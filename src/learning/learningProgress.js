import { LEVEL_BY_ID, LEARNING_LEVELS, LEARNING_LEVEL_IDS } from './levelData.js'

export const LEARNING_STORAGE_KEY = 'lunar-loop-x-learning-v1'
const VALID_MODES = new Set(['explorer', 'mission'])
const VALID_CRATERS = new Set(['crater-south-field-a', 'crater-south-ridge', 'crater-highlands', 'crater-east-basin', 'crater-horizon', 'crater-west-field'])
const VALID_STRUCTURES = new Set(['habitat', 'solar', 'rover', 'greenhouse', 'storage', 'energy-storage', 'water-recovery', 'communications', 'science-lab', 'astronaut'])

export function createInitialLearningProgress() {
  return {
    version: 1,
    mode: 'explorer',
    currentLevelId: LEARNING_LEVEL_IDS[0],
    completedLevelIds: [],
    levelResults: {},
    inspectedStructureIds: [],
    scienceViewedStructureIds: [],
    inspectedCraterIds: [],
    eventDecisionIds: [],
    experimentRuns: 0,
    roverMoves: 0,
    roverPosition: [0, 0],
    landed: false,
    missionRunRecords: [],
    quizResults: {},
  }
}

function uniqueKnown(values, allowed) {
  return Array.isArray(values) ? [...new Set(values.filter((item) => allowed.has(item)))] : []
}

function safePosition(value) {
  return Array.isArray(value) && value.length === 2 && value.every((item) => Number.isFinite(item) && Math.abs(item) <= 24)
    ? value
    : [0, 0]
}

export function validateLearningProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) return false
  if (!VALID_MODES.has(value.mode) || !LEVEL_BY_ID.has(value.currentLevelId)) return false
  if (!Array.isArray(value.completedLevelIds) || value.completedLevelIds.some((id) => !LEVEL_BY_ID.has(id))) return false
  if (new Set(value.completedLevelIds).size !== value.completedLevelIds.length) return false
  for (const key of ['inspectedStructureIds', 'scienceViewedStructureIds', 'inspectedCraterIds', 'eventDecisionIds']) {
    if (!Array.isArray(value[key])) return false
  }
  if (value.inspectedStructureIds.some((id) => !VALID_STRUCTURES.has(id))) return false
  if (value.scienceViewedStructureIds.some((id) => !VALID_STRUCTURES.has(id))) return false
  if (value.inspectedCraterIds.some((id) => !VALID_CRATERS.has(id))) return false
  if (value.eventDecisionIds.some((id) => !['reduced-sunlight', 'array-interruption', 'water-recycling-fault', 'greenhouse-interruption', 'increased-power-demand'].includes(id))) return false
  if (!Number.isInteger(value.experimentRuns) || value.experimentRuns < 0 || !Number.isInteger(value.roverMoves) || value.roverMoves < 0) return false
  if (!Array.isArray(value.roverPosition)
    || !safePosition(value.roverPosition).every((coordinate, index) => coordinate === value.roverPosition[index])) return false
  if (typeof value.landed !== 'boolean' || !value.levelResults || typeof value.levelResults !== 'object' || Array.isArray(value.levelResults)) return false
  if (!value.missionRunRecords || !Array.isArray(value.missionRunRecords)) return false
  if (!value.quizResults || typeof value.quizResults !== 'object' || Array.isArray(value.quizResults)) return false
  for (const id of Object.keys(value.levelResults)) {
    const result = value.levelResults[id]
    if (!LEVEL_BY_ID.has(id) || !value.completedLevelIds.includes(id) || !result || result.completed !== true
      || !Number.isInteger(result.stars) || result.stars < 1 || result.stars > 4
      || !Number.isInteger(result.xp) || result.xp < 50 || result.xp > 125) return false
  }
  for (const record of value.missionRunRecords) {
    if (!record || typeof record.runId !== 'string' || !['complete', 'failed'].includes(record.status)
      || !Array.isArray(record.completedLevelIds)
      || record.completedLevelIds.some((id) => !LEVEL_BY_ID.has(id))) return false
  }
  for (const [levelId, results] of Object.entries(value.quizResults)) {
    if (!LEVEL_BY_ID.has(levelId) || !results || typeof results !== 'object' || Array.isArray(results)) return false
    const questionCount = LEVEL_BY_ID.get(levelId).questions.length
    if (Object.entries(results).some(([index, correct]) => (
      !Number.isInteger(Number(index)) || Number(index) < 0 || Number(index) >= questionCount || typeof correct !== 'boolean'
    ))) return false
  }
  return true
}

