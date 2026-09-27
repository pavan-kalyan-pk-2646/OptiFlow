import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import Scene3D from "../../cinematic/three/Scene3D";
import FloatingModule, { type ModuleState } from "../../cinematic/three/FloatingModule";
import EnergyBeam, { type BeamStatus } from "../../cinematic/three/EnergyBeam";
import DPStateNode from "../../cinematic/three/DPStateNode";
import HoloLabel from "../../cinematic/three/HoloLabel";
import ParticleField from "../../cinematic/three/ParticleField";
import { useWindowPointer } from "../../cinematic/three/CameraRig";
import { getGlowTexture } from "../../cinematic/three/textures";
import { useQuality } from "../../cinematic/quality";

/* =========================================================
   OPTIFLOW STUDIO — 3D SCENES
   PipelineModulesScene  · build / simulate / results
   ConstraintFieldScene  · feasible space vs constraints
========================================================= */

type V3 = [number, number, number];

export interface ModuleStage {
  id: string;
  name: string;
  strategies: { id: string; name: string; time: number; cost: number }[];
  dependencies: string[];
}

export type PipelineSceneMode = "build" | "simulate" | "results";

export interface PipelineModulesSceneProps {
  stages: ModuleStage[];
  mode: PipelineSceneMode;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** simulate: index currently executing (-1 idle) */
  activeIndex?: number;
  /** simulate/results: number of stages completed */
  completed?: number;
  /** stageId → chosen strategyId */
  selections?: Record<string, string>;
  /** results: play the reverse reconstruction flow */
  reconstruct?: boolean;
  className?: string;
  label?: string;
}

function stagePositions(count: number, compact: boolean): V3[] {
  if (count === 0) return [];
  const spacing = compact ? 1.25 : count > 7 ? 1.7 : 2.25;
  const span = (count - 1) * spacing;
  return Array.from({ length: count }, (_, i) => {
    if (compact) return [0, span / 2 - i * spacing, 0];
    const u = count === 1 ? 0.5 : i / (count - 1);
    return [-span / 2 + i * spacing, Math.sin(u * Math.PI * 2) * 0.35, -Math.sin(u * Math.PI) * 1.1];
  });
}

/** Smoothly glides to its target position — used for reordering. */
function LerpGroup({ target, children, appear = true }: { target: V3; children: ReactNode; appear?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const born = useRef(false);
  const quality = useQuality();
  useFrame((_, delta) => {
    if (!ref.current) return;
    if (!born.current) {
      ref.current.position.set(target[0], target[1] - (appear ? 1.2 : 0), target[2]);
      ref.current.scale.setScalar(appear ? 0.001 : 1);
      born.current = true;
    }
    const k = quality.reducedMotion ? 1 : 1 - Math.exp(-5 * delta);
    ref.current.position.x += (target[0] - ref.current.position.x) * k;
    ref.current.position.y += (target[1] - ref.current.position.y) * k;
    ref.current.position.z += (target[2] - ref.current.position.z) * k;
    const s = ref.current.scale.x + (1 - ref.current.scale.x) * k;
    ref.current.scale.setScalar(s);
  });
  return <group ref={ref}>{children}</group>;
}

/** A module that was deleted breaks into particles. */
function DissolveBurst({ position, onDone }: { position: V3; onDone: () => void }) {
  const count = 90;
  const points = useRef<THREE.Points>(null);
  const life = useRef(1);
  const velocities = useMemo(() => {
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.6 + Math.random() * 1.8;
      v.set([Math.sin(phi) * Math.cos(theta) * speed, Math.sin(phi) * Math.sin(theta) * speed, Math.cos(phi) * speed], i * 3);
    }
    return v;
  }, []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p.set([position[0] + (Math.random() - 0.5) * 1.3, position[1] + (Math.random() - 0.5) * 0.8, position[2] + (Math.random() - 0.5) * 0.3], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, [position]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    life.current -= delta * 0.8;
    if (life.current <= 0) {
      onDone();
      return;
    }
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      attr.setXYZ(i, attr.getX(i) + velocities[i * 3] * delta, attr.getY(i) + velocities[i * 3 + 1] * delta - delta * 0.3, attr.getZ(i) + velocities[i * 3 + 2] * delta);
    }
    attr.needsUpdate = true;
    if (points.current) (points.current.material as THREE.PointsMaterial).opacity = Math.max(0, life.current);
  });
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial map={getGlowTexture()} color="#ff7a90" size={0.12} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function PipelineRig({ positions, mode, activeIndex, compact }: { positions: V3[]; mode: PipelineSceneMode; activeIndex: number; compact: boolean }) {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const span = positions.length > 1 ? Math.abs(positions[positions.length - 1][compact ? 1 : 0] - positions[0][compact ? 1 : 0]) : 1;

  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    const follow = mode === "simulate" && activeIndex >= 0 && positions[activeIndex];
    const k = 1 - Math.exp(-(follow ? 2.2 : 2.6) * delta);
    if (follow) {
      const p = positions[activeIndex];
      desired.set(p[0] + 0.6, p[1] + 1.1, p[2] + 4.6);
      look.set(p[0], p[1], p[2]);
    } else {
      const distance = compact ? span * 0.9 + 5 : Math.max(6.5, span * 0.62 + 3.2);
      desired.set(pointer.x * 0.8 * s, 1.4 + pointer.y * 0.5 * s, distance);
      look.set(0, 0, 0);
    }
    camera.position.lerp(desired, quality.reducedMotion ? 1 : k);
    camera.lookAt(look);
  });
  return null;
}

