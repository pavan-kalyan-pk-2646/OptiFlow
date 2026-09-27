import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";
import HoloLabel from "./HoloLabel";
import { getDotTexture, getGlowTexture } from "./textures";

/* =========================================================
   DP CONSTELLATION
   Distant clusters of state nodes linked by hairline
   transitions, with energy pulses crawling along them.
========================================================= */

export interface ConstellationProps {
  clusters?: number;
  radius?: number;
  depth?: number;
  labels?: boolean;
  opacity?: number;
  seed?: number;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function Constellation({
  clusters = 5,
  radius = 16,
  depth = -14,
  labels = true,
  opacity = 1,
  seed = 11,
}: ConstellationProps) {
  const quality = useQuality();
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Points>(null);

  const data = useMemo(() => {
    const random = rng(seed);
    const nodes: THREE.Vector3[] = [];
    const segments: [THREE.Vector3, THREE.Vector3][] = [];
    const labelled: { p: THREE.Vector3; text: string }[] = [];

    for (let c = 0; c < clusters; c++) {
      const angle = (c / clusters) * Math.PI * 2 + random() * 0.6;
      const center = new THREE.Vector3(
        Math.cos(angle) * radius * (0.55 + random() * 0.45),
        (random() - 0.5) * radius * 0.7,
        depth - random() * 10,
      );
      const count = 4 + Math.floor(random() * 3);
      let prev: THREE.Vector3 | null = null;
      for (let i = 0; i < count; i++) {
        const p = center
          .clone()
          .add(new THREE.Vector3(i * 1.25 - count * 0.6, (random() - 0.5) * 1.6, (random() - 0.5) * 1.5));
        nodes.push(p);
        if (prev) segments.push([prev, p]);
        if (i > 0 && random() > 0.6) {
          const branch = p.clone().add(new THREE.Vector3(0.4, (random() > 0.5 ? 1 : -1) * 0.9, 0.2));
          nodes.push(branch);
          segments.push([prev ?? p, branch]);
        }
        if (labels && i < 4 && (c + i) % 2 === 0) labelled.push({ p, text: `S${i}` });
        prev = p;
      }
    }
    return { nodes, segments, labelled };
  }, [clusters, radius, depth, labels, seed]);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(data.segments.length * 6);
    data.segments.forEach(([a, b], i) => {
      positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [data]);

  const nodeGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(data.nodes);
    return g;
  }, [data]);

  const pulseCount = Math.min(data.segments.length, quality.tier === "low" ? 6 : 16);
  const pulseGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3));
    return g;
  }, [pulseCount]);

  useEffect(
    () => () => {
      lineGeometry.dispose();
      nodeGeometry.dispose();
      pulseGeometry.dispose();
    },
    [lineGeometry, nodeGeometry, pulseGeometry],
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (quality.reducedMotion) return;
    if (group.current) group.current.rotation.y += delta * 0.006;
    const attr = pulseGeometry.getAttribute("position") as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < pulseCount; i++) {
      const seg = data.segments[(i * 7) % data.segments.length];
      const u = (t * 0.18 + i * 0.37) % 1;
      tmp.copy(seg[0]).lerp(seg[1], u);
      attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
    }
    attr.needsUpdate = true;
    if (pulse.current) {
      (pulse.current.material as THREE.PointsMaterial).opacity = 0.6 * opacity;
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color="#7fe9ff"
          transparent
          opacity={0.12 * opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <points geometry={nodeGeometry}>
        <pointsMaterial
          map={getGlowTexture()}
          color="#cfe9ff"
          size={0.55}
          transparent
          opacity={0.55 * opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={pulse} geometry={pulseGeometry}>
        <pointsMaterial
          map={getDotTexture()}
          color="#38e8ff"
          size={0.22}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {labels &&
        data.labelled.map((item, index) => (
          <HoloLabel
            key={index}
            text={item.text}
            position={[item.p.x, item.p.y + 0.55, item.p.z]}
            height={0.32}
            color="#9fefff"
            opacity={0.28 * opacity}
            depthTest
          />
        ))}
    </group>
  );
}
