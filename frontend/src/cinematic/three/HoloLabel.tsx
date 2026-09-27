import { useMemo } from "react";

import { getLabelTexture, type LabelOptions } from "./textures";

/* =========================================================
   HOLOGRAPHIC LABEL (3D)
   Billboarded text sprite — used for S0…Sn markers and
   module names inside WebGL scenes.
========================================================= */

export interface HoloLabelProps extends LabelOptions {
  text: string;
  position?: [number, number, number];
  height?: number;
  opacity?: number;
  depthTest?: boolean;
}

export default function HoloLabel({
  text,
  position = [0, 0, 0],
  height = 0.22,
  opacity = 1,
  depthTest = false,
  ...options
}: HoloLabelProps) {
  const { texture, aspect } = useMemo(
    () => getLabelTexture(text, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, options.color, options.size, options.weight, options.font, options.letterSpacing],
  );

  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        depthTest={depthTest}
        toneMapped={false}
      />
    </sprite>
  );
}
