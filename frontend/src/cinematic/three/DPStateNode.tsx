import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { OF } from "../theme";
import { useQuality } from "../quality";
import HoloLabel from "./HoloLabel";
import { getGlowTexture } from "./textures";

/* =========================================================
   DP STATE NODE
   A single dynamic-programming state rendered as a glowing
   3D node. Status drives colour, scale, and energy.
========================================================= */

export type NodeStatus = "idle" | "candidate" | "active" | "optimal" | "pruned" | "cached" | "hidden";

export interface DPStateNodeProps {
  position: [number, number, number];
  label?: string;
  sublabel?: string;
  status?: NodeStatus;
  size?: number;
  /** Delay before the node "awakens" (seconds from mount) */
  appearDelay?: number;
  labelOffset?: number;
  labelHeight?: number;
  interactive?: boolean;
  onHover?: (hovered: boolean) => void;
  onSelect?: () => void;
}

const STATUS_STYLE: Record<NodeStatus, { color: string; glow: number; scale: number; opacity: number; ring: boolean }> = {
  idle: { color: "#8fa3b8", glow: 0.3, scale: 0.75, opacity: 0.32, ring: false },
  candidate: { color: OF.violet, glow: 0.6, scale: 0.9, opacity: 0.85, ring: false },
  active: { color: OF.cyan, glow: 1.05, scale: 1.05, opacity: 1, ring: true },
  optimal: { color: "#ffffff", glow: 1.5, scale: 1.25, opacity: 1, ring: true },
  pruned: { color: OF.pruned, glow: 0.18, scale: 0.45, opacity: 0.25, ring: false },
  cached: { color: OF.success, glow: 0.9, scale: 1, opacity: 1, ring: true },
  hidden: { color: "#000000", glow: 0, scale: 0.0001, opacity: 0, ring: false },
};

export default function DPStateNode({
  position,
  label,
  sublabel,
  status = "idle",
  size = 0.16,
  appearDelay = 0,
  labelOffset = 0.42,
  labelHeight = 0.2,
  interactive = false,
  onHover,
  onSelect,
}: DPStateNodeProps) {
  const quality = useQuality();
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const born = useRef<number | null>(null);

  const glowTexture = useMemo(() => getGlowTexture(), []);
  const targetColor = useMemo(() => new THREE.Color(), []);
  const style = STATUS_STYLE[status];
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;
    const age = t - born.current - appearDelay;
    const appear = quality.reducedMotion ? 1 : THREE.MathUtils.clamp(age / 0.6, 0, 1);
    const eased = 1 - Math.pow(1 - appear, 3);

    const pulse = quality.reducedMotion ? 1 : 1 + Math.sin(t * 2.2 + phase) * 0.06 * style.glow;
    const hoverBoost = hovered ? 1.35 : 1;
    const targetScale = style.scale * eased * hoverBoost * pulse;
    const k = 1 - Math.pow(0.001, delta);

    if (group.current) {
      const s = THREE.MathUtils.lerp(group.current.scale.x, targetScale, k);
      group.current.scale.setScalar(Math.max(0.0001, s));
    }

    targetColor.set(style.color);

    if (core.current) {
      const m = core.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(targetColor, k);
      m.opacity = THREE.MathUtils.lerp(m.opacity, style.opacity * eased, k);
    }

    if (halo.current) {
      const m = halo.current.material as THREE.SpriteMaterial;
      m.color.lerp(targetColor, k);
      m.opacity = THREE.MathUtils.lerp(m.opacity, style.glow * 0.55 * eased * (hovered ? 1.4 : 1), k);
    }

    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(targetColor, k);
      m.opacity = THREE.MathUtils.lerp(m.opacity, style.ring || hovered ? 0.7 * eased : 0, k);
      if (!quality.reducedMotion) {
        ring.current.rotation.z += delta * 0.8;
        ring.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.7 + phase) * 0.35;
      }
    }
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    setHovered(true);
    onHover?.(true);
    document.body.style.cursor = "pointer";
  };

  const handleOut = () => {
    if (!interactive) return;
    setHovered(false);
    onHover?.(false);
    document.body.style.cursor = "";
  };

  return (
    <group position={position}>
      <group ref={group} scale={0.0001}>
        <sprite ref={halo} scale={[size * 9, size * 9, 1]}>
          <spriteMaterial
            map={glowTexture}
            color={style.color}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>

        <mesh
          ref={core}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={(event) => {
            if (!interactive) return;
            event.stopPropagation();
            onSelect?.();
          }}
        >
          <sphereGeometry args={[size, 24, 24]} />
          <meshBasicMaterial color={style.color} transparent opacity={0} toneMapped={false} />
        </mesh>

        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 2.1, size * 0.07, 8, 64]} />
          <meshBasicMaterial
            color={style.color}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      {label && status !== "hidden" && (
        <HoloLabel
          text={label}
          position={[0, labelOffset, 0]}
          height={labelHeight}
          color={status === "pruned" ? "#ff8fa1" : status === "optimal" ? "#ffffff" : "#bff6ff"}
          opacity={status === "pruned" ? 0.35 : status === "idle" ? 0.6 : 0.95}
        />
      )}

      {sublabel && status !== "hidden" && (
        <HoloLabel
          text={sublabel}
          position={[0, -labelOffset * 0.95, 0]}
          height={labelHeight * 0.72}
          color="#9aa9b8"
          weight={500}
          opacity={status === "pruned" ? 0.25 : 0.7}
        />
      )}
    </group>
  );
}
