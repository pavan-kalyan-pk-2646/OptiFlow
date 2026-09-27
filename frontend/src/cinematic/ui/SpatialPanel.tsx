import type { ReactNode } from "react";

import NeonFrame from "./NeonFrame";
import { HolographicLabel } from "./HolographicLabel";

/* =========================================================
   SPATIAL PANEL
   A large, non-tilting depth surface for page sections
   (forms, tables, consoles). Keeps usability high while
   staying inside the OptiFlow universe.
========================================================= */

export interface SpatialPanelProps {
  kicker?: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  active?: boolean;
  tone?: "cyan" | "violet" | "danger";
  scan?: boolean;
}

export default function SpatialPanel({
  kicker,
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "p-6 sm:p-7",
  active = false,
  tone = "cyan",
  scan = false,
}: SpatialPanelProps) {
  return (
    <NeonFrame
      as="section"
      active={active}
      tone={tone}
      radius={22}
      className={`of-surface of-surface--raised overflow-hidden ${className}`}
      style={{ borderRadius: 22 }}
    >
      {scan && <span className="of-scanline" aria-hidden="true" />}
      <div className={`relative z-[5] ${bodyClassName}`}>
        {(kicker || title || actions) && (
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {kicker && <HolographicLabel>{kicker}</HolographicLabel>}
              {title && <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h2>}
              {description && <p className="mt-2 max-w-2xl text-[15px] leading-7 text-white/65">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
          </header>
        )}
        {children}
      </div>
    </NeonFrame>
  );
}
