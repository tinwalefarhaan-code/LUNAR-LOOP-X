# LUNAR LOOP X — Simulation assumptions

## Scientific status and interpretation

This is a deterministic educational systems model, not NASA software, an operational mission predictor, or validated engineering guidance.

- **NASA-supported scientific facts:** This Phase 4 model introduces no NASA-derived numeric facts, flight specifications, terrain measurements, or telemetry. The dependency concepts are educational system relationships; this document does not attribute the configured values to NASA.
- **Simplified educational assumptions:** Every numeric initial value, capacity, threshold, rate, light factor, load, event duration, and decision modifier is a project assumption in [`src/simulation/config.js`](../src/simulation/config.js). Event labels and explanations are in [`src/simulation/eventEngine.js`](../src/simulation/eventEngine.js).
- **Simulation-generated values:** Hourly resource balances, service-allocation fractions, warning states, event deltas, and advisor messages are calculated by the model from the configuration and student actions. They are not measurements.

The assumptions are intentionally small and inspectable. Changing them changes the outcome; none is calibrated against a lunar habitat or crew dataset.

## Mission clock and crew

- Mission duration: 7 educational days × 24 hours/day = 168 discrete one-hour steps.
- Crew size: 4 (fixed educational configuration).
- Starting elapsed time: 0 hours; the display reads Day 01 · 00:00.
- Time advances only after a student explicitly chooses **Advance 1 hour**, **Advance 1 day**, or applies an event decision. Applying a decision calculates its first affected hour and advances the clock by one hour. There is no background timer.
- Events are injected by the student once their configured earliest hour is reached. No event is chosen randomly.
- Repeating the same starting state, event sequence, decisions, and clock steps produces the same results.

## State variables, units, initial values, limits, and thresholds

Threshold status uses this rule: **Critical** at or below the configured critical threshold; **Monitor** above critical and at or below the monitor threshold; otherwise **Nominal**. Inventories and indexes are clamped to the inclusive range from zero to their configured capacity.

| System | State and unit | Initial | Capacity / maximum | Monitor at or below | Critical at or below |
| --- | --- | ---: | ---: | ---: | ---: |
| Electrical power | Stored energy, kWh | 92 | 160 kWh | 50 kWh | 18 kWh |
| Oxygen | Inventory, kg | 34 | 36 kg | 11 kg | 4 kg |
| Water | Inventory, L | 700 | 800 L | 220 L | 80 L |
| Food | Edible-food inventory, kg | 82 | 100 kg | 30 kg | 12 kg |
| Habitat condition | Condition index, points | 96 | 100 points | 78 points | 45 points |
| Radiation protection | Fixed shielding index, points | 72 | 100 points | 65 points | 45 points |

Radiation protection is a **fixed context index**, not a consumable inventory. This model does not calculate radiation flux, dose, exposure, or shielding performance. It does not degrade over time.

## Hourly equations and configured rates

All production and consumption rates below are educational assumptions in `config.js`. Each model step represents one simulated hour.

### Electrical energy

`solar generation (kWh) = 5.4 kWh/hour × hourly sunlight factor × array-performance factor`

Requested service loads, in kWh for one simulated hour, are served in this configured order:

1. Life support: 0.72 kWh
2. Habitat controls: 0.50 kWh
3. Water recovery: 0.72 kWh
4. Greenhouse: 0.66 kWh
5. Nonessential equipment: 0.50 kWh
6. Added event demand, when present

Each demand can be reduced by a student decision. A service allocation fraction is the supplied portion of its requested load, multiplied by the selected operating-load factor. If available energy is insufficient, higher-priority loads are allocated first.

`available energy = current stored energy + solar generation`

`energy used = sum of service allocations`

`next stored energy = clamp(current stored energy + solar generation − energy used, 0, 160 kWh)`

Energy above the configured storage capacity is curtailed by the upper clamp. A zero or invalid input is handled without creating a negative or non-finite inventory.

The hourly light curve is a repeatable 24-value project profile in `config.js`, not a measured South Pole illumination record. Student-injected illumination and array events multiply the corresponding factor.

### Oxygen and life support

`oxygen consumed = 0.006 kg/(crew member·hour) × 4 crew`

`oxygen produced = 0.0055 kg/(crew member·hour) × 4 crew × life-support availability fraction`

`next oxygen = clamp(current oxygen + oxygen produced − oxygen consumed, 0, 36 kg)`

Crew use continues at the configured rate when life support is unpowered. Modeled production scales to zero if the life-support load receives no power. The values do not represent an actual crew metabolic specification or a flight life-support system.

### Water and recycling

`crew water used = 0.25 L/(crew member·hour) × 4 crew × selected use factor`

`water recovered = crew water used × 0.8 recovery fraction × water-recovery availability`

