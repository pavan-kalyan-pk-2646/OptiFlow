import { lazy, Suspense, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import NeonFrame from "../../cinematic/ui/NeonFrame";
import { HolographicLabel } from "../../cinematic/ui/HolographicLabel";
import { BrandEmblem } from "../brand/OptiFlowLogo";
import type { AuthChamberSceneProps, ChamberStatus } from "./AuthChamberScene";

const AuthChamberScene = lazy(() => import("./AuthChamberScene"));

/* =========================================================
   AUTH LAYOUT
   Entering the OptiFlow operating system: the 3D
   authentication chamber behind, a floating holographic
   panel in front.
========================================================= */

interface AuthLayoutProps {
  children: ReactNode;
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  chamber: AuthChamberSceneProps;
  /** Short, human-readable description of the chamber state */
  statusText?: string;
}

const STATUS_COPY: Record<ChamberStatus, string> = {
  idle: "AUTH CORE · AWAITING INPUT",
  submitting: "AUTH CORE · EVALUATING TRANSITION",
  success: "AUTH CORE · STATE ACCEPTED",
  error: "AUTH CORE · TRANSITION REJECTED",
};

export default function AuthLayout({
  children,
  kicker = "State access",
  title,
  subtitle,
  footer,
  chamber,
  statusText,
}: AuthLayoutProps) {
  const status = chamber.status;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0">
        <Suspense fallback={<div className="of-starfield-fallback" />}>
          <AuthChamberScene {...chamber} />
        </Suspense>
      </div>

      {/* Depth vignette keeps the panel readable */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(0,0,0,.72),transparent_62%)] max-lg:bg-[linear-gradient(180deg,transparent_10%,rgba(0,0,0,.82)_48%)]" />

      {/* Success fly-through flash */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle,rgba(191,246,255,.9),rgba(56,232,255,.35)_35%,#000_75%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1] }}
            transition={{ duration: 1.05, times: [0, 0.55, 1] }}
          />
        )}
      </AnimatePresence>

      <Link
        to="/"
        className="fixed left-4 top-4 z-30 inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 text-[13px] font-medium text-white/70 backdrop-blur-xl transition hover:border-cyan-300/40 hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={15} />
        Exit to OptiFlow
      </Link>

      <div
        className={`fixed right-4 top-4 z-30 hidden items-center gap-2.5 rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.2em] backdrop-blur-xl sm:right-6 sm:top-6 sm:flex ${
          status === "error"
            ? "border-rose-400/30 bg-rose-500/[0.06] text-rose-200"
            : "border-cyan-300/20 bg-black/40 text-cyan-100/80"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className={status === "error" ? "h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_10px_#fb7185]" : "of-sync-dot"} />
        {statusText ?? STATUS_COPY[status]}
      </div>

      <div className="relative z-20 mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 items-center px-4 pb-10 pt-[42vh] sm:px-6 lg:grid-cols-[1fr_500px] lg:gap-10 lg:px-10 lg:pt-20">
        {/* Left: chamber caption (desktop) */}
        <div className="pointer-events-none hidden self-end pb-16 lg:block">
          <HolographicLabel>Authentication chamber</HolographicLabel>
          <p className="mt-4 max-w-sm text-[15px] leading-7 text-white/65">
            Each field is a state. Complete them and the transition into your optimization workspace is evaluated —
            just like a DP transition.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={
            status === "success"
              ? { opacity: 0, scale: 0.94, y: -10 }
              : { opacity: 1, y: 0, rotateX: 0, scale: 1 }
          }
          transition={{ duration: status === "success" ? 0.6 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformPerspective: 1200 }}
          className="w-full"
        >
          <NeonFrame
            active={status !== "idle"}
            tone={status === "error" ? "danger" : "cyan"}
            radius={28}
            className={`of-surface of-surface--raised overflow-hidden ${status === "error" ? "of-pulse-danger" : ""}`}
            style={{ borderRadius: 28 }}
          >
            <span className="of-scanline" aria-hidden="true" />
            <div className="relative z-[5] p-6 sm:p-9">
              <div className="mb-7 flex items-center gap-3">
                <BrandEmblem size={44} />
                <div>
                  <div className="font-display text-[16px] font-extrabold tracking-[0.22em] text-white">OPTIFLOW</div>
                  <div className="font-mono text-[11px] tracking-[0.22em] text-cyan-100/65">{kicker.toUpperCase()}</div>
                </div>
              </div>

              <h1 className="font-heading text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-white sm:text-[38px]">
                {title}
              </h1>
              {subtitle && <p className="mt-3 text-[15px] leading-7 text-white/65">{subtitle}</p>}

              <div className="mt-7">{children}</div>

              <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/[0.08] pt-5 font-mono text-[11px] tracking-[0.16em] text-white/50">
                <ShieldCheck size={14} className="text-cyan-300/80" />
                SECURE SESSION · JWT AUTHENTICATION
              </div>
            </div>
          </NeonFrame>

          {footer && <div className="mt-5 text-center text-[14px] text-white/65">{footer}</div>}
        </motion.div>
      </div>
    </main>
  );
}
