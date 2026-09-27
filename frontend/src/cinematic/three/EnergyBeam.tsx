import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";
import { getGlowTexture } from "./textures";

/* =========================================================
   ENERGY BEAM
   A DP transition: a luminous tube with data pulses that
   travel from one state to the next.
========================================================= */

export type BeamStatus = "dim" | "candidate" | "active" | "optimal" | "pruned" | "reverse" | "hidden";

export interface EnergyBeamProps {
  points: [number, number, number][];
  status?: BeamStatus;
  color?: string;
  /** 0 → 1 : how much of the beam is drawn (number, or a getter read every frame) */
  progress?: number | (() => number);
  radius?: number;
  pulses?: number;
  speed?: number;
  /** Bend the beam through a curve (adds a mid control point) */
  arc?: number;
}

const BEAM_STYLE: Record<BeamStatus, { color: string; opacity: number; glow: number; pulses: boolean }> = {
  dim: { color: "#6f8196", opacity: 0.12, glow: 0.03, pulses: false },
  candidate: { color: "#9a7bff", opacity: 0.35, glow: 0.1, pulses: true },
  active: { color: "#38e8ff", opacity: 0.8, glow: 0.22, pulses: true },
  optimal: { color: "#bff9ff", opacity: 1, glow: 0.35, pulses: true },
  pruned: { color: "#ff5470", opacity: 0.08, glow: 0.02, pulses: false },
  reverse: { color: "#c3b1ff", opacity: 0.9, glow: 0.3, pulses: true },
  hidden: { color: "#000000", opacity: 0, glow: 0, pulses: false },
};

const TUBULAR = 64;
const RADIAL = 6;

export default function EnergyBeam({
  points,
  status = "active",
  color,
  progress = 1,
  radius = 0.012,
  pulses = 2,
  speed = 0.35,
  arc = 0,
}: EnergyBeamProps) {
  const quality = useQuality();
  const style = BEAM_STYLE[status];
  const beamColor = color ?? style.color;

  const key = points.map((p) => p.join(",")).join("|") + `:${arc}`;

  const curve = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(...p));
    if (arc !== 0 && vectors.length === 2) {
      const mid = vectors[0].clone().lerp(vectors[1], 0.5);
      mid.y += arc;
      vectors.splice(1, 0, mid);
    }
    return new THREE.CatmullRomCurve3(vectors, false, "centripetal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const coreGeometry = useMemo(() => new THREE.TubeGeometry(curve, TUBULAR, radius, RADIAL, false), [curve, radius]);
  const glowGeometry = useMemo(() => new THREE.TubeGeometry(curve, TUBULAR, radius * 3.4, RADIAL, false), [curve, radius]);

  useEffect(
    () => () => {
      coreGeometry.dispose();
      glowGeometry.dispose();
    },
    [coreGeometry, glowGeometry],
  );

  const core = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const pulseRefs = useRef<(THREE.Sprite | null)[]>([]);
  const target = useMemo(() => new THREE.Color(), []);
  const glowTexture = useMemo(() => getGlowTexture(), []);
  const offset = useMemo(() => Math.random(), []);

  useFrame((state, delta) => {
    const k = 1 - Math.pow(0.002, delta);
    target.set(beamColor);

    const drawn = THREE.MathUtils.clamp(typeof progress === "function" ? progress() : progress, 0, 1);
    const count = Math.floor(drawn * TUBULAR) * RADIAL * 6;
    coreGeometry.setDrawRange(0, count);
    glowGeometry.setDrawRange(0, count);

    if (core.current) {
      const m = core.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(target, k);
      m.opacity = THREE.MathUtils.lerp(m.opacity, style.opacity, k);
    }
    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(target, k);
      m.opacity = THREE.MathUtils.lerp(m.opacity, style.glow, k);
    }

    const t = state.clock.elapsedTime;
    pulseRefs.current.forEach((sprite, index) => {
      if (!sprite) return;
      const m = sprite.material as THREE.SpriteMaterial;
      const visible = style.pulses && drawn >= 0.999 && !quality.reducedMotion;
      m.opacity = THREE.MathUtils.lerp(m.opacity, visible ? 0.95 : 0, k);
      if (!visible) return;
      let u = (t * speed + offset + index / Math.max(1, pulses)) % 1;
      if (status === "reverse") u = 1 - u;
      sprite.position.copy(curve.getPointAt(u));
      const s = radius * 22 * (0.7 + Math.sin(u * Math.PI) * 0.6);
      sprite.scale.set(s, s, 1);
      m.color.copy(target);
    });
  });

  return (
    <group>
      <mesh ref={glow} geometry={glowGeometry}>
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={core} geometry={coreGeometry}>
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {Array.from({ length: pulses }, (_, index) => (
        <sprite
          key={index}
          ref={(node) => {
            pulseRefs.current[index] = node;
          }}
        >
          <spriteMaterial
            map={glowTexture}
            color={beamColor}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
