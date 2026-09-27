import type { ReactNode } from "react";

import NeonFrame from "./NeonFrame";
import TiltCard from "./TiltCard";

/* =========================================================
   GLASS 3D CARD
   A physical holographic module: layered glass surface,
   inner depth, full-perimeter light, scan line, corner
   geometry, perspective tilt and depth shadow.
========================================================= */

export interface Glass3DCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  active?: boolean;
  tone?: "cyan" | "violet" | "danger";
  tilt?: boolean;
  scan?: boolean;
  corners?: boolean;
  radius?: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  as?: "div" | "article" | "section";
  ariaLabel?: string;
}

export default function Glass3DCard({
  children,
  className = "",
  innerClassName = "p-6",
  active = false,
  tone = "cyan",
  tilt = true,
  scan = false,
  corners = true,
  radius = 20,
  onClick,
  onMouseEnter,
  onMouseLeave,
  as = "div",
  ariaLabel,
}: Glass3DCardProps) {
  const body = (
    <NeonFrame
      as={as}
      active={active}
      tone={tone}
      corners={corners}
      radius={radius}
      className={`of-surface h-full overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
      style={{ borderRadius: radius }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {scan && <span className="of-scanline" aria-hidden="true" />}
      <div className={`relative z-[5] h-full ${innerClassName}`} style={{ transform: "translateZ(24px)" }}>
        {children}
      </div>
    </NeonFrame>
  );

  if (!tilt) {
    return (
      <div className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {body}
      </div>
    );
  }

  return (
    <TiltCard className={className} style={{ borderRadius: radius }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {body}
    </TiltCard>
  );
}
