import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import Scene3D from "../../cinematic/three/Scene3D";
import DPStateNode, { type NodeStatus } from "../../cinematic/three/DPStateNode";
import EnergyBeam from "../../cinematic/three/EnergyBeam";
import ParticleField from "../../cinematic/three/ParticleField";
import { useWindowPointer } from "../../cinematic/three/CameraRig";
import { useQuality } from "../../cinematic/quality";

/* =========================================================
   ACADEMY PROGRESS — learning as DP state progression
   MODULE 01 → S0, MODULE 02 → S1 …
   completed = glowing optimal node · in progress = active ·
   locked = pruned/dim · lessons orbit their module.
========================================================= */

export interface AcademyModuleProgress {
  id: string;
  number: string;
  title: string;
  total: number;
  completed: number;
  locked: number;
  current: boolean;
}

function Rig() {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    desired.set(pointer.x * 0.7 * s, 0.6 + pointer.y * 0.4 * s, quality.isMobile ? 9 : 6.3);
    camera.position.lerp(desired, 1 - Math.exp(-2.2 * delta));
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function statusOf(module: AcademyModuleProgress): NodeStatus {
  const available = module.total - module.locked;
  if (available === 0) return "pruned";
  if (module.completed >= available) return "optimal";
  if (module.current) return "active";
  if (module.completed > 0) return "cached";
  return "idle";
}

export default function AcademyProgressScene({
  modules,
  className = "",
}: {
  modules: AcademyModuleProgress[];
  className?: string;
}) {
  const positions = useMemo(
    () =>
      modules.map((_, i) => {
        const u = modules.length === 1 ? 0.5 : i / (modules.length - 1);
        return [-3.3 + u * 6.6, Math.sin(u * Math.PI * 2) * 0.55, Math.cos(u * Math.PI) * 0.6] as [number, number, number];
      }),
    [modules],
  );

  return (
    <Scene3D
      className={className}
      label={`Learning progress: ${modules.map((m) => `module ${m.number} ${m.completed} of ${m.total - m.locked} lessons`).join(", ")}`}
      camera={{ position: [0, 0.6, 6.3], fov: 42 }}
    >
      <ParticleField count={180} spread={[6, 3, 3]} size={0.5} opacity={0.35} seed={44} />
      {positions.slice(1).map((p, i) => {
        const prev = modules[i];
        const done = prev.completed >= prev.total - prev.locked && prev.total - prev.locked > 0;
        return (
          <EnergyBeam
            key={`b-${i}`}
            points={[positions[i], p]}
            status={done ? "optimal" : modules[i + 1].locked === modules[i + 1].total ? "pruned" : "dim"}
            radius={0.014}
            arc={0.15}
          />
        );
      })}

      {modules.map((module, i) => {
        const p = positions[i];
        const lessonStatus = (j: number): NodeStatus =>
          j < module.completed ? "active" : j >= module.total - module.locked ? "pruned" : "idle";
        return (
          <group key={module.id}>
            <DPStateNode
              position={p}
              label={`S${i}`}
              sublabel={`MODULE ${module.number}`}
              status={statusOf(module)}
              size={0.16}
              labelOffset={0.56}
              labelHeight={0.34}
            />
            {Array.from({ length: module.total }, (_, j) => {
              const a = (j / module.total) * Math.PI * 2;
              return (
                <DPStateNode
                  key={j}
                  position={[p[0] + Math.cos(a) * 0.42, p[1] + Math.sin(a) * 0.42, p[2] + 0.1]}
                  status={lessonStatus(j)}
                  size={0.035}
                />
              );
            })}
          </group>
        );
      })}
      <Rig />
    </Scene3D>
  );
}
