import {
  ArrowRight,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Globe2,
  Layers3,
  Rocket,
  Server,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const applications = [
  {
    icon: Workflow,
    title: "CI/CD Pipeline Optimization",
    description:
      "Choose execution strategies for build, test, security, packaging and deployment stages while respecting delivery constraints.",
    example:
      "Select faster build infrastructure when a release deadline is tight.",
  },
  {
    icon: Cloud,
    title: "Cloud Cost Optimization",
    description:
      "Model alternative execution strategies with different time and cost characteristics and select a feasible configuration.",
    example:
      "Balance faster compute against increased infrastructure cost.",
  },
  {
    icon: Server,
    title: "Deployment Planning",
    description:
      "Represent deployment stages as sequential decisions where each stage offers multiple execution options.",
    example:
      "Choose an accelerated deployment path under a release budget.",
  },
  {
    icon: ShieldCheck,
    title: "Security Pipeline Decisions",
    description:
      "Evaluate alternative security scanning strategies as part of a larger software delivery pipeline.",
    example:
      "Use an accelerated security scan when time is constrained.",
  },
  {
    icon: Database,
    title: "Data Processing Workflows",
    description:
      "Represent processing stages with alternative strategies and optimize their cumulative execution characteristics.",
    example:
      "Choose between cheaper and faster processing strategies.",
  },
  {
    icon: Cpu,
    title: "Compute Strategy Selection",
    description:
      "Treat compute choices as stage-level alternatives with measurable time and cost trade-offs.",
    example:
      "Select the strategy that best satisfies the workload objective.",
  },
];

export default function RealWorldApplicationsPage() {
  return (
    <div className="min-h-screen bg-[#070708] px-6 py-8 text-white lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/[0.07] pb-10">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.22em] text-cyan-400">
            <Globe2 size={13} />
            Explore
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Dynamic Programming beyond
            <span className="text-cyan-300">
              {" "}
              textbook problems.
            </span>
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/62">
            OptiFlow demonstrates how a carefully formulated Dynamic
            Programming problem can represent real engineering
            decisions involving alternative strategies, deadlines,
            budgets and optimization objectives.
          </p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {applications.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="group rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-6 transition hover:-translate-y-1 hover:border-cyan-400/15"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300">
                  <Icon size={19} />
                </div>

                <h2 className="mt-6 text-base font-semibold">
                  {item.title}
                </h2>

                <p className="mt-3 text-xs leading-6 text-white/62">
                  {item.description}
                </p>

                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <p className="text-[12px] uppercase tracking-wider text-cyan-400">
                    Example
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/55">
                    {item.example}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-cyan-400/10 bg-[#0c0c0d]">
          <div className="grid lg:grid-cols-2">
            <div className="p-7 lg:p-10">
              <div className="flex items-center gap-2 text-cyan-300">
                <GitBranch size={18} />
                <span className="text-xs font-medium">
                  The common pattern
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold">
                Real systems become optimization problems when
                decisions have measurable trade-offs.
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/62">
                OptiFlow focuses on a bounded pipeline model where
                each stage provides alternative strategies. The
                engine combines those decisions while enforcing
                deadline and budget constraints.
              </p>
            </div>

            <div className="border-t border-white/[0.06] p-7 lg:border-l lg:border-t-0 lg:p-10">
              <div className="space-y-4">
                <FlowRow
                  icon={<Layers3 size={16} />}
                  title="Stage"
                  text="A pipeline decision point"
                />

                <FlowRow
                  icon={<Code2 size={16} />}
                  title="Strategy"
                  text="An alternative execution choice"
                />

                <FlowRow
                  icon={<Rocket size={16} />}
                  title="Constraint"
                  text="Deadline and budget limits"
                />

                <FlowRow
                  icon={<Cpu size={16} />}
                  title="DP Engine"
                  text="Searches reusable states"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/[0.07] bg-[#0c0c0d] p-7 text-center">
          <p className="text-[12px] uppercase tracking-[0.22em] text-cyan-400">
            OptiFlow principle
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-semibold">
            Model the decision space correctly first.
            Then optimize it efficiently.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-white/55">
            Dynamic Programming is powerful when the problem has
            optimal substructure and overlapping subproblems. OptiFlow
            deliberately starts with a bounded model where those
            properties can be explained and demonstrated clearly.
          </p>
        </section>
      </div>
    </div>
  );
}

function FlowRow({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
      <div className="text-cyan-300">{icon}</div>

      <div>
        <p className="text-xs font-medium text-white">
          {title}
        </p>

        <p className="mt-1 text-[13px] text-white/55">
          {text}
        </p>
      </div>

      <ArrowRight
        size={14}
        className="ml-auto text-white/45"
      />
    </div>
  );
}