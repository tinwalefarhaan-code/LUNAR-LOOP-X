# LUNAR LOOP X

**Lunar Mission Intelligence & Learning Simulator**  
*Think like a mission commander. Learn like a space scientist.*

An educational, browser-based lunar outpost simulator for students and young space enthusiasts. The seven-day mission makes configured resource dependencies and student-selected trade-offs visible. It labels its assumptions and does not present simulated values as NASA measurements or operational guidance.

## Current build

The application now includes a full-screen, world-first lunar environment, five deterministic mission scenarios, a transparent scoring and debrief system, and a ten-level student learning path. Students can explore freely or follow guided lessons, inspect procedural craters and facilities, move a visual rover, use a space glossary, and run isolated one-hour experiments based on the existing resource model. Learning progress and completed mission attempts are saved locally. The 3D environment includes selectable habitat, solar field, rover, greenhouse, supply storage, energy storage, water recovery, communications, research laboratory, astronaut, and procedural crater landmarks. All resource values, terrain features, and experiment inputs are educational assumptions, not NASA telemetry or operational specifications.

## Run locally

Requires Node.js and npm. Run these commands in PowerShell:

```powershell
Set-Location 'C:\Users\Lenovo\Documents\Codex\2026-11-14\files-pasted-by-the-user-master\outputs\LUNAR-LOOP-X'
npm install
npm run dev
```

Vite prints the local URL, usually `http://localhost:5173`. Create a production bundle with `npm run build`, run the static check with `npm run lint`, and run the simulation tests with `npm test`.

## Architecture

The project is organized around clear boundaries so the interface, 3D scene, and educational simulation can evolve independently. The Phase 3 scene uses generated geometry and does not download large environment assets.

```text
src/
  app/          Application composition and screen flow
  components/   Navigation, tabs, learning path, experiments, mission panels
  data/         Static mission and structure descriptions
  learning/     Levels, learner progress, achievements, experiment model
  scenes/       Three.js / React Three Fiber lunar environment
  simulation/   Configuration, resource/dependency/event/decision engines, advisor, selectors, and browser persistence
  styles/       Shared visual tokens
  App.jsx       React application entry component
```

`app/MissionControlApp.jsx` owns page composition and connects reusable panels to `simulation/useMissionSimulation.js`. Pure model transitions live in `simulation/missionEngine.js`; equations and numerical assumptions are in `simulation/config.js`. The model and dependency graph are explained in `docs/SIMULATION_ASSUMPTIONS.md` and covered by Node’s built-in test runner.

## Minimum first-version plan

1. **Phase 1 — Project setup and architecture:** done.
2. **Phase 2 — Main application layout:** done.
3. **Phase 3 — 3D lunar environment:** done; procedural terrain, selectable outpost structures, camera controls, and a non-3D fallback.
4. **Phase 4 — Mission dependency intelligence engine:** done; transparent resource balances, dependencies, controlled events, decisions, clock, advisor, and local state persistence.
5. **Phase 5 — Space Explorer learning universe:** ten progressive levels, local learning progress, Explorer and Mission modes, glossary, interactive experiments, crater exploration, and achievements.
6. **Further work:** add verified science references, deeper rover and crew activities, and more browser/device usability testing.

The simulator remains intentionally small and deterministic: a seven-day mission model, five transparent scenarios, local same-scenario attempt comparison, and classroom learning activities.

## Scientific integrity

This project is an educational model, not NASA software. Scene geometry, configured values, and calculated outputs are illustrative. There are no NASA API connections, flight specifications, measured lunar terrain, or operational recommendations. Assumptions, equations, thresholds, dependencies, learning unlocks, and limitations are documented in `docs/SIMULATION_ASSUMPTIONS.md` and `docs/LEARNING_SYSTEM.md`.

## Technology

- React and Vite (JavaScript)
- Three.js, React Three Fiber, and Drei
- Recharts and Lucide React
- CSS and browser LocalStorage

The current dependency versions are recorded in `package-lock.json` for reproducible installs.
