import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/* =========================================================
   CINEMATIC BUTTON
   A physical futuristic control. Perimeter light travels
   on hover, the control lifts forward in 3D, the icon
   rotates and sparks respond.
========================================================= */

export interface CinematicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "solid" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  kicker?: string;
  arrow?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export default function CinematicButton({
  variant = "primary",
  size = "md",
  icon,
  kicker,
  arrow = true,
  loading = false,
  children,
  className = "",
  type = "button",
  disabled,
  ...rest
}: CinematicButtonProps) {
  const framed = variant === "primary";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`of-btn of-btn--${variant} of-btn--${size} ${framed ? "of-frame" : ""} ${className}`}
      {...rest}
    >
      {framed && (
        <span className="of-btn__sparks" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      )}

      {icon && size === "lg" ? (
        <span className="of-btn__chip of-btn__icon" aria-hidden="true">
          {loading ? <span className="of-loader" style={{ width: 20, height: 20 }}><i /><i /></span> : icon}
        </span>
      ) : icon ? (
        <span className="of-btn__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {kicker ? (
        <span className="text-left">
          <span className="of-btn__kicker">{kicker}</span>
          <span className="of-btn__label">{children}</span>
        </span>
      ) : (
        <span className="relative">{children}</span>
      )}

      {arrow && !loading && (
        <span className="of-btn__arrow" aria-hidden="true">
          <ArrowRight size={size === "lg" ? 19 : 16} />
        </span>
      )}
    </button>
  );
}
