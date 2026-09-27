import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Filter,
  Lightbulb,
  Lock,
  Search,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Difficulty = "Easy" | "Medium" | "Hard";

type Problem = {
  id: string;
  number: number;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  acceptance: string;
  time: string;
  topics: string[];
  solved?: boolean;
  locked?: boolean;
};

const problems: Problem[] = [
  {
    id: "climbing-stairs",
    number: 1,
    title: "Climbing Stairs",
    description:
      "Find the number of distinct ways to reach the top when you can climb one or two steps at a time.",
    category: "1D DP",
    difficulty: "Easy",
    acceptance: "76%",
    time: "15 min",
    topics: ["State Design", "1D DP"],
    solved: true,
  },
  {
    id: "house-robber",
    number: 2,
    title: "House Robber",
    description:
      "Determine the maximum value that can be collected without selecting two adjacent houses.",
    category: "1D DP",
    difficulty: "Easy",
    acceptance: "71%",
    time: "20 min",
    topics: ["Decision DP", "1D DP"],
  },
  {
    id: "coin-change",
    number: 3,
    title: "Coin Change",
    description:
      "Find the minimum number of coins required to reach a target amount.",
    category: "Knapsack",
    difficulty: "Medium",
    acceptance: "48%",
    time: "30 min",
    topics: ["Knapsack", "Minimization"],
  },
  {
    id: "unique-paths",
    number: 4,
    title: "Unique Paths",
    description:
      "Count the number of possible paths from the top-left to bottom-right of a grid.",
    category: "Grid DP",
    difficulty: "Medium",
    acceptance: "67%",
    time: "25 min",
    topics: ["Grid DP", "2D DP"],
  },
  {
    id: "longest-common-subsequence",
    number: 5,
    title: "Longest Common Subsequence",
    description:
      "Find the length of the longest subsequence common to two sequences.",
    category: "Sequence DP",
    difficulty: "Medium",
    acceptance: "59%",
    time: "35 min",
    topics: ["Sequences", "2D DP"],
  },
  {
    id: "partition-equal-subset",
    number: 6,
    title: "Partition Equal Subset Sum",
    description:
      "Determine whether an array can be divided into two subsets having equal sums.",
    category: "Knapsack",
    difficulty: "Medium",
    acceptance: "46%",
    time: "35 min",
    topics: ["Knapsack", "Boolean DP"],
  },
  {
    id: "edit-distance",
    number: 7,
    title: "Edit Distance",
    description:
      "Calculate the minimum operations needed to transform one string into another.",
    category: "Sequence DP",
    difficulty: "Hard",
    acceptance: "54%",
    time: "45 min",
    topics: ["Strings", "2D DP"],
  },
  {
    id: "matrix-chain",
    number: 8,
    title: "Matrix Chain Optimization",
    description:
      "Determine the optimal order for multiplying a sequence of matrices.",
    category: "Interval DP",
    difficulty: "Hard",
    acceptance: "41%",
    time: "50 min",
    topics: ["Interval DP", "Optimization"],
    locked: true,
  },
  {
    id: "pipeline-resource",
    number: 9,
    title: "Pipeline Resource Allocation",
    description:
      "Choose feasible execution decisions under resource constraints while optimizing a pipeline objective.",
    category: "OptiFlow",
    difficulty: "Hard",
    acceptance: "—",
    time: "45 min",
    topics: ["Optimization", "Constraints", "OptiFlow"],
    locked: true,
  },
];

const categories = [
  "All",
  "1D DP",
  "2D DP",
  "Knapsack",
  "Grid DP",
  "Sequence DP",
  "Interval DP",
  "OptiFlow",
];

const difficulties = ["All", "Easy", "Medium", "Hard"];

