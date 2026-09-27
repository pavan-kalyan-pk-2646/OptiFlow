import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import Scene3D from "../three/Scene3D";
import DPStateNode, { type NodeStatus } from "../three/DPStateNode";
import EnergyBeam, { type BeamStatus } from "../three/EnergyBeam";
import HoloLabel from "../three/HoloLabel";
import ParticleField from "../three/ParticleField";
import { useWindowPointer } from "../three/CameraRig";
import { useQuality } from "../quality";

/* =========================================================
   DP CONCEPT SCENE
   The persistent visual language of Dynamic Programming.
   One scene, many concepts:

   state · transition · constraint · pruning · optimality ·
   reconstruction · overlap · memo · grid
========================================================= */

export type DPConcept =
  | "state"
  | "transition"
  | "constraint"
  | "pruning"
  | "optimality"
  | "reconstruction"
  | "overlap"
  | "memo"
  | "grid";

type V3 = [number, number, number];

/* ---------------------------------------------------------
   Branching state tree
--------------------------------------------------------- */

interface TreeNode {
  id: string;
  label: string;
  p: V3;
  violates?: boolean;
  optimal?: boolean;
}

const TREE: TreeNode[] = [
  { id: "s0", label: "S0", p: [-3.6, 0, 0], optimal: true },
  { id: "s1", label: "S1", p: [-1.8, 0, 0.2], optimal: true },
  { id: "s2a", label: "S2a", p: [0, 1.35, -0.2] },
  { id: "s2b", label: "S2b", p: [0, 0, 0.3], optimal: true },
  { id: "s2c", label: "S2c", p: [0, -1.35, -0.1], violates: true },
  { id: "s3a", label: "S3a", p: [1.8, 1.9, 0.1], violates: true },
  { id: "s3b", label: "S3b", p: [1.8, 0.85, -0.3] },
  { id: "s3c", label: "S3c", p: [1.8, 0, 0.35], optimal: true },
  { id: "s3d", label: "S3d", p: [1.8, -0.8, -0.2] },
  { id: "s4", label: "S4", p: [3.6, 0.2, 0], optimal: true },
];

const EDGES: [string, string][] = [
  ["s0", "s1"],
  ["s1", "s2a"],
  ["s1", "s2b"],
  ["s1", "s2c"],
  ["s2a", "s3a"],
  ["s2a", "s3b"],
  ["s2b", "s3c"],
  ["s2b", "s3d"],
  ["s3b", "s4"],
  ["s3c", "s4"],
  ["s3d", "s4"],
];

const byId = Object.fromEntries(TREE.map((n) => [n.id, n]));
const ORDER: DPConcept[] = ["state", "transition", "constraint", "pruning", "optimality", "reconstruction"];

function stepOf(concept: DPConcept) {
  const i = ORDER.indexOf(concept);
  return i === -1 ? 4 : i;
}

function nodeStatus(node: TreeNode, step: number): NodeStatus {
  if (step === 0) return node.id === "s0" || node.id === "s1" ? "active" : "idle";
  if (step === 1) return node.violates ? "candidate" : "active";
  if (step === 2) return node.violates ? "pruned" : "active";
  if (step === 3) return node.violates ? "hidden" : "candidate";
  if (step >= 4) return node.violates ? "hidden" : node.optimal ? (node.id === "s4" ? "optimal" : "active") : "idle";
  return "idle";
}

function edgeStatus(a: TreeNode, b: TreeNode, step: number): BeamStatus {
  const dead = a.violates || b.violates;
  if (step === 0) return a.id === "s0" ? "active" : "dim";
  if (step === 1) return dead ? "candidate" : "active";
  if (step === 2) return dead ? "pruned" : "active";
  if (step === 3) return dead ? "hidden" : "candidate";
  const optimal = a.optimal && b.optimal;
  if (step === 4) return dead ? "hidden" : optimal ? "optimal" : "dim";
  return dead ? "hidden" : optimal ? "reverse" : "dim";
}

