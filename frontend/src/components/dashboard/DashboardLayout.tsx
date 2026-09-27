import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Ambient from "../../cinematic/Ambient";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const COLLAPSE_KEY = "optiflow_sidebar_collapsed";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Close the drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-black text-white">
      <Ambient variant="app" intensity={0.8} />

      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={`of-layer min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
          collapsed ? "lg:pl-16" : "lg:pl-[190px]"
        }`}
      >
        <DashboardTopbar onMenuClick={() => setMobileOpen(true)} />

        <main id="main-content" className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
