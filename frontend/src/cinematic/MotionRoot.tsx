import { MotionConfig } from "framer-motion";
import { useEffect, type ReactNode } from "react";

import { useQuality } from "./quality";

/* =========================================================
   MOTION ROOT
   Applies the user's motion preference (system / full /
   reduced) to Framer Motion and to CSS animations.
========================================================= */

export default function MotionRoot({ children }: { children: ReactNode }) {
  const quality = useQuality();

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = quality.reducedMotion ? "true" : "false";
    document.documentElement.dataset.quality = quality.tier;
  }, [quality.reducedMotion, quality.tier]);

  return <MotionConfig reducedMotion={quality.reducedMotion ? "always" : "never"}>{children}</MotionConfig>;
}
