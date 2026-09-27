import { Html, OrbitControls } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

import Scene3D from "../../cinematic/three/Scene3D";
import EnergyBeam from "../../cinematic/three/EnergyBeam";
import HoloLabel from "../../cinematic/three/HoloLabel";
import ParticleField from "../../cinematic/three/ParticleField";
import { getGlowTexture } from "../../cinematic/three/textures";
import { useQuality } from "../../cinematic/quality";
import { predecessorChain, type StateSpaceTrace } from "../../cinematic/dpStateSpace";

/* =========================================================
   STATE SPACE SCENE — DP[i][time][cost] in 3D
   x = stage i · y = accumulated time · z = accumulated cost
   Kept states glow cyan, dominated states fade violet,
   pruned states flare red and dissolve beyond the
   constraint walls. The optimal path carries the strongest
   light; a selected state shows its predecessor chain.
========================================================= */

const W = 8.4;
const H = 4.2;
const D = 4.2;

export interface StateSpaceSceneProps {
  trace: StateSpaceTrace;
  /** Continuous reveal progress in layers (0 … layers) */
  reveal: MutableRefObject<number>;
  selected: number | null;
  onSelect: (id: number | null) => void;
  className?: string;
  /** Monotonic counter: increment to restart the reveal */
  replayKey: number;
}

function positionOf(trace: StateSpaceTrace, id: number): [number, number, number] {
  const s = trace.states[id];
  const x = (trace.layers <= 1 ? 0 : s.layer / (trace.layers - 1) - 0.5) * W;
  const y = (s.time / Math.max(1, trace.maxTime)) * H - H / 2;
  const z = (s.costCents / Math.max(1, trace.maxCostCents)) * D - D / 2;
  return [x, y, z];
}

const COLOR = {
  kept: new THREE.Color("#38e8ff"),
  dominated: new THREE.Color("#7c63d9"),
  pruned: new THREE.Color("#ff4868"),
  optimal: new THREE.Color("#ffffff"),
  chain: new THREE.Color("#c3b1ff"),
};

