import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import Scene3D from "../../../cinematic/three/Scene3D";
import OptimizationCore, { coreNodePositions } from "../../../cinematic/three/OptimizationCore";
import ParticleField from "../../../cinematic/three/ParticleField";
import { scrollProgress, useWindowPointer } from "../../../cinematic/three/CameraRig";
import { getGlowTexture } from "../../../cinematic/three/textures";
import { useQuality } from "../../../cinematic/quality";
import { solveExample } from "../../../cinematic/exampleProblem";

/* =========================================================
   HERO CORE SCENE — the opening title sequence
   ---------------------------------------------------------
   0.0s  black · a single point of light
   0.6s  S0 wakes
   1.1s  an energy beam builds S0 → S1 → … → S5
   3.7s  the state network branches outward
   4.0s  the camera pulls back, the core assembles
   5.4s  hand-over to cursor + scroll parallax
========================================================= */

export const INTRO_DURATION = 5.4;

interface IntroDirectorProps {
  skipped: boolean;
  coreOffset: number;
  onStart?: () => void;
  coreScale: number;
}

function IntroDirector({ skipped, coreOffset, onStart, coreScale }: IntroDirectorProps) {
  useEffect(() => {
    onStart?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quality = useQuality();
  const { camera } = useThree();
  const pointer = useWindowPointer();
  const clock = useRef(0);
  const timeline = useRef(0);
  const shell = useRef(0);
  const branches = useRef(0);
  const core = useRef<THREE.Group>(null);
  const spark = useRef<THREE.Sprite>(null);

  const states = solveExample().path;
  const nodes = useMemo(() => coreNodePositions(states.length), [states.length]);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const glow = useMemo(() => getGlowTexture(), []);

  const instant = skipped || quality.reducedMotion;

  useFrame((_, delta) => {
    clock.current = instant ? INTRO_DURATION + 1 : clock.current + Math.min(delta, 0.05);
    const t = clock.current;

    // Build-up values
    timeline.current = t < 1.1 ? (t > 0.6 ? 0.001 : -1) : Math.min(states.length - 1, (t - 1.1) / 0.5);
    branches.current = THREE.MathUtils.clamp((t - 3.7) / 0.8, 0, 1);
    shell.current = THREE.MathUtils.clamp((t - 4.0) / 1.3, 0, 1);

    // The first point of light
    if (spark.current) {
      const m = spark.current.material as THREE.SpriteMaterial;
      const a = THREE.MathUtils.clamp(t / 0.6, 0, 1) * (1 - THREE.MathUtils.clamp((t - 1.3) / 0.6, 0, 1));
      m.opacity = a;
      const s = 0.2 + a * 0.6 + Math.sin(t * 9) * 0.03;
      spark.current.scale.set(s, s, 1);
    }

    // Core drifts to its resting place as the camera pulls back
    const settle = THREE.MathUtils.smoothstep(t, 4.0, INTRO_DURATION);
    if (core.current) {
      core.current.position.x = THREE.MathUtils.lerp(0, coreOffset, settle);
      // Mobile: the core rises above the title instead of sitting beside it.
      core.current.position.y = quality.isMobile ? THREE.MathUtils.lerp(0, 2.55, settle) : 0;
    }

    // Camera: tracks the state being built, then dollies out
    const buildIndex = THREE.MathUtils.clamp(timeline.current, 0, states.length - 1);
    const i0 = Math.floor(buildIndex);
    const i1 = Math.min(states.length - 1, i0 + 1);
    const f = buildIndex - i0;
    const nodeX = THREE.MathUtils.lerp(nodes[i0][0], nodes[i1][0], f) * coreScale;
    const nodeY = THREE.MathUtils.lerp(nodes[i0][1], nodes[i1][1], f) * coreScale;

    const s = scrollProgress();
    const strength = quality.reducedMotion ? 0 : quality.isMobile ? 0.15 : 0.45;
    const orbit = quality.reducedMotion ? 0 : s * 2.2;
    const restDistance = quality.isMobile ? 11.5 : 9.6;
    const distance = THREE.MathUtils.lerp(3.6, restDistance, settle) + s * 3;

    const focusX = THREE.MathUtils.lerp(nodeX * 0.85, 0, settle);
    const focusY = THREE.MathUtils.lerp(nodeY * 0.6, 0, settle);

    desired.set(
      focusX + Math.sin(orbit) * distance + pointer.x * strength * settle,
      focusY + pointer.y * strength * 0.6 * settle + s * 1.2,
      Math.cos(orbit) * distance,
    );
    lookTarget.set(focusX, focusY, 0);

    const k = instant ? 1 : 1 - Math.exp(-3.2 * delta);
    camera.position.lerp(desired, k);
    camera.lookAt(lookTarget);
  });

  return (
    <group>
      <sprite ref={spark} position={[nodes[0][0] * coreScale, nodes[0][1] * coreScale, nodes[0][2] * coreScale]} scale={[0.2, 0.2, 1]}>
        <spriteMaterial map={glow} color="#dffbff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <group ref={core}>
        <OptimizationCore timeline={timeline} shellReveal={shell} branchReveal={branches} scale={coreScale} />
      </group>
    </group>
  );
}

export default function HeroCoreScene({
  skipped,
  className = "",
  onStart,
}: {
  skipped: boolean;
  className?: string;
  onStart?: () => void;
}) {
  const quality = useQuality();
  const offset = quality.isMobile ? 0 : 3.1;
  const coreScale = quality.isMobile ? 0.72 : 1.12;

  return (
    <Scene3D
      className={className}
      label="OptiFlow optimization core: a chain of dynamic-programming states S0 to S5 inside orbital rings. Hover a state to inspect it."
      camera={{ position: [-1.2, 0, 3.1], fov: 40, near: 0.1, far: 100 }}
      eventPrefix="client"
    >
      <ParticleField count={260} spread={[6, 4, 4]} size={0.6} opacity={0.45} drift={0.3} color="#bff6ff" seed={31} rotationSpeed={0.01} />
      <IntroDirector skipped={skipped} coreOffset={offset} onStart={onStart} coreScale={coreScale} />
    </Scene3D>
  );
}