export function PipelineModulesScene({
  stages,
  mode,
  selectedId = null,
  onSelect,
  activeIndex = -1,
  completed = 0,
  selections,
  reconstruct = false,
  className = "",
  label,
}: PipelineModulesSceneProps) {
  const quality = useQuality();
  const compact = quality.isMobile;
  const positions = useMemo(() => stagePositions(stages.length, compact), [stages.length, compact]);
  const byId = useMemo(() => new Map(stages.map((stage, i) => [stage.id, i])), [stages]);
  const [hovered, setHovered] = useState<string | null>(null);

  // Track deletions to play a dissolve at the old position
  const previous = useRef<Map<string, V3>>(new Map());
  const [bursts, setBursts] = useState<{ key: string; position: V3 }[]>([]);
  useEffect(() => {
    const current = new Map<string, V3>();
    stages.forEach((stage, i) => current.set(stage.id, positions[i]));
    const removed: { key: string; position: V3 }[] = [];
    previous.current.forEach((pos, id) => {
      if (!current.has(id)) removed.push({ key: `${id}-${Date.now()}`, position: pos });
    });
    if (removed.length && !quality.reducedMotion) setBursts((list) => [...list, ...removed]);
    previous.current = current;
  }, [stages, positions, quality.reducedMotion]);

  const [reverse, setReverse] = useState(false);
  useEffect(() => {
    if (!reconstruct) return;
    setReverse(true);
    const timer = window.setTimeout(() => setReverse(false), 3200);
    return () => window.clearTimeout(timer);
  }, [reconstruct]);

  const moduleState = (i: number, stage: ModuleStage): ModuleState => {
    if (mode === "build") return stage.id === selectedId ? "active" : "idle";
    if (mode === "simulate") {
      if (i === activeIndex) return "running";
      if (i < completed) return "complete";
      return activeIndex >= 0 || completed > 0 ? "dim" : "idle";
    }
    return "complete";
  };

  const beamStatus = (fromIndex: number, toIndex: number): BeamStatus => {
    if (mode === "results") return reverse ? "reverse" : "optimal";
    if (mode === "simulate") {
      if (toIndex === activeIndex) return "optimal";
      if (toIndex < completed) return "active";
      return "dim";
    }
    const selected = selectedId !== null && (stages[fromIndex]?.id === selectedId || stages[toIndex]?.id === selectedId);
    return selected ? "optimal" : "active";
  };

  return (
    <Scene3D
      className={className}
      label={label ?? `Pipeline of ${stages.length} stages rendered as 3D modules with dependency beams.`}
      camera={{ position: [0, 1.4, 8], fov: 42 }}
      eventPrefix="client"
    >
      <ParticleField count={220} spread={[9, 4, 4]} size={0.5} opacity={0.32} seed={83} />

      {/* Dependencies as energy beams */}
      {stages.map((stage, toIndex) =>
        stage.dependencies
          .map((dep) => byId.get(dep))
          .filter((fromIndex): fromIndex is number => fromIndex !== undefined)
          .map((fromIndex) => {
            const a = positions[fromIndex];
            const b = positions[toIndex];
            if (!a || !b) return null;
            const distance = Math.abs(toIndex - fromIndex);
            return (
              <EnergyBeam
                key={`${stage.id}-${stages[fromIndex].id}`}
                points={[
                  [a[0] + (compact ? 0 : 0.7), a[1] - (compact ? 0.3 : 0), a[2]],
                  [b[0] - (compact ? 0 : 0.7), b[1] + (compact ? 0.3 : 0), b[2]],
                ]}
                status={beamStatus(fromIndex, toIndex)}
                radius={0.014}
                pulses={2}
                speed={0.5}
                arc={compact ? 0 : distance > 1 ? 0.55 * distance : 0.12}
              />
            );
          }),
      )}

      {stages.map((stage, i) => {
        const times = stage.strategies.map((s) => s.time);
        const chosen = selections?.[stage.id];
        const chosenStrategy = stage.strategies.find((s) => s.id === chosen);
        const subtitle =
          mode === "build" || !chosenStrategy
            ? `${stage.strategies.length} strategies · ${Math.min(...times)}–${Math.max(...times)} min`
            : `${chosenStrategy.name} · ${chosenStrategy.time}m · $${chosenStrategy.cost.toFixed(2)}`;
        return (
          <LerpGroup key={stage.id} target={positions[i] ?? [0, 0, 0]}>
            <FloatingModule
              position={[0, 0, 0]}
              index={String(i + 1).padStart(2, "0")}
              title={stage.name.slice(0, 14)}
              subtitle={compact ? undefined : subtitle}
              size={compact ? [2.4, 0.66, 0.3] : [1.5, 0.9, 0.36]}
              state={moduleState(i, stage)}
              hovered={hovered === stage.id || (mode === "simulate" && i === activeIndex)}
              onHover={(h) => setHovered(h ? stage.id : null)}
              onSelect={onSelect ? () => onSelect(stage.id) : undefined}
              lift={0.6}
            />
            {/* Strategies orbit their stage */}
            {!compact &&
              stage.strategies.slice(0, 6).map((strategy, j) => {
                const n = Math.min(6, stage.strategies.length);
                const x = (j - (n - 1) / 2) * 0.3;
                const isChosen = chosen === strategy.id;
                const status =
                  mode === "build"
                    ? stage.id === selectedId
                      ? "active"
                      : "idle"
                    : chosen
                      ? isChosen
                        ? mode === "simulate" && i >= completed && i !== activeIndex
                          ? "candidate"
                          : "optimal"
                        : "pruned"
                      : "idle";
                return <DPStateNode key={strategy.id} position={[x, 0.78, 0]} size={0.05} status={status} />;
              })}
          </LerpGroup>
        );
      })}

      {bursts.map((burst) => (
        <DissolveBurst
          key={burst.key}
          position={burst.position}
          onDone={() => setBursts((list) => list.filter((item) => item.key !== burst.key))}
        />
      ))}

      {mode === "results" && positions.length > 0 && (
        <>
          <HoloLabel text="S0" position={[positions[0][0] - 1.1, positions[0][1], positions[0][2]]} height={0.24} color="#bff6ff" />
          <HoloLabel
            text={`S${stages.length} · OPTIMAL`}
            position={[positions[positions.length - 1][0] + 1.2, positions[positions.length - 1][1] + 0.1, positions[positions.length - 1][2]]}
            height={0.24}
            color="#ffffff"
          />
        </>
      )}

      <PipelineRig positions={positions} mode={mode} activeIndex={activeIndex} compact={compact} />
    </Scene3D>
  );
}

