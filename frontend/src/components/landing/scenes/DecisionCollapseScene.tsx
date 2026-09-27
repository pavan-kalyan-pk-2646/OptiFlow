import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

import Scene3D from "../../../cinematic/three/Scene3D";
import DPStateNode from "../../../cinematic/three/DPStateNode";
import EnergyBeam from "../../../cinematic/three/EnergyBeam";
import HoloLabel from "../../../cinematic/three/HoloLabel";
import { useWindowPointer } from "../../../cinematic/three/CameraRig";
import { useQuality } from "../../../cinematic/quality";
import { EXAMPLE_STAGES, solveExample } from "../../../cinematic/exampleProblem";

/* =========================================================
   DECISION COLLAPSE
   Every configuration of the example pipeline drawn as its
   own luminous path through the stage columns. Constraints
   dissolve infeasible paths, the objective ranks the rest,
   and a single optimal route remains.

   phase: 0 all · 1 time constraint · 2 cost constraint ·
          3 objective · 4 optimal
========================================================= */

const COLUMN_SPAN = 8.4;

function columnX(layer: number) {
  return -COLUMN_SPAN / 2 + (layer / EXAMPLE_STAGES.length) * COLUMN_SPAN;
}

function strategyY(stageIndex: number, choice: number) {
  const n = EXAMPLE_STAGES[stageIndex].strategies.length;
  return (choice - (n - 1) / 2) * 1.05;
}

