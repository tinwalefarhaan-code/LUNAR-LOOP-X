import { RESOURCE_DEFINITIONS, SIMULATION_CONFIG } from './config.js'
import { getMissionObjectives } from './objectiveEngine.js'
import { getMissionConfig, getMissionScenario } from './scenarios.js'

const SCORE_MAXIMA = {
  resourceManagement: 25,
  essentialSystemProtection: 25,
  decisionQuality: 20,
  objectiveCompletion: 20,
  missionDuration: 10,
}

function safeRatio(value, capacity) {
  if (!Number.isFinite(value) || !Number.isFinite(capacity) || capacity <= 0) return 0
  return Math.max(0, Math.min(1, value / capacity))
}

function essentialResourceIsAboveCritical(resources) {
  const keys = ['energyKwh', 'oxygenKg', 'waterL', 'foodKg', 'habitatCondition']
  return keys.every((key) => {
    const definition = RESOURCE_DEFINITIONS.find((item) => item.stateKey === key)
    return definition && resources[key] > definition.criticalBelow
  })
}

export function scoreMission(state) {
  const scenario = getMissionScenario(state.scenarioId)
  const config = getMissionConfig(scenario.id)
  const history = Array.isArray(state.hourlyHistory) ? state.hourlyHistory : []
  const finalResources = state.resources ?? {}
  const resourceDefinitions = ['power', 'oxygen', 'water', 'food']
    .map((id) => SIMULATION_CONFIG.resources[id])
  const resourceFraction = resourceDefinitions.length === 0 ? 0 : resourceDefinitions
    .reduce((total, resource) => total + safeRatio(finalResources[resource.stateKey], resource.capacity), 0)
    / resourceDefinitions.length
  const resourceManagement = Math.round(SCORE_MAXIMA.resourceManagement * resourceFraction)

  const criticalKeys = ['energyKwh', 'oxygenKg', 'waterL', 'foodKg', 'habitatCondition']
  const protectedObservations = criticalKeys.reduce((count, key) => {
    const definition = RESOURCE_DEFINITIONS.find((item) => item.stateKey === key)
    if (!definition || history.length === 0) return count
    return count + history.filter((entry) => entry.resources?.[key] > definition.criticalBelow).length
  }, 0)
  const totalObservations = criticalKeys.length * history.length
  const essentialSystemProtection = Math.round(
    SCORE_MAXIMA.essentialSystemProtection * (totalObservations > 0 ? protectedObservations / totalObservations : 0),
  )

  const uniqueDecisions = [...new Map(
    (state.decisionHistory ?? []).map((decision) => [decision.eventId, decision]),
  ).values()]
  const decisionEvaluations = uniqueDecisions.map((decision) => {
    const essentialThresholdsPreserved = essentialResourceIsAboveCritical(decision.after)
    return {
      eventId: decision.eventId,
      choiceLabel: decision.choiceLabel,
      score: essentialThresholdsPreserved ? 1 : 0,
      maximum: 1,
      essentialThresholdsPreserved,
    }
  })
  const safeDecisions = decisionEvaluations.filter((decision) => decision.essentialThresholdsPreserved).length
  const decisionQuality = uniqueDecisions.length === 0
    ? 0
    : Math.round(SCORE_MAXIMA.decisionQuality * safeDecisions / uniqueDecisions.length)

  const objectives = getMissionObjectives(state)
  const completedObjectives = objectives.filter((objective) => objective.status === 'completed').length
  const objectiveCompletion = objectives.length === 0
    ? 0
    : Math.round(SCORE_MAXIMA.objectiveCompletion * completedObjectives / objectives.length)
  const durationHours = config.mission.durationDays * config.mission.hoursPerDay
  const missionDuration = Math.round(SCORE_MAXIMA.missionDuration * safeRatio(state.elapsedHours, durationHours))

  const categories = {
    resourceManagement: { label: 'Resource management', score: resourceManagement, maximum: SCORE_MAXIMA.resourceManagement, explanation: 'Final oxygen, water, food, and stored-energy inventories as fractions of their configured capacities.' },
    essentialSystemProtection: { label: 'Essential system protection', score: essentialSystemProtection, maximum: SCORE_MAXIMA.essentialSystemProtection, explanation: 'Share of resource-hour observations where energy, oxygen, water, food, and habitat index stayed above their configured critical thresholds.' },
    decisionQuality: { label: 'Decision quality', score: decisionQuality, maximum: SCORE_MAXIMA.decisionQuality, explanation: 'Average share of distinct event decisions whose calculated one-hour result leaves all five essential inventories above configured critical thresholds. Each event can contribute once.' },
    objectiveCompletion: { label: 'Objective completion', score: objectiveCompletion, maximum: SCORE_MAXIMA.objectiveCompletion, explanation: 'Completed measurable objectives divided by the scenario objective count.' },
    missionDuration: { label: 'Mission duration', score: missionDuration, maximum: SCORE_MAXIMA.missionDuration, explanation: 'Elapsed simulated hours divided by the configured 168-hour window.' },
  }
  const total = Object.values(categories).reduce((sum, category) => sum + category.score, 0)

  return {
    total,
    maximum: 100,
    outcome: state.status,
    scenarioId: scenario.id,
    categories,
    objectivesCompleted: completedObjectives,
    objectivesTotal: objectives.length,
    decisionsCounted: uniqueDecisions.length,
    decisionEvaluations,
    formula: 'Resource management (25) + essential system protection (25) + decision quality (20) + objective completion (20) + mission duration (10). Each category is rounded to a whole point before summing.',
    standard: 'LUNAR LOOP X educational project score; not a NASA or mission-readiness rating.',
  }
}