function ConstraintField({ visible }: { visible: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const edges = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(5.2, 3.3, 1.8), []);
  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  useEffect(() => () => {
    geometry.dispose();
    edgeGeometry.dispose();
  }, [geometry, edgeGeometry]);

  useFrame((state, delta) => {
    const k = 1 - Math.exp(-4 * delta);
    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2.4) * 0.5;
    if (mesh.current) {
      const m = mesh.current.material as THREE.MeshBasicMaterial;
      m.opacity = THREE.MathUtils.lerp(m.opacity, visible ? 0.035 + pulse * 0.02 : 0, k);
    }
    if (edges.current) {
      const m = edges.current.material as THREE.LineBasicMaterial;
      m.opacity = THREE.MathUtils.lerp(m.opacity, visible ? 0.45 + pulse * 0.25 : 0, k);
    }
  });

  return (
    <group position={[0.1, 0.25, 0]}>
      <mesh ref={mesh} geometry={geometry}>
        <meshBasicMaterial color="#38e8ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <lineSegments ref={edges} geometry={edgeGeometry}>
        <lineBasicMaterial color="#9a7bff" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      {visible && (
        <HoloLabel text="FEASIBLE REGION · time ≤ T · cost ≤ B" position={[0, 1.95, 0]} height={0.16} color="#c3b1ff" opacity={0.9} />
      )}
    </group>
  );
}

function BranchTree({ concept }: { concept: DPConcept }) {
  const step = stepOf(concept);
  return (
    <group>
      <ConstraintField visible={step === 2 || step === 3} />
      {EDGES.map(([a, b]) => (
        <EnergyBeam
          key={`${a}-${b}`}
          points={[byId[a].p, byId[b].p]}
          status={edgeStatus(byId[a], byId[b], step)}
          radius={0.014}
          pulses={2}
          speed={step === 5 ? 0.6 : 0.4}
          arc={0.05}
        />
      ))}
      {TREE.map((node) => (
        <DPStateNode
          key={node.id}
          position={node.p}
          label={node.label}
          status={nodeStatus(node, step)}
          size={0.13}
          labelOffset={0.42}
          labelHeight={0.2}
        />
      ))}
    </group>
  );
}

/* ---------------------------------------------------------
   Overlapping subproblems → merge → memo
--------------------------------------------------------- */

function OverlapTree({ memo }: { memo: boolean }) {
  const quality = useQuality();
  const merge = useRef(0);
  const leftDup = useRef<THREE.Group>(null);
  const rightDup = useRef<THREE.Group>(null);

  const f4: V3 = [0, 1.8, 0];
  const f3: V3 = [-1.7, 0.5, 0];
  const f2a: V3 = [1.7, 0.5, 0];
  const f2b: V3 = [-2.6, -0.9, 0];
  const f1a: V3 = [-0.8, -0.9, 0];
  const f1b: V3 = [2.6, -0.9, 0];
  const f0: V3 = [0.9, -0.9, 0];
  const shared: V3 = [0.0, -0.2, 0.6];

  const [merged, setMerged] = useState(quality.reducedMotion);

  useFrame((_, delta) => {
    merge.current = quality.reducedMotion ? 1 : Math.min(1, merge.current + delta * 0.45);
    const e = THREE.MathUtils.smoothstep(merge.current, 0.25, 1);
    if (!merged && e > 0.97) setMerged(true);
    if (leftDup.current) leftDup.current.position.set(
      THREE.MathUtils.lerp(f2b[0], shared[0], e),
      THREE.MathUtils.lerp(f2b[1], shared[1], e),
      THREE.MathUtils.lerp(f2b[2], shared[2], e),
    );
    if (rightDup.current) rightDup.current.position.set(
      THREE.MathUtils.lerp(f2a[0], shared[0], e),
      THREE.MathUtils.lerp(f2a[1], shared[1], e),
      THREE.MathUtils.lerp(f2a[2], shared[2], e),
    );
  });

  const status: NodeStatus = memo ? "cached" : "active";

  return (
    <group>
      <EnergyBeam points={[f4, f3]} status="active" radius={0.014} />
      {/* Before the merge: two identical F(2) subtrees */}
      <EnergyBeam points={[f4, f2a]} status={merged ? "hidden" : "active"} radius={0.012} />
      <EnergyBeam points={[f3, f2b]} status={merged ? "hidden" : "active"} radius={0.012} />
      {/* After the merge: one shared state, reused */}
      <EnergyBeam points={[f4, shared]} status={merged ? (memo ? "optimal" : "active") : "hidden"} radius={0.014} />
      <EnergyBeam points={[f3, shared]} status={merged ? (memo ? "optimal" : "active") : "hidden"} radius={0.014} />
      <EnergyBeam points={[f3, f1a]} status="dim" radius={0.01} pulses={0} />
      <EnergyBeam points={[shared, f0]} status={merged ? "dim" : "hidden"} radius={0.01} pulses={0} />
      <EnergyBeam points={[shared, f1b]} status={merged ? "dim" : "hidden"} radius={0.01} pulses={0} />

      <DPStateNode position={f4} label="F(4)" status="active" size={0.14} labelOffset={0.45} />
      <DPStateNode position={f3} label="F(3)" status="active" size={0.13} labelOffset={0.45} />
      <DPStateNode position={f1a} label="F(1)" status="idle" size={0.1} labelOffset={0.4} />
      <DPStateNode position={f0} label="F(0)" status="idle" size={0.1} labelOffset={0.4} />
      <DPStateNode position={f1b} label="F(1)" status="idle" size={0.1} labelOffset={0.4} />

      <group ref={leftDup} position={f2b}>
        <DPStateNode position={[0, 0, 0]} label="F(2)" status={status} size={0.14} labelOffset={0.46} />
      </group>
      <group ref={rightDup} position={f2a}>
        <DPStateNode position={[0, 0, 0]} status={status} size={0.14} />
      </group>

      <HoloLabel
        text={memo ? "memo[2] · computed once · reused" : "same subproblem reached twice → merged"}
        position={[0, -1.85, 0]}
        height={0.17}
        color={memo ? "#9ff7d5" : "#bff6ff"}
      />
    </group>
  );
}

