import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";
import HoloLabel from "./HoloLabel";
import { getGlowTexture } from "./textures";

/* =========================================================
   AMBIENT ELEMENTS
   Distant geometry, floating mathematical symbols and the
   occasional shooting particle. All extremely subtle.
========================================================= */

export function DistantGeometry({ count = 5, opacity = 1 }: { count?: number; opacity?: number }) {
  const quality = useQuality();
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.7;
        return {
          position: [Math.cos(a) * (14 + (i % 3) * 5), Math.sin(a * 1.7) * 7, -18 - (i % 4) * 7] as [number, number, number],
          size: 1.2 + (i % 3) * 0.9,
          kind: i % 3,
          speed: 0.02 + (i % 4) * 0.012,
          color: i % 2 === 0 ? "#38e8ff" : "#9a7bff",
        };
      }),
    [count],
  );

  useFrame((_, delta) => {
    if (quality.reducedMotion) return;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.x += delta * items[i].speed;
      mesh.rotation.y += delta * items[i].speed * 1.3;
    });
  });

  return (
    <group>
      {items.map((item, i) => (
        <mesh
          key={i}
          position={item.position}
          ref={(node) => {
            refs.current[i] = node;
          }}
        >
          {item.kind === 0 && <icosahedronGeometry args={[item.size, 0]} />}
          {item.kind === 1 && <octahedronGeometry args={[item.size, 0]} />}
          {item.kind === 2 && <torusGeometry args={[item.size, item.size * 0.02, 4, 48]} />}
          <meshBasicMaterial
            color={item.color}
            wireframe
            transparent
            opacity={0.06 * opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

const SYMBOLS = ["DP[i][t][c]", "min", "Σ", "argmin", "f(n)", "S₀", "S₁", "S₂", "S₃", "≤ T", "≤ B", "∂"];

export function FloatingSymbols({ count = 9, opacity = 1 }: { count?: number; opacity?: number }) {
  const quality = useQuality();
  const group = useRef<THREE.Group>(null);

  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        text: SYMBOLS[i % SYMBOLS.length],
        position: [
          ((i * 37) % 26) - 13,
          ((i * 53) % 16) - 8,
          -6 - ((i * 29) % 12),
        ] as [number, number, number],
      })),
    [count],
  );

  useFrame((state) => {
    if (quality.reducedMotion || !group.current) return;
    const t = state.clock.elapsedTime;
    group.current.children.forEach((child, i) => {
      child.position.y = items[i].position[1] + Math.sin(t * 0.15 + i) * 0.4;
    });
  });

  return (
    <group ref={group}>
      {items.map((item, i) => (
        <HoloLabel
          key={i}
          text={item.text}
          position={item.position}
          height={0.34}
          color={i % 3 === 0 ? "#c3b1ff" : "#9fefff"}
          weight={500}
          opacity={0.14 * opacity}
          depthTest
        />
      ))}
    </group>
  );
}

export function ShootingParticles({ every = 7 }: { every?: number }) {
  const quality = useQuality();
  const sprite = useRef<THREE.Sprite>(null);
  const state = useRef({ start: 0, from: new THREE.Vector3(), dir: new THREE.Vector3(), active: false });

  useFrame(({ clock }) => {
    if (!sprite.current) return;
    const m = sprite.current.material as THREE.SpriteMaterial;
    if (quality.reducedMotion) {
      m.opacity = 0;
      return;
    }
    const t = clock.elapsedTime;
    const s = state.current;
    if (!s.active && t - s.start > every) {
      s.active = true;
      s.start = t;
      s.from.set(-14 + Math.random() * 10, 4 + Math.random() * 5, -8 - Math.random() * 6);
      s.dir.set(1, -0.35 - Math.random() * 0.2, 0).normalize();
    }
    if (s.active) {
      const age = t - s.start;
      const life = 1.4;
      if (age > life) {
        s.active = false;
        s.start = t + Math.random() * every;
        m.opacity = 0;
        return;
      }
      sprite.current.position.copy(s.from).addScaledVector(s.dir, age * 16);
      m.opacity = Math.sin((age / life) * Math.PI) * 0.8;
      m.rotation = Math.atan2(s.dir.y, s.dir.x);
    }
  });

  return (
    <sprite ref={sprite} scale={[3.2, 0.05, 1]}>
      <spriteMaterial
        map={getGlowTexture()}
        color="#dffbff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}
