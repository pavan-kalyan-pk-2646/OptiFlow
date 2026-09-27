import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

/* =========================================================
   AUTH INPUT — holographic field bound to a DP state
========================================================= */

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  /** DP state this field activates, e.g. "S0" */
  state?: string;
  trailing?: ReactNode;
  invalid?: boolean;
  hint?: ReactNode;
  labelAside?: ReactNode;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, icon, state, trailing, invalid = false, hint, labelAside, id, value, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const filled = value !== undefined && value !== null && String(value).length > 0;

  return (
    <div className="block">
      {(label || labelAside) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor={inputId} className="text-[13px] font-semibold tracking-[0.02em] text-white/80">
            {label}
          </label>
          {labelAside}
        </div>
      )}

      <div className="of-frame of-field" data-invalid={invalid ? "true" : undefined} data-filled={filled ? "true" : undefined}>
        <div className="relative z-[5] flex items-center gap-3 px-4">
          {icon && <span className="shrink-0 text-cyan-100/60" aria-hidden="true">{icon}</span>}
          <input ref={ref} id={inputId} value={value} aria-invalid={invalid || undefined} {...props} />
          {state && <span className="of-field__state shrink-0" aria-hidden="true">{state}</span>}
          {trailing}
        </div>
      </div>
      {hint && <div className="mt-1.5 text-[12.5px] text-white/55">{hint}</div>}
    </div>
  );
});

export default AuthInput;
