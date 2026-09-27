import * as THREE from "three";

/* =========================================================
   CANVAS TEXTURES
   Generated locally — no font or image downloads required.
   Cached so every scene shares GPU memory.
========================================================= */

const cache = new Map<string, THREE.Texture>();

export function getGlowTexture(): THREE.Texture {
  const key = "glow";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

export function getDotTexture(): THREE.Texture {
  const key = "dot";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  cache.set(key, texture);
  return texture;
}

export interface LabelOptions {
  color?: string;
  font?: string;
  weight?: number;
  size?: number;
  letterSpacing?: number;
  background?: string;
}

/** Crisp text sprite texture. Returns texture + aspect ratio (w/h). */
export function getLabelTexture(
  text: string,
  options: LabelOptions = {},
): { texture: THREE.Texture; aspect: number } {
  const {
    color = "#dffbff",
    font = "JetBrains Mono, ui-monospace, monospace",
    weight = 600,
    size = 64,
    letterSpacing = 0.12,
    background,
  } = options;

  const key = `label:${text}:${color}:${font}:${weight}:${size}:${letterSpacing}:${background ?? ""}`;
  const cached = cache.get(key);
  if (cached) {
    const img = cached.image as HTMLCanvasElement;
    return { texture: cached, aspect: img.width / img.height };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${weight} ${size}px ${font}`;

  const spacing = size * letterSpacing;
  const chars = [...text];
  const width = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, 0) - spacing;

  const padX = size * 0.45;
  const padY = size * 0.32;
  canvas.width = Math.ceil(width + padX * 2);
  canvas.height = Math.ceil(size + padY * 2);

  const draw = canvas.getContext("2d")!;
  if (background) {
    draw.fillStyle = background;
    draw.fillRect(0, 0, canvas.width, canvas.height);
  }
  draw.font = `${weight} ${size}px ${font}`;
  draw.textBaseline = "middle";
  draw.fillStyle = color;
  draw.shadowColor = color;
  draw.shadowBlur = size * 0.18;

  let x = padX;
  for (const ch of chars) {
    draw.fillText(ch, x, canvas.height / 2 + size * 0.04);
    x += draw.measureText(ch).width + spacing;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearFilter;
  cache.set(key, texture);

  return { texture, aspect: canvas.width / canvas.height };
}
