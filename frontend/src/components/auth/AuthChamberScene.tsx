import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import Scene3D from "../../cinematic/three/Scene3D";
import DPStateNode, { type NodeStatus } from "../../cinematic/three/DPStateNode";
import EnergyBeam from "../../cinematic/three/EnergyBeam";
import FresnelShell from "../../cinematic/three/FresnelShell";
import OrbitSystem from "../../cinematic/three/OrbitSystem";
import ParticleField from "../../cinematic/three/ParticleField";
import { useWindowPointer } from "../../cinematic/three/CameraRig";
import { getGlowTexture } from "../../cinematic/three/textures";
import { useQuality } from "../../cinematic/quality";

/* =========================================================
   AUTHENTICATION CHAMBER
   ---------------------------------------------------------
   The AUTH CORE sits inside a ring of state nodes.
   Focusing a field activates its state (EMAIL → S0,
   ACCESS KEY → S1 …). Typing emits particle bursts.
   Submit charges the transition, success flies the camera
   through the core, failure pulses red — nothing breaks.
========================================================= */

export type ChamberStatus = "idle" | "submitting" | "success" | "error";

export interface AuthChamberSceneProps {
  labels: string[];
  /** Index of the state bound to the focused field (-1 = none) */
  active: number;
  /** States already satisfied (filled fields) */
  completed: boolean[];
  /** Increment on every keystroke */
  pulse: number;
  status: ChamberStatus;
  /** Called when the success fly-through has finished */
  onFlyThroughComplete?: () => void;
}

function ringPosition(index: number, count: number, radius: number): [number, number, number] {
  const angle = Math.PI / 2 + (index / count) * Math.PI * 2;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.82, Math.sin(angle * 2) * 0.25];
}