/* ---------------------------------------------------------
   Tabulation grid
--------------------------------------------------------- */

function TabulationGrid() {
  const quality = useQuality();
  const cols = 8;
  const rows = 5;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const clock = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const count = cols * rows;

  useFrame((_, delta) => {
    clock.current = quality.reducedMotion ? count : (clock.current + delta * 7) % (count + 14);
    if (!mesh.current) return;
    for (let i = 0; i < count; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const filled = i < clock.current;
      const head = Math.abs(i - clock.current) < 1;
      dummy.position.set((c - (cols - 1) / 2) * 0.72, ((rows - 1) / 2 - r) * 0.72, filled ? 0.12 : 0);
      const s = head ? 1.15 : filled ? 1 : 0.82;
      dummy.scale.set(s, s, filled ? 1 : 0.4);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      color.set(head ? "#ffffff" : filled ? (r % 2 ? "#38e8ff" : "#6fdcff") : "#1a2530");
      mesh.current.setColorAt(i, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <group rotation={[-0.35, 0.35, 0]}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.6, 0.6, 0.22]} />
        <meshBasicMaterial transparent opacity={0.85} toneMapped={false} />
      </instancedMesh>
      <HoloLabel text="dp[i][j] ← dp[i-1][…] · filled bottom-up" position={[0, 2.25, 0.3]} height={0.18} color="#bff6ff" />
      <HoloLabel text="i →" position={[-3.3, 2, 0]} height={0.16} color="#9a7bff" />
      <HoloLabel text="j ↓" position={[-3.4, 1.4, 0]} height={0.16} color="#9a7bff" />
    </group>
  );
}

/* ---------------------------------------------------------
   Scene
--------------------------------------------------------- */

function Rig({ distance }: { distance: number }) {
  const pointer = useWindowPointer();
  const quality = useQuality();
  const desired = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, delta) => {
    const s = quality.reducedMotion ? 0 : 1;
    desired.set(pointer.x * 0.9 * s, 0.3 + pointer.y * 0.5 * s, distance);
    camera.position.lerp(desired, 1 - Math.exp(-2.4 * delta));
    camera.lookAt(0, 0.1, 0);
  });
  return null;
}

export default function DPConceptScene({
  concept,
  className = "",
  label,
  distance = 8.4,
}: {
  concept: DPConcept;
  className?: string;
  label?: string;
  distance?: number;
}) {
  return (
    <Scene3D
      className={className}
      label={label ?? `Dynamic programming concept visualization: ${concept}`}
      camera={{ position: [0, 0.3, distance], fov: 42 }}
    >
      <ParticleField count={160} spread={[6, 3.5, 3]} size={0.5} opacity={0.3} drift={0.2} seed={5} />
      {(concept === "overlap" || concept === "memo") && <OverlapTree memo={concept === "memo"} />}
      {concept === "grid" && <TabulationGrid />}
      {ORDER.includes(concept) && <BranchTree concept={concept} />}
      <Rig distance={distance} />
    </Scene3D>
  );
}

export const DP_CONCEPT_ORDER = ORDER;
