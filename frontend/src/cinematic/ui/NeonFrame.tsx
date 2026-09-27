import type { CSSProperties, FC, HTMLAttributes, ReactNode } from "react";

/* =========================================================
   NEON FRAME
   Full-perimeter lighting (top · right · bottom · left) with
   a travelling light beam and corner pulses.
   Inactive: subtle · Hover: stronger · Active: clearly lit.
========================================================= */

export interface NeonFrameProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "header" | "aside" | "button" | "li" | "nav";
  active?: boolean;
  tone?: "cyan" | "violet" | "danger";
  corners?: boolean;
  /** Disable the travelling beam (static perimeter only) */
  quiet?: boolean;
  radius?: number;
  children?: ReactNode;
}

export default function NeonFrame({
  as = "div",
  active = false,
  tone = "cyan",
  corners = true,
  quiet = false,
  radius,
  className = "",
  style,
  children,
  ...rest
}: NeonFrameProps) {
  const frameStyle: CSSProperties = radius !== undefined
    ? ({ ...style, "--of-frame-radius": `${radius}px` } as CSSProperties)
    : style ?? {};

  const Tag = as as unknown as FC<Record<string, unknown>>;

  return (
    <Tag
      className={`of-frame ${className}`}
      data-active={active ? "true" : undefined}
      data-tone={tone === "cyan" ? undefined : tone}
      data-quiet={quiet ? "true" : undefined}
      style={frameStyle}
      {...rest}
    >
      {corners && (
        <>
          <span className="of-corner of-corner--tl" aria-hidden="true" />
          <span className="of-corner of-corner--tr" aria-hidden="true" />
          <span className="of-corner of-corner--bl" aria-hidden="true" />
          <span className="of-corner of-corner--br" aria-hidden="true" />
        </>
      )}
      {children}
    </Tag>
  );
}
