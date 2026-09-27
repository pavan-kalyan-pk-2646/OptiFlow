import {
  ChevronDown,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Mail,
  Orbit,
  UserRound,
  UsersRound,
  CalendarDays,
} from "lucide-react";
import {
  type FormEvent,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import type { ChamberStatus } from "../../components/auth/AuthChamberScene";
import CinematicButton from "../../cinematic/ui/CinematicButton";
import { registerUser } from "../../services/authService";
import type { Gender } from "../../services/authService";
import { saveAuth } from "../../utils/auth";


type FieldKey =
  | "name"
  | "age"
  | "gender"
  | "email"
  | "password"
  | "confirm";

const FIELD_ORDER: FieldKey[] = ["name", "age", "gender", "email", "password", "confirm"];
const CHAMBER_STATES = ["NAME", "AGE", "PROFILE", "EMAIL", "KEY", "CONFIRM"];


const genderOptions: {
  value: Gender;
  label: string;
}[] = [
  {
    value: "male",
    label: "Male",
  },
  {
    value: "female",
    label: "Female",
  },
  {
    value: "other",
    label: "Other",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer not to say",
  },
];


function FieldError({ show, children }: { show: boolean; children: string }) {
  if (!show) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-2 text-[13px] text-rose-200">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />
      {children}
    </p>
  );
}


