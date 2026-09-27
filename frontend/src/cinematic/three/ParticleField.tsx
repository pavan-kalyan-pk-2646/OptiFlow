import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";

/* =========================================================
   PARTICLE FIELD
   One draw call. Twinkle + drift happen on the GPU.
========================================================= */

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uDrift;
  varying float vTwinkle;

  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.12 + aPhase * 6.2831) * uDrift;
    p.x += cos(uTime * 0.09 + aPhase * 4.0) * uDrift * 0.6;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aPhase * 1.8) + aPhase * 40.0);
    vTwinkle = tw;
    gl_PointSize = aSize * uPixelRatio * (0.75 + tw * 0.5) * (18.0 / -mv.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTwinkle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.4);
    gl_FragColor = vec4(uColor, glow * uOpacity * vTwinkle);
  }
`;

export interface ParticleFieldProps {
  count?: number;
  /** Half-extents of the spawn volume */
  spread?: [number, number, number];
  color?: string;
  size?: number;
  opacity?: number;
  drift?: number;
  /** Radial shell instead of a box */
  shell?: { inner: number; outer: number };
  rotationSpeed?: number;
  seed?: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function ParticleField({
  count = 1200,
  spread = [30, 18, 20],
  color = "#bff6ff",
  size = 1.2,
  opacity = 0.7,
  drift = 0.15,
  shell,
  rotationSpeed = 0.004,
  seed = 7,
}: ParticleFieldProps) {
  const quality = useQuality();
  const points = useRef<THREE.Points>(null);
  const total = Math.max(40, Math.round(count * quality.particles));

  const geometry = useMemo(() => {
    const random = mulberry32(seed);
    const positions = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const phases = new Float32Array(total);

    for (let i = 0; i < total; i++) {
      if (shell) {
        const r = shell.inner + random() * (shell.outer - shell.inner);
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.cos(phi) * 0.6;
        positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      } else {
        positions[i * 3] = (random() * 2 - 1) * spread[0];
        positions[i * 3 + 1] = (random() * 2 - 1) * spread[1];
        positions[i * 3 + 2] = (random() * 2 - 1) * spread[2];
      }
      const bright = random() > 0.965;
      sizes[i] = size * (bright ? 2.6 : 0.5 + random() * 0.9);
      phases[i] = random();
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, spread[0], spread[1], spread[2], size, shell?.inner, shell?.outer, seed]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
          uDrift: { value: drift },
        },
      }),
    [color, opacity, drift],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    if (quality.reducedMotion) return;
    material.uniforms.uTime.value += delta;
    if (points.current) points.current.rotation.y += delta * rotationSpeed;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
