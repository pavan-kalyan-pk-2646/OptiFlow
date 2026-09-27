import { Canvas, type CanvasProps } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";

import { hasWebGL, useQuality } from "../quality";

/* =========================================================
   SCENE ERROR BOUNDARY
   A failing 3D scene must never take the page down with it.
========================================================= */

class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[OptiFlow] 3D scene disabled:", error.message, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

let fontsLoaded = false;

/* =========================================================
   SCENE 3D
   - pauses rendering when scrolled out of view
   - honours quality tiers (dpr / antialias)
   - degrades to a DOM fallback when WebGL is unavailable
========================================================= */

export interface Scene3DProps extends Omit<CanvasProps, "children"> {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  /** Accessible description of what the scene represents. */
  label?: string;
  /** Keep rendering even when off-screen (fixed backgrounds). */
  alwaysActive?: boolean;
  /** Render only on demand (static scenes). */
  demand?: boolean;
}

export default function Scene3D({
  children,
  className = "",
  fallback = null,
  label,
  alwaysActive = false,
  demand = false,
  camera,
  gl,
  ...rest
}: Scene3DProps) {
  const quality = useQuality();
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // Canvases are only created once they first approach the viewport.
  const [armed, setArmed] = useState(alwaysActive);
  const [supported] = useState(() => hasWebGL());
  const [docVisible, setDocVisible] = useState(true);
  const [fontsReady, setFontsReady] = useState(() => fontsLoaded);

  useEffect(() => {
    if (fontsReady) return;
    let alive = true;
    const done = () => {
      fontsLoaded = true;
      if (alive) setFontsReady(true);
    };
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) return done();
    // Canvas-rendered labels need the webfonts; never wait more than 1.2s.
    const timer = window.setTimeout(done, 800);
    Promise.all([
      fonts.load('600 64px "JetBrains Mono"'),
      fonts.load('700 64px "Orbitron"'),
    ])
      .catch(() => undefined)
      .then(() => fonts.ready)
      .then(() => {
        window.clearTimeout(timer);
        done();
      });
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [fontsReady]);

  useEffect(() => {
    if (alwaysActive || !wrapper.current || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      setArmed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setArmed(true);
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, [alwaysActive]);

  useEffect(() => {
    const onVisibility = () => setDocVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const frameloop = !visible || !docVisible ? "never" : demand ? "demand" : "always";

  return (
    <div
      ref={wrapper}
      className={`of-scene3d ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {supported && armed ? (
        <SceneBoundary fallback={fallback}>
          <Canvas
            dpr={quality.dpr}
            frameloop={frameloop}
            camera={camera ?? { position: [0, 0, 10], fov: 42, near: 0.1, far: 200 }}
            gl={{
              antialias: quality.tier !== "low",
              alpha: true,
              powerPreference: "high-performance",
              ...(typeof gl === "object" ? gl : {}),
            }}
            {...rest}
          >
            <Suspense fallback={null}>{fontsReady ? children : null}</Suspense>
          </Canvas>
        </SceneBoundary>
      ) : supported ? null : (
        fallback
      )}
    </div>
  );
}
