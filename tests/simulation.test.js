import assert from 'node:assert/strict'
import test from 'node:test'
import { SIMULATION_CONFIG, TOTAL_MISSION_HOURS } from '../src/simulation/config.js'
import { evaluateDependencies, getHourlyConditions } from '../src/simulation/dependencyEngine.js'
import { getMissionEvents, MISSION_EVENTS } from '../src/simulation/eventEngine.js'
import {
  advanceMissionDay,
  advanceMissionHours,
  createInitialMissionState,
  getMissionClock,
  injectMissionEvent,
  pauseMission,
  resetMission,
  resolveMissionEvent,
  startMission,
  validateMissionState,
} from '../src/simulation/missionEngine.js'
import { stepResources } from '../src/simulation/resourceEngine.js'
import { getMissionObjectives } from '../src/simulation/objectiveEngine.js'
import { scoreMission } from '../src/simulation/scoringEngine.js'
import { MISSION_SCENARIOS } from '../src/simulation/scenarios.js'
import {
  archiveMissionRun,
  loadMissionRuns,
  loadMissionState,
  MISSION_RUNS_STORAGE_KEY,
  MISSION_STORAGE_KEY,
  saveMissionState,
} from '../src/simulation/storage.js'

function activeMissionAt(hours) {
  return advanceMissionHours(startMission(createInitialMissionState()), hours)
}

test('configuration defines explicit units, starting values, and bounded educational systems', () => {
  assert.equal(SIMULATION_CONFIG.mission.durationDays, 7)
  assert.equal(TOTAL_MISSION_HOURS, 168)
  assert.equal(SIMULATION_CONFIG.resources.power.unit, 'kWh')
  assert.equal(SIMULATION_CONFIG.resources.water.unit, 'L')
  assert.equal(SIMULATION_CONFIG.resources.radiation.initial, 72)
  assert.equal(SIMULATION_CONFIG.resources.radiation.stateKey, 'radiationProtection')
  assert.ok(SIMULATION_CONFIG.dependencies.length >= 8)
  assert.equal(MISSION_EVENTS.length, 5)
})

test('five scenario definitions include explicit, valid launch and outcome criteria', () => {
  assert.equal(MISSION_SCENARIOS.length, 5)
  assert.equal(new Set(MISSION_SCENARIOS.map((scenario) => scenario.id)).size, 5)
  for (const scenario of MISSION_SCENARIOS) {
    assert.ok(scenario.name && scenario.cinematicIntroduction && scenario.briefing)
    assert.ok(scenario.initialConditions && scenario.completionCriteria)
    assert.ok(scenario.failureCriteria.length > 0 && scenario.constraints.length > 0)
    assert.ok(scenario.educationalExplanation && scenario.objectives.length > 0)
    assert.ok(scenario.availableEventIds.length > 0)
    const state = createInitialMissionState(scenario.id)
    assert.deepEqual(state.resources, scenario.startingResources)
    assert.equal(state.scenarioId, scenario.id)
  }
  assert.ok(getHourlyConditions(createInitialMissionState('darkness-challenge')).sunlightFactor
    < getHourlyConditions(createInitialMissionState('seven-day-survival')).sunlightFactor)
  assert.ok(getMissionEvents(createInitialMissionState('water-recovery-crisis'))
    .every((event) => ['water-recycling-fault', 'greenhouse-interruption', 'reduced-sunlight'].includes(event.id)))
})

test('one resource step follows configured balances and keeps values finite and in bounds', () => {
  const initial = createInitialMissionState()
  const conditions = getHourlyConditions(initial)
  const result = stepResources(initial.resources, conditions)
  const { rates, mission, resources } = SIMULATION_CONFIG

  assert.equal(
    result.resources.oxygenKg,
    initial.resources.oxygenKg
      + rates.oxygen.producedKgPerCrewHourWhenPowered * mission.crewSize
      - rates.oxygen.consumedKgPerCrewHour * mission.crewSize,
  )
  assert.equal(result.resources.radiationProtection, initial.resources.radiationProtection)
  Object.values(resources).forEach((resource) => {
    const value = result.resources[resource.stateKey]
    assert.ok(Number.isFinite(value))
    assert.ok(value >= 0 && value <= resource.capacity)
  })
})

test('power loss propagates to life support, water recovery, and greenhouse equipment', () => {
  const initial = createInitialMissionState()
  const noPower = {
    sunlightFactor: 0,
    arrayPerformanceFactor: 1,
    waterRecoveryFactor: 1,
    greenhouseProductionFactor: 1,
    powerLoadFactors: Object.fromEntries(
      Object.keys(SIMULATION_CONFIG.rates.powerLoadsKwhPerHour).map((key) => [key, 1]),
    ),
    crewWaterUseFactor: 1,
    greenhouseWaterUseFactor: 1,
    extraPowerKwhPerHour: 0,
  }
  const result = stepResources({ ...initial.resources, energyKwh: 0 }, noPower)

  assert.equal(result.systems.pathways.lifeSupportAvailability, 0)
  assert.equal(result.systems.pathways.waterRecoveryAvailability, 0)
  assert.equal(result.systems.pathways.greenhousePowerAvailability, 0)
  assert.equal(result.systems.oxygenProducedKg, 0)
  assert.equal(result.systems.waterRecoveredL, 0)
  assert.equal(result.systems.foodProducedKg, 0)
})

