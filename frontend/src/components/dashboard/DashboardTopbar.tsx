import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Menu, Search, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { getStoredUser } from "../../utils/auth";
import { ALL_NAV_ITEMS, findNavItem } from "./navigation";

/* =========================================================
   DASHBOARD TOPBAR
   Breadcrumb · command search (real route navigation) ·
   live engine status (GET /health) · operator identity.
========================================================= */

interface DashboardTopbarProps {
  onMenuClick: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type EngineState = "checking" | "online" | "offline";

function useEngineStatus(): EngineState {
  const [state, setState] = useState<EngineState>("checking");
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
        window.clearTimeout(timer);
        if (alive) setState(response.ok ? "online" : "offline");
      } catch {
        if (alive) setState("offline");
      }
    };
    check();
    const interval = window.setInterval(check, 60000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);
  return state;
}

export default function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();
  const engine = useEngineStatus();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const current = findNavItem(location.pathname);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NAV_ITEMS.slice(0, 7);
    return ALL_NAV_ITEMS.filter((item) =>
      `${item.label} ${item.section} ${item.keywords ?? ""}`.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    input.current?.blur();
    navigate(path);
  };

  return (
    <header className="of-topbar sticky top-0 z-30 flex h-[64px] shrink-0 items-center px-3 sm:px-5 lg:px-7">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/75 transition hover:border-cyan-300/40 hover:text-white lg:hidden"
          >
            <Menu size={19} />
          </button>

          <nav aria-label="Breadcrumb" className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
              {current?.section ?? "WORKSPACE"}
            </p>
            <p className="truncate font-heading text-[16px] font-bold text-white">{current?.label ?? "OptiFlow"}</p>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Command search */}
          <div className="relative">
            <label className="of-frame of-field hidden h-10 w-[260px] items-center md:flex xl:w-[320px]" style={{ borderRadius: 12 }}>
              <span className="relative z-[5] flex w-full items-center gap-2.5 px-3">
                <Search size={16} className="shrink-0 text-white/55" aria-hidden="true" />
                <input
                  ref={input}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setCursor(0);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => window.setTimeout(() => setOpen(false), 150)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setCursor((c) => Math.min(results.length - 1, c + 1));
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setCursor((c) => Math.max(0, c - 1));
                    } else if (event.key === "Enter" && results[cursor]) {
                      go(results[cursor].path);
                    } else if (event.key === "Escape") {
                      setOpen(false);
                      input.current?.blur();
                    }
                  }}
                  placeholder="Jump to…"
                  aria-label="Search OptiFlow pages"
                  aria-expanded={open}
                  aria-controls="of-command-results"
                  role="combobox"
                  className="!h-10 !text-[14px]"
                />
                <kbd className="hidden shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10.5px] text-white/50 xl:block">
                  Ctrl K
                </kbd>
              </span>
            </label>

            {open && (
              <ul
                id="of-command-results"
                role="listbox"
                className="of-surface absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl p-1.5"
              >
                {results.length === 0 && <li className="px-3 py-3 text-[14px] text-white/60">No matching page.</li>}
                {results.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path} role="option" aria-selected={index === cursor}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => go(item.path)}
                        onMouseEnter={() => setCursor(index)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          index === cursor ? "bg-cyan-300/[0.08] text-white" : "text-white/75"
                        }`}
                      >
                        <Icon size={16} className="shrink-0 text-cyan-200/80" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">{item.label}</span>
                          <span className="block font-mono text-[10.5px] tracking-[0.18em] text-white/45">{item.section}</span>
                        </span>
                        {index === cursor && <CornerDownLeft size={14} className="text-white/50" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Engine status */}
          <div
            className={`hidden h-10 items-center gap-2 rounded-xl border px-3 font-mono text-[11px] tracking-[0.16em] sm:flex ${
              engine === "online"
                ? "border-emerald-300/20 bg-emerald-400/[0.05] text-emerald-100/85"
                : engine === "offline"
                  ? "border-rose-300/25 bg-rose-500/[0.06] text-rose-100/85"
                  : "border-white/10 text-white/55"
            }`}
            title={`Backend ${API_BASE_URL}`}
            role="status"
          >
            <span
              className={
                engine === "online"
                  ? "of-sync-dot"
                  : engine === "offline"
                    ? "h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]"
                    : "h-2 w-2 rounded-full bg-white/40"
              }
            />
            {engine === "online" ? "ENGINE ONLINE" : engine === "offline" ? "ENGINE OFFLINE" : "CHECKING"}
          </div>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition hover:bg-white/[0.04]"
            aria-label="Open profile"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/[0.08] text-cyan-200 shadow-[inset_0_0_0_1px_rgba(56,232,255,.3)]">
              <User size={17} />
            </span>
            <span className="hidden text-left md:block">
              <span className="block max-w-[140px] truncate text-[13.5px] font-semibold text-white/90">{user?.name || "Operator"}</span>
              <span className="block max-w-[140px] truncate text-[11.5px] text-white/50">{user?.email || "Workspace member"}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
