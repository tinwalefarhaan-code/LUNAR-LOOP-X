import { useState } from 'react'
import { ArrowRightLeft, RotateCcw } from 'lucide-react'
import { RESOURCE_DEFINITIONS } from '../simulation/config.js'
import { getMissionObjectives } from '../simulation/objectiveEngine.js'
import { MISSION_SCENARIOS } from '../simulation/scenarios.js'

const compareResources = RESOURCE_DEFINITIONS.filter((resource) => (
  ['energyKwh', 'oxygenKg', 'waterL', 'foodKg', 'habitatCondition'].includes(resource.stateKey)
))

function RunComparisonPanel({ runs, onReplay }) {
  const [scenarioId, setScenarioId] = useState(runs[0]?.scenarioId ?? MISSION_SCENARIOS[0].id)
  const [firstRunId, setFirstRunId] = useState(runs[0]?.id ?? '')
  const [secondRunId, setSecondRunId] = useState(runs[1]?.id ?? '')
  const scenarioRuns = runs.filter((run) => run.scenarioId === scenarioId)
  const firstRun = scenarioRuns.find((run) => run.id === firstRunId) ?? scenarioRuns[0]
  const secondRun = scenarioRuns.find((run) => run.id === secondRunId && run.id !== firstRun?.id)
    ?? scenarioRuns.find((run) => run.id !== firstRun?.id)
    ?? firstRun

  return (
    <section className="run-comparison panel" aria-labelledby="run-comparison-title">
      <div className="panel-header panel-header--compact">
        <div>
          <div className="section-heading__eyebrow">LOCAL ARCHIVE <span>/</span> ATTEMPT REVIEW</div>
          <h2 id="run-comparison-title">Compare mission attempts</h2>
        </div>
        <ArrowRightLeft size={17} aria-hidden="true" />
      </div>
      <label className="run-comparison__scenario">Scenario
        <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>
          {MISSION_SCENARIOS.map((scenario) => <option value={scenario.id} key={scenario.id}>{scenario.name}</option>)}
        </select>
      </label>
      {scenarioRuns.length === 0 ? (
        <p className="run-comparison__empty">No completed or failed attempts for this scenario are saved on this device yet. Terminal runs are archived automatically.</p>
      ) : (
        <>
          {scenarioRuns.length > 1 ? (
            <div className="run-comparison__selectors">
              <label>Attempt 1
                <select value={firstRun.id} onChange={(event) => setFirstRunId(event.target.value)}>
                  {scenarioRuns.map((item, itemIndex) => <option value={item.id} key={item.id}>Run {scenarioRuns.length - itemIndex} · {new Date(item.savedAt).toLocaleString()}</option>)}
                </select>
              </label>
              <label>Attempt 2
                <select value={secondRun.id} onChange={(event) => setSecondRunId(event.target.value)}>
                  {scenarioRuns.map((item, itemIndex) => <option value={item.id} key={item.id}>Run {scenarioRuns.length - itemIndex} · {new Date(item.savedAt).toLocaleString()}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <p className="run-comparison__empty">One attempt is saved. Replay this scenario and complete or fail another run to compare attempts.</p>
          )}
          <RunPairDetails firstRun={firstRun} secondRun={secondRun} onReplay={onReplay} />
        </>
      )}
      <p className="panel-footnote">Only locally archived runs of the selected scenario can be compared. These are educational simulations, not lunar mission records.</p>
    </section>
  )
}

function RunPairDetails({ firstRun, secondRun, onReplay }) {
  if (!firstRun) return null
  const first = firstRun
  const second = secondRun ?? firstRun
  const firstObjectives = getMissionObjectives(first.missionState)
  const secondObjectives = getMissionObjectives(second.missionState)
  const firstCompleted = firstObjectives.filter((objective) => objective.status === 'completed').length
  const secondCompleted = secondObjectives.filter((objective) => objective.status === 'completed').length
  const runLabel = (run) => `Run · ${new Date(run.savedAt).toLocaleString()}`

  return (
    <>
      <div className={`run-comparison__columns${first.id === second.id ? ' run-comparison__columns--single' : ''}`}>
        {[first, second].map((run, index) => (
          <article className="run-comparison__attempt" key={`${index}-${run.id}`}>
            <div className="run-comparison__attempt-head"><small>ATTEMPT {index + 1}</small><strong>{runLabel(run)}</strong></div>
            <div className="run-comparison__score"><strong>{run.score.total}<small> / 100</small></strong><span>{run.status.toUpperCase()}</span></div>
            <dl>
              <div><dt>Mission time</dt><dd>{run.elapsedHours} h</dd></div>
              <div><dt>Objectives</dt><dd>{(index === 0 ? firstCompleted : secondCompleted)} / {run.score.objectivesTotal}</dd></div>
              <div><dt>Decisions</dt><dd>{run.missionState.decisionHistory.length}</dd></div>
            </dl>
            <div className="run-comparison__resources">
              {compareResources.map((resource) => <span key={resource.stateKey}>{resource.label}<strong>{run.missionState.resources[resource.stateKey].toFixed(1)} {resource.unit}</strong></span>)}
            </div>
            <ol className="run-comparison__decisions">
              {run.missionState.decisionHistory.map((decision) => <li key={decision.eventId}><strong>{decision.eventTitle}</strong><span>{decision.choiceLabel}</span></li>)}
              {run.missionState.decisionHistory.length === 0 && <li>No event decisions recorded.</li>}
            </ol>
            <button type="button" onClick={() => onReplay(run.scenarioId)}><RotateCcw size={13} /> Replay this scenario</button>
          </article>
        ))}
      </div>
      <div className="run-comparison__objective-compare">
        <strong>Objective completion</strong>
        <span>{firstCompleted}/{firstObjectives.length} completed</span>
        <span>{secondCompleted}/{secondObjectives.length} completed</span>
      </div>
    </>
  )
}

export default RunComparisonPanel
