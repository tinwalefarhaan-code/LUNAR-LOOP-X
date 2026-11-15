# Space Explorer learning system

## Learning path and unlocks

The learning path contains ten lessons in `src/learning/levelData.js`. Each lesson supplies its intro, objective, short explanation, activity, steps, contextual hints, completion condition, outcome explanation, and three knowledge-check questions. A level unlocks when the preceding level is completed. The first level is open at the start.

The app records real interactions from its UI: viewing a facility science note, selecting crater landmarks, inspecting core facilities, running an experiment, moving the displayed rover, making a mission-event decision, and completing an existing mission run. The activity evaluator in `src/learning/learningProgress.js` checks this evidence before enabling lesson completion. Mission 10 requires a completed mission run whose saved progress already contains levels 1–9.

Students may complete a knowledge check after attempting all three questions. A wrong answer displays the explanation, can be retried, and does not take away progress or rewards. The best correct response for each question is retained. A lesson awards 1 activity star and 50 XP, plus one star and 25 XP for each question answered correctly. Rewards are calculated from saved lesson results, so replay does not duplicate XP.

Achievements derive from recorded actions and saved results. They do not unlock from visiting an achievement screen. The rover achievement requires actual scene movement plus a crater inspection; the habitat achievement requires selecting the three named facilities; the mission achievement requires a successfully completed seven-day run.

## Explorer and Mission modes

- **Explorer mode** keeps lessons informal and allows students to inspect the world at their own pace.
- **Mission mode** adds step-by-step instructions and uses the same 3D world, event controls, mission objectives, and debrief.
- The glossary at `learning-glossary` defines the ten space terms listed in the Phase 5 brief using short explanations.
- The 3D facility rail and crater landmark list provide selection controls when pointer picking is difficult. The scene also keeps its keyboard-accessible inspection tabs and camera buttons.

## Experiment Lab

`src/learning/experimentEngine.js` calls the existing `getHourlyConditions` and `stepResources` functions. Each run compares one baseline model hour with a separate one-hour calculation after changing illustrative sunlight, added equipment demand, initial stored energy, nonessential load, and greenhouse operation. The experiment does not update the active mission, archive a mission run, or claim a measured prediction.

The rover buttons move the rover model in the rendered scene and save its offset. They do not calculate route distance, traction, energy use, or safety. Crater shapes and positions are procedural classroom landmarks and are not a lunar survey.

## Saved student progress

Learning mode, unlocked lessons, quiz results, earned stars and XP, science inspections, crater visits, experiment count, rover movement, event actions, and mission completion records are saved locally under `lunar-loop-x-learning-v1`. Records are schema-validated before restore. Clearing browser site data removes this learning profile and the separate mission history. The records stay in the current browser; they are not accounts or real lunar mission records.

## Accessibility and limits

The experience includes direct buttons for scene inspection, keyboard-operable tabs and controls, readable labels, responsive drawer layouts, a text-based activity path, and reduced-motion handling for camera approaches and completion transitions. The WebGL scene remains a visual learning layer; the rest of the course and its facility notes are still available if WebGL cannot start.

This course is educational material, not NASA instruction, mission procedure, a validated design, or a safety assessment. All simulator values and experiment inputs are project assumptions.
