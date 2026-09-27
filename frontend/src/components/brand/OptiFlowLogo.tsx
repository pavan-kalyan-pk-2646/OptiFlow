interface OptiFlowLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

/* Horizontal wordmark (optimised WebP, PNG fallback) */
export default function OptiFlowLogo({ className = "", width, height = 48 }: OptiFlowLogoProps) {
  return (
    <picture>
      <source srcSet="/assets/brand/optiflow-logo-horizontal.webp" type="image/webp" />
      <img
        src="/assets/brand/optiflow-logo-horizontal.png"
        alt="OptiFlow"
        height={typeof height === "number" ? height : undefined}
        width={typeof width === "number" ? width : undefined}
        decoding="async"
        className={`h-auto max-w-full object-contain ${className}`}
        style={{
          height,
          width: width && width !== "auto" ? width : "auto",
        }}
      />
    </picture>
  );
}

/* =========================================================
   BRAND EMBLEM
   The OptiFlow "O" with 3D depth and an orbital ring.
========================================================= */

export function BrandEmblem({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`of-emblem ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="of-emblem__ring" />
      <span className="of-emblem__ring of-emblem__ring--b" />
      <img src="/assets/brand/optiflow-emblem.webp" alt="" draggable={false} />
    </span>
  );
}
