import { getResourceDeltas, stepResources } from './resourceEngine.js'
import { SIMULATION_CONFIG } from './config.js'
import { getHourlyConditions } from './dependencyEngine.js'
import { getMissionEvent, getMissionEvents, isValidEventDuration, tickEventEffects, triggerMissionEvent } from './eventEngine.js'
import { applyMissionDecision } from './decisionEngine.js'
import { getMissionConfig, getMissionScenario, isKnownScenario } from './scenarios.js'

const RESOURCE_KEYS = Object.values(SIMULATION_CONFIG.resources).map(({ stateKey }) => stateKey)
const VALID_STATUSES = new Set(['standby', 'active', 'paused', 'complete', 'failed'])

function copyResources(resources) {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => [key, resources[key]]))
}

let runSequence = 0

function createRunId() {
  runSequence += 1
  return globalThis.crypto?.randomUUID?.()
    ?? `lunar-run-${Date.now().toString(36)}-${runSequence.toString(36)}`
}

export function createInitialMissionState(scenarioId = 'seven-day-survival') {
  const scenario = getMissionScenario(scenarioId)
  const resources = copyResources(scenario.startingResources)

  return {
    schemaVersion: SIMULATION_CONFIG.schemaVersion,
    scenarioId: scenario.id,
    runId: createRunId(),
    status: 'standby',
    elapsedHours: 0,
    crewSize: SIMULATION_CONFIG.mission.crewSize,
    resources,
    startingResources: copyResources(resources),
    systems: null,
    activeEvents: [],
    triggeredEventIds: [],
    pendingEventId: null,
    pendingDecision: null,
    decisionHistory: [],
    latestOutcome: null,
    hourlyHistory: [{ elapsedHours: 0, resources: copyResources(resources), systems: null }],
    failureReason: null,
  }
}

export function normalizeMissionState(value) {
  if (!validateMissionState(value)) return null
  const scenarioId = value.scenarioId ?? 'seven-day-survival'
  const startingResources = value.startingResources ?? value.hourlyHistory[0].resources
  return {
    ...value,
    scenarioId,
    runId: value.runId ?? createRunId(),
    startingResources: copyResources(startingResources),
  }
}

export function startMission(state) {
  if (state.status === 'standby' || state.status === 'paused') {
    return { ...state, status: 'active' }
  }
  return state
}

export function pauseMission(state) {
  return state.status === 'active' ? { ...state, status: 'paused' } : state
}

export function resetMission(scenarioId = 'seven-day-survival') {
  return createInitialMissionState(scenarioId)
}

function findFailure(resources, config = SIMULATION_CONFIG) {
  const depleted = config.failureRules.depletedResources
    .find((key) => resources[key] <= 0)
  if (depleted) {
    const labels = Object.values(config.resources)
    const label = labels.find((resource) => resource.stateKey === depleted)?.label ?? depleted
    return `${label} inventory is exhausted.`
  }
  if (resources.habitatCondition <= config.failureRules.habitatConditionAtOrBelow) {
    return 'The habitat condition index reached zero.'
  }
  return null
}

function makeHistoryEntry(elapsedHours, resources, systems) {
  return { elapsedHours, resources: copyResources(resources), systems }
}

function stepOneHour(state) {
  const config = getMissionConfig(state.scenarioId)
  const durationHours = config.mission.durationDays * config.mission.hoursPerDay
  const conditions = getHourlyConditions(state, config)
  const result = stepResources(state.resources, conditions, config)
  const elapsedHours = Math.min(durationHours, state.elapsedHours + 1)
  const failureReason = findFailure(result.resources, config)
  const status = failureReason
    ? 'failed'
    : elapsedHours >= durationHours
      ? 'complete'
      : 'active'

  return {
    ...state,
    status,
    elapsedHours,
    resources: result.resources,
    systems: result.systems,
    activeEvents: tickEventEffects(state.activeEvents),
    hourlyHistory: [
      ...state.hourlyHistory,
      makeHistoryEntry(elapsedHours, result.resources, result.systems),
    ],
    failureReason,
  }
}

export function advanceMissionHours(state, hours = 1) {
  if (state.status !== 'active' || state.pendingEventId || !Number.isInteger(hours) || hours < 1) {
    return state
  }

  let next = state
  const config = getMissionConfig(state.scenarioId)
  const totalHours = config.mission.durationDays * config.mission.hoursPerDay
  const hoursToRun = Math.min(hours, totalHours - state.elapsedHours)

  for (let index = 0; index < hoursToRun && next.status === 'active'; index += 1) {
    next = stepOneHour(next)
  }

  return next
}

