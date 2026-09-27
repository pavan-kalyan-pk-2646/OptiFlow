import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";

import { useQuality } from "../quality";

/* =========================================================
   TILT CARD
   Subtle perspective tilt toward the cursor
   (rotateX ±4°, rotateY ±5°) with a hover lift and a glare
   highlight. Disabled for touch and reduced motion.
========================================================= */

export interface TiltCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  maxX?: number;
  maxY?: number;
  lift?: number;
  glare?: boolean;
}

export default function TiltCard({
  children,
  maxX = 4,
  maxY = 5,
  lift = 6,
  glare = true,
  className = "",
  style,
  onPointerMove,
  onPointerLeave,
  ...rest
}: TiltCardProps) {
  const quality = useQuality();
  const ref = useRef<HTMLDivElement>(null);
  const enabled = !quality.reducedMotion && !quality.isTouch;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 180, damping: 22, mass: 0.6 };
  const rotateX = useSpring(rx, springConfig);
  const rotateY = useSpring(ry, springConfig);
  const translateY = useSpring(y, springConfig);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rx.set((0.5 - py) * 2 * maxX);
    ry.set((px - 0.5) * 2 * maxY);
    y.set(-lift);
    ref.current.style.setProperty("--of-mx", `${px * 100}%`);
    ref.current.style.setProperty("--of-my", `${py * 100}%`);
  };

  const handleLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    rx.set(0);
    ry.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`of-tilt ${className}`}
      style={{
        rotateX: enabled ? rotateX : 0,
        rotateY: enabled ? rotateY : 0,
        y: enabled ? translateY : 0,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
        ...style,
      }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {glare && <span className="of-glare" aria-hidden="true" />}
      {children}
    </motion.div>
  );
}
