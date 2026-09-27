import Scene3D from "../../cinematic/three/Scene3D";
import OptimizationCore from "../../cinematic/three/OptimizationCore";
import ParticleField from "../../cinematic/three/ParticleField";

/* Live preview of the current rendering settings. */
export default function SettingsPreviewScene({ className = "" }: { className?: string }) {
  return (
    <Scene3D className={className} camera={{ position: [0, 0.3, 6.4], fov: 42 }} label="Live preview of the current 3D quality settings">
      <ParticleField count={500} spread={[6, 4, 4]} size={0.7} opacity={0.6} seed={2} />
      <OptimizationCore interactive={false} scale={0.85} spin={0.12} />
    </Scene3D>
  );
}
