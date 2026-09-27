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
   PLAYGROUND STATE SCENE
   dp[0] … dp[n] as 3D state nodes. The state being solved
   glows; energy flows in from the states it depends on.
   Memoization shows pending calls (violet) and cache hits.
========================================================= */

export interface PlaygroundNode {
  index: number;
  value: number | null;
  status: NodeStatus;
}

function Rig({ span }: { span: number }) {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    const distance = Math.max(4.8, span * 0.8 + 1.4) + (quality.isMobile ? 3 : 0);
    desired.set(pointer.x * 0.8 * s, 1.2 + pointer.y * 0.5 * s, distance);
    camera.position.lerp(desired, 1 - Math.exp(-2.4 * delta));
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function PlaygroundStateScene({
  nodes,
  currentIndex,
  dependencies,
  className = "",
}: {
  nodes: PlaygroundNode[];
  currentIndex: number | null;
  dependencies: number[];
  className?: string;
}) {
  const spacing = nodes.length > 14 ? 0.62 : 0.85;
  const span = (nodes.length - 1) * spacing;

  const positions = useMemo(
    () =>
      nodes.map((_, i) => {
        const x = -span / 2 + i * spacing;
        const u = nodes.length === 1 ? 0 : i / (nodes.length - 1);
        return [x, Math.sin(u * Math.PI) * 0.5 - 0.2, -Math.sin(u * Math.PI) * 0.8] as [number, number, number];
      }),
    [nodes, span, spacing],
  );

  return (
    <Scene3D
      className={className}
      label={`DP states: ${nodes.map((n) => `dp[${n.index}]=${n.value ?? "?"}`).join(", ")}`}
      camera={{ position: [0, 1.2, 8], fov: 42 }}
    >
      <ParticleField count={180} spread={[8, 3, 3]} size={0.5} opacity={0.3} seed={61} />

      {positions.slice(1).map((p, i) => (
        <EnergyBeam
          key={`chain-${i}`}
          points={[positions[i], p]}
          status={nodes[i + 1].value !== null ? "candidate" : "dim"}
          radius={0.008}
          pulses={0}
        />
      ))}

      {currentIndex !== null &&
        dependencies
          .filter((d) => d >= 0 && d < positions.length)
          .map((d) => (
            <EnergyBeam
              key={`dep-${d}-${currentIndex}`}
              points={[positions[d], positions[currentIndex]]}
              status="optimal"
              radius={0.018}
              pulses={3}
              speed={0.8}
              arc={0.6 + (currentIndex - d) * 0.25}
            />
          ))}

      {nodes.map((node, i) => (
        <DPStateNode
          key={node.index}
          position={positions[i]}
          label={`dp[${node.index}]`}
          sublabel={node.value === null ? "·" : String(node.value)}
          status={node.status}
          size={nodes.length > 14 ? 0.1 : 0.13}
          labelOffset={0.36}
          labelHeight={nodes.length > 14 ? 0.17 : 0.24}
        />
      ))}

      <Rig span={span} />
    </Scene3D>
  );
}
