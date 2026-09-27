import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { BrandEmblem } from "../brand/OptiFlowLogo";

/* =========================================================
   SPATIAL CONTROL BAR
   Floating glass console with bevel, perimeter lighting,
   hover light-trace and an energised active item.
========================================================= */

export const LANDING_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "engine", label: "Engine" },
  { id: "problem", label: "Problem" },
  { id: "dp", label: "DP" },
  { id: "launch", label: "Launch" },
] as const;

export default function PublicNavbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState<string>("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // A section is "active" while it crosses the middle of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
    );
    LANDING_SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const goTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <motion.nav
        aria-label="Primary"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="of-frame of-controlbar mx-auto flex h-[64px] max-w-[1240px] items-center justify-between gap-3 px-3 sm:px-4"
        data-active={scrolled ? "true" : undefined}
      >
        <Link
          to="/"
          aria-label="OptiFlow home"
          onClick={() => goTo("home")}
          className="flex min-w-0 items-center gap-3 rounded-xl pr-2"
        >
          <BrandEmblem size={38} />
          <span className="hidden sm:block">
            <span className="block font-display text-[15px] font-extrabold tracking-[0.22em] text-white">OPTIFLOW</span>
            <span className="block font-mono text-[10px] tracking-[0.24em] text-cyan-100/65">DP · STATE · FLOW</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LANDING_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => goTo(section.id)}
              data-active={active === section.id ? "true" : undefined}
              aria-current={active === section.id ? "location" : undefined}
              className="of-frame of-navitem"
            >
              <span className="of-navitem__dot" aria-hidden="true" />
              {section.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className="of-btn of-btn--ghost of-btn--sm">
            Sign in
          </Link>
          <button type="button" onClick={() => navigate("/register")} className="of-btn of-btn--solid of-btn--sm">
            Create workspace
            <ArrowUpRight size={15} />
          </button>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/80 transition hover:border-cyan-300/40 hover:text-white md:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="of-frame of-controlbar mx-auto mt-2 max-w-[1240px] p-3 md:hidden"
            data-active="true"
          >
            <div className="grid gap-1">
              {LANDING_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => goTo(section.id)}
                  className="flex h-12 items-center justify-between rounded-xl px-4 text-left font-heading text-[15px] font-semibold tracking-[0.08em] text-white/80 transition hover:bg-white/[0.04] hover:text-white"
                >
                  {section.label.toUpperCase()}
                  {active === section.id && <span className="of-live-dot" />}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="of-btn of-btn--ghost of-btn--md">
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="of-btn of-btn--solid of-btn--md">
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
