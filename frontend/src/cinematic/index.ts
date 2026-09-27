/* =========================================================
   OPTIFLOW CINEMATIC — PUBLIC API
   DOM primitives are exported here. 3D scene modules live in
   ./three and ./scenes and are lazy-loaded by pages so that
   three.js never blocks first paint.
========================================================= */

export { default as NeonFrame } from "./ui/NeonFrame";
export { default as TiltCard } from "./ui/TiltCard";
export { default as Glass3DCard } from "./ui/Glass3DCard";
export { default as CinematicButton } from "./ui/CinematicButton";
export { default as SectionReveal } from "./ui/SectionReveal";
export { default as SpatialPanel } from "./ui/SpatialPanel";
export { HolographicLabel, DemoBadge, OrbitalLoader } from "./ui/HolographicLabel";
export { useQuality, useVisualSettings, readVisualSettings, writeVisualSettings } from "./quality";
export type { VisualSettings, QualityPreference, MotionPreference } from "./quality";
export { OF, STATE_CHAIN, PIPELINE_LANGUAGE } from "./theme";
