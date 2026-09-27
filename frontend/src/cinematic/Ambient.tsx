import { lazy, Suspense } from "react";

import type { BackgroundVariant } from "./CinematicBackground";

/* =========================================================
   AMBIENT
   Lazy wrapper around the persistent 3D environment:
   a static starfield paints instantly, the WebGL world
   fades in once three.js has loaded.
========================================================= */

const CinematicBackground = lazy(() => import("./CinematicBackground"));

export default function Ambient({ variant = "app", intensity = 1 }: { variant?: BackgroundVariant; intensity?: number }) {
  return (
    <Suspense
      fallback={
        <div className="of-bg-root" aria-hidden="true">
          <div className="of-starfield-fallback" />
          <div className="of-bg-vignette" />
        </div>
      }
    >
      <CinematicBackground variant={variant} intensity={intensity} />
    </Suspense>
  );
}
