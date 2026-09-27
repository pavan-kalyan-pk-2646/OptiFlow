import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

export default function AuthButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-slate-950 transition hover:bg-slate-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {props.children}

      <ArrowRight
        size={16}
        className="transition-transform group-hover:translate-x-1"
      />
    </button>
  );
}