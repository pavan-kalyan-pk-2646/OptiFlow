import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

type SceneProps = {
  intro?: boolean;
};

const STAGES = [
  { label: "BUILD", x: -4.7, y: 0.55, color: "#38e8ff" },
  { label: "TEST", x: -2.55, y: 1.48, color: "#38e8ff" },
  { label: "SECURITY", x: -2.55, y: -1.32, color: "#38e8ff" },
  { label: "DP ENGINE", x: 0, y: 0, color: "#f1fdff" },
  { label: "PACKAGE", x: 2.65, y: 1.08, color: "#9b7cff" },
  { label: "DEPLOY", x: 4.75, y: 0.08, color: "#9b7cff" },
];

function useLine(points: THREE.Vector3[], color: string, opacity: number) {
  return useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, [points, color, opacity]);
}

function StarField() {
  const ref = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 3200;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 11;
      const a = Math.random() * Math.PI * 2;

      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] =
        Math.sin(a) * r * 0.52 + (Math.random() - 0.5) * 3.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 11;
    }

    return new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;

    const position = ref.current.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;

    for (let i = 0; i < position.count; i++) {
      let z = position.getZ(i) + delta * 0.075;
      if (z > 5.5) z = -5.5;
      position.setZ(i, z);
    }

    position.needsUpdate = true;
    ref.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#8eeeff"
        size={0.014}
        transparent
        opacity={0.38}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function EnergyCore() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!group.current) return;

    group.current.rotation.y += delta * 0.18;
    group.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.45) * 0.045;

    if (inner.current) {
      inner.current.rotation.z -= delta * 0.42;
      const pulse =
        1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.035;
      inner.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={group}>
      <mesh ref={inner}>
        <torusGeometry args={[1.08, 0.13, 32, 180]} />
        <meshStandardMaterial
          color="#d9fbff"
          emissive="#1bdcf6"
          emissiveIntensity={4.5}
          metalness={1}
          roughness={0.1}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[1.48, 0.026, 16, 160]} />
        <meshBasicMaterial
          color="#48e8ff"
          transparent
          opacity={0.48}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[0.65, 0.85, 0.25]}>
        <torusGeometry args={[1.85, 0.012, 12, 160]} />
        <meshBasicMaterial
          color="#9676ff"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      <pointLight
        color="#28def7"
        intensity={6}
        distance={8}
      />
    </group>
  );
}

function Pipeline() {
  const group = useRef<THREE.Group>(null);

  const linePoints = useMemo(() => {
    const result: THREE.Vector3[] = [];

    for (let i = 0; i < STAGES.length - 1; i++) {
      result.push(
        new THREE.Vector3(STAGES[i].x, STAGES[i].y, 0),
        new THREE.Vector3(STAGES[i + 1].x, STAGES[i + 1].y, 0),
      );
    }

    return result;
  }, []);

  const line = useLine(linePoints, "#54e9ff", 0.24);

  useFrame((state) => {
    if (!group.current) return;

    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      state.pointer.x * 0.045,
      0.035,
    );

    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -state.pointer.y * 0.025,
      0.035,
    );
  });

  return (
    <group ref={group}>
      <primitive object={line} />

      {STAGES.map((stage, index) => (
        <group
          key={stage.label}
          position={[stage.x, stage.y, index === 3 ? 0.35 : 0]}
        >
          <mesh>
            <sphereGeometry
              args={[index === 3 ? 0.19 : 0.085, 20, 20]}
            />
            <meshStandardMaterial
              color={stage.color}
              emissive={stage.color}
              emissiveIntensity={index === 3 ? 5 : 2.3}
              metalness={0.9}
              roughness={0.12}
            />
          </mesh>

          {index === 3 && (
            <>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.52, 0.015, 12, 96]} />
                <meshBasicMaterial
                  color="#55eaff"
                  transparent
                  opacity={0.58}
                />
              </mesh>
              <mesh rotation={[0.4, 0.9, 0]}>
                <torusGeometry args={[0.78, 0.01, 12, 96]} />
                <meshBasicMaterial
                  color="#a080ff"
                  transparent
                  opacity={0.35}
                />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  );
}

function DataParticles() {
  const group = useRef<THREE.Group>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        phase: (i / 36) * Math.PI * 2,
        radius: 1.9 + (i % 6) * 0.38,
        speed: 0.28 + (i % 5) * 0.035,
      })),
    [],
  );

  useFrame((state) => {
    if (!group.current) return;

    group.current.children.forEach((child, index) => {
      const p = particles[index];
      const t = state.clock.elapsedTime * p.speed + p.phase;

      child.position.x = Math.cos(t) * p.radius;
      child.position.y = Math.sin(t * 1.35) * p.radius * 0.48;
      child.position.z = Math.sin(t * 0.8) * 0.9;
    });
  });

  return (
    <group ref={group}>
      {particles.map((_, index) => (
        <mesh key={index} scale={index % 8 === 0 ? 1.8 : 1}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshBasicMaterial
            color={index % 5 === 0 ? "#a78bfa" : "#56e8ff"}
            transparent
            opacity={0.72}
          />
        </mesh>
      ))}
    </group>
  );
}

function Camera() {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      state.pointer.x * 0.32,
      0.025,
    );

    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      state.pointer.y * -0.18 + Math.sin(t * 0.2) * 0.035,
      0.025,
    );

    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      9.2 + Math.sin(t * 0.15) * 0.12,
      0.02,
    );

    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function OptiFlowHero3D({ }: SceneProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.45]}
        camera={{
          position: [0, 0, 9.2],
          fov: 35,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.045} />

        <pointLight
          position={[0, 0, 4]}
          intensity={6}
          distance={10}
          color="#25ddf7"
        />

        <pointLight
          position={[4, 2, -2]}
          intensity={2.8}
          distance={9}
          color="#795dff"
        />

        <directionalLight
          position={[-4, 5, 6]}
          intensity={1}
          color="#d9fbff"
        />

        <StarField />
        <DataParticles />
        <Pipeline />
        <EnergyCore />
        <Camera />

        <Environment
          preset="night"
          environmentIntensity={0.08}
        />
      </Canvas>
    </div>
  );
}
