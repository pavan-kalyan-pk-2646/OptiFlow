import type { ReactNode } from "react";

/* =========================================================
   HOLOGRAPHIC LABEL / DEMO BADGE / ORBITAL LOADER
========================================================= */

export function HolographicLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`of-eyebrow ${className}`}>{children}</span>;
}

/**
 * Marks visuals that are not the user's real data.
 * kind="demo" → DEMONSTRATION / EXAMPLE / SIMULATION
 * kind="live" → real data from the backend or the user's workspace
 */
export function DemoBadge({
  children = "Demonstration",
  kind = "demo",
  className = "",
}: {
  children?: ReactNode;
  kind?: "demo" | "live";
  className?: string;
}) {
  return (
    <span className={`of-demo-badge ${className}`} data-kind={kind}>
      {children}
    </span>
  );
}

export function OrbitalLoader({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`} role="status" aria-live="polite">
      <div className="of-loader" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      {label && <span className="of-data">{label}</span>}
    </div>
  );
}

export default HolographicLabel;
