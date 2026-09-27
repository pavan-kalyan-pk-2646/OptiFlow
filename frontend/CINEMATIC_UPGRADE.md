# OptiFlow — Cinematic 3D Upgrade

Every change here is on the presentation side. Routes, JWT auth, protected routes, the `/optimization/run` call, pipeline and history persistence, and the Studio flow (landing → ENTER STUDIO → explanation → ENTER PIPELINE → workspace) all behave as they did before.

## Setup

```bash
cd frontend
npm install      # adds @fontsource/* (self-hosted Orbitron, Space Grotesk, Inter, JetBrains Mono, Cinzel)
npm run dev
npm run build    # tsc -b && vite build — zero TypeScript errors
```

## Design system — `src/cinematic/`

| Module | Purpose |
|---|---|
| `quality.ts` | `useQuality()`: sets the quality tier (high/balanced/low), device pixel ratio, particle density and reduced motion. It reads user Settings and `prefers-reduced-motion`. |
| `MotionRoot.tsx` | Applies the motion preference to Framer Motion and to CSS. |
| `Ambient.tsx` / `CinematicBackground.tsx` | The persistent black-space world: stars, dust, DP constellations, distant geometry, symbols, shooting particles and a camera rig. The WebGL part is lazy-loaded. |
| `three/Scene3D.tsx` | Canvas wrapper. It mounts only near the viewport, pauses when off-screen, has an error boundary, and falls back when WebGL is missing. |
| `three/*` | `ParticleField`, `DPStateNode`, `EnergyBeam`, `OrbitSystem`, `OptimizationCore`, `FloatingModule`, `FresnelShell`, `HoloLabel`, `Constellation`, `CameraRig`. |
| `ui/*` | `NeonFrame` (full-perimeter light), `TiltCard`, `Glass3DCard`, `CinematicButton`, `SectionReveal`, `SpatialPanel`, `HolographicLabel`, `DemoBadge`, `OrbitalLoader`. |
| `scenes/DPConceptScene.tsx` | DP visual language: state · transition · constraint · pruning · optimality · reconstruction · overlap · memo · grid. |
| `exampleProblem.ts` | The Studio default pipeline, used only for visuals labelled EXAMPLE. It computes the 108 → 79 → 1 collapse and the 18 min / $0.93 optimum. |
| `dpStateSpace.ts` | A client-side trace of the backend DP loop, used for the 3D state space. Its counters match the backend exactly (163 / 187 / 24 / 141 on the default pipeline). |
| `benchmark.ts` | Brute force vs DP, measured in the browser. |
| `workspaceData.ts` | Read-only helpers for the user's saved pipelines and history. |

## Page-by-page changes

- **Landing** (`pages/public/LandingPage.tsx`):
  - Opening sequence that can be skipped, plays once per session and is off under reduced motion.
  - Extruded OPTI / FLOW title and a hoverable Optimization Core.
  - Five 3D engine modules.
  - A collapse section driven by scrolling: 108 paths → time pruning → cost pruning → objective → 1 optimal.
  - A DP-concepts theatre and a spatial control-bar nav.
- **Login / Register**: 3D authentication chamber in which each field is a state (S0…). Typing sends particle bursts, a failure pulses red, and a success flies the camera through the core. Register shows per-field validation.
- **Dashboard shell**:
  - Sidebar console: 190px, or 64px collapsed; a drawer on mobile; full-perimeter glow on the active item.
  - Topbar: Ctrl-K route search and a live `/health` engine status.
- **Command Center** (`/dashboard`): a 3D core showing the latest run's real reconstruction, with every metric computed from the user's data.
- **Profile / Settings**: these were empty files and now work. Profile has a 3D ID card and `/auth/me` sync. Settings has quality, motion and ambient controls, JSON export, and clearing of data with a confirmation step.
- **DP Notes**:
  - A 3D concept view that follows the section you scroll to.
  - The hero auto-tours the concepts.
  - Removed the 90 ms re-render timer.
- **DP Academy**:
  - Progress is shown as a chain of DP states.
  - Completion is persisted, with no seeded progress.
  - Continue Learning is a large 3D CTA.
- **DP Problems**: solved progress is persisted, and the invented "acceptance %" stat was removed.
- **DP Playground**:
  - Phase pipeline: INPUT → STATE GENERATION → TRANSITIONS → DP TABLE → ANSWER.
  - Prev/Next/scrub stepping, an array problem (House Robber), a real memoization trace with calls and cache hits, and 3D nodes.
- **DP Visualizer**: orbitable 3D `DP[i][time][cost]` space with constraint walls, pruned states that dissolve, a glowing optimal path, and click-to-inspect with the predecessor chain. It can show the example or any saved pipeline.
- **Studio**:
  - Cinematic landing that previews your pipeline.
  - 3D pipeline builder with dependency beams, reordering, an add animation and a dissolve on delete.
  - 3D constraint field with gauges.
  - DP Engine state-space cube with the backend counters.
  - Simulation where the camera follows execution.
  - Results with reconstruction flow and a "why this solution?" section built from the actual decisions.
  - History records now also store `stageResults` and `reconstruction` (optional fields, so older records still work).
- **Benchmark Lab**: this page was a copy of Algorithm Lab. It is now a real brute-force vs DP benchmark with a 3D log-scale graph and a check that both methods reach the same optimum.
- **Global**: readability pass (minimum text is about 11–12px, low-contrast greys raised), navy backgrounds replaced with black, self-hosted fonts, optimized WebP logo and emblem, and a 404 "PRUNED" page.

## Performance and accessibility

- three.js lives in its own lazy `three-vendor` chunk, and the main bundle is about 133 kB (42 kB gzip).
- Particles use single-draw-call shaders or instancing. Geometries and materials are disposed of, and canvases pause when off-screen or when the tab is hidden.
- The mobile tier lowers DPR and particle counts and simplifies layouts.
- Keyboard focus rings are visible everywhere, and the 3D scenes have ARIA labels.
- `prefers-reduced-motion` and the Settings override skip the intro, freeze the cameras and stop the CSS animations.