function States({ trace, reveal, selected, onSelect, hover }: Omit<StateSpaceSceneProps, "className" | "replayKey"> & { hover: (id: number | null) => void }) {
  const quality = useQuality();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.Points>(null);
  const count = trace.states.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const optimal = useMemo(() => new Set(trace.optimalPath), [trace]);
  const chain = useMemo(() => {
    const set = new Set<number>();
    let cursor = selected === null ? undefined : trace.states[selected];
    while (cursor) {
      set.add(cursor.id);
      cursor = cursor.prev === null ? undefined : trace.states[cursor.prev];
    }
    return set;
  }, [selected, trace]);

  const positions = useMemo(() => trace.states.map((s) => positionOf(trace, s.id)), [trace]);

  const glowGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions.flat()), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [positions, count]);

  useEffect(() => () => glowGeometry.dispose(), [glowGeometry]);

  useFrame((state) => {
    if (!mesh.current) return;
    const r = reveal.current;
    const t = state.clock.elapsedTime;
    const glowColors = glowGeometry.getAttribute("color") as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const s = trace.states[i];
      const age = r - s.layer; // how long since this layer was revealed
      const visible = THREE.MathUtils.clamp(age * 2.5, 0, 1);
      let scale = 0.075 * visible;
      let intensity = visible;

      if (s.status === "pruned") {
        color.copy(COLOR.pruned);
        const dissolve = THREE.MathUtils.clamp((age - 0.35) * 1.6, 0, 1);
        scale *= 1 - dissolve * 0.55;
        intensity *= 1 - dissolve * 0.7;
      } else if (s.status === "dominated") {
        color.copy(COLOR.dominated);
        scale *= 0.7;
        intensity *= 0.55;
      } else {
        color.copy(COLOR.kept);
        intensity *= 0.85;
      }

      const finished = r >= trace.layers - 0.001;
      if (optimal.has(i) && finished) {
        color.lerp(COLOR.optimal, 0.85);
        scale = 0.12 * (1 + (quality.reducedMotion ? 0 : Math.sin(t * 3 + i) * 0.08));
        intensity = 1.2;
      }
      if (chain.has(i)) {
        color.lerp(COLOR.chain, 0.6);
        scale = Math.max(scale, 0.11);
        intensity = 1.1;
      }
      if (i === selected) {
        scale = 0.16;
        intensity = 1.4;
      }

      dummy.position.set(...positions[i]);
      dummy.scale.setScalar(Math.max(0.0001, scale));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      color.multiplyScalar(intensity);
      mesh.current.setColorAt(i, color);
      glowColors.setXYZ(i, color.r * 0.5, color.g * 0.5, color.b * 0.5);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    glowColors.needsUpdate = true;
  });

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.instanceId !== undefined && reveal.current >= trace.states[event.instanceId].layer) {
      hover(event.instanceId);
      document.body.style.cursor = "pointer";
    }
  };

  return (
    <group>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, count]}
        onPointerMove={handleMove}
        onPointerOut={() => {
          hover(null);
          document.body.style.cursor = "";
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (event.instanceId !== undefined) onSelect(event.instanceId === selected ? null : event.instanceId);
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <points ref={glow} geometry={glowGeometry}>
        <pointsMaterial
          map={getGlowTexture()}
          vertexColors
          size={0.55}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

function Transitions({ trace, reveal }: { trace: StateSpaceTrace; reveal: MutableRefObject<number> }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(trace.transitions.length * 6);
    trace.transitions.forEach((t, i) => {
      positions.set([...positionOf(trace, t.from), ...positionOf(trace, t.to)], i * 6);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(trace.transitions.length * 6), 3));
    return g;
  }, [trace]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const base = useMemo(
    () => ({
      kept: new THREE.Color("#38e8ff").multiplyScalar(0.32),
      dominated: new THREE.Color("#7c63d9").multiplyScalar(0.18),
      pruned: new THREE.Color("#ff4868").multiplyScalar(0.3),
    }),
    [],
  );

  useFrame(() => {
    const attr = geometry.getAttribute("color") as THREE.BufferAttribute;
    const r = reveal.current;
    trace.transitions.forEach((t, i) => {
      const layer = trace.states[t.to].layer;
      const age = r - layer + 1;
      const f = THREE.MathUtils.clamp(age, 0, 1);
      const fade = t.status === "pruned" ? 1 - THREE.MathUtils.clamp((r - layer - 0.3) * 1.4, 0, 0.8) : 1;
      const c = base[t.status];
      attr.setXYZ(i * 2, c.r * f * fade, c.g * f * fade, c.b * f * fade);
      attr.setXYZ(i * 2 + 1, c.r * f * fade, c.g * f * fade, c.b * f * fade);
    });
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </lineSegments>
  );
}

function ConstraintWalls({ trace }: { trace: StateSpaceTrace }) {
  const ceilingEdges = useMemo(() => {
    const plane = new THREE.PlaneGeometry(W + 0.6, D + 0.6);
    const edges = new THREE.EdgesGeometry(plane);
    plane.dispose();
    return edges;
  }, []);
  const wallEdges = useMemo(() => {
    const plane = new THREE.PlaneGeometry(W + 0.6, H + 0.6);
    const edges = new THREE.EdgesGeometry(plane);
    plane.dispose();
    return edges;
  }, []);
  useEffect(
    () => () => {
      ceilingEdges.dispose();
      wallEdges.dispose();
    },
    [ceilingEdges, wallEdges],
  );
  const y = (trace.deadline / Math.max(1, trace.maxTime)) * H - H / 2;
  const z = (trace.budgetCents / Math.max(1, trace.maxCostCents)) * D - D / 2;
  const showTime = trace.maxTime > trace.deadline;
  const showCost = trace.maxCostCents > trace.budgetCents;
  return (
    <group>
      {/* Deadline ceiling (time boundary) */}
      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W + 0.6, D + 0.6]} />
        <meshBasicMaterial color="#ff4868" transparent opacity={showTime ? 0.06 : 0.03} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={ceilingEdges}>
        <lineBasicMaterial color="#ff6d86" transparent opacity={0.55} />
      </lineSegments>
      <HoloLabel text={`DEADLINE · time ≤ ${trace.deadline}`} position={[-W / 2 - 0.2, y + 0.22, -D / 2]} height={0.28} color="#ff9fb0" />

      {/* Budget wall (cost boundary) */}
      <mesh position={[0, 0, z]}>
        <planeGeometry args={[W + 0.6, H + 0.6]} />
        <meshBasicMaterial color="#9a7bff" transparent opacity={showCost ? 0.06 : 0.03} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments position={[0, 0, z]} geometry={wallEdges}>
        <lineBasicMaterial color="#b9a4ff" transparent opacity={0.5} />
      </lineSegments>
      <HoloLabel text={`BUDGET · cost ≤ $${(trace.budgetCents / 100).toFixed(2)}`} position={[W / 2 - 0.4, H / 2 + 0.1, z]} height={0.28} color="#d2c4ff" />
    </group>
  );
}