function Paths({ phase }: { phase: MutableRefObject<number> }) {
  const quality = useQuality();
  const solution = useMemo(() => solveExample(), []);
  const configs = solution.configurations;
  const optimalKey = solution.optimal.choice.join("");

  const { geometry, pathCount } = useMemo(() => {
    const segments = EXAMPLE_STAGES.length;
    const positions = new Float32Array(configs.length * segments * 6);
    const colors = new Float32Array(configs.length * segments * 6);

    configs.forEach((config, p) => {
      const z = (p / configs.length - 0.5) * 2.2;
      const jitter = ((p * 37) % 11) / 11 - 0.5;
      const pts: [number, number, number][] = [[columnX(0), 0, z * 0.3]];
      config.choice.forEach((choice, s) => {
        pts.push([columnX(s + 1), strategyY(s, choice) + jitter * 0.12, z]);
      });
      for (let s = 0; s < segments; s++) {
        const a = pts[s];
        const b = pts[s + 1];
        positions.set([...a, ...b], (p * segments + s) * 6);
      }
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: g, pathCount: configs.length };
  }, [configs]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const intensity = useRef(new Float32Array(pathCount).fill(0));
  const tint = useRef(new Float32Array(pathCount * 3));

  const scores = useMemo(() => {
    const feasible = configs.filter((c) => c.timeFeasible && c.costFeasible).map((c) => c.score);
    const min = Math.min(...feasible);
    const max = Math.max(...feasible);
    return { min, max };
  }, [configs]);

  const cyan = useMemo(() => new THREE.Color("#38e8ff"), []);
  const violet = useMemo(() => new THREE.Color("#9a7bff"), []);
  const red = useMemo(() => new THREE.Color("#ff4868"), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const ph = phase.current;
    const k = quality.reducedMotion ? 1 : 1 - Math.exp(-4 * delta);
    const attr = geometry.getAttribute("color") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const segments = EXAMPLE_STAGES.length;
    const shimmer = state.clock.elapsedTime;

    configs.forEach((config, p) => {
      let target = 0.3;
      let color = tmp.copy(violet).lerp(cyan, (p % 7) / 7);

      const timeCut = !config.timeFeasible;
      const costCut = !config.costFeasible;

      if (ph >= 1 && timeCut) {
        const f = THREE.MathUtils.clamp((ph - 1) / 0.6, 0, 1);
        color = tmp.copy(color).lerp(red, Math.min(1, f * 2));
        target = f < 0.5 ? 0.55 : THREE.MathUtils.lerp(0.55, 0, (f - 0.5) * 2);
      } else if (ph >= 2 && costCut) {
        const f = THREE.MathUtils.clamp((ph - 2) / 0.6, 0, 1);
        color = tmp.copy(color).lerp(red, Math.min(1, f * 2));
        target = f < 0.5 ? 0.55 : THREE.MathUtils.lerp(0.55, 0, (f - 0.5) * 2);
      } else if (!timeCut && !costCut) {
        if (ph >= 3) {
          const rank = 1 - (config.score - scores.min) / Math.max(1e-6, scores.max - scores.min);
          const f = THREE.MathUtils.clamp(ph - 3, 0, 1);
          color = tmp.copy(violet).lerp(cyan, rank);
          target = THREE.MathUtils.lerp(0.3, 0.12 + rank * 0.55, f);
        }
        if (ph >= 4) {
          const f = THREE.MathUtils.clamp((ph - 4) / 0.5, 0, 1);
          if (config.choice.join("") === optimalKey) {
            color = tmp.copy(cyan).lerp(white, f);
            target = 1;
          } else {
            target = THREE.MathUtils.lerp(target, 0.035, f);
          }
        }
      }

      if (!quality.reducedMotion && ph < 1) {
        target *= 0.8 + 0.2 * Math.sin(shimmer * 1.5 + p * 0.7);
      }

      intensity.current[p] += (target - intensity.current[p]) * k;
      const tIndex = p * 3;
      tint.current[tIndex] += (color.r - tint.current[tIndex]) * k;
      tint.current[tIndex + 1] += (color.g - tint.current[tIndex + 1]) * k;
      tint.current[tIndex + 2] += (color.b - tint.current[tIndex + 2]) * k;

      const r = tint.current[tIndex] * intensity.current[p];
      const g = tint.current[tIndex + 1] * intensity.current[p];
      const b = tint.current[tIndex + 2] * intensity.current[p];
      for (let v = 0; v < segments * 2; v++) {
        const o = (p * segments * 2 + v) * 3;
        arr[o] = r;
        arr[o + 1] = g;
        arr[o + 2] = b;
      }
    });
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </lineSegments>
  );
}

function StageColumns({ phase }: { phase: MutableRefObject<number> }) {
  const solution = useMemo(() => solveExample(), []);
  const optimal = solution.optimal.choice;
  // Re-render only when the (half-)step changes — statuses are discrete.
  const [ph, setPh] = useState(() => Math.floor(phase.current * 2) / 2);
  useFrame(() => {
    const step = Math.floor(phase.current * 2) / 2;
    if (step !== ph) setPh(step);
  });

  return (
    <group>
      <DPStateNode position={[columnX(0), 0, 0]} label="S0" status={ph >= 4 ? "optimal" : "active"} size={0.12} labelOffset={0.4} />
      {EXAMPLE_STAGES.map((stage, s) => (
        <group key={stage.id}>
          <HoloLabel text={stage.name} position={[columnX(s + 1), 2.1, 0]} height={0.2} color="#ffffff" font="Orbitron, sans-serif" weight={700} />
          <HoloLabel text={`${stage.strategies.length} STRATEGIES`} position={[columnX(s + 1), 1.8, 0]} height={0.12} color="#8fdcef" opacity={0.8} />
          {stage.strategies.map((strategy, c) => {
            const chosen = optimal[s] === c;
            return (
              <DPStateNode
                key={strategy.id}
                position={[columnX(s + 1), strategyY(s, c), 0]}
                status={ph >= 4 ? (chosen ? "optimal" : "pruned") : ph >= 3 ? (chosen ? "active" : "candidate") : "candidate"}
                size={0.075}
              />
            );
          })}
        </group>
      ))}
    </group>
  );
}

function OptimalBeam({ phase }: { phase: MutableRefObject<number> }) {
  const solution = useMemo(() => solveExample(), []);
  const points = useMemo(() => {
    const pts: [number, number, number][] = [[columnX(0), 0, 0]];
    solution.optimal.choice.forEach((choice, s) => pts.push([columnX(s + 1), strategyY(s, choice), 0]));
    return pts;
  }, [solution]);

  return (
    <EnergyBeam
      points={points}
      status="optimal"
      radius={0.022}
      pulses={4}
      speed={0.28}
      progress={() => THREE.MathUtils.clamp((phase.current - 4) / 0.6, 0, 1)}
    />
  );
}

function CollapseContent({ phase }: { phase: MutableRefObject<number> }) {
  const quality = useQuality();
  // Desktop: shift the decision space right so the narrative column stays readable.
  const offset: [number, number, number] = quality.isMobile ? [0, -3.1, 0] : [2.1, 0, 0];
  return (
    <group position={offset} scale={quality.isMobile ? 0.54 : 0.9}>
      <Paths phase={phase} />
      <StageColumns phase={phase} />
      <OptimalBeam phase={phase} />
    </group>
  );
}

function CollapseRig() {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    const k = 1 - Math.exp(-2.4 * delta);
    desired.set(pointer.x * 1.4 * s, 0.4 + pointer.y * 0.7 * s, quality.isMobile ? 13.5 : 9.6);
    camera.position.lerp(desired, k);
    camera.lookAt(0, 0.1, 0);
  });
  return null;
}

export default function DecisionCollapseScene({
  phase,
  className = "",
}: {
  phase: MutableRefObject<number>;
  className?: string;
}) {
  return (
    <Scene3D
      className={className}
      label="Decision space of the example pipeline: 108 configurations drawn as paths, pruned by time and cost constraints until one optimal path remains."
      camera={{ position: [0, 0.4, 9.6], fov: 44 }}
    >
      <CollapseContent phase={phase} />
      <CollapseRig />
    </Scene3D>
  );
}
