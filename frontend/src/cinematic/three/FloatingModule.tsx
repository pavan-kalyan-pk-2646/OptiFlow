import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";
import FresnelShell from "./FresnelShell";
import HoloLabel from "./HoloLabel";

/* =========================================================
   FLOATING MODULE
   A 3D pipeline / engine module: glass block with lit edges,
   a floating title, and a hover state that pulls it toward
   the camera.
========================================================= */

export type ModuleState = "idle" | "active" | "complete" | "running" | "error" | "dim";

export interface FloatingModuleProps {
  position: [number, number, number];
  title: string;
  subtitle?: string;
  index?: string;
  size?: [number, number, number];
  state?: ModuleState;
  hovered?: boolean;
  onHover?: (hovered: boolean) => void;
  onSelect?: () => void;
  bob?: number;
  /** Extra forward travel when hovered */
  lift?: number;
  labelScale?: number;
}

const STATE_COLOR: Record<ModuleState, { edge: string; glow: number; face: number }> = {
  idle: { edge: "#7fdcf0", glow: 0.35, face: 0.05 },
  dim: { edge: "#3d4a57", glow: 0.12, face: 0.02 },
  active: { edge: "#38e8ff", glow: 1, face: 0.12 },
  running: { edge: "#9a7bff", glow: 0.9, face: 0.1 },
  complete: { edge: "#46f0b4", glow: 0.8, face: 0.09 },
  error: { edge: "#ff5470", glow: 0.9, face: 0.1 },
};

export default function FloatingModule({
  position,
  title,
  subtitle,
  index,
  size = [1.3, 0.8, 0.32],
  state = "idle",
  hovered = false,
  onHover,
  onSelect,
  bob = 0.05,
  lift = 0.7,
  labelScale = 1,
}: FloatingModuleProps) {
  const quality = useQuality();
  const group = useRef<THREE.Group>(null);
  const edges = useRef<THREE.LineSegments>(null);
  const face = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const color = useMemo(() => new THREE.Color(), []);
  const style = STATE_COLOR[hovered && state === "idle" ? "active" : state];

  const edgeGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(size[0] * 1.002, size[1] * 1.002, size[2] * 1.002);
    const g = new THREE.EdgesGeometry(box);
    box.dispose();
    return g;
  }, [size]);

  useFrame((stateFrame, delta) => {
    const k = 1 - Math.exp(-6 * delta);
    const t = stateFrame.clock.elapsedTime;
    if (group.current) {
      const targetZ = position[2] + (hovered ? lift : 0);
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, targetZ, k);
      group.current.position.y = position[1] + (quality.reducedMotion ? 0 : Math.sin(t * 0.9 + phase) * bob);
      const s = THREE.MathUtils.lerp(group.current.scale.x, hovered ? 1.08 : 1, k);
      group.current.scale.setScalar(s);
      if (!quality.reducedMotion) {
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, hovered ? 0 : Math.sin(t * 0.4 + phase) * 0.12, k);
      }
    }
    color.set(style.edge);
    if (edges.current) {
      const m = edges.current.material as THREE.LineBasicMaterial;
      m.color.lerp(color, k);
      m.opacity = THREE.MathUtils.lerp(m.opacity, 0.35 + style.glow * 0.65, k);
    }
    if (face.current) {
      const m = face.current.material as THREE.MeshBasicMaterial;
      m.color.lerp(color, k);
      m.opacity = THREE.MathUtils.lerp(m.opacity, style.face + (hovered ? 0.06 : 0), k);
    }
  });

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover?.(true);
    document.body.style.cursor = onSelect ? "pointer" : "";
  };
  const out = () => {
    onHover?.(false);
    document.body.style.cursor = "";
  };

  return (
    <group ref={group} position={position}>
      <RoundedBox
        ref={face}
        args={size}
        radius={0.06}
        smoothness={3}
        onPointerOver={over}
        onPointerOut={out}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.();
        }}
      >
        <meshBasicMaterial color={style.edge} transparent opacity={0.04} depthWrite={false} />
      </RoundedBox>

      <FresnelShell geometry="box" args={size} colorA={style.edge} colorB="#9a7bff" power={1.6} intensity={0.3 + style.glow * 0.5} scan={state === "running" || hovered} />

      <lineSegments ref={edges} geometry={edgeGeometry}>
        <lineBasicMaterial color={style.edge} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>

      {index && (
        <HoloLabel text={index} position={[-size[0] / 2 + 0.2, size[1] / 2 - 0.14, size[2] / 2 + 0.01]} height={0.11 * labelScale} color="#9fefff" opacity={0.8} />
      )}
      <HoloLabel
        text={title}
        position={[0, subtitle ? 0.05 : 0, size[2] / 2 + 0.02]}
        height={0.19 * labelScale}
        color="#ffffff"
        font="Orbitron, Space Grotesk, sans-serif"
        weight={700}
        letterSpacing={0.14}
      />
      {subtitle && (
        <HoloLabel text={subtitle} position={[0, -0.2, size[2] / 2 + 0.02]} height={0.11 * labelScale} color="#a9d6e6" weight={500} opacity={0.85} />
      )}
    </group>
  );
}
