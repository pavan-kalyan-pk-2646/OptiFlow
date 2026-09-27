import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";
import { getDotTexture } from "./textures";

/* =========================================================
   ORBIT SYSTEM
   Tilted orbital rings with data particles riding them.
   Each ring represents a pass of the optimizer.
========================================================= */

export interface OrbitRing {
  radius: number;
  tilt: [number, number, number];
  color: string;
  speed: number;
  opacity?: number;
  particles?: number;
  thickness?: number;
}

export interface OrbitSystemProps {
  rings?: OrbitRing[];
  intensity?: number;
}

export const DEFAULT_RINGS: OrbitRing[] = [
  { radius: 1.9, tilt: [1.2, 0.2, 0], color: "#38e8ff", speed: 0.22, opacity: 0.5, particles: 26 },
  { radius: 2.35, tilt: [0.5, 0.9, 0.3], color: "#9a7bff", speed: -0.16, opacity: 0.35, particles: 18 },
  { radius: 2.8, tilt: [1.7, -0.5, 0.6], color: "#dff9ff", speed: 0.1, opacity: 0.18, particles: 12 },
];

function Ring({ ring, intensity }: { ring: OrbitRing; intensity: number }) {
  const quality = useQuality();
  const spin = useRef<THREE.Group>(null);
  const count = Math.max(4, Math.round((ring.particles ?? 16) * (quality.tier === "low" ? 0.5 : 1)));

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      positions[i * 3] = Math.cos(a) * ring.radius;
      positions[i * 3 + 1] = Math.sin(a) * ring.radius;
      positions[i * 3 + 2] = 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count, ring.radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (quality.reducedMotion || !spin.current) return;
    spin.current.rotation.z += delta * ring.speed;
  });

  return (
    <group rotation={ring.tilt}>
      <mesh>
        <torusGeometry args={[ring.radius, ring.thickness ?? 0.006, 6, 160]} />
        <meshBasicMaterial
          color={ring.color}
          transparent
          opacity={(ring.opacity ?? 0.35) * intensity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <group ref={spin}>
        <points geometry={geometry}>
          <pointsMaterial
            map={getDotTexture()}
            color={ring.color}
            size={0.07}
            sizeAttenuation
            transparent
            opacity={0.9 * intensity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      </group>
    </group>
  );
}

export default function OrbitSystem({ rings = DEFAULT_RINGS, intensity = 1 }: OrbitSystemProps) {
  return (
    <group>
      {rings.map((ring, index) => (
        <Ring key={index} ring={ring} intensity={intensity} />
      ))}
    </group>
  );
}
