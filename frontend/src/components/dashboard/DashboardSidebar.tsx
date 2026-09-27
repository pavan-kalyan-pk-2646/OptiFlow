import { ChevronLeft, ChevronRight, LogOut, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { getStoredUser, logout } from "../../utils/auth";
import { BrandEmblem } from "../brand/OptiFlowLogo";
import { ACCOUNT_ITEMS, NAV_SECTIONS, type NavigationItem } from "./navigation";

/* =========================================================
   DASHBOARD SIDEBAR — physical 3D control console
   190px expanded · 64px collapsed · drawer on mobile.
   Active item: full-perimeter cyan/violet energy frame.
   Hover: a light trace travels around the item border.
========================================================= */

interface DashboardSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function ConstellationRail() {
  const points: [number, number][] = [
    [8, 29],
    [39, 19],
    [65, 28],
    [91, 11],
    [121, 21],
    [150, 8],
  ];
  return (
    <div className="pointer-events-none px-3 pb-2 pt-4" aria-hidden="true">
      <svg viewBox="0 0 160 40" className="h-10 w-full">
        <path
          d={`M${points.map((p) => p.join(" ")).join(" L")}`}
          fill="none"
          stroke="rgba(116,236,255,.22)"
          strokeWidth="0.8"
        />
        <path
          d={`M${points.map((p) => p.join(" ")).join(" L")}`}
          fill="none"
          stroke="rgba(116,236,255,.8)"
          strokeWidth="0.6"
          strokeDasharray="3 7"
          className="of-constellation-flow"
        />
        {points.map(([x, y], i) => (
          <circle key={x} cx={x} cy={y} r={i === 5 ? 2.2 : 1.3} fill={i === 5 ? "#dffbff" : "rgba(255,255,255,.6)"} />
        ))}
      </svg>
      <div className="mt-1 text-center font-mono text-[10px] tracking-[0.3em] text-cyan-100/45">S0 → S5 · OPTIMAL</div>
    </div>
  );
}

function SideLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavigationItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `of-frame of-sidenav-item mb-1 ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${isActive ? "is-active" : ""}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="sr-only">(current page)</span>}
          <span
            className="relative z-[5] flex items-center"
            data-active-mark={isActive ? "true" : undefined}
          >
            <Icon size={17} strokeWidth={isActive ? 2.1 : 1.7} className={isActive ? "" : "text-white/60"} />
          </span>
          {!collapsed && <span className="relative z-[5] truncate">{item.label}</span>}
          {isActive && (
            <span
              className="pointer-events-none absolute -left-[3px] top-1/2 z-[6] h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-100 shadow-[0_0_6px_#bff6ff,0_0_14px_rgba(56,232,255,.95)]"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function DashboardSidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // On mobile the drawer is always shown expanded.
  const compact = collapsed && !mobileOpen;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        aria-label="Workspace navigation"
        className={`of-console fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden text-white transition-[width,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
          compact ? "lg:w-16" : "lg:w-[190px]"
        } w-[260px] ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ perspective: 900 }}
      >
        <div className="of-console__stars" aria-hidden="true" />

        {/* BRAND */}
        <div className={`relative flex h-[68px] shrink-0 items-center border-b border-white/[0.07] ${compact ? "justify-center px-2" : "px-3"}`}>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="group flex min-w-0 items-center gap-2.5 rounded-xl text-left"
            aria-label="OptiFlow Command Center"
          >
            <BrandEmblem size={compact ? 34 : 36} />
            {!compact && (
              <span className="min-w-0">
                <span className="block font-display text-[14px] font-extrabold tracking-[0.18em] text-white drop-shadow-[0_0_10px_rgba(56,232,255,.25)]">
                  OPTIFLOW
                </span>
                <span className="mt-0.5 block font-mono text-[10px] tracking-[0.2em] text-cyan-100/55">CONTROL CONSOLE</span>
              </span>
            )}
          </button>

          {mobileOpen ? (
            <button
              type="button"
              onClick={onMobileClose}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          onClick={onToggle}
          className={`absolute top-[80px] z-20 hidden h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black text-white/60 transition hover:border-cyan-300/60 hover:text-cyan-100 hover:shadow-[0_0_12px_rgba(56,232,255,.25)] lg:flex ${
            compact ? "left-1/2 -translate-x-1/2" : "right-2"
          }`}
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!compact}
        >
          {compact ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* NAVIGATION */}
        <nav className={`relative flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 [scrollbar-width:none] ${compact ? "pt-12" : "pt-4"}`}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              {!compact ? (
                <div className="of-sidenav-section mb-2 px-2">
                  <span className="text-cyan-200/60">//</span> {section.title}
                </div>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden="true" />
              )}
              {section.items.map((item) => (
                <SideLink key={item.path} item={item} collapsed={compact} onNavigate={onMobileClose} />
              ))}
            </div>
          ))}

          {!compact && <ConstellationRail />}
        </nav>

        {/* ACCOUNT */}
        <div className="relative shrink-0 border-t border-white/[0.07] p-2">
          {ACCOUNT_ITEMS.map((item) => (
            <SideLink key={item.path} item={item} collapsed={compact} onNavigate={onMobileClose} />
          ))}

          <div className={`mt-1 flex items-center rounded-xl border border-white/[0.08] bg-white/[0.02] p-2 ${compact ? "justify-center" : "gap-2"}`}>
            {!compact && (
              <div className="min-w-0 flex-1 pl-1">
                <div className="truncate text-[13px] font-semibold text-white/90">{user?.name || "Operator"}</div>
                <div className="truncate font-mono text-[10.5px] text-white/50">{user?.email || "workspace"}</div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-rose-500/10 hover:text-rose-200"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