export function advanceMissionDay(state) {
  return advanceMissionHours(state, getMissionConfig(state.scenarioId).mission.hoursPerDay)
}

export function injectMissionEvent(state, eventId) {
  return triggerMissionEvent(state, eventId)
}

export function resolveMissionEvent(state, eventId, choiceId) {
  const event = getMissionEvent(eventId)
  const choice = event?.decisions.find((item) => item.id === choiceId)
  const prepared = applyMissionDecision(state, eventId, choiceId)

  if (prepared === state || !event || !choice) return state

  const advanced = advanceMissionHours(prepared, 1)
  const outcome = {
    eventId,
    eventTitle: event.title,
    severity: event.severity,
    choiceId,
    choiceLabel: choice.label,
    reason: choice.reason,
    tradeoff: choice.tradeoff,
    explanation: event.explanation,
    lesson: event.lesson,
    affectedSystems: event.affectedSystems,
    causalChain: event.causalChain,
    appliedAtHour: state.elapsedHours,
    consequencesAtHour: advanced.elapsedHours,
    before: copyResources(state.resources),
    after: copyResources(advanced.resources),
    deltas: getResourceDeltas(state.resources, advanced.resources),
    assumptionLabel: 'Calculated using the configured educational model; not NASA telemetry.',
  }

  return {
    ...advanced,
    pendingDecision: null,
    decisionHistory: [...state.decisionHistory, outcome],
    latestOutcome: outcome,
  }
}

export function getMissionClock(state) {
  const { hoursPerDay, durationDays } = getMissionConfig(state.scenarioId).mission
  const totalHours = hoursPerDay * durationDays
  if (state.elapsedHours >= totalHours) {
    return {
      day: durationDays,
      hour: hoursPerDay,
      display: `Day ${String(durationDays).padStart(2, '0')} · ${String(hoursPerDay).padStart(2, '0')}:00`,
    }
  }
  const day = Math.floor(state.elapsedHours / hoursPerDay) + 1
  const hour = state.elapsedHours % hoursPerDay
  return {
    day,
    hour,
    display: `Day ${String(day).padStart(2, '0')} · ${String(hour).padStart(2, '0')}:00`,
  }
}

function validResourceSnapshot(resources) {
  if (!resources || typeof resources !== 'object' || Array.isArray(resources)) return false
  return Object.values(SIMULATION_CONFIG.resources).every((resource) => {
    const current = resources[resource.stateKey]
    return Number.isFinite(current) && current >= 0 && current <= resource.capacity
  })
}

function validSystemSnapshot(systems) {
  if (systems === null) return true
  if (!systems || typeof systems !== 'object' || Array.isArray(systems)) return false
  const requiredNumbers = [
    'sunlightFactor',
    'arrayPerformanceFactor',
    'solarGenerationPotentialKwh',
    'powerDemandKwh',
    'powerUsedKwh',
    'oxygenProducedKg',
    'oxygenConsumedKg',
    'waterRecoveredL',
    'crewWaterUsedL',
    'greenhouseWaterUsedL',
    'foodProducedKg',
    'foodConsumedKg',
    'habitatConditionLoss',
  ]
  if (!requiredNumbers.every((key) => Number.isFinite(systems[key]) && systems[key] >= 0)) return false
  if (!systems.pathways || !Object.values(systems.pathways).every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) return false
  if (!systems.powerAllocations || !Object.values(systems.powerAllocations).every((allocation) => (
    Number.isFinite(allocation.requestedKwh)
      && Number.isFinite(allocation.allocatedKwh)
      && Number.isFinite(allocation.fraction)
      && allocation.requestedKwh >= 0
      && allocation.allocatedKwh >= 0
      && allocation.fraction >= 0
      && allocation.fraction <= 1
  ))) return false
  return true
}

function validDecisionRecord(record) {
  const event = getMissionEvent(record?.eventId)
  const choice = event?.decisions.find((decision) => decision.id === record.choiceId)
  return Boolean(
    event
      && choice
      && Number.isInteger(record.appliedAtHour)
      && Number.isInteger(record.consequencesAtHour)
      && record.consequencesAtHour === record.appliedAtHour + 1
      && typeof record.choiceLabel === 'string'
      && typeof record.reason === 'string'
      && typeof record.tradeoff === 'string'
      && typeof record.explanation === 'string'
      && typeof record.lesson === 'string'
      && Array.isArray(record.affectedSystems)
      && Array.isArray(record.causalChain)
      && validResourceSnapshot(record.before)
      && validResourceSnapshot(record.after)
      && RESOURCE_KEYS.every((key) => Number.isFinite(record.deltas?.[key]))
  )
}

