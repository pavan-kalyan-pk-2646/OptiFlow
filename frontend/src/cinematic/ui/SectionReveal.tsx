import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

import { useQuality } from "../quality";

/* =========================================================
   SECTION REVEAL
   Depth reveal: content rises out of the dark with a small
   rotateX and scale — like a panel sliding into focus.
========================================================= */

export interface SectionRevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  distance?: number;
  once?: boolean;
  amount?: number;
}

export default function SectionReveal({
  children,
  delay = 0,
  distance = 44,
  once = true,
  amount = 0.06,
  ...rest
}: SectionRevealProps) {
  const quality = useQuality();

  if (quality.reducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once, amount }}
        transition={{ duration: 0.25 }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: distance, rotateX: 9, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.95, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1200, transformOrigin: "50% 100%" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