/* =========================================================
   CONSTRAINT FIELD
========================================================= */

export interface FieldPoint {
  time: number;
  costCents: number;
  score: number;
}

const FW = 7;
const FH = 4;

function FieldPoints({
  points,
  deadline,
  budgetCents,
  maxTime,
  maxCost,
}: {
  points: FieldPoint[];
  deadline: number;
  budgetCents: number;
  maxTime: number;
  maxCost: number;
}) {
  const quality = useQuality();
  const count = points.length;
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    points.forEach((p, i) => {
      pos.set([(p.time / maxTime) * FW - FW / 2, (p.costCents / maxCost) * FH - FH / 2, 0], i * 3);
    });
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [points, count, maxTime, maxCost]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const best = useMemo(() => {
    let index = -1;
    let score = Infinity;
    points.forEach((p, i) => {
      if (p.time <= deadline && p.costCents <= budgetCents && p.score < score) {
        score = p.score;
        index = i;
      }
    });
    return index;
  }, [points, deadline, budgetCents]);

  const cyan = useMemo(() => new THREE.Color("#38e8ff"), []);
  const red = useMemo(() => new THREE.Color("#ff4868"), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const k = quality.reducedMotion ? 1 : 1 - Math.exp(-5 * delta);
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = geometry.getAttribute("color") as THREE.BufferAttribute;
    points.forEach((p, i) => {
      const feasible = p.time <= deadline && p.costCents <= budgetCents;
      const targetZ = feasible ? (i === best ? 0.6 : 0) : -1.4;
      pos.setZ(i, pos.getZ(i) + (targetZ - pos.getZ(i)) * k);
      if (i === best) tmp.copy(white);
      else if (feasible) tmp.copy(cyan).multiplyScalar(0.8);
      else tmp.copy(red).multiplyScalar(0.28);
      col.setXYZ(i, col.getX(i) + (tmp.r - col.getX(i)) * k, col.getY(i) + (tmp.g - col.getY(i)) * k, col.getZ(i) + (tmp.b - col.getZ(i)) * k);
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial map={getGlowTexture()} vertexColors size={count > 2000 ? 0.12 : 0.22} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function FeasibleRegion({ deadline, budgetCents, maxTime, maxCost }: { deadline: number; budgetCents: number; maxTime: number; maxCost: number }) {
  const ref = useRef<THREE.Group>(null);
  const box = useRef<THREE.Mesh>(null);
  const edges = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const e = new THREE.EdgesGeometry(g);
    g.dispose();
    return e;
  }, []);
  useEffect(() => () => edges.dispose(), [edges]);
  const quality = useQuality();
  const w = Math.min(1, deadline / maxTime) * FW;
  const h = Math.min(1, budgetCents / maxCost) * FH;

  useFrame((state, delta) => {
    if (!ref.current) return;
    const k = quality.reducedMotion ? 1 : 1 - Math.exp(-5 * delta);
    ref.current.scale.x += (Math.max(0.01, w) - ref.current.scale.x) * k;
    ref.current.scale.y += (Math.max(0.01, h) - ref.current.scale.y) * k;
    ref.current.position.x = -FW / 2 + ref.current.scale.x / 2;
    ref.current.position.y = -FH / 2 + ref.current.scale.y / 2;
    if (box.current) (box.current.material as THREE.MeshBasicMaterial).opacity = 0.045 + Math.sin(state.clock.elapsedTime * 2) * 0.015;
  });

  return (
    <group ref={ref} scale={[w, h, 1.6]} position={[-FW / 2 + w / 2, -FH / 2 + h / 2, 0]}>
      <mesh ref={box}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#38e8ff" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#8ff3ff" transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}

export function ConstraintFieldScene({
  points,
  deadline,
  budget,
  className = "",
}: {
  points: FieldPoint[];
  deadline: number;
  budget: number;
  className?: string;
}) {
  const budgetCents = Math.round(budget * 100);
  const maxTime = Math.max(deadline * 1.15, ...points.map((p) => p.time), 1);
  const maxCost = Math.max(budgetCents * 1.15, ...points.map((p) => p.costCents), 1);
  const feasible = points.filter((p) => p.time <= deadline && p.costCents <= budgetCents).length;

  return (
    <Scene3D
      className={className}
      label={`Constraint field: ${feasible} of ${points.length} configurations are feasible under time ≤ ${deadline} and cost ≤ $${budget.toFixed(2)}.`}
      camera={{ position: [1.2, 1.2, 7.4], fov: 42 }}
    >
      <FeasibleRegion deadline={deadline} budgetCents={budgetCents} maxTime={maxTime} maxCost={maxCost} />
      <FieldPoints points={points} deadline={deadline} budgetCents={budgetCents} maxTime={maxTime} maxCost={maxCost} />
      <HoloLabel text="TIME →" position={[FW / 2 - 0.2, -FH / 2 - 0.35, 0]} height={0.24} color="#bff6ff" />
      <HoloLabel text="COST ↑" position={[-FW / 2 - 0.4, FH / 2 + 0.2, 0]} height={0.24} color="#bff6ff" />
      <HoloLabel
        text={`TIME LIMIT ${deadline} MIN`}
        position={[-FW / 2 + Math.min(1, deadline / maxTime) * FW, -FH / 2 - 0.35, 0.8]}
        height={0.2}
        color="#8ff3ff"
      />
      <HoloLabel
        text={`BUDGET $${budget.toFixed(2)}`}
        position={[-FW / 2 - 0.1, -FH / 2 + Math.min(1, budgetCents / maxCost) * FH + 0.2, 0.8]}
        height={0.2}
        color="#c3b1ff"
      />
      <HoloLabel text="INFEASIBLE STATES SINK OUT OF THE FIELD" position={[0, -FH / 2 - 0.85, -1.4]} height={0.16} color="#ff9fb0" opacity={0.7} />
      <FieldRig />
    </Scene3D>
  );
}

function FieldRig() {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    desired.set(pointer.x * 1.2 * s + 1.2, 1.2 + pointer.y * 0.8 * s, quality.isMobile ? 10 : 7.4);
    camera.position.lerp(desired, 1 - Math.exp(-2.2 * delta));
    camera.lookAt(0, 0, 0);
  });
  return null;
}
