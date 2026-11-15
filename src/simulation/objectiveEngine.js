import { RESOURCE_DEFINITIONS, SIMULATION_CONFIG } from './config.js'
import { getMissionConfig, getMissionScenario } from './scenarios.js'

const terminalStatuses = new Set(['complete', 'failed'])

function objectiveStatus(missionState, met, breached = false) {
  if (missionState.status === 'standby' && missionState.elapsedHours === 0) return 'not-started'
  if (breached) return 'failed'
  if (met) return 'completed'
  if (terminalStatuses.has(missionState.status)) return 'failed'
  return 'in-progress'
}

function getResourceMinimum(missionState, key) {
  return Math.min(...missionState.hourlyHistory.map((entry) => entry.resources[key]))
}

function evaluateObjective(missionState, objective, totalHours) {
  const progress = totalHours > 0 ? Math.min(1, missionState.elapsedHours / totalHours) : 0

  if (objective.type === 'duration') {
    const reached = missionState.elapsedHours >= objective.targetHours
    return {
      ...objective,
      progress: Math.round((missionState.elapsedHours / objective.targetHours) * 100),
      currentValue: missionState.elapsedHours,
      status: objectiveStatus(missionState, reached && missionState.status === 'complete'),
    }
  }

  if (objective.type === 'minimum-resource') {
    const resource = RESOURCE_DEFINITIONS.find((item) => item.stateKey === objective.resourceKey)
    const minimum = getResourceMinimum(missionState, objective.resourceKey)
    const current = missionState.resources[objective.resourceKey]
    const breached = minimum <= objective.threshold
    const terminalAndSafe = missionState.status === 'complete' && !breached
    return {
      ...objective,
      progress: Math.round(progress * 100),
      currentValue: current,
      minimumValue: minimum,
      unit: resource?.unit ?? '',
      status: objectiveStatus(missionState, terminalAndSafe, breached),
    }
  }

  if (objective.type === 'minimum-pathway') {
    const values = missionState.hourlyHistory
      .map((entry) => entry.systems?.pathways?.[objective.pathway])
      .filter(Number.isFinite)
    const minimum = values.length > 0 ? Math.min(...values) : null
    const breached = minimum !== null && minimum < objective.threshold
    const terminalAndSafe = missionState.status === 'complete' && !breached
    return {
      ...objective,
      progress: Math.round(progress * 100),
      currentValue: missionState.systems?.pathways?.[objective.pathway] ?? null,
      minimumValue: minimum,
      status: objectiveStatus(missionState, terminalAndSafe, breached),
    }
  }

  if (objective.type === 'decision-count') {
    const decisionCount = missionState.decisionHistory
      .filter((decision) => objective.eventIds.includes(decision.eventId)).length
    const reached = decisionCount >= objective.requiredCount
    return {
      ...objective,
      progress: Math.min(100, Math.round((decisionCount / objective.requiredCount) * 100)),
      currentValue: decisionCount,
      status: objectiveStatus(missionState, reached),
    }
  }

  return { ...objective, progress: 0, status: 'failed' }
}

export function getMissionObjectives(missionState) {
  const scenario = getMissionScenario(missionState.scenarioId)
  const config = getMissionConfig(scenario.id)
  const totalHours = config.mission.durationDays * config.mission.hoursPerDay
  return scenario.objectives.map((objective) => evaluateObjective(missionState, objective, totalHours))
}

export function getObjectiveSummary(missionState) {
  const objectives = getMissionObjectives(missionState)
  return {
    objectives,
    completed: objectives.filter((objective) => objective.status === 'completed').length,
    failed: objectives.filter((objective) => objective.status === 'failed').length,
    total: objectives.length,
    progress: objectives.length === 0 ? 0 : Math.round(
      objectives.reduce((sum, objective) => sum + objective.progress, 0) / objectives.length,
    ),
  }
}

export function getObjectiveResourceThreshold(resourceKey) {
  return SIMULATION_CONFIG.resources[resourceKey]?.criticalBelow ?? null
}
