import { useCallback, useEffect, useRef, useState } from 'react'
import {
  advanceMissionDay,
  advanceMissionHours,
  createInitialMissionState,
  injectMissionEvent,
  normalizeMissionState,
  pauseMission,
  resetMission,
  resolveMissionEvent,
  startMission,
} from './missionEngine.js'
import {
  archiveMissionRun,
  isMissionStorageAvailable,
  loadMissionRuns,
  loadMissionState,
  saveMissionRuns,
  saveMissionState,
} from './storage.js'
import { isKnownScenario } from './scenarios.js'

function getInitialState() {
  const loaded = normalizeMissionState(loadMissionState())
  return loaded ?? createInitialMissionState()
}

export function useMissionSimulation() {
  const [missionState, setMissionState] = useState(getInitialState)
  const [storageAvailable] = useState(isMissionStorageAvailable)
  const [runs, setRuns] = useState(loadMissionRuns)
  const archivedRunIds = useRef(new Set())

  useEffect(() => {
    saveMissionState(missionState)
  }, [missionState])

  useEffect(() => {
    saveMissionRuns(runs)
  }, [runs])

  useEffect(() => {
    if (!['complete', 'failed'].includes(missionState.status)
      || !missionState.runId
      || archivedRunIds.current.has(missionState.runId)) return
    archivedRunIds.current.add(missionState.runId)
    setRuns(archiveMissionRun(missionState, undefined, runs))
  }, [missionState, runs])

  const start = useCallback(() => setMissionState((state) => startMission(state)), [])
  const pause = useCallback(() => setMissionState((state) => pauseMission(state)), [])
  const advanceHour = useCallback(() => setMissionState((state) => advanceMissionHours(state, 1)), [])
  const advanceDay = useCallback(() => setMissionState((state) => advanceMissionDay(state)), [])
  const triggerEvent = useCallback((eventId) => {
    setMissionState((state) => injectMissionEvent(state, eventId))
  }, [])
  const resolveDecision = useCallback((eventId, choiceId) => {
    setMissionState((state) => resolveMissionEvent(state, eventId, choiceId))
  }, [])
  const reset = useCallback(() => {
    setMissionState((state) => resetMission(state.scenarioId))
  }, [])
  const selectScenario = useCallback((scenarioId) => {
    if (!isKnownScenario(scenarioId)) return false
    setMissionState(createInitialMissionState(scenarioId))
    return true
  }, [])
  const replay = useCallback((scenarioId) => {
    const next = createInitialMissionState(scenarioId ?? missionState.scenarioId)
    setMissionState(startMission(next))
  }, [missionState.scenarioId])

  return {
    missionState,
    storageAvailable,
    runs,
    start,
    pause,
    advanceHour,
    advanceDay,
    triggerEvent,
    resolveDecision,
    reset,
    selectScenario,
    replay,
  }
}
