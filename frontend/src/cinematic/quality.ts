import { useEffect, useState } from "react";

/* =========================================================
   VISUAL SETTINGS
   ---------------------------------------------------------
   User-controlled rendering preferences (Settings page).
   Stored locally; these are presentation-only and never
   touch business data.
========================================================= */

export type QualityPreference = "auto" | "high" | "balanced" | "low";
export type MotionPreference = "system" | "full" | "reduced";

export interface VisualSettings {
  quality: QualityPreference;
  motion: MotionPreference;
  ambientBackground: boolean;
}

export const VISUAL_SETTINGS_KEY = "optiflow_visual_settings";
const SETTINGS_EVENT = "optiflow:visual-settings";

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  quality: "auto",
  motion: "system",
  ambientBackground: true,
};

export function readVisualSettings(): VisualSettings {
  try {
    const raw = localStorage.getItem(VISUAL_SETTINGS_KEY);
    if (!raw) return DEFAULT_VISUAL_SETTINGS;
    return { ...DEFAULT_VISUAL_SETTINGS, ...(JSON.parse(raw) as Partial<VisualSettings>) };
  } catch {
    return DEFAULT_VISUAL_SETTINGS;
  }
}

export function writeVisualSettings(next: VisualSettings): void {
  try {
    localStorage.setItem(VISUAL_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — settings stay in memory for this session */
  }
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
}

export function useVisualSettings(): VisualSettings {
  const [settings, setSettings] = useState<VisualSettings>(() => readVisualSettings());

  useEffect(() => {
    const update = () => setSettings(readVisualSettings());
    window.addEventListener(SETTINGS_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(SETTINGS_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return settings;
}

/* =========================================================
   MEDIA QUERIES
========================================================= */

function useMedia(query: string, fallback = false): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return fallback;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

/* =========================================================
   QUALITY TIER
========================================================= */

export type QualityTier = "high" | "balanced" | "low";

export interface Quality {
  tier: QualityTier;
  reducedMotion: boolean;
  isMobile: boolean;
  isTouch: boolean;
  /** Device-pixel-ratio range handed to R3F */
  dpr: [number, number];
  /** Multiplier for particle counts */
  particles: number;
  /** Whether heavy ambient canvases should render at all */
  ambient: boolean;
}

function detectAutoTier(isMobile: boolean): QualityTier {
  if (isMobile) return "low";
  const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 4 : 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (cores <= 4 || memory <= 4) return "balanced";
  return "high";
}

export function useQuality(): Quality {
  const settings = useVisualSettings();
  const systemReduced = useMedia("(prefers-reduced-motion: reduce)");
  const isMobile = useMedia("(max-width: 767px)");
  const isTouch = useMedia("(hover: none), (pointer: coarse)");

  const reducedMotion =
    settings.motion === "reduced" || (settings.motion === "system" && systemReduced);

  const tier: QualityTier =
    settings.quality === "auto" ? detectAutoTier(isMobile) : settings.quality;

  const dpr: [number, number] =
    tier === "high" ? [1, 1.75] : tier === "balanced" ? [1, 1.35] : [1, 1];

  const particles = tier === "high" ? 1 : tier === "balanced" ? 0.6 : 0.3;

  return {
    tier,
    reducedMotion,
    isMobile,
    isTouch,
    dpr,
    particles,
    ambient: settings.ambientBackground,
  };
}

/* =========================================================
   WEBGL SUPPORT
========================================================= */

let webglSupport: boolean | null = null;

export function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    webglSupport = Boolean(context);
    const lose = (context as WebGLRenderingContext | null)?.getExtension?.("WEBGL_lose_context");
    lose?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
