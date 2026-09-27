import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, CalendarClock, Fingerprint, LogOut, RefreshCw, ShieldCheck, UserRound } from "lucide-react";

import { getCurrentUser, type User } from "../../services/authService";
import { getStoredUser, getToken, logout, saveAuth } from "../../utils/auth";
import {
  CinematicButton,
  DemoBadge,
  HolographicLabel,
  NeonFrame,
  SectionReveal,
  SpatialPanel,
  TiltCard,
} from "../../cinematic";
import { readHistory, readPipelines } from "../../cinematic/workspaceData";

/* =========================================================
   PROFILE — 3D identity card
========================================================= */

function initials(name?: string) {
  if (!name) return "OF";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const pipelines = useMemo(() => readPipelines(), []);
  const history = useMemo(() => readHistory(), []);

  const refresh = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const fresh = await getCurrentUser();
      const token = getToken();
      if (token) saveAuth(token, fresh);
      setUser(fresh);
      setSyncMessage({ tone: "ok", text: "Identity synchronized with the OptiFlow API." });
    } catch (error) {
      setSyncMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not reach the API.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const rows = [
    { icon: <UserRound size={16} />, label: "Full name", value: user?.name ?? "—" },
    { icon: <AtSign size={16} />, label: "Email", value: user?.email ?? "—" },
    { icon: <CalendarClock size={16} />, label: "Age", value: user?.age ? String(user.age) : "—" },
    { icon: <Fingerprint size={16} />, label: "Gender", value: user?.gender ? GENDER_LABEL[user.gender] ?? user.gender : "—" },
    { icon: <ShieldCheck size={16} />, label: "Account status", value: user?.is_active === false ? "Inactive" : "Active" },
    { icon: <CalendarClock size={16} />, label: "Member since", value: formatDate(user?.created_at) },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <SectionReveal>
        <HolographicLabel>Operator identity</HolographicLabel>
        <h1 className="mt-4 font-heading text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.03em] text-white">Profile</h1>
      </SectionReveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* 3D IDENTITY CARD */}
        <SectionReveal>
          <TiltCard maxX={7} maxY={9} className="rounded-[28px]" style={{ borderRadius: 28 }}>
            <NeonFrame active radius={28} className="of-surface of-surface--raised overflow-hidden" style={{ borderRadius: 28 }}>
              <span className="of-scanline" aria-hidden="true" />
              <div className="relative z-[5] p-7" style={{ transformStyle: "preserve-3d" }}>
                <div className="flex items-center justify-between" style={{ transform: "translateZ(20px)" }}>
                  <span className="font-mono text-[11px] tracking-[0.26em] text-cyan-100/70">OPTIFLOW · ID CARD</span>
                  <DemoBadge kind="live">Verified session</DemoBadge>
                </div>

                <div className="mt-8 flex items-center gap-5" style={{ transform: "translateZ(46px)" }}>
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                    <span className="of-emblem__ring" style={{ inset: "-8%" }} />
                    <span className="of-emblem__ring of-emblem__ring--b" style={{ inset: "-20%" }} />
                    <span className="relative z-[2] flex h-20 w-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#dffbff,#38e8ff_35%,#3a2a8a_80%)] font-display text-[26px] font-extrabold text-black shadow-[0_0_40px_rgba(56,232,255,.45),inset_0_-8px_18px_rgba(0,0,0,.35)]">
                      {initials(user?.name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-heading text-[26px] font-bold text-white">{user?.name ?? "Operator"}</div>
                    <div className="truncate font-mono text-[13px] text-white/60">{user?.email ?? "—"}</div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3" style={{ transform: "translateZ(30px)" }}>
                  {[
                    { label: "PIPELINES", value: pipelines.length },
                    { label: "RUNS", value: history.length },
                    { label: "USER ID", value: user?.id ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white/[0.035] p-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
                      <div className="font-heading text-[22px] font-bold tabular-nums text-white">{item.value}</div>
                      <div className="mt-0.5 font-mono text-[10px] tracking-[0.2em] text-white/50">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-white/[0.08] pt-5 font-mono text-[11px] tracking-[0.18em] text-white/45" style={{ transform: "translateZ(12px)" }}>
                  <span>STATE · AUTHENTICATED</span>
                  <span className="text-cyan-200/70">S0 → S∞</span>
                </div>
              </div>
            </NeonFrame>
          </TiltCard>
        </SectionReveal>

        {/* DETAILS */}
        <SectionReveal delay={0.08}>
          <SpatialPanel
            kicker="Account record"
            title="Identity details"
            description="Loaded from your current session. Synchronize to fetch the latest record from the API."
            actions={
              <CinematicButton variant="ghost" size="sm" icon={<RefreshCw size={15} className={syncing ? "animate-spin" : ""} />} arrow={false} onClick={refresh} disabled={syncing}>
                {syncing ? "Synchronizing…" : "Synchronize"}
              </CinematicButton>
            }
          >
            {syncMessage && (
              <div
                role="status"
                className={`mb-5 rounded-xl px-4 py-3 text-[14px] ${
                  syncMessage.tone === "ok"
                    ? "of-pulse-success bg-cyan-300/[0.06] text-cyan-50 shadow-[inset_0_0_0_1px_rgba(56,232,255,.3)]"
                    : "bg-rose-500/[0.07] text-rose-100 shadow-[inset_0_0_0_1px_rgba(255,84,112,.35)]"
                }`}
              >
                {syncMessage.text}
              </div>
            )}

            <dl className="grid gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={row.label} className="rounded-2xl bg-white/[0.025] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]">
                  <dt className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
                    <span className="text-cyan-200/80">{row.icon}</span>
                    {row.label}
                  </dt>
                  <dd className="mt-2 break-words text-[16px] font-semibold text-white">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <CinematicButton variant="ghost" size="sm" onClick={() => navigate("/settings")}>
                Open settings
              </CinematicButton>
              <CinematicButton
                variant="danger"
                size="sm"
                icon={<LogOut size={15} />}
                arrow={false}
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Sign out
              </CinematicButton>
            </div>
          </SpatialPanel>
        </SectionReveal>
      </div>
    </div>
  );
}