test('water inventory limits greenhouse operation through the configured dependency', () => {
  const initial = createInitialMissionState()
  const conditions = getHourlyConditions(initial)
  const dryState = { ...initial.resources, waterL: 0 }
  const dependencies = evaluateDependencies(dryState, conditions, {
    lifeSupport: 1,
    waterRecovery: 1,
    habitatControls: 1,
    greenhouse: 1,
  })
  const result = stepResources(dryState, conditions)

  assert.equal(dependencies.pathways.greenhouseWaterAvailability, 0)
  assert.equal(result.systems.foodProducedKg, 0)
})

test('configured dependency edges gate their modeled effects', () => {
  const initial = createInitialMissionState()
  const config = structuredClone(SIMULATION_CONFIG)
  config.dependencies = config.dependencies.filter((edge) => edge.id !== 'sunlight-to-solar-power')
  const result = stepResources(initial.resources, getHourlyConditions(initial), config)

  assert.equal(result.systems.solarGenerationPotentialKwh, 0)
  assert.equal(result.systems.pathways.solarGenerationFactor, 0)
})

test('mission clock progresses only on explicit steps and is deterministic', () => {
  const firstRun = advanceMissionDay(startMission(createInitialMissionState()))
  const secondRun = advanceMissionHours(startMission(createInitialMissionState()), 24)

  assert.equal(firstRun.elapsedHours, 24)
  assert.equal(getMissionClock(firstRun).day, 2)
  assert.deepEqual(firstRun.resources, secondRun.resources)
  assert.equal(pauseMission(firstRun).status, 'paused')
  assert.equal(advanceMissionHours(pauseMission(firstRun), 1).elapsedHours, 24)
})

test('events are gated by mission time and a choice calculates actual one-hour consequences', () => {
  const tooEarly = startMission(createInitialMissionState())
  assert.equal(injectMissionEvent(tooEarly, 'reduced-sunlight'), tooEarly)

  const atDayTwo = activeMissionAt(24)
  const pendingProtect = injectMissionEvent(atDayTwo, 'reduced-sunlight')
  assert.equal(pendingProtect.pendingEventId, 'reduced-sunlight')
  assert.equal(advanceMissionHours(pendingProtect, 1).elapsedHours, 24)
  const protectedRun = resolveMissionEvent(pendingProtect, 'reduced-sunlight', 'protect-core-services')

  const pendingGreenhouse = injectMissionEvent(activeMissionAt(24), 'reduced-sunlight')
  const greenhouseRun = resolveMissionEvent(pendingGreenhouse, 'reduced-sunlight', 'maintain-greenhouse')

  assert.equal(protectedRun.elapsedHours, 25)
  assert.equal(protectedRun.decisionHistory.length, 1)
  assert.equal(protectedRun.latestOutcome.consequencesAtHour, 25)
  assert.ok(protectedRun.latestOutcome.after.energyKwh !== protectedRun.latestOutcome.before.energyKwh)
  assert.ok(protectedRun.latestOutcome.after.foodKg < greenhouseRun.latestOutcome.after.foodKg)
  assert.equal(protectedRun.activeEvents[0].remainingHours, 11)
})

test('all five controlled events activate at their configured window and affect their linked system', () => {
  for (const event of MISSION_EVENTS) {
    const beforeEvent = activeMissionAt(event.availableAfterHours)
    const listedEvent = getMissionEvents(beforeEvent).find((item) => item.id === event.id)
    assert.equal(listedEvent.canTrigger, true, `${event.id} should become available at its configured hour`)

    const pending = injectMissionEvent(beforeEvent, event.id)
    const decision = resolveMissionEvent(pending, event.id, event.decisions[0].id)
    assert.equal(decision.elapsedHours, beforeEvent.elapsedHours + 1, `${event.id} decision applies one hourly step`)
    assert.equal(decision.latestOutcome.eventId, event.id)

    if (event.id === 'reduced-sunlight') assert.ok(decision.systems.sunlightFactor < beforeEvent.systems.sunlightFactor)
    if (event.id === 'array-interruption') assert.equal(decision.systems.arrayPerformanceFactor, 0.18)
    if (event.id === 'water-recycling-fault') assert.equal(decision.systems.waterRecoveredL, 0)
    if (event.id === 'greenhouse-interruption') assert.equal(decision.systems.foodProducedKg, 0)
    if (event.id === 'increased-power-demand') assert.ok(decision.systems.powerDemandKwh > beforeEvent.systems.powerDemandKwh)
  }
})

