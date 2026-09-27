import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";

/* =========================================================
   CAMERA RIG
   Cinematic, damped camera response to cursor + scroll.
   Pointer is read from window so it works even when the
   canvas sits behind the UI (pointer-events: none).
========================================================= */

export interface CameraRigProps {
  base?: [number, number, number];
  lookAt?: [number, number, number];
  /** How far the camera drifts with the pointer */
  pointer?: number;
  /** Camera dolly per full page scroll (z units) */
  scrollDolly?: number;
  /** Vertical travel per full page scroll */
  scrollLift?: number;
  /** Orbit angle (radians) per full page scroll */
  scrollOrbit?: number;
  damping?: number;
  /** External target override: dolly amount 0..1 */
  dolly?: number;
  dollyDistance?: number;
}

const pointerState = { x: 0, y: 0, bound: false };

function bindPointer() {
  if (pointerState.bound || typeof window === "undefined") return;
  pointerState.bound = true;
  window.addEventListener(
    "pointermove",
    (event) => {
      pointerState.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerState.y = -((event.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}

export function useWindowPointer() {
  useEffect(bindPointer, []);
  return pointerState;
}

export function scrollProgress(): number {
  if (typeof window === "undefined") return 0;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
}

export default function CameraRig({
  base = [0, 0, 10],
  lookAt = [0, 0, 0],
  pointer = 0.6,
  scrollDolly = 0,
  scrollLift = 0,
  scrollOrbit = 0,
  damping = 2.4,
  dolly = 0,
  dollyDistance = 0,
}: CameraRigProps) {
  const { camera } = useThree();
  const quality = useQuality();
  const p = useWindowPointer();
  const target = useMemo(() => new THREE.Vector3(...lookAt), [lookAt[0], lookAt[1], lookAt[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  const desired = useRef(new THREE.Vector3(...base));

  useFrame((_, delta) => {
    const strength = quality.reducedMotion ? 0 : quality.isMobile ? pointer * 0.3 : pointer;
    const s = scrollProgress();
    const orbit = quality.reducedMotion ? 0 : s * scrollOrbit;

    const radius = base[2] - s * scrollDolly - dolly * dollyDistance;
    desired.current.set(
      base[0] + Math.sin(orbit) * radius + p.x * strength,
      base[1] - s * scrollLift + p.y * strength * 0.6,
      Math.cos(orbit) * radius,
    );

    const k = 1 - Math.exp(-damping * delta);
    camera.position.lerp(desired.current, quality.reducedMotion ? 1 : k);
    camera.lookAt(target);
  });

  return null;
}
