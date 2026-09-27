import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";

/* =========================================================
   FRESNEL SHELL
   Edge-lit glass volume — gives geometry a holographic,
   volumetric-looking rim without post-processing.
========================================================= */

const vertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    vPos = position;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uPower;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uScan;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPos;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
    vec3 col = mix(uColorA, uColorB, clamp(vPos.y * 0.35 + 0.5, 0.0, 1.0));
    float scan = uScan * smoothstep(0.06, 0.0, abs(fract(vPos.y * 0.45 - uTime * 0.12) - 0.5));
    gl_FragColor = vec4(col, (f + scan * 0.12) * uIntensity);
  }
`;

export interface FresnelShellProps {
  geometry?: "sphere" | "icosahedron" | "box" | "octahedron";
  args?: number[];
  colorA?: string;
  colorB?: string;
  power?: number;
  intensity?: number | (() => number);
  scan?: boolean;
  side?: THREE.Side;
}

export default function FresnelShell({
  geometry = "sphere",
  args,
  colorA = "#38e8ff",
  colorB = "#9a7bff",
  power = 2.4,
  intensity = 0.9,
  scan = true,
  side = THREE.FrontSide,
}: FresnelShellProps) {
  const quality = useQuality();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side,
        uniforms: {
          uColorA: { value: new THREE.Color(colorA) },
          uColorB: { value: new THREE.Color(colorB) },
          uPower: { value: power },
          uIntensity: { value: 0 },
          uTime: { value: 0 },
          uScan: { value: scan ? 1 : 0 },
        },
      }),
    [colorA, colorB, power, side, scan], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    const target = typeof intensity === "function" ? intensity() : intensity;
    material.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      material.uniforms.uIntensity.value,
      target,
      1 - Math.pow(0.01, delta),
    );
    if (!quality.reducedMotion) material.uniforms.uTime.value += delta;
  });

  return (
    <mesh material={material}>
      {geometry === "sphere" && <sphereGeometry args={(args as [number, number, number]) ?? [1, 48, 48]} />}
      {geometry === "icosahedron" && <icosahedronGeometry args={(args as [number, number]) ?? [1, 1]} />}
      {geometry === "octahedron" && <octahedronGeometry args={(args as [number, number]) ?? [1, 0]} />}
      {geometry === "box" && <boxGeometry args={(args as [number, number, number]) ?? [1, 1, 1]} />}
    </mesh>
  );
}