`greenhouse water used = 0.45 L/hour × selected irrigation factor × greenhouse operation fraction × water availability factor`

`next water = clamp(current water + water recovered − crew water used − greenhouse water used, 0, 800 L)`

Recovery is reduced by both the supplied electrical fraction and event availability. The model assumes recovery returns a configured fraction of crew water use; it does not simulate waste streams, losses by process, or water chemistry.

### Food and greenhouse

`food consumed = 0.05 kg/(crew member·hour) × 4 crew`

`food produced = 0.12 kg/hour × greenhouse production availability × greenhouse water availability`

`next food = clamp(current food + food produced − food consumed, 0, 100 kg)`

Water availability scales linearly from zero to full at the configured 30 L minimum greenhouse reserve. Greenhouse production also scales with supplied greenhouse power, the chosen electrical load factor, and active event effects. These values do not model crop species, growth stages, yields, nutrition, or real greenhouse performance.

### Habitat condition

`condition loss = 0.12 index points/hour × (1 − habitat-controls availability)`

`next habitat condition = clamp(current condition − condition loss, 0, 100 points)`

The index stays constant when controls are fully supplied. It is a pedagogical state indicator, not measured pressure, temperature, structural integrity, or crew safety.

### Radiation protection

`next protection index = current protection index`

No radiation event, dose model, shielding change, or crew exposure calculation is implemented. This keeps protection distinct from consumable inventories.

## Explicit dependency graph

The graph is configured in `SIMULATION_CONFIG.dependencies`; its effects use the corresponding configured rates and service allocations above.

| From → to | Configured effect | Reason and limit |
| --- | --- | --- |
| Sunlight → solar generation | Sunlight and array-performance factors multiply rated generation. | The array model needs a positive configured light and availability factor; the profile is illustrative. |
| Electrical power → life-support processing → oxygen production | The service allocation fraction scales oxygen production. | Oxygen processing is represented as powered equipment; crew use continues regardless. |
| Electrical power → water recovery → recovered water | The service allocation and event-availability factors scale recovery. | The recovery loop is simplified as powered equipment. |
| Electrical power → habitat controls → habitat condition | An unpowered fraction applies the configured condition-index loss. | This is an educational relationship, not a habitat engineering failure model. |
| Electrical power → greenhouse equipment → food production and irrigation | Greenhouse operation scales production and water use. | Equipment loads are a simplified representation of greenhouse operations. |
| Water inventory → greenhouse operation | Water availability scales linearly to full at the configured minimum reserve. | Water is an explicit modeled input; no crop or plant response is inferred. |
| Food inventory → crew food availability indicator | The display uses the bounded inventory/capacity ratio. | It reports inventory only; no health, nutrition, or performance result is inferred. |
| Habitat condition → crew environment indicator | The display uses the bounded condition-index/maximum ratio. | It reports a model index only; it does not predict crew health or safety. |

The learning course can move the rover's visual model by a small scene offset. The mission simulator has no rover mobility, power, distance, or range calculation. The facility inspection explicitly says **Mobility not simulated**.

## Controlled events and decisions

An event becomes selectable at its configured earliest elapsed hour. It is triggered only by the student, at most once per run. A triggered event waits for a student decision; the choice applies its configured effect, advances one hour, and displays actual before/after resource values. The remaining configured event duration continues on later manual steps.

| Event | Earliest hour | Active hours | Configured event effect |
| --- | ---: | ---: | --- |
| A · Reduced local illumination | 24 | 12 | Multiply sunlight factor by 0.30. |
| B · Solar array interruption | 48 | 8 | Multiply array performance by 0.18. |
| C · Water-recovery interruption | 72 | 18 | Multiply water-recovery availability by 0. |
| D · Greenhouse production interruption | 96 | 24 | Multiply greenhouse production by 0. |
| E · Increased mission power demand | 120 | 12 | Add 1.2 kWh to each affected hour’s lowest-priority demand. |

Decision modifiers are stored with the event configuration in `config.js`. Power decisions multiply the named load request; water decisions multiply crew-use or irrigation factors; production decisions multiply greenhouse output. Multiple factors combine by multiplication. The model reports each choice’s reason and trade-off alongside its calculated resource deltas; its text is a configured explanation, not a guaranteed outcome claim.

Displayed severity labels are scenario labels for instruction, not empirically assessed hazard levels. Trigger hours, durations, multipliers, rates, and options are all adjustable educational assumptions.

## Mission outcomes and advisor

