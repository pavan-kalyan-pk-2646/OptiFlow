import {
  lazy,
  Suspense,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "../components/dashboard/DashboardLayout";
import LandingPage from "../pages/public/LandingPage";
import MotionRoot from "../cinematic/MotionRoot";
import { CinematicButton, OrbitalLoader } from "../cinematic";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import { isAuthenticated } from "../utils/auth";


/* =========================================================
   HELPER
========================================================= */

function loadPage(
  loader: () => Promise<Record<string, unknown>>,
) {
  return lazy(async () => {
    const module = await loader();

    const possibleComponent = Object.values(module).find(
      (value) => typeof value === "function",
    );

    if (!possibleComponent) {
      throw new Error(
        "No React component export was found in this page module.",
      );
    }

    return {
      default: possibleComponent as ComponentType,
    };
  });
}


/* =========================================================
   DASHBOARD
========================================================= */

const DashboardPage = loadPage(
  () => import("../pages/dashboard/DashboardPage"),
);

const OverviewPage = loadPage(
  () => import("../pages/dashboard/OverviewPage"),
);

const ProfilePage = loadPage(
  () => import("../pages/dashboard/ProfilePage"),
);

const SettingsPage = loadPage(
  () => import("../pages/dashboard/SettingsPage"),
);


/* =========================================================
   LEARN
========================================================= */

const DPNotesPage = loadPage(
  () => import("../pages/learn/DPNotesPage"),
);

const DPAcademyPage = loadPage(
  () => import("../pages/learn/DPAcademyPage"),
);

const DPProblemsPage = loadPage(
  () => import("../pages/learn/DPProblemsPage"),
);

const DPPlaygroundPage = loadPage(
  () => import("../pages/learn/DPPlaygroundPage"),
);

const DPVisualizerPage = loadPage(
  () => import("../pages/learn/DPVisualizerPage"),
);


/* =========================================================
   BUILD
========================================================= */

const OptiFlowStudioPage = loadPage(
  () => import("../pages/build/OptiFlowStudioPage"),
);

const MyPipelinesPage = loadPage(
  () => import("../pages/build/MyPipelinesPage"),
);


/* =========================================================
   ANALYZE
========================================================= */

const OptimizationHistoryPage = loadPage(
  () => import("../pages/analyze/OptimizationHistoryPage"),
);

const AlgorithmLabPage = loadPage(
  () => import("../pages/analyze/AlgorithmLabPage"),
);

const BenchmarkLabPage = loadPage(
  () => import("../pages/analyze/BenchmarkLabPage"),
);


/* =========================================================
   EXPLORE
========================================================= */

const RealWorldApplicationsPage = loadPage(
  () => import("../pages/explore/RealWorldApplicationsPage"),
);

const DocumentationPage = loadPage(
  () => import("../pages/explore/DocumentationPage"),
);


/* =========================================================
   LOADING SCREEN
========================================================= */

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-white">
      <OrbitalLoader label="Synchronizing state space" />
    </div>
  );
}


/* =========================================================
   LAZY PAGE WRAPPER
========================================================= */

function LazyPage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}


/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <>{children}</>;
}


/* =========================================================
   DASHBOARD SHELL
========================================================= */

function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <LazyPage>
          {children}
        </LazyPage>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


/* =========================================================
   PROTECTED STUDIO SHELL
========================================================= */

function ProtectedStudio() {
  return (
    <ProtectedRoute>
      <LazyPage>
        <OptiFlowStudioPage />
      </LazyPage>
    </ProtectedRoute>
  );
}


/* =========================================================
   PUBLIC HOME
========================================================= */

function PublicHomePage() {
  return <LandingPage />;
}


/* =========================================================
   AUTH WRAPPER
========================================================= */

function AuthWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}


/* =========================================================
   404
========================================================= */

