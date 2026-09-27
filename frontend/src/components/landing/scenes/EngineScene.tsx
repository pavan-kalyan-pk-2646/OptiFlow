import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import Scene3D from "../../../cinematic/three/Scene3D";
import FloatingModule from "../../../cinematic/three/FloatingModule";
import EnergyBeam from "../../../cinematic/three/EnergyBeam";
import DPStateNode from "../../../cinematic/three/DPStateNode";
import ParticleField from "../../../cinematic/three/ParticleField";
import { useWindowPointer } from "../../../cinematic/three/CameraRig";
import { useQuality } from "../../../cinematic/quality";

/* =========================================================
   ENGINE SCENE
   PIPELINE → STATE SPACE → OPTIMIZE → RECONSTRUCT → EXECUTE
   as five physical modules. Hovering a module pulls it
   toward the camera, lights its edges, and wakes the DP
   states it is responsible for.
========================================================= */

export interface EngineModuleInfo {
  id: string;
  title: string;
  subtitle: string;
}

interface EngineSceneProps {
  modules: EngineModuleInfo[];
  active: number | null;
  onActive: (index: number | null) => void;
  className?: string;
}

function EngineRig({ compact }: { compact: boolean }) {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const k = 1 - Math.exp(-2.5 * delta);
    const s = quality.reducedMotion ? 0 : 0.5;
    camera.position.lerp(desired.set(pointer.x * s, 0.8 + pointer.y * s * 0.5, compact ? 10 : 7.3), k);
    camera.lookAt(target);
  });
  return null;
}

function EngineContent({ modules, active, onActive, compact }: EngineSceneProps & { compact: boolean }) {
  const layout = useMemo(() => {
    return modules.map((_, i) => {
      if (compact) return [0, 1.9 - i * 0.95, 0] as [number, number, number];
      const u = i / (modules.length - 1);
      return [-4.6 + u * 9.2, Math.sin(u * Math.PI) * 0.35 - 0.1, -Math.sin(u * Math.PI) * 0.9] as [number, number, number];
    });
  }, [modules, compact]);

  // Each module owns a small cluster of DP states above it.
  const clusters = useMemo(
    () =>
      layout.map((p, i) =>
        Array.from({ length: 3 }, (_, j) => [
          p[0] + (j - 1) * 0.42,
          p[1] + (compact ? 0 : 1.05) + (j === 1 ? 0.18 : 0),
          p[2] + (compact ? 0.4 : 0) + (i % 2 === 0 ? 0.05 : -0.05),
        ] as [number, number, number]),
      ),
    [layout, compact],
  );

  const group = useRef<THREE.Group>(null);

  return (
    <group ref={group}>
      {layout.slice(1).map((p, i) => (
        <EnergyBeam
          key={`link-${i}`}
          points={[
            [layout[i][0] + (compact ? 0 : 0.85), layout[i][1], layout[i][2]],
            [p[0] - (compact ? 0 : 0.85), p[1], p[2]],
          ]}
          status={active === null ? "active" : i === active || i + 1 === active ? "optimal" : "dim"}
          radius={0.012}
          pulses={3}
          speed={0.5}
          arc={compact ? 0 : 0.15}
        />
      ))}

      {modules.map((module, i) => (
        <group key={module.id}>
          <FloatingModule
            position={layout[i]}
            index={`0${i + 1}`}
            title={module.title}
            subtitle={compact ? undefined : module.subtitle}
            size={compact ? [2.6, 0.62, 0.28] : [1.62, 0.98, 0.38]}
            state={active === null ? "idle" : active === i ? "active" : "dim"}
            hovered={active === i}
            onHover={(h) => onActive(h ? i : null)}
            lift={0.9}
            labelScale={compact ? 1.1 : 1}
          />
          {!compact &&
            clusters[i].map((c, j) => (
              <DPStateNode
                key={j}
                position={c}
                size={0.05}
                status={active === i ? (j === 1 ? "optimal" : "active") : "idle"}
              />
            ))}
          {!compact && active === i &&
            clusters[i].map((c, j) => (
              <EnergyBeam
                key={`c-${j}`}
                points={[[layout[i][0], layout[i][1] + 0.5, layout[i][2]], c]}
                status="active"
                radius={0.006}
                pulses={1}
                speed={0.9}
              />
            ))}
        </group>
      ))}
    </group>
  );
}

export default function EngineScene(props: EngineSceneProps) {
  const quality = useQuality();
  const compact = quality.isMobile;
  return (
    <Scene3D
      className={props.className}
      label="The OptiFlow engine: five connected modules — pipeline, state space, optimize, reconstruct, execute."
      camera={{ position: [0, 0.8, compact ? 10 : 7.3], fov: 42 }}
      eventPrefix="client"
    >
      <ParticleField count={200} spread={[8, 3, 3]} size={0.5} opacity={0.35} drift={0.25} seed={77} />
      <EngineContent {...props} compact={compact} />
      <EngineRig compact={compact} />
    </Scene3D>
  );
}