export function normalizeLearningProgress(value) {
  if (!validateLearningProgress(value)) return null
  return {
    ...createInitialLearningProgress(),
    ...value,
    completedLevelIds: [...value.completedLevelIds],
    inspectedStructureIds: uniqueKnown(value.inspectedStructureIds, VALID_STRUCTURES),
    scienceViewedStructureIds: uniqueKnown(value.scienceViewedStructureIds, VALID_STRUCTURES),
    inspectedCraterIds: uniqueKnown(value.inspectedCraterIds, VALID_CRATERS),
    eventDecisionIds: [...new Set(value.eventDecisionIds)],
    levelResults: { ...value.levelResults },
    quizResults: structuredClone(value.quizResults),
    missionRunRecords: structuredClone(value.missionRunRecords),
    roverPosition: [...safePosition(value.roverPosition)],
  }
}

function getStorage(storage) {
  return storage ?? globalThis.localStorage
}

export function loadLearningProgress(storage) {
  try {
    const target = getStorage(storage)
    const raw = target?.getItem(LEARNING_STORAGE_KEY)
    if (!raw) return createInitialLearningProgress()
    const normalized = normalizeLearningProgress(JSON.parse(raw))
    if (normalized) return normalized
    target.removeItem(LEARNING_STORAGE_KEY)
  } catch {
    return createInitialLearningProgress()
  }
  return createInitialLearningProgress()
}

