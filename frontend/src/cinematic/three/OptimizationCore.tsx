import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

import { useQuality } from "../quality";
import { solveExample } from "../exampleProblem";
import DPStateNode, { type NodeStatus } from "./DPStateNode";
import EnergyBeam from "./EnergyBeam";
import FresnelShell from "./FresnelShell";
import OrbitSystem from "./OrbitSystem";
import { useWindowPointer } from "./CameraRig";

/* =========================================================
   OPTIMIZATION CORE
   The visual identity of OptiFlow: a floating computational
   core holding the DP state chain. The optimal path glows,
   alternative transitions stay dim. Hover a node to read
   its STATE / TIME / COST / SCORE.
========================================================= */

export interface CoreState {
  label: string;
  stage: string;
  strategy?: string;
  time: number;
  cost: number;
  score: number;
}

export interface OptimizationCoreProps {
  /** Real states to display. Falls back to the labelled example. */
  states?: CoreState[];
  /** Source tag shown in readouts (e.g. "LIVE RESULT") */
  source?: string;
  /** Highlight states up to this index (-1 = none, undefined = all) */
  activeIndex?: number;
  /**
   * Continuous build-up value read every frame:
   * node i appears when timeline ≥ i, beam i→i+1 draws over [i, i+1].
   * Overrides activeIndex.
   */
  timeline?: MutableRefObject<number>;
  /** 0..1 reveal of the shell + orbital rings (getter) */
  shellReveal?: MutableRefObject<number>;
  /** 0..1 reveal of the alternative (non-optimal) branches */
  branchReveal?: MutableRefObject<number>;
  intensity?: number;
  interactive?: boolean;
  branching?: boolean;
  rings?: boolean;
  alert?: boolean;
  scale?: number;
  position?: [number, number, number];
  spin?: number;
  /** Tilt toward the cursor */
  pointerTilt?: boolean;
}

function layout(count: number): [number, number, number][] {
  const span = 2.5;
  return Array.from({ length: count }, (_, i) => {
    const u = count === 1 ? 0.5 : i / (count - 1);
    return [
      -span / 2 + u * span,
      Math.sin(u * Math.PI * 2.1 + 0.4) * 0.42,
      Math.cos(u * Math.PI * 1.6) * 0.32,
    ];
  });
}

export function coreNodePositions(count: number) {
  return layout(count);
}

