/* =========================================================
   OPTIFLOW CINEMATIC PALETTE
   Black is the world. Color is light.
========================================================= */

export const OF = {
  black: "#000000",
  cyan: "#38e8ff",
  cyanSoft: "#8ff3ff",
  violet: "#9a7bff",
  violetSoft: "#c3b1ff",
  white: "#f4fbff",
  dim: "#3a4452",
  pruned: "#ff5470",
  success: "#46f0b4",
} as const;

export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;

/** The canonical OptiFlow state chain, used as the visual language everywhere. */
export const STATE_CHAIN = ["S0", "S1", "S2", "S3", "S4"] as const;

export const PIPELINE_LANGUAGE = [
  "PIPELINE",
  "STATE SPACE",
  "OPTIMIZE",
  "RECONSTRUCT",
  "EXECUTE",
] as const;
