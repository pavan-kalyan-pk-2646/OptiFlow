import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import Scene3D from "../../cinematic/three/Scene3D";
import HoloLabel from "../../cinematic/three/HoloLabel";
import FresnelShell from "../../cinematic/three/FresnelShell";
import ParticleField from "../../cinematic/three/ParticleField";
import { useWindowPointer } from "../../cinematic/three/CameraRig";
import { useQuality } from "../../cinematic/quality";
import type { BenchmarkResult } from "../../cinematic/benchmark";

/* =========================================================
   BENCHMARK BARS — 3D performance graph (log scale)
   Violet pillars: brute force · cyan pillars: DP
========================================================= */

export type BenchMetric = "operations" | "ms";

function Pillar({ position, height, color, label }: { position: [number, number, number]; height: number; color: string; label: string }) {
  const group = useRef<THREE.Group>(null);
  const current = useRef(0.02);
  const quality = useQuality();
  useFrame((_, delta) => {
    if (!group.current) return;
    const k = quality.reducedMotion ? 1 : 1 - Math.exp(-4 * delta);
    current.current += (Math.max(0.02, height) - current.current) * k;
    group.current.scale.set(1, current.current, 1);
  });
  return (
    <group position={position}>
      <group ref={group}>
        <group position={[0, 0.5, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 1, 0.42]} />
            <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <FresnelShell geometry="box" args={[0.42, 1, 0.42]} colorA={color} colorB="#ffffff" power={1.4} intensity={0.8} scan={false} />
        </group>
      </group>
      <HoloLabel text={label} position={[0, Math.max(0.02, height) + 0.3, 0]} height={0.18} color="#ffffff" />
    </group>
  );
}

function Rig({ count }: { count: number }) {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    desired.set(pointer.x * 1.2 * s + 1.5, 2.6 + pointer.y * 0.8 * s, Math.max(7, count * 1.25));
    camera.position.lerp(desired, 1 - Math.exp(-2.2 * delta));
    camera.lookAt(0, 1.3, 0);
  });
  return null;
}

function format(value: number, metric: BenchMetric) {
  if (metric === "ms") return value < 1 ? `${value.toFixed(3)}ms` : `${value.toFixed(1)}ms`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

export default function BenchmarkBarsScene({
  results,
  metric,
  className = "",
}: {
  results: BenchmarkResult[];
  metric: BenchMetric;
  className?: string;
}) {
  const values = results.flatMap((r) => [r.dp[metric], r.brute ? r.brute[metric] : 0]).filter((v) => v > 0);
  const maxLog = Math.log10(Math.max(10, ...values) + 1);
  const minLog = metric === "ms" ? Math.log10(Math.max(1e-4, Math.min(...values, 1))) : 0;
  const scale = (v: number) => (v <= 0 ? 0 : ((Math.log10(v + (metric === "ms" ? 0 : 1)) - minLog) / (maxLog - minLog)) * 3.4 + 0.08);
  const spacing = 1.3;
  const span = (results.length - 1) * spacing;

  return (
    <Scene3D className={className} camera={{ position: [1.5, 2.6, 8], fov: 42 }} label="Three-dimensional bar chart of brute force versus dynamic programming, log scale.">
      <ParticleField count={200} spread={[8, 4, 4]} size={0.5} opacity={0.3} seed={91} />
      <gridHelper args={[Math.max(8, span + 3), 12, "#1d4a55", "#0d1f24"]} position={[0, 0, 0]} />
      {results.map((r, i) => {
        const x = -span / 2 + i * spacing;
        return (
          <group key={r.size}>
            {r.brute && <Pillar position={[x - 0.24, 0, 0]} height={scale(r.brute[metric])} color="#9a7bff" label={format(r.brute[metric], metric)} />}
            {!r.brute && <HoloLabel text="skipped" position={[x - 0.24, 0.3, 0]} height={0.14} color="#c3b1ff" opacity={0.7} />}
            <Pillar position={[x + 0.24, 0, 0]} height={scale(r.dp[metric])} color="#38e8ff" label={format(r.dp[metric], metric)} />
            <HoloLabel text={`${r.size} stages`} position={[x, -0.3, 0.5]} height={0.17} color="#bff6ff" />
          </group>
        );
      })}
      <HoloLabel text={metric === "ms" ? "MEDIAN RUNTIME · LOG SCALE" : "OPERATIONS · LOG SCALE"} position={[0, 4.2, 0]} height={0.24} color="#ffffff" />
      <Rig count={results.length} />
    </Scene3D>
  );
}