export function saveLearningProgress(progress, storage) {
  try {
    if (!validateLearningProgress(progress)) return false
    getStorage(storage)?.setItem(LEARNING_STORAGE_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export function isLearningLevelUnlocked(progress, levelId) {
  const index = LEARNING_LEVEL_IDS.indexOf(levelId)
  return index === 0 || (index > 0 && progress.completedLevelIds.includes(LEARNING_LEVEL_IDS[index - 1]))
}

export function selectLearningLevel(progress, levelId) {
  return LEVEL_BY_ID.has(levelId) && isLearningLevelUnlocked(progress, levelId)
    ? { ...progress, currentLevelId: levelId }
    : progress
}

export function setLearningMode(progress, mode) {
  return VALID_MODES.has(mode) ? { ...progress, mode } : progress
}

export function recordStructureInspection(progress, structureId) {
  if (!VALID_STRUCTURES.has(structureId)) return progress
  return { ...progress, inspectedStructureIds: uniqueKnown([...progress.inspectedStructureIds, structureId], VALID_STRUCTURES) }
}

export function recordScienceView(progress, structureId) {
  if (!VALID_STRUCTURES.has(structureId)) return progress
  const inspected = recordStructureInspection(progress, structureId)
  return { ...inspected, scienceViewedStructureIds: uniqueKnown([...progress.scienceViewedStructureIds, structureId], VALID_STRUCTURES) }
}

export function recordCraterInspection(progress, craterId) {
  if (!VALID_CRATERS.has(craterId)) return progress
  return { ...progress, inspectedCraterIds: uniqueKnown([...progress.inspectedCraterIds, craterId], VALID_CRATERS) }
}

export function recordExperiment(progress) {
  return { ...progress, experimentRuns: progress.experimentRuns + 1 }
}

export function moveLearningRover(progress, dx, dz) {
  if (![dx, dz].every(Number.isFinite) || Math.abs(dx) + Math.abs(dz) !== 1) return progress
  const [x, z] = progress.roverPosition
  return {
    ...progress,
    roverMoves: progress.roverMoves + 1,
    roverPosition: [Math.max(-16, Math.min(16, x + dx * 1.4)), Math.max(-16, Math.min(16, z + dz * 1.4))],
  }
}

export function recordLanding(progress) {
  return progress.landed ? progress : { ...progress, landed: true }
}

export function recordEventDecision(progress, eventId) {
  const valid = new Set(['reduced-sunlight', 'array-interruption', 'water-recycling-fault', 'greenhouse-interruption', 'increased-power-demand'])
  return valid.has(eventId) ? { ...progress, eventDecisionIds: [...new Set([...progress.eventDecisionIds, eventId])] } : progress
}

export function recordMissionRun(progress, missionState, levelId = progress.currentLevelId) {
  if (!missionState?.runId || !['complete', 'failed'].includes(missionState.status)
    || progress.missionRunRecords.some((record) => record.runId === missionState.runId)) return progress
  const record = {
    runId: missionState.runId,
    scenarioId: missionState.scenarioId,
    status: missionState.status,
    elapsedHours: missionState.elapsedHours,
    levelId,
    completedLevelIds: [...progress.completedLevelIds],
  }
  return { ...progress, missionRunRecords: [record, ...progress.missionRunRecords].slice(0, 30) }
}

export function recordQuizAnswer(progress, levelId, questionIndex, correct) {
  if (!LEVEL_BY_ID.has(levelId) || !Number.isInteger(questionIndex)
    || questionIndex < 0 || questionIndex >= LEVEL_BY_ID.get(levelId).questions.length) return progress
  const previous = progress.quizResults[levelId] ?? {}
  return {
    ...progress,
    quizResults: {
      ...progress.quizResults,
      [levelId]: { ...previous, [questionIndex]: previous[questionIndex] === true || correct === true },
    },
  }
}

export function getLevelActivityComplete(progress, levelId) {
  const level = LEVEL_BY_ID.get(levelId)
  if (!level) return false
  const activeArrayDecision = progress.eventDecisionIds.includes('array-interruption')
  const hasCoreBase = ['habitat', 'energy-storage', 'greenhouse'].every((id) => progress.inspectedStructureIds.includes(id))
  const previouslyCompleted = progress.completedLevelIds
  const firstNineComplete = LEARNING_LEVEL_IDS.slice(0, 9).every((id) => previouslyCompleted.includes(id))
  const missionCompleted = progress.missionRunRecords.some((record) => record.status === 'complete')
  const completedAfterPath = progress.missionRunRecords.some((record) => record.status === 'complete'
    && LEARNING_LEVEL_IDS.slice(0, 9).every((id) => record.completedLevelIds.includes(id)))

  switch (level.activity.type) {
    case 'science-inspection': return progress.scienceViewedStructureIds.includes('habitat')
    case 'landing': return progress.landed
    case 'crater-inspection': return progress.inspectedCraterIds.length >= level.activity.targetCount
    case 'facility-inspection': return hasCoreBase
    case 'experiment': return progress.experimentRuns >= level.activity.targetCount
    case 'mission-completion': return level.id === 'future-moon-colony' ? firstNineComplete && completedAfterPath : missionCompleted
    case 'rover-expedition': return progress.roverMoves >= level.activity.targetCount && progress.inspectedCraterIds.length >= 1
    case 'event-decision': return activeArrayDecision
    case 'science-tour': return progress.scienceViewedStructureIds.length >= level.activity.targetCount
    default: return false
  }
}

export function getLevelQuizStatus(progress, levelId) {
  const level = LEVEL_BY_ID.get(levelId)
  const answers = progress.quizResults[levelId] ?? {}
  const answered = level.questions.filter((_, index) => Object.hasOwn(answers, index)).length
  const correct = level.questions.filter((_, index) => answers[index] === true).length
  return { answered, total: level.questions.length, correct, complete: answered === level.questions.length }
}

export function completeLearningLevel(progress, levelId) {
  if (!LEVEL_BY_ID.has(levelId) || !isLearningLevelUnlocked(progress, levelId)
    || !getLevelActivityComplete(progress, levelId) || !getLevelQuizStatus(progress, levelId).complete) return progress
  const quiz = getLevelQuizStatus(progress, levelId)
  const xp = 50 + quiz.correct * 25
  const stars = 1 + quiz.correct
  const result = { completed: true, stars, xp, quizCorrect: quiz.correct }
  const completedLevelIds = [...new Set([...progress.completedLevelIds, levelId])]
  return {
    ...progress,
    completedLevelIds,
    levelResults: { ...progress.levelResults, [levelId]: result },
    currentLevelId: progress.currentLevelId,
  }
}

export function getLearningRewards(progress) {
  const results = Object.values(progress.levelResults)
  return {
    xp: results.reduce((total, result) => total + result.xp, 0),
    stars: results.reduce((total, result) => total + result.stars, 0),
    completed: progress.completedLevelIds.length,
    total: LEARNING_LEVELS.length,
  }
}

export const LEARNING_ACHIEVEMENTS = [
  { id: 'first-steps', name: 'First Steps on the Moon', description: 'Complete your first learning level.', unlocked: (p) => p.completedLevelIds.length >= 1 },
  { id: 'crater-explorer', name: 'Crater Explorer', description: 'Inspect three crater landmarks.', unlocked: (p) => p.inspectedCraterIds.length >= 3 },
  { id: 'power-engineer', name: 'Power Engineer', description: 'Run an experiment with changed system inputs.', unlocked: (p) => p.experimentRuns >= 1 },
  { id: 'habitat-architect', name: 'Habitat Architect', description: 'Inspect the habitat, energy storage, and greenhouse.', unlocked: (p) => ['habitat', 'energy-storage', 'greenhouse'].every((id) => p.inspectedStructureIds.includes(id)) },
  { id: 'rover-scientist', name: 'Rover Scientist', description: 'Move the rover and inspect a crater.', unlocked: (p) => p.roverMoves >= 3 && p.inspectedCraterIds.length >= 1 },
  { id: 'water-conservation', name: 'Water Conservation Expert', description: 'Choose a response to the water-recovery interruption.', unlocked: (p) => p.eventDecisionIds.includes('water-recycling-fault') },
  { id: 'lunar-researcher', name: 'Lunar Researcher', description: 'Open science notes for three facilities.', unlocked: (p) => p.scienceViewedStructureIds.length >= 3 },
  { id: 'mission-commander', name: 'Mission Commander', description: 'Complete a seven-day educational mission.', unlocked: (p) => p.missionRunRecords.some((record) => record.status === 'complete') },
]

export function getLearningAchievements(progress) {
  return LEARNING_ACHIEVEMENTS.map((achievement) => ({ ...achievement, unlocked: achievement.unlocked(progress) }))
}
