import { useState } from 'react'
import { Award, Check, ChevronRight, CircleHelp, LockKeyhole, Map, RotateCcw, Sparkles } from 'lucide-react'
import { completeLearningLevel, getLearningAchievements, getLearningRewards, getLevelActivityComplete, getLevelQuizStatus, isLearningLevelUnlocked, recordQuizAnswer, selectLearningLevel, setLearningMode } from '../learning/learningProgress.js'
import { LEARNING_LEVELS, LEARNING_LEVEL_IDS } from '../learning/levelData.js'
import { CRATER_LANDMARKS } from '../learning/levelData.js'

function LearningPathPanel({ progress, onUpdate, missionState, onLanding, onMoveRover, onFocusStructure, onOpenExperiment, onOpenMissions, onOpenEvents }) {
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState({})
  const [selection, setSelection] = useState({})
  const rewards = getLearningRewards(progress)
  const selectedLevel = LEARNING_LEVELS.find((level) => level.id === progress.currentLevelId) ?? LEARNING_LEVELS[0]
  const activityComplete = getLevelActivityComplete(progress, selectedLevel.id)
  const quizStatus = getLevelQuizStatus(progress, selectedLevel.id)
  const canComplete = activityComplete && quizStatus.complete
  const achievements = getLearningAchievements(progress)
  const roverLevel = selectedLevel.activity.type === 'rover-expedition'
  const nextLevelId = LEARNING_LEVEL_IDS[LEARNING_LEVEL_IDS.indexOf(selectedLevel.id) + 1]

  function chooseLevel(levelId) {
    onUpdate((current) => selectLearningLevel(current, levelId))
    setShowHint(false)
    setFeedback({})
    setSelection({})
  }

  function answerQuestion(questionIndex) {
    const question = selectedLevel.questions[questionIndex]
    const correct = Number(selection[questionIndex]) === question.answer
    onUpdate((current) => recordQuizAnswer(current, selectedLevel.id, questionIndex, correct))
    setFeedback((current) => ({ ...current, [questionIndex]: correct ? 'correct' : 'try-again' }))
  }

  return (
    <section className="learning-path panel" aria-labelledby="learning-path-title">
      <div className="panel-header panel-header--compact">
        <div><div className="section-heading__eyebrow">SPACE EXPLORER ACADEMY <span>/</span> TEN LEVELS</div><h2 id="learning-path-title">Your Moon learning path</h2></div>
        <Map size={18} aria-hidden="true" />
      </div>
      <p className="learning-path__intro">Explore freely, or follow a mission with small steps. Lessons save on this device. Wrong answers are a chance to learn: read the tip, try again, and keep going.</p>
      <div className="learning-mode-selector" role="group" aria-label="Choose learning mode">
        <button type="button" className={progress.mode === 'explorer' ? 'is-selected' : ''} aria-pressed={progress.mode === 'explorer'} onClick={() => onUpdate((current) => setLearningMode(current, 'explorer'))}><Sparkles size={14} /> Explorer mode</button>
        <button type="button" className={progress.mode === 'mission' ? 'is-selected' : ''} aria-pressed={progress.mode === 'mission'} onClick={() => onUpdate((current) => setLearningMode(current, 'mission'))}><Map size={14} /> Mission mode</button>
      </div>
      <div className="learning-reward-strip" aria-label="Learning rewards">
        <span><strong>{rewards.xp}</strong> XP earned</span><span><strong>{rewards.stars}</strong> stars</span><span><strong>{rewards.completed}/{rewards.total}</strong> levels</span>
      </div>
      <ol className="learning-level-list" aria-label="Learning level progress">
        {LEARNING_LEVELS.map((level) => {
          const unlocked = isLearningLevelUnlocked(progress, level.id)
          const complete = progress.completedLevelIds.includes(level.id)
          const current = selectedLevel.id === level.id
          const result = progress.levelResults[level.id]
          return (
            <li key={level.id}>
              <button type="button" className={`learning-level${current ? ' learning-level--current' : ''}${complete ? ' learning-level--complete' : ''}${!unlocked ? ' learning-level--locked' : ''}`} onClick={() => chooseLevel(level.id)} disabled={!unlocked} aria-current={current ? 'step' : undefined}>
                <span className="learning-level__number">{complete ? <Check size={14} /> : unlocked ? level.number : <LockKeyhole size={13} />}</span>
                <span className="learning-level__copy"><strong>{level.title}</strong><small>{complete ? 'Complete · replay any time' : unlocked ? 'Ready to explore' : 'Complete the previous level to unlock'}</small></span>
                {result && <span className="learning-level__stars" aria-label={`${result.stars} stars`}>{'★'.repeat(result.stars)}</span>}
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ol>

      <article className="learning-lesson" aria-labelledby="learning-lesson-title">
        <div className="learning-lesson__eyebrow">LEVEL {selectedLevel.number} <span>/</span> {progress.mode === 'mission' ? 'MISSION MODE' : 'EXPLORER MODE'}</div>
        <h3 id="learning-lesson-title">{selectedLevel.title}</h3>
        <p className="learning-lesson__intro">{selectedLevel.introduction}</p>
        <div className="learning-lesson__objective"><strong>Learning objective</strong><span>{selectedLevel.objective}</span></div>
        <p className="learning-lesson__explanation">{selectedLevel.explanation}</p>
        {progress.mode === 'mission' && (
          <div className="learning-lesson__steps"><strong>Mission steps</strong><ol>{selectedLevel.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
        )}
        {selectedLevel.activity.type === 'landing' && <button type="button" className="learning-action" onClick={onLanding}><RotateCcw size={14} /> Begin landing approach</button>}
        {selectedLevel.activity.type === 'crater-inspection' && <p className="learning-action-note">Activity: {selectedLevel.activity.label} <span>{progress.inspectedCraterIds.length} / {selectedLevel.activity.targetCount} inspected</span></p>}
        {selectedLevel.activity.type === 'facility-inspection' && <p className="learning-action-note">Activity: {selectedLevel.activity.label}<span>{['habitat', 'energy-storage', 'greenhouse'].filter((id) => progress.inspectedStructureIds.includes(id)).length} / 3 inspected</span></p>}
        {selectedLevel.activity.type === 'science-inspection' && <div><p className="learning-action-note">Activity: {selectedLevel.activity.label}<span>{progress.scienceViewedStructureIds.includes('habitat') ? 'Complete' : 'Waiting for inspection'}</span></p><button type="button" className="learning-action" onClick={() => onFocusStructure('habitat')}>Focus the habitat in the world</button></div>}
        {selectedLevel.activity.type === 'science-tour' && <p className="learning-action-note">Activity: {selectedLevel.activity.label}<span>{progress.scienceViewedStructureIds.length} / {selectedLevel.activity.targetCount} viewed</span></p>}
        {selectedLevel.activity.type === 'experiment' && <button type="button" className="learning-action" onClick={onOpenExperiment}><Sparkles size={14} /> Open Experiment Lab <span>{progress.experimentRuns} runs</span></button>}
        {selectedLevel.activity.type === 'mission-completion' && (
          <div className="learning-action-stack"><p className="learning-action-note">Activity: {selectedLevel.activity.label}<span>{progress.missionRunRecords.filter((run) => run.status === 'complete').length} completed runs</span></p><button type="button" className="learning-action" onClick={onOpenMissions}>Choose a mission scenario</button></div>
        )}
        {selectedLevel.activity.type === 'event-decision' && <button type="button" className="learning-action" onClick={onOpenEvents}>Open mission events <span>{progress.eventDecisionIds.includes('array-interruption') ? 'Decision recorded' : 'Array event after hour 48'}</span></button>}
        {(selectedLevel.activity.type === 'crater-inspection' || roverLevel) && (
          <div className="crater-learning-selector" role="group" aria-label="Select a crater landmark to inspect">
            <strong>Crater landmarks · select to focus</strong>
            <div>{CRATER_LANDMARKS.map((crater) => <button type="button" key={crater.id} className={progress.inspectedCraterIds.includes(crater.id) ? 'is-inspected' : ''} onClick={() => onFocusStructure(crater.id)}>{crater.name}{progress.inspectedCraterIds.includes(crater.id) ? ' · visited' : ''}</button>)}</div>
          </div>
        )}
        {roverLevel && (
          <div className="rover-learning-controls">
            <strong>Move the rover model</strong><div className="rover-learning-controls__grid" role="group" aria-label="Rover movement controls">
              <span /> <button type="button" aria-label="Move rover north" onClick={() => onMoveRover(0, -1)}>↑</button> <span />
              <button type="button" aria-label="Move rover west" onClick={() => onMoveRover(-1, 0)}>←</button><span className="rover-learning-controls__count">{progress.roverMoves}</span><button type="button" aria-label="Move rover east" onClick={() => onMoveRover(1, 0)}>→</button>
              <span /> <button type="button" aria-label="Move rover south" onClick={() => onMoveRover(0, 1)}>↓</button> <span />
            </div><small>Move count: {progress.roverMoves} / 3 · Then inspect any crater.</small>
          </div>
        )}
        <div className={`learning-activity-status${activityComplete ? ' learning-activity-status--complete' : ''}`} role="status">{activityComplete ? `✓ ${selectedLevel.completion}` : `Next: ${selectedLevel.activity.label}`}</div>
        <details className="learning-hint" open={showHint} onToggle={(event) => setShowHint(event.currentTarget.open)}>
          <summary><CircleHelp size={14} /> Need a hint?</summary>
          <ol>{selectedLevel.hints.map((hint) => <li key={hint}>{hint}</li>)}</ol>
        </details>
        <section className="learning-quiz" aria-labelledby="learning-quiz-title">
          <div className="learning-quiz__heading"><strong id="learning-quiz-title">Quick knowledge check</strong><span>{quizStatus.correct} / 3 ready answers</span></div>
          {selectedLevel.questions.map((question, index) => {
            const result = feedback[index]
            return (
              <fieldset className="learning-question" key={question.prompt}>
                <legend>{index + 1}. {question.prompt}</legend>
                {question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`${selectedLevel.id}-question-${index}`} value={optionIndex} checked={Number(selection[index]) === optionIndex} onChange={(event) => setSelection((current) => ({ ...current, [index]: event.target.value }))} />{option}</label>)}
                <button type="button" className="learning-question__check" disabled={selection[index] === undefined} onClick={() => answerQuestion(index)}>{result === 'correct' ? 'Check again' : 'Check answer'}</button>
                {result && <p className={`learning-question__feedback learning-question__feedback--${result}`} role="status">{result === 'correct' ? `That’s right! ${question.explanation}` : `Good try. ${question.explanation} Choose another answer whenever you are ready.`}</p>}
              </fieldset>
            )
          })}
        </section>
        {progress.completedLevelIds.includes(selectedLevel.id) && (
          <div className="learning-complete-note" role="status">
            <p>{selectedLevel.outcome} This lesson is complete and can be replayed.</p>
            {nextLevelId && isLearningLevelUnlocked(progress, nextLevelId) && <button type="button" onClick={() => chooseLevel(nextLevelId)}>Continue to {LEARNING_LEVELS.find((item) => item.id === nextLevelId)?.title} <ChevronRight size={14} /></button>}
          </div>
        )}
        <button type="button" className="learning-complete-button" disabled={!canComplete} onClick={() => onUpdate((current) => completeLearningLevel(current, selectedLevel.id))}>
          {progress.completedLevelIds.includes(selectedLevel.id) ? 'Update lesson mastery' : 'Complete this lesson and collect rewards'}
        </button>
        <div className="learning-reward-note"><Award size={14} /><span>Complete the activity for 1 star and 50 XP. Each correct knowledge check adds a star and 25 XP. You can retry any answer; nothing is taken away.</span></div>
      </article>

      <section className="learning-achievements" aria-labelledby="learning-achievements-title">
        <div><Award size={15} /><h3 id="learning-achievements-title">Achievements</h3></div>
        <ul>{achievements.map((achievement) => <li className={achievement.unlocked ? 'is-unlocked' : ''} key={achievement.id}><span>{achievement.unlocked ? '★' : '○'}</span><div><strong>{achievement.name}</strong><small>{achievement.description}</small></div></li>)}</ul>
      </section>
      {missionState.status === 'active' && <p className="panel-footnote">Live mission: Day {Math.floor(missionState.elapsedHours / 24) + 1} · {missionState.elapsedHours} of 168 manual simulated hours.</p>}
    </section>
  )
}

export default LearningPathPanel
