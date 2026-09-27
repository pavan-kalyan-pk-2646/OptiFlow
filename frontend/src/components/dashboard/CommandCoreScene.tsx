import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import Scene3D from "../../cinematic/three/Scene3D";
import OptimizationCore, { type CoreState } from "../../cinematic/three/OptimizationCore";
import ParticleField from "../../cinematic/three/ParticleField";
import { useWindowPointer } from "../../cinematic/three/CameraRig";
import { useQuality } from "../../cinematic/quality";

/* =========================================================
   COMMAND CORE SCENE — the floating core at the centre of
   the Command Center, showing the user's latest run.
========================================================= */

function Rig() {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    desired.set(pointer.x * 0.8 * s, 0.4 + pointer.y * 0.5 * s, quality.isMobile ? 8.6 : 7.2);
    camera.position.lerp(desired, 1 - Math.exp(-2.2 * delta));
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function CommandCoreScene({
  states,
  source,
  className = "",
}: {
  states?: CoreState[];
  source?: string;
  className?: string;
}) {
  return (
    <Scene3D
      className={className}
      label="Optimization core showing the states of your latest optimization run. Hover a state for details."
      camera={{ position: [0, 0.4, 7.2], fov: 42 }}
      eventPrefix="client"
    >
      <ParticleField count={260} spread={[6, 4, 4]} size={0.55} opacity={0.4} drift={0.3} seed={21} />
      <OptimizationCore states={states} source={source} scale={1.05} spin={0.06} />
      <Rig />
    </Scene3D>
  );
}
