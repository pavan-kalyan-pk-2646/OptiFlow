import { memo } from "react";

import { useQuality } from "./quality";
import Scene3D from "./three/Scene3D";
import ParticleField from "./three/ParticleField";
import Constellation from "./three/Constellation";
import CameraRig from "./three/CameraRig";
import { DistantGeometry, FloatingSymbols, ShootingParticles } from "./three/AmbientElements";

/* =========================================================
   CINEMATIC BACKGROUND
   The persistent black-space environment every page lives
   inside: sparse stars, dust, distant geometry, DP
   constellations and energy pulses. Fixed, non-interactive,
   and deliberately quiet.
========================================================= */

export type BackgroundVariant = "landing" | "app" | "studio" | "auth";

interface CinematicBackgroundProps {
  variant?: BackgroundVariant;
  intensity?: number;
}

export function StaticStarfield() {
  return <div className="of-starfield-fallback" aria-hidden="true" />;
}

function CinematicBackground({ variant = "app", intensity = 1 }: CinematicBackgroundProps) {
  const quality = useQuality();

  if (!quality.ambient) {
    return (
      <div className="of-bg-root" aria-hidden="true">
        <StaticStarfield />
        <div className="of-bg-vignette" />
      </div>
    );
  }

  const dense = variant === "landing";
  const low = quality.tier === "low";

  return (
    <div className="of-bg-root" aria-hidden="true">
      <StaticStarfield />
      <Scene3D
        className="absolute inset-0"
        alwaysActive
        camera={{ position: [0, 0, 12], fov: 55, near: 0.1, far: 120 }}
        fallback={null}
      >
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 14, 48]} />

        <ParticleField count={dense ? 2200 : 1400} spread={[42, 26, 26]} size={1.1} opacity={0.75 * intensity} seed={3} />
        <ParticleField count={dense ? 520 : 320} spread={[14, 9, 8]} size={0.55} opacity={0.3 * intensity} drift={0.45} color="#a9c6ff" seed={19} rotationSpeed={-0.006} />

        {!low && <DistantGeometry count={dense ? 6 : 4} opacity={intensity * 0.6} />}
        <Constellation clusters={low ? 3 : dense ? 6 : 4} labels={!low} opacity={intensity * 0.7} />
        {!low && <FloatingSymbols count={dense ? 10 : 6} opacity={intensity} />}
        {!low && <ShootingParticles every={variant === "app" ? 11 : 7} />}

        <CameraRig
          base={[0, 0, 12]}
          pointer={variant === "app" ? 0.35 : 0.7}
          scrollDolly={dense ? 4 : 1.2}
          scrollLift={dense ? 3 : 1}
          scrollOrbit={dense ? 0.35 : 0.1}
        />
      </Scene3D>
      <div className="of-bg-vignette" />
    </div>
  );
}

export default memo(CinematicBackground);