function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="of-layer text-center">
        <p className="font-mono text-[13px] uppercase tracking-[0.3em] text-rose-300/90">
          404 · State not found
        </p>

        <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[0.06em] sm:text-6xl">
          PRUNED
        </h1>

        <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-white/65">
          This route is outside the feasible region. The page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-8 flex justify-center">
          <CinematicButton
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Back to OptiFlow
          </CinematicButton>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <MotionRoot>
    <Routes>

      {/* =====================================================
          PUBLIC
      ===================================================== */}

      <Route
        path="/"
        element={<PublicHomePage />}
      />

      <Route
        path="/home"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />


      {/* =====================================================
          AUTH
      ===================================================== */}

      <Route
        path="/login"
        element={
          <AuthWrapper>
            <LoginPage />
          </AuthWrapper>
        }
      />

      <Route
        path="/register"
        element={
          <AuthWrapper>
            <RegisterPage />
          </AuthWrapper>
        }
      />


      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/dashboard"
        element={
          <DashboardShell>
            <DashboardPage />
          </DashboardShell>
        }
      />

      <Route
        path="/overview"
        element={
          <DashboardShell>
            <OverviewPage />
          </DashboardShell>
        }
      />

      <Route
        path="/profile"
        element={
          <DashboardShell>
            <ProfilePage />
          </DashboardShell>
        }
      />

      <Route
        path="/settings"
        element={
          <DashboardShell>
            <SettingsPage />
          </DashboardShell>
        }
      />


      {/* =====================================================
          LEARN
      ===================================================== */}

      <Route
        path="/dp-notes"
        element={
          <DashboardShell>
            <DPNotesPage />
          </DashboardShell>
        }
      />

      <Route
        path="/dp-academy"
        element={
          <DashboardShell>
            <DPAcademyPage />
          </DashboardShell>
        }
      />

      <Route
        path="/dp-problems"
        element={
          <DashboardShell>
            <DPProblemsPage />
          </DashboardShell>
        }
      />

      <Route
        path="/dp-playground"
        element={
          <DashboardShell>
            <DPPlaygroundPage />
          </DashboardShell>
        }
      />

      <Route
        path="/dp-visualizer"
        element={
          <DashboardShell>
            <DPVisualizerPage />
          </DashboardShell>
        }
      />


      {/* =====================================================
          BUILD
      ===================================================== */}

      <Route
        path="/studio"
        element={<ProtectedStudio />}
      />

      <Route
        path="/pipelines"
        element={
          <DashboardShell>
            <MyPipelinesPage />
          </DashboardShell>
        }
      />


      {/* =====================================================
          ANALYZE
      ===================================================== */}

      <Route
        path="/optimization-history"
        element={
          <DashboardShell>
            <OptimizationHistoryPage />
          </DashboardShell>
        }
      />

      <Route
        path="/algorithm-lab"
        element={
          <DashboardShell>
            <AlgorithmLabPage />
          </DashboardShell>
        }
      />

      <Route
        path="/benchmark-lab"
        element={
          <DashboardShell>
            <BenchmarkLabPage />
          </DashboardShell>
        }
      />


      {/* =====================================================
          EXPLORE
      ===================================================== */}

      <Route
        path="/real-world-applications"
        element={
          <DashboardShell>
            <RealWorldApplicationsPage />
          </DashboardShell>
        }
      />

      <Route
        path="/documentation"
        element={
          <DashboardShell>
            <DocumentationPage />
          </DashboardShell>
        }
      />


      {/* =====================================================
          SHORTCUTS
      ===================================================== */}

      <Route
        path="/learn"
        element={
          <Navigate
            to="/dp-notes"
            replace
          />
        }
      />

      <Route
        path="/build"
        element={
          <Navigate
            to="/studio"
            replace
          />
        }
      />

      <Route
        path="/analyze"
        element={
          <Navigate
            to="/optimization-history"
            replace
          />
        }
      />

      <Route
        path="/explore"
        element={
          <Navigate
            to="/real-world-applications"
            replace
          />
        }
      />


      {/* =====================================================
          FALLBACK
      ===================================================== */}

      <Route
        path="*"
        element={<NotFoundPage />}
      />

    </Routes>
    </MotionRoot>
  );
}