function Bursts({ pulse, origin }: { pulse: number; origin: [number, number, number] }) {
  const quality = useQuality();
  const count = 36;
  const points = useRef<THREE.Points>(null);
  const velocities = useRef(new Float32Array(count * 3));
  const life = useRef(0);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    if (pulse === 0 || quality.reducedMotion) return;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      attr.setXYZ(i, origin[0], origin[1], origin[2]);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.6 + Math.random() * 1.4;
      velocities.current.set(
        [Math.sin(phi) * Math.cos(theta) * speed, Math.sin(phi) * Math.sin(theta) * speed, Math.cos(phi) * speed],
        i * 3,
      );
    }
    attr.needsUpdate = true;
    life.current = 1;
  }, [pulse, origin, geometry, quality.reducedMotion]);

  useFrame((_, delta) => {
    if (!points.current || life.current <= 0) return;
    life.current = Math.max(0, life.current - delta * 1.6);
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      attr.setXYZ(
        i,
        attr.getX(i) + velocities.current[i * 3] * delta,
        attr.getY(i) + velocities.current[i * 3 + 1] * delta,
        attr.getZ(i) + velocities.current[i * 3 + 2] * delta,
      );
    }
    attr.needsUpdate = true;
    (points.current.material as THREE.PointsMaterial).opacity = life.current;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={getGlowTexture()}
        color="#8ff3ff"
        size={0.09}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Chamber({ labels, active, completed, pulse, status, onFlyThroughComplete }: AuthChamberSceneProps) {
  const quality = useQuality();
  const pointer = useWindowPointer();
  const { camera } = useThree();
  const root = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Sprite>(null);
  const alertLevel = useRef(0);
  const charge = useRef(0);
  const fly = useRef(0);
  const flown = useRef(false);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  const coreX = quality.isMobile ? 0 : -2.7;
  const coreY = quality.isMobile ? 1.9 : 0;
  const radius = quality.isMobile ? 1.5 : 1.95;

  const positions = useMemo(() => labels.map((_, i) => ringPosition(i, labels.length, radius)), [labels, radius]);

  useEffect(() => {
    if (status === "error") alertLevel.current = 1;
    if (status !== "success") {
      fly.current = 0;
      flown.current = false;
    }
  }, [status]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    alertLevel.current = Math.max(0, alertLevel.current - delta * 0.9);
    charge.current = THREE.MathUtils.lerp(charge.current, status === "submitting" || status === "success" ? 1 : 0, 1 - Math.exp(-3 * delta));

    if (root.current && !quality.reducedMotion) {
      root.current.rotation.z += delta * (0.05 + charge.current * 0.6);
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -pointer.y * 0.15, 0.05);
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, pointer.x * 0.2, 0.05);
    }

    if (flash.current) {
      const m = flash.current.material as THREE.SpriteMaterial;
      const a = alertLevel.current * (0.6 + Math.sin(t * 18) * 0.4);
      m.color.set(alertLevel.current > 0.01 ? "#ff4868" : "#38e8ff");
      m.opacity = Math.max(a, charge.current * 0.55 + Math.sin(t * 6) * 0.08 * charge.current);
    }

    // Camera: gentle parallax, or the fly-through on success
    if (status === "success") {
      fly.current = quality.reducedMotion ? 1 : Math.min(1, fly.current + delta / 1.05);
      if (fly.current >= 1 && !flown.current) {
        flown.current = true;
        onFlyThroughComplete?.();
      }
    }
    const f = THREE.MathUtils.smoothstep(fly.current, 0, 1);
    origin.set(coreX, coreY, 0);
    const baseZ = quality.isMobile ? 11 : 10;
    desired.set(
      THREE.MathUtils.lerp(pointer.x * 0.35 * (quality.reducedMotion ? 0 : 1), coreX, f),
      THREE.MathUtils.lerp(pointer.y * 0.25 * (quality.reducedMotion ? 0 : 1) + (quality.isMobile ? 0.6 : 0), coreY, f),
      THREE.MathUtils.lerp(baseZ, -1.5, f),
    );
    camera.position.lerp(desired, status === "success" ? 0.35 : 1 - Math.exp(-2.4 * delta));
    if (f > 0.001) look.copy(origin).setZ(-6);
    else look.set(quality.isMobile ? 0 : -0.6, quality.isMobile ? 0.6 : 0, 0);
    camera.lookAt(look);
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = THREE.MathUtils.lerp(40, 75, f);
    perspective.updateProjectionMatrix();
  });

  const nodeStatus = (i: number): NodeStatus => {
    if (status === "error" && i === Math.max(0, active)) return "pruned";
    if (status === "success") return "optimal";
    if (i === active) return "optimal";
    if (completed[i]) return "active";
    return "idle";
  };

  const reached = completed.reduce((last, done, i) => (done ? i : last), -1);

  return (
    <group position={[coreX, coreY, 0]}>
      <group ref={root}>
        <FresnelShell geometry="icosahedron" args={[1.05, 2]} colorA={status === "error" ? "#ff5470" : "#38e8ff"} colorB="#9a7bff" intensity={0.7} />
        <mesh>
          <icosahedronGeometry args={[1.08, 1]} />
          <meshBasicMaterial color="#38e8ff" wireframe transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <FresnelShell geometry="sphere" args={[0.32, 32, 32]} colorA="#ffffff" colorB="#38e8ff" power={1.3} intensity={1} scan={false} />
        <sprite ref={flash} scale={[3.2, 3.2, 1]}>
          <spriteMaterial map={getGlowTexture()} color="#38e8ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>

        <OrbitSystem
          rings={[
            { radius: radius, tilt: [0, 0, 0], color: "#38e8ff", speed: 0.12, opacity: 0.35, particles: 20 },
            { radius: radius * 1.22, tilt: [0.4, 0.3, 0], color: "#9a7bff", speed: -0.08, opacity: 0.22, particles: 14 },
            { radius: radius * 0.62, tilt: [1.2, 0.2, 0.3], color: "#dff9ff", speed: 0.3, opacity: 0.25, particles: 10 },
          ]}
        />

        {/* core → first state */}
        <EnergyBeam points={[[0, 0, 0], positions[0]]} status={active >= 0 || reached >= 0 || status === "success" ? "active" : "dim"} radius={0.012} />

        {positions.slice(1).map((p, i) => (
          <EnergyBeam
            key={`t-${i}`}
            points={[positions[i], p]}
            arc={0.2}
            status={
              status === "error"
                ? "pruned"
                : status === "success"
                  ? "optimal"
                  : completed[i] && (completed[i + 1] || active === i + 1)
                    ? "active"
                    : "dim"
            }
            radius={0.012}
          />
        ))}

        {positions.map((p, i) => (
          <DPStateNode
            key={labels[i]}
            position={p}
            label={`S${i}`}
            sublabel={labels[i]}
            status={nodeStatus(i)}
            size={quality.isMobile ? 0.08 : 0.1}
            labelOffset={0.32}
            labelHeight={0.17}
          />
        ))}

        <Bursts pulse={pulse} origin={active >= 0 ? positions[active] : [0, 0, 0]} />
      </group>
    </group>
  );
}

export default function AuthChamberScene(props: AuthChamberSceneProps) {
  return (
    <Scene3D
      className="absolute inset-0"
      alwaysActive
      label="Authentication chamber: each field of the form is a state around the OptiFlow core."
      camera={{ position: [0, 0, 9], fov: 40 }}
    >
      <ParticleField count={900} spread={[24, 14, 12]} size={0.9} opacity={0.6} seed={9} />
      <ParticleField count={200} spread={[7, 5, 4]} size={0.5} opacity={0.35} drift={0.4} color="#c3b1ff" seed={13} />
      <Chamber {...props} />
    </Scene3D>
  );
}