export default function DPProblemsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  // Real, persisted progress — nothing is pre-solved.
  const [solvedIds, setSolvedIds] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("optiflow_solved_problems") ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("optiflow_solved_problems", JSON.stringify(solvedIds));
    } catch {
      /* storage unavailable */
    }
  }, [solvedIds]);

  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return problems.filter((problem) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        problem.title.toLowerCase().includes(normalizedQuery) ||
        problem.description.toLowerCase().includes(normalizedQuery) ||
        problem.topics.some((topic) =>
          topic.toLowerCase().includes(normalizedQuery),
        );

      const matchesCategory =
        category === "All" ||
        problem.category === category ||
        problem.topics.includes(category);

      const matchesDifficulty =
        difficulty === "All" || problem.difficulty === difficulty;

      return matchesQuery && matchesCategory && matchesDifficulty;
    });
  }, [query, category, difficulty]);

  const availableProblems = problems.filter((problem) => !problem.locked);
  const solvedCount = solvedIds.length;
  const progress =
    availableProblems.length === 0
      ? 0
      : Math.min(100, Math.round((solvedCount / availableProblems.length) * 100));

  const markSolved = (id: string) => {
    setSolvedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setSelectedProblem((current) =>
      current ? { ...current, solved: true } : current,
    );
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
    setDifficulty("All");
  };

  const hasFilters =
    query.length > 0 || category !== "All" || difficulty !== "All";

  return (
    <div className="min-h-full">
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-cyan-400/[0.045] blur-[120px]" />
        <div className="pointer-events-none absolute left-1/3 top-20 h-[300px] w-[500px] rounded-full bg-violet-500/[0.025] blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto max-w-[1500px] px-5 py-9 sm:px-7 lg:px-9 lg:py-12">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.17em] text-cyan-300">
                <BrainCircuit size={13} />
                DP Problems
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Practice the patterns.
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Master the decisions.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                Solve carefully designed Dynamic Programming problems,
                understand the state behind every solution, and build the
                reasoning required for real optimization problems.
              </p>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 xl:w-[350px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    Problem Progress
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {solvedCount}/{availableProblems.length} solved
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06] text-cyan-300">
                  <Trophy size={18} />
                </div>
              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[12px] text-white/55">
                <span>{progress}% complete</span>
                <span>{problems.length} problems</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] px-5 pt-7 sm:px-7 lg:px-9">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ProblemStat icon={<Code2 size={17} />} label="Problems" value={`${problems.length}`} />
          <ProblemStat icon={<Target size={17} />} label="Easy" value={`${problems.filter((p) => p.difficulty === "Easy").length}`} />
          <ProblemStat icon={<Zap size={17} />} label="Medium" value={`${problems.filter((p) => p.difficulty === "Medium").length}`} />
          <ProblemStat icon={<Sparkles size={17} />} label="Hard" value={`${problems.filter((p) => p.difficulty === "Hard").length}`} />
        </div>
      </div>

      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-9">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/55" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search problems, topics..."
                    className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-10 pr-4 text-xs text-white outline-none transition placeholder:text-white/45 focus:border-cyan-400/20 focus:bg-white/[0.04]"
                  />
                </div>

                <div className="relative">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 pr-10 text-xs text-slate-400 outline-none transition focus:border-cyan-400/20 lg:w-44"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item} className="bg-[#0d0d0e] text-white">
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/55" />
                </div>

                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 pr-10 text-xs text-slate-400 outline-none transition focus:border-cyan-400/20 lg:w-40"
                  >
                    {difficulties.map((item) => (
                      <option key={item} value={item} className="bg-[#0d0d0e] text-white">
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/55" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  className={[
                    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs transition lg:hidden",
                    showFilters
                      ? "border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300"
                      : "border-white/[0.07] bg-white/[0.025] text-white/62",
                  ].join(" ")}
                >
                  <Filter size={14} />
                  Filters
                </button>
              </div>

              {showFilters && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3 lg:hidden">
                  {categories.slice(1).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={[
                        "rounded-lg px-3 py-1.5 text-[12px] transition",
                        category === item
                          ? "bg-cyan-400/[0.08] text-cyan-300"
                          : "bg-white/[0.03] text-white/55",
                      ].join(" ")}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              {hasFilters && (
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <p className="text-[12px] text-white/55">
                    {filteredProblems.length} matching problems
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-[12px] text-white/62 transition hover:text-white"
                  >
                    <X size={11} />
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cyan-500/70">
                    Problem Set
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    Dynamic Programming challenges
                  </h2>
                </div>
                <span className="text-[12px] text-white/55">
                  {filteredProblems.length} results
                </span>
              </div>

              {filteredProblems.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
                  <Search size={22} className="mx-auto text-white/45" />
                  <h3 className="mt-4 text-sm font-semibold text-slate-300">
                    No problems found
                  </h3>
                  <p className="mt-2 text-xs text-white/55">
                    Try changing your search or filters.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProblems.map((problem) => (
                    <ProblemCard
                      key={problem.id}
                      problem={problem}
                      solved={solvedIds.includes(problem.id)}
                      onOpen={() => setSelectedProblem(problem)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside>
            <div className="sticky top-[96px] space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
                <div className="flex items-center gap-2">
                  <Lightbulb size={15} className="text-cyan-400" />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    Solve Smarter
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-white">
                  Don't code too early.
                </h3>

                <p className="mt-2 text-xs leading-5 text-white/55">
                  First identify the state, decisions, recurrence, and base
                  cases. Then implement.
                </p>

                <div className="mt-4 space-y-2">
                  <MethodStep number="01" text="Define the state" />
                  <MethodStep number="02" text="Find the transition" />
                  <MethodStep number="03" text="Validate base cases" />
                  <MethodStep number="04" text="Analyze complexity" />
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Difficulty
                </p>
                <div className="mt-4 space-y-3">
                  <DifficultySummary
                    label="Easy"
                    count={problems.filter((p) => p.difficulty === "Easy").length}
                    className="bg-emerald-400/[0.06] text-emerald-300"
                  />
                  <DifficultySummary
                    label="Medium"
                    count={problems.filter((p) => p.difficulty === "Medium").length}
                    className="bg-amber-400/[0.06] text-amber-300"
                  />
                  <DifficultySummary
                    label="Hard"
                    count={problems.filter((p) => p.difficulty === "Hard").length}
                    className="bg-violet-400/[0.06] text-violet-300"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  Need help?
                </p>
                <p className="mt-3 text-xs leading-5 text-white/55">
                  Review the fundamentals before attempting a difficult
                  problem.
                </p>
                <a
                  href="/dp-notes"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  Read DP Notes
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {selectedProblem && (
        <ProblemModal
          problem={selectedProblem}
          solved={solvedIds.includes(selectedProblem.id)}
          onClose={() => setSelectedProblem(null)}
          onSolve={() => markSolved(selectedProblem.id)}
        />
      )}
    </div>
  );
}

function ProblemStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300">
          {icon}
        </div>
        <div>
          <p className="text-[12px] text-white/55">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProblemCard({
  problem,
  solved,
  onOpen,
}: {
  problem: Problem;
  solved: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition duration-200 hover:border-cyan-400/10 hover:bg-white/[0.035]"
    >
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-[12px]",
          solved
            ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
            : "border-white/[0.07] bg-white/[0.025] text-white/55",
        ].join(" ")}
      >
        {solved ? <Check size={15} /> : String(problem.number).padStart(2, "0")}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={[
              "text-sm font-semibold transition",
              solved ? "text-cyan-300" : "text-white group-hover:text-cyan-300",
            ].join(" ")}
          >
            {problem.title}
          </h3>
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
              <Lock size={9} />
              Locked
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-xs text-white/55">
          {problem.description}
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-white/[0.035] px-1.5 py-1 text-[11px] text-white/55">
            {problem.category}
          </span>
          {problem.topics.slice(0, 2).map((topic) => (
            <span
              key={topic}
              className="rounded-md bg-white/[0.025] px-1.5 py-1 text-[11px] text-white/45"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden shrink-0 text-right md:block">
        <div className="flex items-center justify-end gap-1.5 text-[12px] text-white/55">
          <Clock3 size={11} />
          {problem.time}
        </div>
        <p className="mt-1 text-[11px] text-white/45">
          {problem.difficulty}
        </p>
      </div>

      <ChevronRight
        size={16}
        className="shrink-0 text-white/45 transition group-hover:translate-x-0.5 group-hover:text-cyan-400"
      />
    </button>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const classes =
    difficulty === "Easy"
      ? "bg-emerald-400/[0.06] text-emerald-300"
      : difficulty === "Medium"
        ? "bg-amber-400/[0.06] text-amber-300"
        : "bg-violet-400/[0.06] text-violet-300";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${classes}`}>
      {difficulty}
    </span>
  );
}

function DifficultySummary({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${className}`}>
        {label}
      </span>
      <span className="text-[12px] text-white/55">{count} problems</span>
    </div>
  );
}

function MethodStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2">
      <span className="font-mono text-[11px] text-cyan-500/60">{number}</span>
      <span className="text-[12px] text-white/55">{text}</span>
    </div>
  );
}

function ProblemModal({
  problem,
  solved,
  onClose,
  onSolve,
}: {
  problem: Problem;
  solved: boolean;
  onClose: () => void;
  onSolve: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#0b0b0c] shadow-2xl shadow-black/50">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0b0b0c]/95 px-6 py-5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06] text-cyan-300">
              <BrainCircuit size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-500/70">
                Problem {problem.number}
              </p>
              <h2 className="truncate text-base font-semibold text-white">
                {problem.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close problem"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/[0.05] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/62">
              {problem.category}
            </span>
            <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/62">
              {problem.time}
            </span>
          </div>

          <section className="mt-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-500/70">
              Problem
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {problem.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-white/62">
              {problem.description}
            </p>
          </section>

          <section className="mt-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-500/70">
              Example
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#050506]">
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-slate-400">
{`Input:
n = 5

Possible transitions:
state 5 → state 4
state 5 → state 3

Output:
optimal result for the given state`}
              </pre>
            </div>
          </section>

          <section className="mt-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-500/70">
              Constraints
            </p>
            <div className="mt-3 space-y-2">
              <Constraint text="Input values are within the problem's valid range." />
              <Constraint text="Every transition must produce a valid state." />
              <Constraint text="The solution should satisfy the required optimization objective." />
            </div>
          </section>

          <section className="mt-7 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-cyan-400" />
              <p className="text-xs font-semibold text-cyan-300">
                DP Thinking Hint
              </p>
            </div>
            <p className="mt-3 text-xs leading-6 text-white/62">
              Ask yourself: what minimum information completely describes the
              current subproblem? Once that state is defined, identify every
              valid decision and express the current result using smaller
              states.
            </p>
          </section>

          <section className="mt-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
              Concepts involved
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {problem.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-[12px] text-white/62"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to Problems
            </button>

            {problem.locked ? (
              <button
                type="button"
                disabled
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.05] px-5 text-xs font-semibold text-white/55"
              >
                <Lock size={13} />
                Complete Previous Modules
              </button>
            ) : (
              <button
                type="button"
                onClick={onSolve}
                className={[
                  "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold transition",
                  solved
                    ? "bg-cyan-400/[0.08] text-cyan-300"
                    : "bg-white text-slate-950 hover:bg-slate-100",
                ].join(" ")}
              >
                {solved ? (
                  <>
                    <Check size={14} />
                    Solved
                  </>
                ) : (
                  <>
                    Mark as Solved
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Constraint({ text }: { text: string }) {
  return (
    <div className="flex gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/50" />
      <p className="text-[12px] leading-5 text-white/55">{text}</p>
    </div>
  );
}
