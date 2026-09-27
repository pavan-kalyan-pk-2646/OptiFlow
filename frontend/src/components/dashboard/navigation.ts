import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Boxes,
  BrainCircuit,
  CircleUserRound,
  FileCode2,
  Gauge,
  GitBranch,
  GraduationCap,
  History,
  LayoutDashboard,
  Network,
  Orbit,
  PlaySquare,
  Settings,
  Target,
  Workflow,
} from "lucide-react";

/* =========================================================
   APP NAVIGATION — single source of truth for the sidebar,
   the top-bar breadcrumb and the command search.
   Routes are unchanged from the original application.
========================================================= */

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  keywords?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export const NAV_SECTIONS: NavigationSection[] = [
  {
    title: "COMMAND",
    items: [
      { label: "Command Center", path: "/dashboard", icon: Orbit, keywords: "dashboard home core" },
      { label: "Overview", path: "/overview", icon: LayoutDashboard, keywords: "summary deck" },
    ],
  },
  {
    title: "LEARN",
    items: [
      { label: "DP Notes", path: "/dp-notes", icon: BookOpen, keywords: "theory concepts memoization tabulation" },
      { label: "DP Academy", path: "/dp-academy", icon: GraduationCap, keywords: "lessons modules course" },
      { label: "DP Problems", path: "/dp-problems", icon: Target, keywords: "practice exercises" },
      { label: "DP Playground", path: "/dp-playground", icon: PlaySquare, keywords: "steps run code" },
      { label: "DP Visualizer", path: "/dp-visualizer", icon: GitBranch, keywords: "3d states graph" },
    ],
  },
  {
    title: "BUILD",
    items: [
      { label: "OptiFlow Studio", path: "/studio", icon: Workflow, keywords: "pipeline optimize run" },
      { label: "My Pipelines", path: "/pipelines", icon: Boxes, keywords: "saved load" },
    ],
  },
  {
    title: "ANALYZE",
    items: [
      { label: "Optimization History", path: "/optimization-history", icon: History, keywords: "runs results" },
      { label: "Algorithm Lab", path: "/algorithm-lab", icon: BrainCircuit, keywords: "fibonacci memo" },
      { label: "Benchmark Lab", path: "/benchmark-lab", icon: Gauge, keywords: "brute force performance" },
    ],
  },
  {
    title: "EXPLORE",
    items: [
      { label: "Real-World Applications", path: "/real-world-applications", icon: Network, keywords: "use cases" },
      { label: "Documentation", path: "/documentation", icon: FileCode2, keywords: "docs api" },
    ],
  },
];

export const ACCOUNT_ITEMS: NavigationItem[] = [
  { label: "Profile", path: "/profile", icon: CircleUserRound, keywords: "account identity" },
  { label: "Settings", path: "/settings", icon: Settings, keywords: "preferences quality motion" },
];

export const ALL_NAV_ITEMS: (NavigationItem & { section: string })[] = [
  ...NAV_SECTIONS.flatMap((section) => section.items.map((item) => ({ ...item, section: section.title }))),
  ...ACCOUNT_ITEMS.map((item) => ({ ...item, section: "ACCOUNT" })),
];

export function findNavItem(pathname: string) {
  return ALL_NAV_ITEMS.find((item) => item.path === pathname);
}