- A run **fails** if oxygen, water, or food reaches zero, or if the habitat condition index reaches zero. Power depletion alone reduces powered services according to the allocation order; the model can then reduce other inventories or habitat condition. Radiation protection is not an automatic failure trigger because exposure is not modeled.
- A run **completes** after 168 hours if no failure rule has occurred.
- Threshold warnings do not automatically fail a mission.
- The advisor applies transparent rules to current inventory thresholds and the most recent calculated service pathways. It reports configured causes and possible priorities, with an explicit assumption disclaimer. It is not an AI service, does not use an external API, and does not optimize or guarantee a successful mission.

## Scenario definitions and objectives

Five explicit scenario configurations are in `src/simulation/scenarios.js`: seven-day survival, darkness challenge, water-recovery crisis, greenhouse versus life support, and resource emergency. Each defines starting resources, environmental multipliers, event allowlist and availability windows, power-load overrides, constraints, completion criteria, failure criteria, and measurable objectives. The scenario selector exposes these values as mission profiles. All five currently use the same 168-hour window and the existing standard failure rules; scenario reserve and pathway objectives can fail independently of mission termination.

Objective progress comes from the actual hourly resource and service-pathway history, elapsed simulated time, and recorded student decisions. A resource minimum objective fails if any recorded value is at or below its configured scenario threshold. A pathway objective fails if any recorded value falls below its scenario threshold. A decision-count objective counts distinct recorded decisions for its listed event IDs. A duration objective completes only when the configured mission window ends successfully.

## Deterministic project scoring

Terminal runs receive a project score from 0 to 100. Each category is rounded to the nearest whole point before categories are added:

| Category | Maximum | Formula |
| --- | ---: | --- |
| Resource management | 25 | Mean final energy, oxygen, water, and food inventory as a fraction of configured capacity, multiplied by 25. |
| Essential system protection | 25 | Share of resource-hour observations above the configured critical threshold for energy, oxygen, water, food, and habitat condition, multiplied by 25. |
| Decision quality | 20 | Share of distinct event decisions whose actual calculated one-hour `after` snapshot leaves all five essential resources above critical thresholds, multiplied by 20. Each event contributes at most once. |
| Objective completion | 20 | Completed scenario objectives divided by the scenario objective count, multiplied by 20. |
| Mission duration | 10 | Elapsed hours divided by the configured mission duration, multiplied by 10. |

A failed run still receives a transparent partial score from its recorded state. Decisions are evaluated against actual calculated one-hour consequences, not the configured trade-off text or a projected result. The model does not assign extra points to any event choice, and an event cannot earn duplicate decision-quality credit. This score is a reproducible educational project metric, not NASA scoring, crew-safety evaluation, or operational mission readiness.

## Debrief, local history, and comparison

When a run completes or fails, its completion experience shows the run outcome, objective states, final score, and starting-to-ending resource levels. The debrief reads hourly history and recorded decision outcomes to show resource minima, configured critical-threshold observations, actual one-hour deltas, recorded causal chains, and each selected choice's configured trade-off and lesson. It does not create events that were not triggered or infer unrecorded effects.

At most 20 completed or failed run snapshots are retained in browser local storage under `lunar-loop-x-runs-v1`. Each snapshot is schema-validated and its deterministic score is recomputed before it is displayed. Comparison is limited to attempts of the same scenario and uses the stored state for score, outcome, resource levels, decision record, objectives, and mission duration. Replaying starts a fresh run from that scenario's configured initial state; it does not replay or claim to reproduce an archived user's step sequence. Local records can be cleared with browser site data and are not lunar mission records.

## Student learning and experiment inputs

The ten lesson activities and their sequential unlock requirements are in `src/learning/levelData.js` and `src/learning/learningProgress.js`. A wrong quiz response shows an explanation and can be tried again. XP and stars are calculated from the first completed activity and the highest correct result saved for its three questions. Achievements use saved interactions such as inspections, experiments, rover moves, selected event responses, and successfully completed runs.

Experiment Lab calls the same `getHourlyConditions` and `stepResources` functions as the mission engine, but it calculates a separate baseline and modified model hour. Sunlight, additional load, stored-energy starting value, nonessential-load pause, and greenhouse inclusion are illustrative inputs. The resulting comparison never mutates the current mission. Visual rover movement is an educational scene interaction only; the experiment does not model rover propulsion, route length, or battery use.

## Persistence, replay, and limitations

The current mission state is saved in browser local storage under a versioned key. A malformed or different-schema state is rejected and removed; an unavailable storage API falls back to in-memory state. Reset restores the selected scenario's configured initial state. Hourly history and event decisions are retained in terminal run snapshots for debrief and same-scenario comparison.

This is a small deterministic teaching model. It omits orbital mechanics, real lunar lighting and terrain data, thermal balance, pressure dynamics, crew physiology, plant biology, radiation dose, maintenance procedures, failures beyond the five authored scenarios, uncertainty propagation, and calibrated engineering performance. Do not use its outputs for design or operational decisions.
