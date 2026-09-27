import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, Orbit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import type { ChamberStatus } from "../../components/auth/AuthChamberScene";
import CinematicButton from "../../cinematic/ui/CinematicButton";
import { loginUser } from "../../services/authService";
import { saveAuth } from "../../utils/auth";

const CHAMBER_STATES = ["EMAIL", "ACCESS KEY", "VERIFY"];

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Presentation-only state for the 3D chamber
  const [focus, setFocus] = useState(-1);
  const [pulse, setPulse] = useState(0);
  const [status, setStatus] = useState<ChamberStatus>("idle");
  const [recoverNote, setRecoverNote] = useState(false);
  const navigated = useRef(false);

  const goToDashboard = () => {
    if (navigated.current) return;
    navigated.current = true;
    navigate("/dashboard", { replace: true });
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);
    setStatus("submitting");

    try {
      const response = await loginUser({
        email,
        password,
      });

      saveAuth(response.access_token, response.user);

      // Fly through the core, then enter the dashboard.
      setStatus("success");
      window.setTimeout(goToDashboard, 1400); // safety net if the 3D scene is unavailable
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Unable to establish a session. Please try again.",
      );
      window.setTimeout(() => setStatus((current) => (current === "error" ? "idle" : current)), 1800);
    } finally {
      setLoading(false);
    }
  }

  const typed = () => setPulse((value) => value + 1);

  return (
    <AuthLayout
      kicker="State access · 01"
      title={
        <>
          Resume your <span className="of-gradient-text">flow.</span>
        </>
      }
      subtitle="Enter the credentials for your OptiFlow optimization workspace."
      chamber={{
        labels: CHAMBER_STATES,
        active: status === "submitting" ? 2 : focus,
        completed: [email.length > 0, password.length > 0, status === "success"],
        pulse,
        status,
        onFlyThroughComplete: goToDashboard,
      }}
      footer={
        <>
          New to the optimization engine?{" "}
          <Link to="/register" className="font-semibold text-cyan-300 transition hover:text-cyan-100">
            Initialize a workspace
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        <AuthInput
          label="Workspace identity"
          state="S0"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail size={18} />}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            typed();
          }}
          onFocus={() => setFocus(0)}
          onBlur={() => setFocus(-1)}
          required
          disabled={loading}
          invalid={status === "error"}
        />

        <AuthInput
          label="Access key"
          state="S1"
          labelAside={
            <button
              type="button"
              disabled={loading}
              onClick={() => setRecoverNote((value) => !value)}
              className="text-[12.5px] font-medium text-cyan-300/80 transition hover:text-cyan-100 disabled:opacity-40"
            >
              Recover access
            </button>
          }
          type={showPassword ? "text" : "password"}
          placeholder="Enter your access key"
          autoComplete="current-password"
          icon={<Lock size={18} />}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            typed();
          }}
          onFocus={() => setFocus(1)}
          onBlur={() => setFocus(-1)}
          required
          disabled={loading}
          invalid={status === "error"}
          hint={
            recoverNote
              ? "Self-service password recovery isn't available in this version yet — contact your workspace administrator."
              : undefined
          }
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide access key" : "Show access key"}
              disabled={loading}
              className="shrink-0 rounded-lg p-1.5 text-white/50 transition hover:text-white disabled:opacity-30"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.07] px-4 py-3.5 text-[14px] leading-6 text-rose-100"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose-200/80">
              Authentication transition rejected
            </div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-white/65">
            <input
              type="checkbox"
              disabled={loading}
              className="h-4 w-4 rounded border-white/10 bg-white/5 accent-cyan-400"
            />
            Keep session active
          </label>

          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-300/70">
            Secure channel
          </span>
        </div>

        <CinematicButton
          type="submit"
          size="lg"
          kicker={loading ? "EVALUATING" : "TRANSITION"}
          icon={<Orbit size={20} />}
          loading={loading}
          disabled={status === "success"}
          className="w-full !justify-start"
        >
          {loading ? "Restoring state…" : "Enter Optimization Space"}
        </CinematicButton>
      </form>
    </AuthLayout>
  );
}
