import assert from 'node:assert/strict'
import test from 'node:test'
import { advanceMissionHours, createInitialMissionState, startMission } from '../src/simulation/missionEngine.js'
import { DEFAULT_EXPERIMENT, runExperiment } from '../src/learning/experimentEngine.js'
import { CRATER_LANDMARKS, LEARNING_GLOSSARY, LEARNING_LEVELS } from '../src/learning/levelData.js'
import {
  completeLearningLevel,
  createInitialLearningProgress,
  getLearningAchievements,
  getLearningRewards,
  getLevelActivityComplete,
  isLearningLevelUnlocked,
  loadLearningProgress,
  moveLearningRover,
  recordCraterInspection,
  recordEventDecision,
  recordExperiment,
  recordLanding,
  recordMissionRun,
  recordQuizAnswer,
  recordScienceView,
  recordStructureInspection,
  saveLearningProgress,
  selectLearningLevel,
  validateLearningProgress,
} from '../src/learning/learningProgress.js'

function answerLevel(progress, levelId, correctValues = [true, true, true]) {
  return LEARNING_LEVELS.find((level) => level.id === levelId).questions.reduce(
    (current, _question, index) => recordQuizAnswer(current, levelId, index, correctValues[index]),
    progress,
  )
}

function completeFirstFiveLevels() {
  let progress = createInitialLearningProgress()
  progress = recordScienceView(progress, 'habitat')
  progress = answerLevel(progress, 'welcome-to-moon')
  progress = completeLearningLevel(progress, 'welcome-to-moon')
  progress = recordLanding(progress)
  progress = answerLevel(progress, 'moon-landing-academy')
  progress = completeLearningLevel(progress, 'moon-landing-academy')
  for (const crater of CRATER_LANDMARKS.slice(0, 3)) progress = recordCraterInspection(progress, crater.id)
  progress = answerLevel(progress, 'explore-craters')
  progress = completeLearningLevel(progress, 'explore-craters')
  for (const id of ['habitat', 'energy-storage', 'greenhouse']) progress = recordStructureInspection(progress, id)
  progress = answerLevel(progress, 'build-lunar-base')
  progress = completeLearningLevel(progress, 'build-lunar-base')
  progress = recordExperiment(progress)
  progress = answerLevel(progress, 'power-the-moon-base')
  progress = completeLearningLevel(progress, 'power-the-moon-base')
  return progress
}

test('learning path has ten complete lessons and the required glossary terms', () => {
  assert.equal(LEARNING_LEVELS.length, 10)
  assert.equal(new Set(LEARNING_LEVELS.map((level) => level.id)).size, 10)
  assert.ok(LEARNING_LEVELS.every((level) => level.questions.length === 3
    && level.steps.length > 0 && level.hints.length > 0 && level.completion && level.outcome))
  for (const term of ['Gravity', 'Regolith', 'Crater', 'Solar energy', 'Lunar orbit', 'Radiation', 'Life support', 'Water ice', 'Rover', 'Habitat']) {
    assert.ok(LEARNING_GLOSSARY.some((item) => item.term === term), `${term} should be defined`)
  }
})

test('levels unlock one step at a time from completed learning activity', () => {
  let progress = createInitialLearningProgress()
  assert.equal(isLearningLevelUnlocked(progress, 'welcome-to-moon'), true)
  assert.equal(isLearningLevelUnlocked(progress, 'moon-landing-academy'), false)
  assert.deepEqual(selectLearningLevel(progress, 'explore-craters'), progress)

  progress = recordScienceView(progress, 'habitat')
  progress = answerLevel(progress, 'welcome-to-moon', [false, true, true])
  assert.equal(progress.quizResults['welcome-to-moon'][0], false)
  progress = recordQuizAnswer(progress, 'welcome-to-moon', 0, true)
  assert.equal(progress.quizResults['welcome-to-moon'][0], true)
  progress = completeLearningLevel(progress, 'welcome-to-moon')
  assert.equal(progress.levelResults['welcome-to-moon'].stars, 4)
  assert.equal(progress.levelResults['welcome-to-moon'].xp, 125)
  assert.equal(isLearningLevelUnlocked(progress, 'moon-landing-academy'), true)
  assert.equal(isLearningLevelUnlocked(progress, 'explore-craters'), false)
  assert.equal(getLearningRewards(progress).xp, 125)
  assert.equal(getLearningRewards(progress).stars, 4)
})

