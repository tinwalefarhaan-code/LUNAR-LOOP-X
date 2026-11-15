import { validateMissionState } from './missionEngine.js'
import { scoreMission } from './scoringEngine.js'
import { getMissionScenario, isKnownScenario } from './scenarios.js'

export const MISSION_STORAGE_KEY = 'lunar-loop-x-mission-v1'
export const MISSION_RUNS_STORAGE_KEY = 'lunar-loop-x-runs-v1'
export const MAX_STORED_RUNS = 20
const STORAGE_PROBE_KEY = 'lunar-loop-x-storage-probe'

function getStorage(storage) {
  if (storage) return storage
  return globalThis.localStorage
}

export function saveMissionState(state, storage) {
  try {
    const target = getStorage(storage)
    if (!target || !validateMissionState(state)) return false
    target.setItem(MISSION_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function loadMissionState(storage) {
  let target
  try {
    target = getStorage(storage)
    const saved = target?.getItem(MISSION_STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (validateMissionState(parsed)) return parsed
    target.removeItem(MISSION_STORAGE_KEY)
    return null
  } catch {
    try {
      target?.removeItem(MISSION_STORAGE_KEY)
    } catch {
      return null
    }
    return null
  }
}

export function isMissionStorageAvailable(storage) {
  try {
    const target = getStorage(storage)
    if (!target) return false
    target.setItem(STORAGE_PROBE_KEY, 'available')
    target.removeItem(STORAGE_PROBE_KEY)
    return true
  } catch {
    return false
  }
}

function isValidStoredRun(run) {
  if (!run || typeof run !== 'object' || Array.isArray(run)) return false
  if (typeof run.id !== 'string' || run.id.length < 1) return false
  if (!isKnownScenario(run.scenarioId) || !['complete', 'failed'].includes(run.status)) return false
  if (!Number.isFinite(Date.parse(run.savedAt))) return false
  if (!validateMissionState(run.missionState)) return false
  if (run.missionState.status !== run.status || run.missionState.scenarioId !== run.scenarioId) return false
  if (run.missionState.runId !== run.id || run.elapsedHours !== run.missionState.elapsedHours) return false
  const expectedScore = scoreMission(run.missionState)
  return Number.isFinite(run.score?.total)
    && run.score.total === expectedScore.total
    && run.score.maximum === expectedScore.maximum
}

export function loadMissionRuns(storage) {
  let target
  try {
    target = getStorage(storage)
    const saved = target?.getItem(MISSION_RUNS_STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) {
      target.removeItem(MISSION_RUNS_STORAGE_KEY)
      return []
    }
    return parsed.filter(isValidStoredRun).slice(0, MAX_STORED_RUNS)
  } catch {
    try {
      target?.removeItem(MISSION_RUNS_STORAGE_KEY)
    } catch {
      return []
    }
    return []
  }
}

export function saveMissionRuns(runs, storage) {
  try {
    const target = getStorage(storage)
    if (!target || !Array.isArray(runs)) return false
    const validRuns = runs.filter(isValidStoredRun).slice(0, MAX_STORED_RUNS)
    target.setItem(MISSION_RUNS_STORAGE_KEY, JSON.stringify(validRuns))
    return true
  } catch {
    return false
  }
}

export function archiveMissionRun(missionState, storage, previousRuns) {
  if (!['complete', 'failed'].includes(missionState?.status)
    || !validateMissionState(missionState)
    || !isKnownScenario(missionState.scenarioId)
    || typeof missionState.runId !== 'string') return []

  const existingRuns = previousRuns ?? loadMissionRuns(storage)
  if (existingRuns.some((run) => run.id === missionState.runId)) return existingRuns
  const scenario = getMissionScenario(missionState.scenarioId)
  const run = {
    id: missionState.runId,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    savedAt: new Date().toISOString(),
    status: missionState.status,
    elapsedHours: missionState.elapsedHours,
    missionState,
    score: scoreMission(missionState),
  }
  const updatedRuns = [run, ...existingRuns].slice(0, MAX_STORED_RUNS)
  saveMissionRuns(updatedRuns, storage)
  return updatedRuns
}