function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [errorField, setErrorField] =
    useState<FieldKey | null>(null);

  // Presentation-only chamber state
  const [focus, setFocus] =
    useState<FieldKey | null>(null);
  const [pulse, setPulse] = useState(0);
  const [status, setStatus] = useState<ChamberStatus>("idle");
  const navigated = useRef(false);

  const goToDashboard = () => {
    if (navigated.current) return;
    navigated.current = true;
    navigate("/dashboard", { replace: true });
  };

  function fail(message: string, field: FieldKey | null) {
    setError(message);
    setErrorField(field);
    setStatus("error");
    window.setTimeout(() => setStatus((current) => (current === "error" ? "idle" : current)), 1800);
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setErrorField(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      fail(
        "Workspace identity must contain at least 2 characters.",
        "name",
      );
      return;
    }

    const numericAge = Number(age);

    if (
      !age ||
      !Number.isInteger(numericAge) ||
      numericAge < 1 ||
      numericAge > 120
    ) {
      fail(
        "Enter a valid age between 1 and 120.",
        "age",
      );
      return;
    }

    if (!gender) {
      fail(
        "Select your profile identity.",
        "gender",
      );
      return;
    }

    if (!trimmedEmail) {
      fail(
        "Workspace email is required.",
        "email",
      );
      return;
    }

    if (password.length < 8) {
      fail(
        "Access key must contain at least 8 characters.",
        "password",
      );
      return;
    }

    if (password !== confirmPassword) {
      fail(
        "Access key confirmation does not match.",
        "confirm",
      );
      return;
    }

    try {
      setLoading(true);
      setStatus("submitting");

      const response = await registerUser({
        name: trimmedName,
        age: numericAge,
        gender,
        email: trimmedEmail,
        password,
      });

      saveAuth(
        response.access_token,
        response.user,
      );

      setStatus("success");
      window.setTimeout(goToDashboard, 1400);
    } catch (err) {
      fail(
        err instanceof Error
          ? err.message
          : "Unable to initialize workspace.",
        null,
      );
    } finally {
      setLoading(false);
    }
  }

  const values: Record<FieldKey, string> = {
    name,
    age,
    gender,
    email,
    password,
    confirm: confirmPassword,
  };

  const focusProps = (field: FieldKey) => ({
    onFocus: () => setFocus(field),
    onBlur: () => setFocus(null),
  });

  const typed = () => setPulse((value) => value + 1);
  const invalid = (field: FieldKey) => errorField === field;

  return (
    <AuthLayout
      kicker="Initialize workspace"
      title={
        <>
          Initialize <span className="of-gradient-text">your flow.</span>
        </>
      }
      subtitle="Create your workspace identity and enter the OptiFlow optimization space."
      chamber={{
        labels: CHAMBER_STATES,
        active: focus ? FIELD_ORDER.indexOf(focus) : status === "submitting" ? FIELD_ORDER.length - 1 : -1,
        completed: FIELD_ORDER.map((field) => values[field].length > 0),
        pulse,
        status,
        onFlyThroughComplete: goToDashboard,
      }}
      footer={
        <>
          Already have access?{" "}
          <Link to="/login" className="font-semibold text-cyan-300 transition hover:text-cyan-100">
            Resume your flow
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <AuthInput
            label="Full name"
            state="S0"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              typed();
            }}
            {...focusProps("name")}
            placeholder="Your full name"
            autoComplete="name"
            required
            icon={<UserRound size={18} />}
            invalid={invalid("name")}
          />
          <FieldError show={invalid("name")}>{error}</FieldError>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <AuthInput
              label="Age"
              state="S1"
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(event) => {
                setAge(event.target.value);
                typed();
              }}
              {...focusProps("age")}
              placeholder="Age"
              required
              icon={<CalendarDays size={18} />}
              invalid={invalid("age")}
            />
            <FieldError show={invalid("age")}>{error}</FieldError>
          </div>

          <div>
            <label htmlFor="register-gender" className="mb-2 block text-[13px] font-semibold tracking-[0.02em] text-white/80">
              Gender
            </label>
            <div className="of-frame of-field" data-invalid={invalid("gender") ? "true" : undefined} data-filled={gender ? "true" : undefined}>
              <div className="relative z-[5] flex items-center gap-3 px-4">
                <UsersRound size={18} className="shrink-0 text-cyan-100/60" aria-hidden="true" />
                <select
                  id="register-gender"
                  value={gender}
                  onChange={(event) => {
                    setGender(event.target.value as Gender);
                    typed();
                  }}
                  {...focusProps("gender")}
                  required
                  aria-invalid={invalid("gender") || undefined}
                  className="of-select"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="of-field__state shrink-0" aria-hidden="true">S2</span>
                <ChevronDown size={16} className="pointer-events-none shrink-0 text-white/50" aria-hidden="true" />
              </div>
            </div>
            <FieldError show={invalid("gender")}>{error}</FieldError>
          </div>
        </div>

        <div>
          <AuthInput
            label="Email"
            state="S3"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              typed();
            }}
            {...focusProps("email")}
            placeholder="you@example.com"
            autoComplete="email"
            required
            icon={<Mail size={18} />}
            invalid={invalid("email")}
          />
          <FieldError show={invalid("email")}>{error}</FieldError>
        </div>

        <div>
          <AuthInput
            label="Password"
            state="S4"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              typed();
            }}
            {...focusProps("password")}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            icon={<LockKeyhole size={18} />}
            invalid={invalid("password")}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="shrink-0 rounded-lg p-1.5 text-white/50 transition hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <FieldError show={invalid("password")}>{error}</FieldError>
        </div>

        <div>
          <AuthInput
            label="Confirm password"
            state="S5"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              typed();
            }}
            {...focusProps("confirm")}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
            icon={<Fingerprint size={18} />}
            invalid={invalid("confirm")}
            trailing={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="shrink-0 rounded-lg p-1.5 text-white/50 transition hover:text-white"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <FieldError show={invalid("confirm")}>{error}</FieldError>
        </div>

        {error && !errorField && (
          <div role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.07] px-4 py-3.5 text-[14px] leading-6 text-rose-100">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-rose-200/80">
              Workspace initialization rejected
            </div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        <CinematicButton
          type="submit"
          size="lg"
          kicker={loading ? "INITIALIZING" : "TRANSITION"}
          icon={<Orbit size={20} />}
          loading={loading}
          disabled={status === "success"}
          className="!mt-6 w-full !justify-start"
        >
          {loading ? "Initializing flow…" : "Initialize Optimization Space"}
        </CinematicButton>

        <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
          Profile → State → Optimization
        </p>
      </form>
    </AuthLayout>
  );
}


export default RegisterPage;