test('mission completion level needs an actual completed 168-hour run', () => {
  let progress = completeFirstFiveLevels()
  assert.equal(isLearningLevelUnlocked(progress, 'survive-on-moon'), true)
  assert.equal(getLevelActivityComplete(progress, 'survive-on-moon'), false)
  const mission = advanceMissionHours(startMission(createInitialMissionState()), 168)
  assert.equal(mission.status, 'complete')
  progress = recordMissionRun(progress, mission, 'survive-on-moon')
  assert.equal(getLevelActivityComplete(progress, 'survive-on-moon'), true)
  progress = answerLevel(progress, 'survive-on-moon')
  progress = completeLearningLevel(progress, 'survive-on-moon')
  assert.equal(progress.completedLevelIds.includes('survive-on-moon'), true)
})

test('experiment uses the resource model without mutating the current mission state', () => {
  const mission = advanceMissionHours(startMission(createInitialMissionState()), 3)
  const before = structuredClone(mission)
  const result = runExperiment(mission, { ...DEFAULT_EXPERIMENT, sunlightPercent: 0, addedDemandKwh: 4, energyReserveKwh: 12, pauseNonessential: true, greenhouseOnline: false })
  assert.deepEqual(mission, before)
  assert.ok(result.experimental.systems.solarGenerationPotentialKwh <= result.baseline.systems.solarGenerationPotentialKwh)
  assert.equal(result.experimental.conditions.powerLoadFactors.nonessential, 0)
  assert.equal(result.experimental.conditions.powerLoadFactors.greenhouse, 0)
  assert.equal(result.experimental.resources.energyKwh <= 12, true)
})

test('achievements require recorded science, rover, event, experiment, and mission actions', () => {
  let progress = createInitialLearningProgress()
  assert.equal(getLearningAchievements(progress).some((achievement) => achievement.unlocked), false)
  progress = recordScienceView(progress, 'habitat')
  progress = recordScienceView(progress, 'solar')
  progress = recordScienceView(progress, 'greenhouse')
  for (const id of ['habitat', 'energy-storage', 'greenhouse']) progress = recordStructureInspection(progress, id)
  progress = recordCraterInspection(progress, CRATER_LANDMARKS[0].id)
  progress = recordCraterInspection(progress, CRATER_LANDMARKS[1].id)
  progress = recordCraterInspection(progress, CRATER_LANDMARKS[2].id)
  progress = recordExperiment(progress)
  progress = moveLearningRover(moveLearningRover(moveLearningRover(progress, 1, 0), 0, 1), -1, 0)
  progress = recordEventDecision(progress, 'water-recycling-fault')
  progress = answerLevel(progress, 'welcome-to-moon')
  progress = recordScienceView(progress, 'habitat')
  progress = completeLearningLevel(progress, 'welcome-to-moon')
  const mission = advanceMissionHours(startMission(createInitialMissionState()), 168)
  progress = recordMissionRun(progress, mission)
  assert.equal(getLearningAchievements(progress).filter((achievement) => achievement.unlocked).length, 8)
})

test('student progress saves, restores, and rejects malformed local records', () => {
  const values = new Map()
  const fakeStorage = {
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, value) },
    removeItem(key) { values.delete(key) },
  }
  let progress = recordLanding(createInitialLearningProgress())
  progress = moveLearningRover(progress, 1, 0)
  assert.equal(validateLearningProgress(progress), true)
  assert.equal(saveLearningProgress(progress, fakeStorage), true)
  assert.deepEqual(loadLearningProgress(fakeStorage), progress)
  values.set('lunar-loop-x-learning-v1', JSON.stringify({ version: 1, mode: 'developer' }))
  assert.deepEqual(loadLearningProgress(fakeStorage), createInitialLearningProgress())
  assert.equal(values.has('lunar-loop-x-learning-v1'), false)
})
