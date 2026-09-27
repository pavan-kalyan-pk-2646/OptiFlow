import {
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Code2,
  Flame,
  GitBranch,
  GraduationCap,
  Layers3,
  Lock,
  Play,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { ReactNode } from "react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { CinematicButton, NeonFrame } from "../../cinematic";
import type { AcademyModuleProgress } from "../../components/learn/AcademyProgressScene";

const AcademyProgressScene = lazy(() => import("../../components/learn/AcademyProgressScene"));
const PROGRESS_KEY = "optiflow_academy_progress";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  icon: LucideIcon;
  completed?: boolean;
  locked?: boolean;
}

interface Module {
  id: string;
  number: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

/* ============================================================
   CURRICULUM
   ============================================================ */

const modules: Module[] = [
  {
    id: "fundamentals",
    number: "01",
    title: "DP Fundamentals",
    description:
      "Build a strong foundation and understand when Dynamic Programming is the right tool.",
    lessons: [
      {
        id: "what-is-dp",
        title: "What is Dynamic Programming?",
        description:
          "Understand the core idea behind breaking problems into reusable subproblems.",
        duration: "8 min",
        difficulty: "Beginner",
        icon: BookOpen,
        completed: true,
      },
      {
        id: "when-to-use-dp",
        title: "When Should You Use DP?",
        description:
          "Learn how to recognize overlapping subproblems and optimal substructure.",
        duration: "10 min",
        difficulty: "Beginner",
        icon: Target,
      },
      {
        id: "dp-characteristics",
        title: "DP Characteristics",
        description:
          "Explore states, transitions, subproblems, and the properties that make DP possible.",
        duration: "12 min",
        difficulty: "Beginner",
        icon: Layers3,
      },
    ],
  },

  {
    id: "thinking",
    number: "02",
    title: "DP Thinking",
    description:
      "Learn the reasoning process used to transform a problem into a Dynamic Programming model.",
    lessons: [
      {
        id: "state-design",
        title: "Designing the State",
        description:
          "Identify the minimum information needed to represent a subproblem.",
        duration: "14 min",
        difficulty: "Beginner",
        icon: Circle,
      },
      {
        id: "decisions",
        title: "Finding Decisions",
        description:
          "Identify the choices available at every state and model their consequences.",
        duration: "12 min",
        difficulty: "Intermediate",
        icon: GitBranch,
      },
      {
        id: "recurrence",
        title: "Writing the Recurrence",
        description:
          "Convert state transitions into a precise mathematical recurrence.",
        duration: "16 min",
        difficulty: "Intermediate",
        icon: Code2,
      },
      {
        id: "base-cases",
        title: "Base Cases",
        description:
          "Learn how to identify and define the smallest valid states.",
        duration: "9 min",
        difficulty: "Beginner",
        icon: Check,
      },
    ],
  },

  {
    id: "patterns",
    number: "03",
    title: "Classic DP Patterns",
    description:
      "Master the patterns that appear repeatedly across programming and real optimization problems.",
    lessons: [
      {
        id: "one-dimensional",
        title: "1D Dynamic Programming",
        description:
          "Learn the fundamentals through linear state transitions.",
        duration: "15 min",
        difficulty: "Beginner",
        icon: Layers3,
      },
      {
        id: "two-dimensional",
        title: "2D Dynamic Programming",
        description:
          "Model problems that require two dimensions of state.",
        duration: "18 min",
        difficulty: "Intermediate",
        icon: Layers3,
      },
      {
        id: "knapsack",
        title: "Knapsack Pattern",
        description:
          "Understand capacity-based state design and decision transitions.",
        duration: "22 min",
        difficulty: "Intermediate",
        icon: Target,
      },
      {
        id: "grid-dp",
        title: "Grid DP",
        description:
          "Solve path and movement optimization problems using grid states.",
        duration: "17 min",
        difficulty: "Intermediate",
        icon: GitBranch,
      },
      {
        id: "sequence-dp",
        title: "Sequence DP",
        description:
          "Explore Dynamic Programming over strings and sequences.",
        duration: "20 min",
        difficulty: "Advanced",
        icon: Code2,
      },
      {
        id: "interval-dp",
        title: "Interval DP",
        description:
          "Learn how to solve problems where subproblems are defined by ranges.",
        duration: "24 min",
        difficulty: "Advanced",
        icon: Layers3,
      },
    ],
  },

  {
    id: "implementation",
    number: "04",
    title: "Implementation",
    description:
      "Turn your DP model into efficient and maintainable code.",
    lessons: [
      {
        id: "memoization",
        title: "Memoization",
        description:
          "Implement top-down Dynamic Programming with cached subproblem results.",
        duration: "14 min",
        difficulty: "Beginner",
        icon: Code2,
      },
      {
        id: "tabulation",
        title: "Tabulation",
        description:
          "Build DP tables iteratively using a bottom-up approach.",
        duration: "15 min",
        difficulty: "Beginner",
        icon: Layers3,
      },
      {
        id: "space-optimization",
        title: "Space Optimization",
        description:
          "Reduce memory usage when previous states are sufficient.",
        duration: "18 min",
        difficulty: "Intermediate",
        icon: Zap,
      },
      {
        id: "reconstruction",
        title: "Solution Reconstruction",
        description:
          "Recover the actual sequence of decisions from the DP result.",
        duration: "19 min",
        difficulty: "Advanced",
        icon: GitBranch,
      },
    ],
  },

  {
    id: "optimization",
    number: "05",
    title: "Optimization Thinking",
    description:
      "Go beyond textbook DP and reason about constraints, objectives, and solution quality.",
    lessons: [
      {
        id: "constraints",
        title: "Constraints & Feasibility",
        description:
          "Understand how constraints affect states, transitions, and valid solutions.",
        duration: "16 min",
        difficulty: "Intermediate",
        icon: Target,
      },
      {
        id: "multi-objective",
        title: "Optimization Objectives",
        description:
          "Model minimization, maximization, and balanced optimization objectives.",
        duration: "18 min",
        difficulty: "Intermediate",
        icon: Trophy,
        locked: true,
      },
      {
        id: "complexity",
        title: "Complexity Analysis",
        description:
          "Analyze time and space complexity of your Dynamic Programming solution.",
        duration: "15 min",
        difficulty: "Intermediate",
        icon: Zap,
        locked: true,
      },
    ],
  },

  {
    id: "optiflow",
    number: "06",
    title: "DP inside OptiFlow",
    description:
      "Connect the concepts you learned to the actual OptiFlow optimization engine.",
    lessons: [
      {
        id: "pipeline-model",
        title: "Modeling a Pipeline",
        description:
          "Understand how a software pipeline can be represented as an optimization problem.",
        duration: "14 min",
        difficulty: "Intermediate",
        icon: GitBranch,
      },
      {
        id: "pipeline-state",
        title: "Pipeline State Design",
        description:
          "Translate pipeline decisions and constraints into DP state information.",
        duration: "20 min",
        difficulty: "Advanced",
        icon: Layers3,
        locked: true,
      },
      {
        id: "optimization-engine",
        title: "The OptiFlow DP Engine",
        description:
          "Follow the journey from pipeline input to optimal strategy reconstruction.",
        duration: "25 min",
        difficulty: "Advanced",
        icon: Sparkles,
        locked: true,
      },
    ],
  },
];

/* ============================================================
   PAGE
   ============================================================ */

export default function DPAcademyPage() {
  const navigate = useNavigate();

  // Real, persisted progress — nothing is pre-completed.
  const [completedLessons, setCompletedLessons] =
    useState<string[]>(() => {
      try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        const parsed = raw ? (JSON.parse(raw) as string[]) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    });

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(completedLessons));
    } catch {
      /* storage unavailable */
    }
  }, [completedLessons]);

  const [expandedModule, setExpandedModule] =
    useState("fundamentals");



  const allLessons = useMemo(
    () => modules.flatMap((module) => module.lessons),
    [],
  );

  const unlockedLessons = allLessons.filter(
    (lesson) => !lesson.locked,
  );

  const progress =
    unlockedLessons.length === 0
      ? 0
      : Math.round(
          (completedLessons.length /
            unlockedLessons.length) *
            100,
        );

  const currentLesson =
    unlockedLessons.find(
      (lesson) =>
        !completedLessons.includes(lesson.id),
    ) || unlockedLessons[0];

  const moduleProgress: AcademyModuleProgress[] = useMemo(
    () =>
      modules.map((module) => ({
        id: module.id,
        number: module.number,
        title: module.title,
        total: module.lessons.length,
        completed: module.lessons.filter((lesson) => !lesson.locked && completedLessons.includes(lesson.id)).length,
        locked: module.lessons.filter((lesson) => lesson.locked).length,
        current: module.lessons.some((lesson) => lesson.id === currentLesson?.id),
      })),
    [completedLessons, currentLesson?.id],
  );

  const markComplete = (lessonId: string) => {
    setCompletedLessons((current) =>
      current.includes(lessonId)
        ? current
        : [...current, lessonId],
    );
  };

  const continueLearning = () => {
    if (!currentLesson) {
      return;
    }

    const module = modules.find((item) =>
      item.lessons.some(
        (lesson) =>
          lesson.id === currentLesson.id,
      ),
    );

    if (module) {
      setExpandedModule(module.id);
    }

    setTimeout(() => {
      document
        .getElementById(currentLesson.id)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  };

  return (
    <div className="relative min-h-full text-white">
      <div className="relative z-10">

      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute right-[9%] top-[-170px] h-[430px] w-[430px] rounded-full border border-cyan-100/[0.035]" />
        <div className="pointer-events-none absolute right-[13%] top-[-135px] h-[350px] w-[350px] rounded-full border border-white/[0.025]" />
        <div className="pointer-events-none absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-100/15 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-violet-100/10 to-transparent" />

        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative mx-auto max-w-[1500px] px-5 py-9 sm:px-7 lg:px-9 lg:py-12">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">

            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.17em] text-cyan-300">
                <GraduationCap size={13} />
                DP Academy
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Learn DP.
                <br />

                <span className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                  Think like an optimizer.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                A structured learning path that takes you
                from Dynamic Programming fundamentals to the
                concepts powering the OptiFlow optimization
                engine.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">

                <CinematicButton
                  size="lg"
                  kicker={currentLesson ? "NEXT STATE" : "COMPLETE"}
                  icon={<Play size={19} />}
                  onClick={continueLearning}
                >
                  CONTINUE LEARNING
                </CinematicButton>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dp-notes")
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 text-sm font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <BookOpen size={15} />

                  Read Notes
                </button>

              </div>
            </div>

            {/* PROGRESS */}

            <div className="w-full max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 xl:w-[360px]">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/50">
                    Your Progress
                  </p>

                  <p className="mt-1 text-lg font-semibold text-white">
                    {progress}% complete
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06] text-cyan-300">
                  <Trophy size={19} />
                </div>

              </div>

              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${progress}%`,
                  }}
                  transition={{
                    duration: 0.7,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-100 via-cyan-200 to-violet-200"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span className="text-white/50">
                  {completedLessons.length} completed
                </span>

                <span className="text-white/50">
                  {unlockedLessons.length} available
                </span>
              </div>

            </div>

            <NeonFrame active radius={22} className="of-surface relative w-full overflow-hidden xl:w-[520px]" style={{ borderRadius: 22 }}>
              <div className="relative h-[240px]">
                <Suspense fallback={null}>
                  <AcademyProgressScene modules={moduleProgress} className="absolute inset-0" />
                </Suspense>
                <div className="pointer-events-none absolute inset-x-4 top-3 flex items-center justify-between font-mono text-[11px] tracking-[0.18em] text-white/60">
                  <span>LEARNING STATE PROGRESSION</span>
                  <span className="text-cyan-100/80">{progress}%</span>
                </div>
              </div>
              <div className="relative z-[5] flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.07] px-4 py-3 font-mono text-[11px] tracking-[0.12em] text-white/60">
                <span><span className="text-white">●</span> complete</span>
                <span><span className="text-cyan-300">●</span> in progress</span>
                <span><span className="text-emerald-300">●</span> started</span>
                <span><span className="text-rose-300">●</span> locked</span>
              </div>
            </NeonFrame>
          </div>
        </div>
      </section>

      {/* ======================================================
          STATS
          ====================================================== */}

      <div className="mx-auto max-w-[1500px] px-5 pt-7 sm:px-7 lg:px-9">

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <AcademyStat
            icon={<BookOpen size={17} />}
            label="Learning Modules"
            value={`${modules.length}`}
          />

          <AcademyStat
            icon={<Layers3 size={17} />}
            label="Lessons"
            value={`${allLessons.length}`}
          />

          <AcademyStat
            icon={<Check size={17} />}
            label="Completed"
            value={`${completedLessons.length}`}
          />

          <AcademyStat
            icon={<Flame size={17} />}
            label="Current Focus"
            value={moduleProgress.find((module) => module.current)?.title ?? "All available complete"}
          />

        </div>
      </div>

      {/* ======================================================
          CURRICULUM
          ====================================================== */}

      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-9">

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">

          {/* LEFT */}

          <section>

            <div className="mb-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cyan-500/70">
                Structured Curriculum
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                Your learning path
              </h2>

              <p className="mt-2 text-sm text-white/50">
                Progress through the modules in order and
                build your understanding step by step.
              </p>
            </div>

            <div className="space-y-3">

              {modules.map((module) => {
                const expanded =
                  expandedModule === module.id;

                const moduleCompleted =
                  module.lessons.filter(
                    (lesson) =>
                      !lesson.locked &&
                      completedLessons.includes(
                        lesson.id,
                      ),
                  ).length;

                const moduleAvailable =
                  module.lessons.filter(
                    (lesson) =>
                      !lesson.locked,
                  ).length;

                return (
                  <NeonFrame
                    key={module.id}
                    active={expanded}
                    corners={expanded}
                    radius={18}
                    className="of-surface overflow-hidden"
                    style={{ borderRadius: 18 }}
                  >
                    <div className="relative z-[5]">

                    {/* MODULE HEADER */}

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModule(
                          expanded
                            ? ""
                            : module.id,
                        )
                      }
                      className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/[0.02]"
                    >

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] font-mono text-xs text-cyan-400">
                        {module.number}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="text-sm font-semibold text-white">
                            {module.title}
                          </h3>

                          {moduleCompleted ===
                            moduleAvailable &&
                            moduleAvailable > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/[0.07] px-2 py-0.5 text-[11px] font-medium text-cyan-300">
                                <Check size={10} />
                                Complete
                              </span>
                            )}

                        </div>

                        <p className="mt-1 max-w-2xl text-xs leading-5 text-white/50">
                          {module.description}
                        </p>

                      </div>

                      <div className="hidden text-right sm:block">

                        <p className="text-[12px] text-white/50">
                          {moduleCompleted}/
                          {moduleAvailable}
                        </p>

                        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/50">
                          lessons
                        </p>

                      </div>

                      <ChevronRight
                        size={17}
                        className={[
                          "shrink-0 text-white/50 transition-transform",
                          expanded
                            ? "rotate-90 text-cyan-400"
                            : "",
                        ].join(" ")}
                      />

                    </button>

                    {/* LESSONS */}

                    {expanded && (
                      <div className="border-t border-white/[0.06] p-3">

                        <div className="space-y-1">

                          {module.lessons.map(
                            (lesson) => {

                              const completed =
                                completedLessons.includes(
                                  lesson.id,
                                );

                              return (
                                <LessonRow
                                  key={lesson.id}
                                  lesson={lesson}
                                  completed={
                                    completed
                                  }
                                  onComplete={() =>
                                    markComplete(
                                      lesson.id,
                                    )
                                  }
                                />
                              );
                            },
                          )}

                        </div>

                      </div>
                    )}

                    </div>
                  </NeonFrame>
                );
              })}

            </div>
          </section>

          {/* ==================================================
              RIGHT SIDEBAR
              ================================================== */}

          <aside>

            <div className="sticky top-[96px] space-y-4">

              {/* CONTINUE */}

              <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">

                <div className="flex items-center gap-2">
                  <Sparkles
                    size={15}
                    className="text-cyan-400"
                  />

                  <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    Continue
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-white">
                  {currentLesson?.title ||
                    "Course Complete"}
                </h3>

                <p className="mt-2 text-xs leading-5 text-white/50">
                  {currentLesson?.description ||
                    "You completed all currently available lessons."}
                </p>

                <div className="mt-4 flex items-center justify-between">

                  <span className="text-[12px] text-white/50">
                    {currentLesson?.duration ||
                      "Completed"}
                  </span>

                  {currentLesson && (
                    <button
                      type="button"
                      onClick={continueLearning}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-[12px] font-semibold text-black transition hover:bg-slate-100"
                    >
                      <Play size={12} />
                      Continue
                    </button>
                  )}

                </div>
              </div>

              {/* STRATEGY */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">

                <div className="flex items-center gap-2">

                  <Zap
                    size={15}
                    className="text-cyan-400"
                  />

                  <h3 className="text-xs font-semibold text-white">
                    Learning Strategy
                  </h3>

                </div>

                <div className="mt-4 space-y-3">

                  <Tip
                    number="01"
                    text="Understand the state before writing code."
                  />

                  <Tip
                    number="02"
                    text="Write the recurrence on paper first."
                  />

                  <Tip
                    number="03"
                    text="Validate base cases and constraints."
                  />

                  <Tip
                    number="04"
                    text="Use the visualizer to inspect transitions."
                  />

                </div>
              </div>

              {/* PRACTICE */}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-5">

                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  Practice with
                </p>

                <div className="mt-3 space-y-1">

                  <ToolLink
                    icon={<Play size={14} />}
                    label="DP Playground"
                    onClick={() =>
                      navigate("/dp-playground")
                    }
                  />

                  <ToolLink
                    icon={<GitBranch size={14} />}
                    label="DP Visualizer"
                    onClick={() =>
                      navigate("/dp-visualizer")
                    }
                  />

                  <ToolLink
                    icon={<Target size={14} />}
                    label="DP Problems"
                    onClick={() =>
                      navigate("/dp-problems")
                    }
                  />

                </div>
              </div>

            </div>
          </aside>

        </div>
      </main>
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTS
   ============================================================ */

function AcademyStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.018] p-4">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300">
          {icon}
        </div>

        <div>

          <p className="text-[12px] text-white/50">
            {label}
          </p>

          <p className="mt-0.5 text-sm font-semibold text-white">
            {value}
          </p>

        </div>

      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  completed,
  onComplete,
}: {
  lesson: Lesson;
  completed: boolean;
  onComplete: () => void;
}) {
  const Icon = lesson.icon;

  return (
    <div
      id={lesson.id}
      className={[
        "group flex items-center gap-3 rounded-xl p-3 transition",
        lesson.locked
          ? "opacity-50"
          : "hover:bg-white/[0.035]",
      ].join(" ")}
    >

      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
          completed
            ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
            : "border-white/[0.07] bg-white/[0.02] text-white/50",
        ].join(" ")}
      >
        {lesson.locked ? (
          <Lock size={14} />
        ) : completed ? (
          <Check size={15} />
        ) : (
          <Icon size={15} />
        )}
      </div>

      <div className="min-w-0 flex-1">

        <div className="flex flex-wrap items-center gap-2">

          <p
            className={[
              "text-xs font-medium",
              completed
                ? "text-cyan-300"
                : "text-white/55",
            ].join(" ")}
          >
            {lesson.title}
          </p>

          <DifficultyBadge
            difficulty={lesson.difficulty}
          />

        </div>

        <p className="mt-1 truncate text-[12px] text-white/50">
          {lesson.description}
        </p>

      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[12px] text-white/50">
          {lesson.duration}
        </p>
      </div>

      {!lesson.locked && (
        <button
          type="button"
          onClick={onComplete}
          className={[
            "flex h-8 shrink-0 items-center justify-center rounded-lg px-2.5 text-[12px] font-medium transition",
            completed
              ? "bg-cyan-400/[0.06] text-cyan-400"
              : "border border-white/[0.07] bg-white/[0.018] text-white/60 hover:bg-white/[0.06] hover:text-white",
          ].join(" ")}
        >
          {completed ? (
            <Check size={13} />
          ) : (
            "Complete"
          )}
        </button>
      )}

    </div>
  );
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty: Lesson["difficulty"];
}) {
  const classes =
    difficulty === "Beginner"
      ? "bg-emerald-400/[0.06] text-emerald-300"
      : difficulty === "Intermediate"
        ? "bg-amber-400/[0.06] text-amber-300"
        : "bg-violet-400/[0.06] text-violet-300";

  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {difficulty}
    </span>
  );
}

function Tip({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">

      <span className="font-mono text-[11px] text-cyan-500/60">
        {number}
      </span>

      <p className="text-[12px] leading-5 text-white/50">
        {text}
      </p>

    </div>
  );
}

function ToolLink({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-white/[0.035]"
    >

      <span className="text-white/50 transition group-hover:text-cyan-300">
        {icon}
      </span>

      <span className="flex-1 text-[13px] text-white/60 transition group-hover:text-slate-200">
        {label}
      </span>

      <ChevronRight
        size={13}
        className="text-white/50 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
      />

    </button>
  );
}