test('mission reaches exactly seven days, completes, and resets to its baseline', () => {
  let state = startMission(createInitialMissionState())
  for (let day = 0; day < SIMULATION_CONFIG.mission.durationDays; day += 1) {
    state = advanceMissionDay(state)
  }

  assert.equal(state.elapsedHours, TOTAL_MISSION_HOURS)
  assert.equal(state.status, 'complete')
  assert.equal(state.hourlyHistory.length, TOTAL_MISSION_HOURS + 1)
  assert.equal(resetMission().elapsedHours, 0)
  assert.equal(resetMission().resources.energyKwh, SIMULATION_CONFIG.resources.power.initial)
})

test('scenario objectives update from the actual simulated timeline', () => {
  const initial = createInitialMissionState('darkness-challenge')
  assert.ok(getMissionObjectives(initial).every((objective) => objective.status === 'not-started'))
  const running = advanceMissionHours(startMission(initial), 1)
  const objectives = getMissionObjectives(running)
  assert.ok(objectives.every((objective) => objective.status === 'in-progress' || objective.status === 'failed'))
  assert.equal(objectives.find((objective) => objective.id === 'duration').progress, 1)
})

test('project score is deterministic, bounded by category maxima, and reports a single event decision once', () => {
  const baseline = createInitialMissionState()
  const initialScore = scoreMission(baseline)
  assert.deepEqual(scoreMission(baseline), initialScore)
  assert.ok(initialScore.total >= 0 && initialScore.total <= initialScore.maximum)
  assert.equal(Object.values(initialScore.categories).reduce((sum, category) => sum + category.maximum, 0), 100)

  const pending = injectMissionEvent(activeMissionAt(24), 'reduced-sunlight')
  const decided = resolveMissionEvent(pending, 'reduced-sunlight', 'protect-core-services')
  const decisionScore = scoreMission(decided)
  assert.equal(decisionScore.decisionsCounted, 1)
  assert.equal(scoreMission(decided).total, decisionScore.total)
  assert.equal(decisionScore.categories.essentialSystemProtection.explanation.includes('resource-hour observations'), true)
})

test('exhausted resources fail cleanly and inventories never become negative', () => {
  const state = startMission({
    ...createInitialMissionState(),
    resources: { ...createInitialMissionState().resources, oxygenKg: 0 },
  })
  const next = advanceMissionHours(state, 1)

  assert.equal(next.status, 'failed')
  assert.match(next.failureReason, /oxygen inventory is exhausted/i)
  Object.values(SIMULATION_CONFIG.resources).forEach((resource) => {
    assert.ok(next.resources[resource.stateKey] >= 0)
  })
})

test('invalid numeric inputs are normalized instead of producing invalid model state', () => {
  const result = stepResources(
    { energyKwh: Number.NaN, oxygenKg: -5, waterL: Number.POSITIVE_INFINITY, foodKg: 900, habitatCondition: Number.NaN, radiationProtection: 72 },
    { sunlightFactor: Number.NaN, arrayPerformanceFactor: Number.POSITIVE_INFINITY },
  )

  Object.values(result.resources).forEach((value) => assert.ok(Number.isFinite(value)))
  Object.values(result.resources).forEach((value) => assert.ok(value >= 0))
})

test('browser persistence restores valid state and rejects outdated or malformed data', () => {
  const fakeStorage = {
    value: null,
    getItem() { return this.value },
    setItem(key, value) { this.value = value },
    removeItem(key) { this.removedKey = key; this.value = null },
  }
  const running = advanceMissionHours(startMission(createInitialMissionState()), 3)

  assert.equal(saveMissionState(running, fakeStorage), true)
  assert.deepEqual(loadMissionState(fakeStorage), running)

  fakeStorage.value = JSON.stringify({ schemaVersion: 0, status: 'active' })
  assert.equal(loadMissionState(fakeStorage), null)
  assert.equal(fakeStorage.removedKey, MISSION_STORAGE_KEY)
  assert.equal(validateMissionState({ schemaVersion: 0 }), false)
})

test('terminal run archive is locally saved, deduplicated, recomputed, and schema validated', () => {
  const values = new Map()
  const fakeStorage = {
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, value) },
    removeItem(key) { values.delete(key) },
  }
  const initial = createInitialMissionState()
  const zeroOxygen = {
    ...initial,
    resources: { ...initial.resources, oxygenKg: 0 },
    startingResources: { ...initial.startingResources, oxygenKg: 0 },
    hourlyHistory: [{ ...initial.hourlyHistory[0], resources: { ...initial.hourlyHistory[0].resources, oxygenKg: 0 } }],
  }
  const failed = advanceMissionHours(startMission(zeroOxygen), 1)
  assert.equal(failed.status, 'failed')
  assert.equal(archiveMissionRun(failed, fakeStorage).length, 1)
  assert.equal(archiveMissionRun(failed, fakeStorage).length, 1)
  const archived = loadMissionRuns(fakeStorage)
  assert.equal(archived[0].id, failed.runId)
  assert.equal(archived[0].score.total, scoreMission(failed).total)

  const corrupted = JSON.parse(values.get(MISSION_RUNS_STORAGE_KEY))
  corrupted[0].score.total = 999
  values.set(MISSION_RUNS_STORAGE_KEY, JSON.stringify(corrupted))
  assert.deepEqual(loadMissionRuns(fakeStorage), [])
})