function Axes({ trace }: { trace: StateSpaceTrace }) {
  const geometry = useMemo(() => {
    const o = [-W / 2, -H / 2, -D / 2];
    const pts = new Float32Array([
      ...o, W / 2, -H / 2, -D / 2,
      ...o, -W / 2, H / 2, -D / 2,
      ...o, -W / 2, -H / 2, D / 2,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#8fdcef" transparent opacity={0.45} />
      </lineSegments>
      <HoloLabel text="STAGE i →" position={[W / 2 - 0.3, -H / 2 - 0.35, -D / 2]} height={0.3} color="#bff6ff" />
      <HoloLabel text="TIME ↑" position={[-W / 2 - 0.1, H / 2 + 0.35, -D / 2]} height={0.3} color="#bff6ff" />
      <HoloLabel text="COST ↗" position={[-W / 2, -H / 2 - 0.35, D / 2 + 0.25]} height={0.3} color="#bff6ff" />
      {Array.from({ length: trace.layers }, (_, i) => (
        <HoloLabel
          key={i}
          text={`S${i}`}
          position={[(trace.layers <= 1 ? 0 : i / (trace.layers - 1) - 0.5) * W, -H / 2 - 0.3, -D / 2 - 0.2]}
          height={0.26}
          color="#8fdcef"
          opacity={0.85}
        />
      ))}
      <HoloLabel text="DP[i][time][cost]" position={[0, H / 2 + 0.8, 0]} height={0.36} color="#ffffff" font="Orbitron, sans-serif" weight={700} />
    </group>
  );
}

function Director({ reveal, layers, replayKey }: { reveal: MutableRefObject<number>; layers: number; replayKey: number }) {
  const quality = useQuality();
  useEffect(() => {
    reveal.current = quality.reducedMotion ? layers : 0;
  }, [replayKey, layers, quality.reducedMotion, reveal]);
  useFrame((_, delta) => {
    if (reveal.current < layers) reveal.current = Math.min(layers, reveal.current + delta * 0.9);
  });
  return null;
}

export default function StateSpaceScene({ trace, reveal, selected, onSelect, className = "", replayKey }: StateSpaceSceneProps) {
  const quality = useQuality();
  const [hovered, setHovered] = useState<number | null>(null);
  const optimalPoints = useMemo(() => trace.optimalPath.map((id) => positionOf(trace, id)), [trace]);
  const chainPoints = useMemo(() => {
    if (selected === null) return [];
    return predecessorChain(trace, selected).map((id) => positionOf(trace, id));
  }, [selected, trace]);

  const hover = hovered !== null ? trace.states[hovered] : null;

  return (
    <Scene3D
      className={className}
      label={`Three-dimensional DP state space with ${trace.states.length} states, ${trace.statesPruned} pruned. Drag to rotate, scroll to zoom.`}
      camera={{ position: [6.5, 3.2, 9.5], fov: 42 }}
      eventPrefix="client"
      onPointerMissed={() => onSelect(null)}
    >
      <ParticleField count={300} spread={[10, 6, 6]} size={0.5} opacity={0.3} seed={71} />
      <Director reveal={reveal} layers={trace.layers} replayKey={replayKey} />
      <Axes trace={trace} />
      <ConstraintWalls trace={trace} />
      <Transitions trace={trace} reveal={reveal} />
      <States trace={trace} reveal={reveal} selected={selected} onSelect={onSelect} hover={setHovered} />

      {optimalPoints.length > 1 && (
        <EnergyBeam
          points={optimalPoints}
          status="optimal"
          radius={0.03}
          pulses={5}
          speed={0.22}
          progress={() => THREE.MathUtils.clamp((reveal.current - (trace.layers - 1)) * 1.5, 0, 1)}
        />
      )}
      {chainPoints.length > 1 && <EnergyBeam points={chainPoints} status="reverse" radius={0.024} pulses={3} speed={0.5} />}

      {hover && (
        <Html position={positionOf(trace, hover.id)} center zIndexRange={[40, 0]} style={{ pointerEvents: "none", transform: "translateY(-70px)" }}>
          <div className="of-holo-readout">
            <div className="of-holo-readout__head">
              <span>DP[{hover.layer}][{hover.time}][{(hover.costCents / 100).toFixed(2)}]</span>
              <em>{hover.status.toUpperCase()}</em>
            </div>
            <dl>
              <dt>STAGE</dt>
              <dd>{hover.stageName}</dd>
              <dt>CHOICE</dt>
              <dd>{hover.strategyName ?? "—"}</dd>
              <dt>SCORE</dt>
              <dd>{hover.score.toFixed(4)}</dd>
            </dl>
          </div>
        </Html>
      )}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan
        minDistance={4}
        maxDistance={22}
        autoRotate={!quality.reducedMotion && selected === null && hovered === null}
        autoRotateSpeed={0.35}
      />
    </Scene3D>
  );
}
