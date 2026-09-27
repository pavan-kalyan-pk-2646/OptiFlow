import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Gauge, LogOut, MonitorCog, Sparkles, Trash2, Waves } from "lucide-react";

import {
  CinematicButton,
  HolographicLabel,
  NeonFrame,
  SectionReveal,
  SpatialPanel,
  useQuality,
  useVisualSettings,
  writeVisualSettings,
  type MotionPreference,
  type QualityPreference,
} from "../../cinematic";
import { HISTORY_KEY, PIPELINES_KEY, readHistory, readPipelines } from "../../cinematic/workspaceData";
import { logout } from "../../utils/auth";

const SettingsPreviewScene = lazy(() => import("../../components/dashboard/SettingsPreviewScene"));

/* =========================================================
   SETTINGS — 3D control console
   Rendering preferences are applied instantly and stored
   locally. Data controls act on the user's real saved data.
========================================================= */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[11.5px] uppercase tracking-[0.2em] text-white/60">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className="text-left"
            >
              <NeonFrame
                active={selected}
                quiet={!selected}
                corners={selected}
                radius={14}
                className={`of-surface h-full p-4 transition ${selected ? "" : "opacity-75 hover:opacity-100"}`}
                style={{ borderRadius: 14 }}
              >
                <div className="relative z-[5]">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-white">{option.label}</span>
                    <span className={`h-3 w-3 rounded-full ${selected ? "bg-cyan-300 shadow-[0_0_10px_#38e8ff]" : "border border-white/25"}`} />
                  </div>
                  <p className="mt-1.5 text-[13px] leading-5 text-white/55">{option.hint}</p>
                </div>
              </NeonFrame>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-5">
      <div>
        <div className="text-[15px] font-semibold text-white">{label}</div>
        <p className="mt-1 text-[13.5px] leading-6 text-white/55">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-cyan-300/30 shadow-[inset_0_0_0_1px_rgba(56,232,255,.7),0_0_18px_rgba(56,232,255,.25)]" : "bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,.15)]"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full transition-all ${checked ? "left-6 bg-cyan-100 shadow-[0_0_10px_#38e8ff]" : "left-1 bg-white/60"}`}
        />
      </button>
    </div>
  );
}

