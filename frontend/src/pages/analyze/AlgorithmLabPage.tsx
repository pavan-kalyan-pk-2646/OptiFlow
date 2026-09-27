import {
  ArrowRight,
  BrainCircuit,
  Check,
  Code2,
  GitBranch,
  Layers3,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type Algorithm = "memoization" | "tabulation";

const problems = {
  fibonacci: {
    title: "Fibonacci",
    description:
      "Compute Fibonacci numbers while observing how Dynamic Programming removes repeated subproblems.",
    recurrence: "DP[n] = DP[n - 1] + DP[n - 2]",
    complexity: "O(n)",
  },
  climbing: {
    title: "Climbing Stairs",
    description:
      "Count the number of ways to reach the nth stair using one-step and two-step moves.",
    recurrence: "DP[n] = DP[n - 1] + DP[n - 2]",
    complexity: "O(n)",
  },
};

export default function AlgorithmLabPage() {
  const [problem, setProblem] =
    useState<keyof typeof problems>("fibonacci");

  const [algorithm, setAlgorithm] =
    useState<Algorithm>("tabulation");

  const [input, setInput] = useState(10);
  const [executed, setExecuted] = useState(false);

  const current = problems[problem];

  const result = useMemo(() => {
    if (problem === "fibonacci") {
      let a = 0;
      let b = 1;

      for (let i = 0; i < input; i++) {
        [a, b] = [b, a + b];
      }

      return a;
    }

    let a = 1;
    let b = 1;

    for (let i = 2; i <= input; i++) {
      [a, b] = [b, a + b];
    }

    return input <= 1 ? 1 : b;
  }, [problem, input]);

  function reset() {
    setInput(10);
    setExecuted(false);
  }

  return (
    <div className="min-h-screen bg-[#070708] px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/[0.07] pb-7">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-cyan-400">
            <BrainCircuit size={13} />
            Analyze · Algorithm Lab
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            Algorithm Lab
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
            Inspect Dynamic Programming algorithms by changing the
            problem, execution strategy and input size.
          </p>
        </header>

        <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* CONTROL PANEL */}
          <aside className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-5">
            <p className="text-[12px] uppercase tracking-[0.18em] text-white/55">
              Experiment
            </p>

            <div className="mt-5">
              <label className="text-xs text-white/62">
                Problem
              </label>

              <div className="mt-2 space-y-2">
                {Object.entries(problems).map(
                  ([key, value]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setProblem(
                          key as keyof typeof problems,
                        );
                        setExecuted(false);
                      }}
                      className={[
                        "w-full rounded-xl border px-3 py-3 text-left transition",
                        problem === key
                          ? "border-cyan-400/20 bg-cyan-400/[0.06]"
                          : "border-white/[0.06] hover:bg-white/[0.025]",
                      ].join(" ")}
                    >
                      <p className="text-xs font-medium">
                        {value.title}
                      </p>
                      <p className="mt-1 text-[12px] text-white/55">
                        {value.complexity}
                      </p>
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-xs text-white/62">
                Algorithm
              </label>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["memoization", "tabulation"] as const).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAlgorithm(item)}
                      className={[
                        "rounded-xl border px-3 py-3 text-xs capitalize transition",
                        algorithm === item
                          ? "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300"
                          : "border-white/[0.06] text-white/62 hover:text-slate-300",
                      ].join(" ")}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-xs text-white/62">
                Input size
              </label>

              <input
                type="number"
                min={1}
                max={30}
                value={input}
                onChange={(e) => {
                  setInput(
                    Math.max(
                      1,
                      Math.min(
                        30,
                        Number(e.target.value),
                      ),
                    ),
                  );
                  setExecuted(false);
                }}
                className="mt-2 h-11 w-full rounded-xl border border-white/[0.07] bg-black/20 px-3 text-sm text-white outline-none focus:border-cyan-400/30"
              />
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setExecuted(true)}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 text-xs font-semibold text-slate-950"
              >
                <Zap size={14} />
                Run
              </button>

              <button
                type="button"
                onClick={reset}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] text-white/62 hover:text-white"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </aside>

          {/* MAIN LAB */}
          <main className="space-y-5">
            <section className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-7">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Layers3 size={17} />
                    <span className="text-xs font-medium">
                      {current.title}
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-semibold">
                    {current.title} with{" "}
                    <span className="text-cyan-300">
                      {algorithm}
                    </span>
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
                    {current.description}
                  </p>
                </div>

                {executed && (
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3 text-right">
                    <p className="text-[11px] uppercase tracking-wider text-emerald-400">
                      Result
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {result}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
              <LabCard
                icon={<GitBranch size={17} />}
                title="State"
              >
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <code className="text-sm text-cyan-300">
                    dp[i]
                  </code>

                  <p className="mt-3 text-xs leading-5 text-white/62">
                    Each state represents the solution to a
                    smaller subproblem. The next state is built
                    from previously computed states.
                  </p>
                </div>
              </LabCard>

              <LabCard
                icon={<ArrowRight size={17} />}
                title="Transition"
              >
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <code className="text-sm text-cyan-300">
                    {current.recurrence}
                  </code>

                  <p className="mt-3 text-xs leading-5 text-white/62">
                    The recurrence defines how the current state
                    depends on earlier states.
                  </p>
                </div>
              </LabCard>
            </section>

            <section className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-7">
              <div className="flex items-center gap-2">
                <Code2
                  size={17}
                  className="text-cyan-300"
                />

                <h2 className="font-semibold">
                  Execution model
                </h2>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <ExecutionStep
                  number="01"
                  title="Define state"
                  text="Represent the smaller subproblem."
                />

                <ExecutionStep
                  number="02"
                  title="Reuse state"
                  text="Avoid recomputing overlapping subproblems."
                />

                <ExecutionStep
                  number="03"
                  title="Build result"
                  text="Combine states using the recurrence."
                />
              </div>
            </section>

            <section className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-6">
              <div className="flex gap-4">
                <Check
                  size={18}
                  className="mt-0.5 shrink-0 text-cyan-300"
                />

                <div>
                  <h3 className="text-sm font-semibold">
                    Why this matters for OptiFlow
                  </h3>

                  <p className="mt-2 text-xs leading-6 text-white/62">
                    OptiFlow applies the same DP principles to a
                    bounded pipeline decision problem: each stage
                    contributes a strategy choice, states encode
                    accumulated time and cost, and transitions
                    extend feasible states toward the final
                    optimal configuration.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function LabCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6">
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}
        <h2 className="text-sm font-semibold text-white">
          {title}
        </h2>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

function ExecutionStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <span className="font-mono text-[12px] text-cyan-400">
        {number}
      </span>

      <h3 className="mt-3 text-sm font-medium">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-white/55">
        {text}
      </p>
    </div>
  );
}