export default function OptimizationCore({
  states,
  source,
  activeIndex,
  timeline,
  shellReveal,
  branchReveal,
  intensity = 1,
  interactive = true,
  branching = true,
  rings = true,
  alert = false,
  scale = 1,
  position = [0, 0, 0],
  spin = 0.08,
  pointerTilt = true,
}: OptimizationCoreProps) {
  const quality = useQuality();
  const pointer = useWindowPointer();
  const root = useRef<THREE.Group>(null);
  const ringGroup = useRef<THREE.Group>(null);
  const branchGroup = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [step, setStep] = useState(() => (timeline ? Math.floor(timeline.current) : Infinity));

  const example = useMemo(() => solveExample(), []);
  const data: CoreState[] = states && states.length > 0 ? states : example.path;
  const tag = states && states.length > 0 ? source ?? "LIVE" : "EXAMPLE · STUDIO DEFAULT";

  const positions = useMemo(() => layout(data.length), [data.length]);

  const alternatives = useMemo(() => {
    if (!branching || quality.tier === "low") return [];
    const out: { from: [number, number, number]; to: [number, number, number]; pruned: boolean; stage: number }[] = [];
    positions.forEach((p, i) => {
      if (i === 0) return;
      const prev = positions[i - 1];
      [-1, 1].forEach((dir, k) => {
        out.push({
          from: prev,
          to: [p[0] + 0.05 * dir, p[1] + 0.62 * dir, p[2] - 0.28 * dir],
          pruned: (i + k) % 3 === 0,
          stage: i,
        });
      });
    });
    return out;
  }, [positions, branching, quality.tier]);

  const reach = timeline ? Math.min(step, data.length - 1) : activeIndex === undefined ? data.length - 1 : activeIndex;

  useFrame((state, delta) => {
    if (timeline) {
      const next = Math.floor(timeline.current);
      if (next !== step) setStep(next);
    }

    if (ringGroup.current && shellReveal) {
      const r = THREE.MathUtils.clamp(shellReveal.current, 0, 1);
      const eased = 1 - Math.pow(1 - r, 3);
      ringGroup.current.scale.setScalar(Math.max(0.0001, 0.6 + eased * 0.4));
      ringGroup.current.visible = r > 0.01;
    }

    if (branchGroup.current && branchReveal) {
      const b = THREE.MathUtils.clamp(branchReveal.current, 0, 1);
      branchGroup.current.visible = b > 0.01;
      branchGroup.current.scale.setScalar(Math.max(0.0001, b));
    }

    if (!root.current) return;
    const k = 1 - Math.exp(-2.2 * delta);
    if (!quality.reducedMotion) {
      root.current.rotation.y += delta * spin;
      if (pointerTilt) {
        root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -pointer.y * 0.18, k);
        root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, pointer.x * -0.06, k);
      }
      root.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.06;
    }
  });

  const statusFor = (i: number): NodeStatus => {
    if (timeline && i > step) return "hidden";
    if (alert && i === Math.max(0, reach)) return "pruned";
    if (i > reach) return "idle";
    if (i === data.length - 1 && reach === data.length - 1) return "optimal";
    return "active";
  };

  const shellIntensity = () => (shellReveal ? THREE.MathUtils.clamp(shellReveal.current, 0, 1) : 1) * 0.55 * intensity;
  const seedIntensity = () => (shellReveal ? 0.25 + THREE.MathUtils.clamp(shellReveal.current, 0, 1) * 0.75 : 1) * 0.8 * intensity;

  return (
    <group position={position} scale={scale}>
      <group ref={root}>
        {/* Volumetric shell */}
        <FresnelShell
          geometry="icosahedron"
          args={[1.75, 3]}
          colorA={alert ? "#ff5470" : "#38e8ff"}
          colorB="#9a7bff"
          intensity={shellIntensity}
        />

        {/* Inner energy seed */}
        <FresnelShell geometry="sphere" args={[0.28, 32, 32]} colorA="#ffffff" colorB="#38e8ff" power={1.4} intensity={seedIntensity} scan={false} />

        <group ref={ringGroup}>
          <mesh>
            <icosahedronGeometry args={[1.78, 1]} />
            <meshBasicMaterial
              color={alert ? "#ff5470" : "#38e8ff"}
              wireframe
              transparent
              opacity={0.06 * intensity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {rings && <OrbitSystem intensity={intensity} />}
        </group>

        {/* Alternative (non-optimal) transitions */}
        <group ref={branchGroup}>
          {alternatives.map((alt, index) => (
            <group key={`alt-${index}`}>
              <EnergyBeam
                points={[alt.from, alt.to]}
                status={timeline && alt.stage > step ? "hidden" : alt.pruned ? "pruned" : "dim"}
                radius={0.006}
                pulses={0}
                arc={0.1}
              />
              <DPStateNode
                position={alt.to}
                status={timeline && alt.stage > step ? "hidden" : alt.pruned ? "pruned" : "idle"}
                size={0.065}
              />
            </group>
          ))}
        </group>

        {/* Optimal transitions */}
        {positions.slice(1).map((p, index) => (
          <EnergyBeam
            key={`opt-${index}`}
            points={[positions[index], p]}
            status={
              timeline
                ? alert
                  ? "pruned"
                  : "optimal"
                : index + 1 <= reach
                  ? alert
                    ? "pruned"
                    : "optimal"
                  : "dim"
            }
            progress={timeline ? () => timeline.current - index : 1}
            radius={0.018}
            pulses={2}
            speed={0.45}
            arc={0.08}
          />
        ))}

        {/* States */}
        {positions.map((p, index) => (
          <group key={`node-${index}`}>
            <DPStateNode
              position={p}
              label={data[index].label}
              status={statusFor(index)}
              size={0.095}
              labelOffset={0.34}
              labelHeight={0.2}
              appearDelay={timeline ? 0 : 0.15 * index}
              interactive={interactive}
              onHover={(value) => setHovered(value ? index : null)}
            />
            {hovered === index && (
              <Html position={[p[0], p[1] + 0.55, p[2]]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
                <div className="of-holo-readout">
                  <div className="of-holo-readout__head">
                    <span>{data[index].label}</span>
                    <em>{tag}</em>
                  </div>
                  <dl>
                    <dt>STATE</dt>
                    <dd>
                      {data[index].stage}
                      {data[index].strategy && data[index].strategy !== "—" ? ` · ${data[index].strategy}` : ""}
                    </dd>
                    <dt>TIME</dt>
                    <dd>{data[index].time} min</dd>
                    <dt>COST</dt>
                    <dd>${data[index].cost.toFixed(2)}</dd>
                    <dt>SCORE</dt>
                    <dd>{data[index].score.toFixed(4)}</dd>
                  </dl>
                </div>
              </Html>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}
