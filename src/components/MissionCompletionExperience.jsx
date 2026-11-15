import { useEffect, useRef } from 'react'
import { ArrowRight, Check, CircleAlert, RotateCcw, SkipForward, Trophy } from 'lucide-react'
import { RESOURCE_DEFINITIONS } from '../simulation/config.js'
import { getMissionObjectives } from '../simulation/objectiveEngine.js'
import { scoreMission } from '../simulation/scoringEngine.js'
import { getMissionScenario } from '../simulation/scenarios.js'

function signed(value, digits = 1) {
  const rounded = Number(value).toFixed(digits)
  return `${value > 0 ? '+' : ''}${rounded}`
}

function MissionCompletionExperience({ missionState, runs, reducedMotion, onDebrief, onReplay, onSkip }) {
  const headingRef = useRef(null)
  const scenario = getMissionScenario(missionState.scenarioId)
  const score = scoreMission(missionState)
  const objectives = getMissionObjectives(missionState)
  const complete = missionState.status === 'complete'
  const storedRun = runs.find((run) => run.id === missionState.runId)

  useEffect(() => headingRef.current?.focus(), [])

  return (
    <div className={`mission-completion mission-completion--${complete ? 'success' : 'failure'}${reducedMotion ? ' mission-completion--reduced' : ''}`} role="presentation">
      <section className="mission-completion__panel" role="dialog" aria-modal="true" aria-labelledby="completion-title" aria-describedby="completion-description">
        <div className="mission-completion__eyebrow">LUNAR LOOP X <span>/</span> MISSION EVALUATION</div>
        <span className="mission-completion__emblem" aria-hidden="true">{complete ? <Trophy size={25} /> : <CircleAlert size={25} />}</span>
        <p className="mission-completion__kicker">{complete ? 'MISSION WINDOW COMPLETE' : 'MISSION RUN ENDED'}</p>
        <h1 id="completion-title" tabIndex={-1} ref={headingRef}>{complete ? 'Outpost mission complete' : 'Mission objectives interrupted'}</h1>
        <p id="completion-description" className="mission-completion__intro">{scenario.name} · {missionState.elapsedHours} of 168 simulated hours</p>
        {missionState.failureReason && <p className="mission-completion__failure-reason"><CircleAlert size={15} /> {missionState.failureReason}</p>}
        <div className="mission-completion__score">
          <span>{storedRun ? 'ARCHIVED PROJECT SCORE' : 'PROJECT SCORE'}</span>
          <strong>{score.total}<small> / {score.maximum}</small></strong>
          <span>{score.standard}</span>
        </div>
        <div className="mission-completion__objectives" aria-label="Objective results">
          {objectives.map((objective) => (
            <div className="mission-completion__objective" key={objective.id}>
              {objective.status === 'completed' ? <Check size={14} /> : <CircleAlert size={14} />}
              <span>{objective.title}</span><strong>{objective.status.replace('-', ' ')}</strong>
            </div>
          ))}
        </div>
        <div className="mission-completion__resources" aria-label="Starting and ending resource levels">
          {RESOURCE_DEFINITIONS.filter((resource) => ['energyKwh', 'oxygenKg', 'waterL', 'foodKg'].includes(resource.stateKey)).map((resource) => {
            const starting = missionState.startingResources?.[resource.stateKey] ?? missionState.hourlyHistory[0].resources[resource.stateKey]
            const ending = missionState.resources[resource.stateKey]
            return <span key={resource.stateKey}>{resource.label} <strong>{starting.toFixed(1)} → {ending.toFixed(1)} {resource.unit}</strong> <small>({signed(ending - starting)})</small></span>
          })}
        </div>
        <div className="mission-completion__actions">
          <button type="button" className="mission-completion__primary" onClick={onDebrief}>Open mission debrief <ArrowRight size={15} /></button>
          <button type="button" onClick={() => onReplay(missionState.scenarioId)}><RotateCcw size={14} /> Replay scenario</button>
        </div>
        <button className="mission-completion__skip" type="button" onClick={onSkip}><SkipForward size={13} /> Skip sequence · open debrief</button>
        <p className="mission-completion__disclaimer">Deterministic educational simulation · values and score are project outputs, not NASA telemetry or mission-readiness evaluation.</p>
      </section>
    </div>
  )
}

export default MissionCompletionExperience