function DangerAction({
  label,
  description,
  count,
  onConfirm,
}: {
  label: string;
  description: string;
  count: number;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.02] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[15px] font-semibold text-white">{label}</div>
        <p className="mt-0.5 text-[13.5px] text-white/55">
          {description} <span className="font-mono text-white/70">({count} stored)</span>
        </p>
      </div>
      {armed ? (
        <div className="flex gap-2">
          <CinematicButton variant="ghost" size="sm" arrow={false} onClick={() => setArmed(false)}>
            Cancel
          </CinematicButton>
          <CinematicButton
            variant="danger"
            size="sm"
            arrow={false}
            icon={<Trash2 size={15} />}
            onClick={() => {
              onConfirm();
              setArmed(false);
            }}
          >
            Confirm delete
          </CinematicButton>
        </div>
      ) : (
        <CinematicButton variant="danger" size="sm" arrow={false} icon={<Trash2 size={15} />} disabled={count === 0} onClick={() => setArmed(true)}>
          Clear
        </CinematicButton>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useVisualSettings();
  const quality = useQuality();
  const [counts, setCounts] = useState(() => ({ pipelines: readPipelines().length, history: readHistory().length }));
  const [notice, setNotice] = useState<string | null>(null);

  const update = (patch: Partial<typeof settings>) => writeVisualSettings({ ...settings, ...patch });

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      pipelines: readPipelines(),
      optimizationHistory: readHistory(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `optiflow-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    flash("Workspace exported as JSON.");
  };

  const tierCopy = useMemo(
    () => `${quality.tier.toUpperCase()} · DPR ${quality.dpr[1]} · PARTICLES ×${quality.particles}${quality.reducedMotion ? " · REDUCED MOTION" : ""}`,
    [quality],
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <SectionReveal>
        <HolographicLabel>Control console</HolographicLabel>
        <h1 className="mt-4 font-heading text-[clamp(2rem,4vw,3.2rem)] font-bold tracking-[-0.03em] text-white">Settings</h1>
      </SectionReveal>

      {notice && (
        <div role="status" className="of-pulse-success fixed right-6 top-20 z-50 rounded-xl bg-black/80 px-4 py-3 text-[14px] text-cyan-50 shadow-[inset_0_0_0_1px_rgba(56,232,255,.45)] backdrop-blur">
          {notice}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <SectionReveal>
            <SpatialPanel kicker="Rendering" title="Visual quality" description="Controls resolution, particle density and 3D detail across every scene.">
              <Segmented<QualityPreference>
                label="Quality tier"
                value={settings.quality}
                onChange={(value) => update({ quality: value })}
                options={[
                  { value: "auto", label: "Auto", hint: "Chosen from your device (mobile → Low)." },
                  { value: "high", label: "High", hint: "Full experience, highest resolution." },
                  { value: "balanced", label: "Balanced", hint: "Fewer particles, lower resolution." },
                  { value: "low", label: "Low", hint: "Minimal 3D for older hardware." },
                ]}
              />
            </SpatialPanel>
          </SectionReveal>

          <SectionReveal delay={0.05}>
            <SpatialPanel kicker="Motion" title="Animation & motion" description="Respect your system accessibility setting, or override it here.">
              <Segmented<MotionPreference>
                label="Motion preference"
                value={settings.motion}
                onChange={(value) => update({ motion: value })}
                options={[
                  { value: "system", label: "System", hint: "Follow prefers-reduced-motion." },
                  { value: "full", label: "Full", hint: "All cinematic camera and scene motion." },
                  { value: "reduced", label: "Reduced", hint: "Static cameras, no intro, minimal animation." },
                ]}
              />
              <div className="mt-6 border-t border-white/[0.07] pt-6">
                <Toggle
                  label="Ambient 3D environment"
                  description="The persistent starfield and DP constellation behind every page. Turn off to save battery."
                  checked={settings.ambientBackground}
                  onChange={(value) => update({ ambientBackground: value })}
                />
              </div>
            </SpatialPanel>
          </SectionReveal>

          <SectionReveal delay={0.1}>
            <SpatialPanel kicker="Data" title="Workspace data" description="Pipelines and optimization history are stored in this browser.">
              <div className="grid gap-3">
                <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.02] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[15px] font-semibold text-white">Export workspace</div>
                    <p className="mt-0.5 text-[13.5px] text-white/55">Download pipelines and history as JSON.</p>
                  </div>
                  <CinematicButton variant="ghost" size="sm" icon={<Download size={15} />} arrow={false} onClick={exportData}>
                    Export JSON
                  </CinematicButton>
                </div>
                <DangerAction
                  label="Clear optimization history"
                  description="Removes all recorded runs."
                  count={counts.history}
                  onConfirm={() => {
                    localStorage.removeItem(HISTORY_KEY);
                    setCounts((c) => ({ ...c, history: 0 }));
                    flash("Optimization history cleared.");
                  }}
                />
                <DangerAction
                  label="Clear saved pipelines"
                  description="Removes every pipeline in My Pipelines."
                  count={counts.pipelines}
                  onConfirm={() => {
                    localStorage.removeItem(PIPELINES_KEY);
                    setCounts((c) => ({ ...c, pipelines: 0 }));
                    flash("Saved pipelines cleared.");
                  }}
                />
              </div>
            </SpatialPanel>
          </SectionReveal>
        </div>

        {/* LIVE PREVIEW + SYSTEM */}
        <div className="grid content-start gap-6">
          <SectionReveal>
            <NeonFrame active radius={24} className="of-surface overflow-hidden" style={{ borderRadius: 24 }}>
              <div className="relative h-[260px]">
                <Suspense fallback={null}>
                  <SettingsPreviewScene className="absolute inset-0" />
                </Suspense>
                <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-cyan-100/80">
                  <Sparkles size={13} /> LIVE PREVIEW
                </div>
              </div>
              <div className="relative z-[5] border-t border-white/[0.07] p-4 font-mono text-[11.5px] leading-6 tracking-[0.12em] text-white/65">
                <Gauge size={13} className="mr-2 inline text-cyan-200" />
                {tierCopy}
              </div>
            </NeonFrame>
          </SectionReveal>

          <SectionReveal delay={0.05}>
            <SpatialPanel kicker="System" title="Connection" bodyClassName="p-6">
              <div className="grid gap-3 text-[14px]">
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]">
                  <MonitorCog size={16} className="text-cyan-200" />
                  <div className="min-w-0">
                    <div className="font-mono text-[10.5px] tracking-[0.2em] text-white/50">API ENDPOINT</div>
                    <div className="truncate font-mono text-[13px] text-white/85">{API_BASE_URL}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]">
                  <Waves size={16} className="text-cyan-200" />
                  <div>
                    <div className="font-mono text-[10.5px] tracking-[0.2em] text-white/50">SESSION</div>
                    <div className="text-[13.5px] text-white/85">JWT stored in this browser</div>
                  </div>
                </div>
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
    </div>
  );
}