export function validateMissionState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (value.schemaVersion !== SIMULATION_CONFIG.schemaVersion || !VALID_STATUSES.has(value.status)) return false
  const scenarioId = value.scenarioId ?? 'seven-day-survival'
  if (!isKnownScenario(scenarioId)) return false
  const scenario = getMissionScenario(scenarioId)
  const totalHours = getMissionConfig(scenarioId).mission.durationDays
    * getMissionConfig(scenarioId).mission.hoursPerDay
  if (value.runId !== undefined && (typeof value.runId !== 'string' || value.runId.length < 1)) return false
  if (!Number.isInteger(value.elapsedHours) || value.elapsedHours < 0 || value.elapsedHours > totalHours) return false
  if (value.crewSize !== SIMULATION_CONFIG.mission.crewSize) return false
  if (!validResourceSnapshot(value.resources)) return false
  if (value.startingResources !== undefined && !validResourceSnapshot(value.startingResources)) return false
  if (!Array.isArray(value.activeEvents) || !Array.isArray(value.triggeredEventIds)) return false
  if (!Array.isArray(value.decisionHistory) || !Array.isArray(value.hourlyHistory)) return false
  if (value.hourlyHistory.length > totalHours + 1 || value.decisionHistory.length > scenario.availableEventIds.length) return false
  if (value.hourlyHistory.length !== value.elapsedHours + 1) return false
  if (value.hourlyHistory.some((entry, index) => !Number.isInteger(entry.elapsedHours)
    || entry.elapsedHours !== index
    || !validResourceSnapshot(entry.resources)
    || !validSystemSnapshot(entry.systems))) return false
  if (!validSystemSnapshot(value.systems)) return false
  if (value.elapsedHours === 0 && value.systems !== null) return false
  if (value.elapsedHours > 0 && value.systems === null) return false
  if (RESOURCE_KEYS.some((key) => value.resources[key] !== value.hourlyHistory.at(-1).resources[key])) return false
  if (value.startingResources && RESOURCE_KEYS.some((key) => value.startingResources[key] !== value.hourlyHistory[0].resources[key])) return false
  if (value.triggeredEventIds.some((eventId) => !getMissionEvent(eventId) || !scenario.availableEventIds.includes(eventId))) return false
  if (new Set(value.triggeredEventIds).size !== value.triggeredEventIds.length) return false
  if (!value.decisionHistory.every(validDecisionRecord)) return false
  if (new Set(value.decisionHistory.map((record) => record.eventId)).size !== value.decisionHistory.length) return false
  if (value.activeEvents.some((activeEvent) => {
    const event = getMissionEvent(activeEvent?.eventId)
    const decided = value.decisionHistory.some((record) => record.eventId === activeEvent?.eventId)
    return !event
      || !isValidEventDuration(activeEvent.eventId, activeEvent.remainingHours)
      || activeEvent.remainingHours < 1
      || !value.triggeredEventIds.includes(activeEvent.eventId)
      || !decided
      || !activeEvent.environmentEffect
      || !activeEvent.decisionModifiers
  })) return false
  if (value.pendingEventId !== null && !getMissionEvent(value.pendingEventId)) return false
  if (value.pendingEventId && !value.triggeredEventIds.includes(value.pendingEventId)) return false
  if (value.triggeredEventIds.length !== value.decisionHistory.length + (value.pendingEventId ? 1 : 0)) return false
  if (value.status === 'standby' && value.elapsedHours !== 0) return false
  if (value.status === 'complete' && value.elapsedHours !== totalHours) return false
  if (value.status === 'failed' && typeof value.failureReason !== 'string') return false
  if (value.status !== 'failed' && value.failureReason !== null) return false
  if (value.pendingEventId && (value.status !== 'active' || value.pendingDecision !== null)) return false
  if (value.pendingDecision !== null) return false
  if (value.latestOutcome === null && value.decisionHistory.length > 0) return false
  if (value.latestOutcome !== null && (!validDecisionRecord(value.latestOutcome)
    || value.latestOutcome.eventId !== value.decisionHistory.at(-1)?.eventId)) return false
  return true
}

export function getAvailableEventCards(state) {
  return getMissionEvents(state)
}
