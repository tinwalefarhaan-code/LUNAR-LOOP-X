import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, BookOpenCheck, CircleAlert, Gauge, ShieldCheck } from 'lucide-react'
import { RESOURCE_DEFINITIONS } from '../simulation/config.js'
import { getMissionObjectives } from '../simulation/objectiveEngine.js'
import { scoreMission } from '../simulation/scoringEngine.js'
import { getMissionScenario } from '../simulation/scenarios.js'
import { getMissionClock } from '../simulation/missionEngine.js'

const trackedResources = RESOURCE_DEFINITIONS.filter((resource) => (
  ['energyKwh', 'oxygenKg', 'waterL', 'foodKg', 'habitatCondition'].includes(resource.stateKey)
))

function format(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

function signed(value, digits = 1) {
  return `${value > 0 ? '+' : ''}${format(value, digits)}`
}

function marginScore(decision) {
  const thresholds = trackedResources
  return thresholds.reduce((total, resource) => {
    const value = decision.after[resource.stateKey]
    return total + Math.max(0, value - resource.criticalBelow) / resource.capacity
  }, 0)
}

function MissionDebriefPanel({ missionState }) {
  const clock = getMissionClock(missionState)
  const scenario = getMissionScenario(missionState.scenarioId)
  const score = scoreMission(missionState)
  const objectives = getMissionObjectives(missionState)
  const completed = missionState.status === 'complete'
  const decisions = [...missionState.decisionHistory].reverse()
  const strongestDecision = useMemo(() => [...missionState.decisionHistory]
    .sort((a, b) => marginScore(b) - marginScore(a))[0], [missionState.decisionHistory])
  const largestTradeoff = useMemo(() => [...missionState.decisionHistory]
    .sort((a, b) => tradeoffMagnitude(b) - tradeoffMagnitude(a))[0], [missionState.decisionHistory])

  const starting = missionState.startingResources ?? missionState.hourlyHistory[0].resources
  const resourceReview = trackedResources.map((resource) => {
    const values = missionState.hourlyHistory.map((entry) => entry.resources[resource.stateKey])
    const minimum = Math.min(...values)
    return {
      ...resource,
      initial: starting[resource.stateKey],
      final: missionState.resources[resource.stateKey],
      delta: missionState.resources[resource.stateKey] - starting[resource.stateKey],
      minimum,
      critical: minimum <= resource.criticalBelow,
    }
  })
  const lowestMargin = resourceReview.filter((resource) => resource.critical)
  const causeResults = decisions.map((decision) => ({
    ...decision,
    changes: trackedResources
      .map((resource) => ({ ...resource, delta: decision.deltas[resource.stateKey] }))
      .filter((resource) => Math.abs(resource.delta) >= 0.001),
  }))

  return (
    <section className="debrief-panel panel" id="mission-debrief" aria-labelledby="debrief-title">
      <div className="panel-header panel-header--compact">
        <div>
          <div className="section-heading__eyebrow">MISSION REVIEW <span>/</span> {scenario.name.toUpperCase()}</div>
          <h2 id="debrief-title">Mission debrief</h2>
        </div>
        <span className={`placeholder-chip debrief-chip--${completed ? 'complete' : missionState.status === 'failed' ? 'failed' : 'active'}`}>
          {completed ? 'MISSION COMPLETE' : missionState.status === 'failed' ? 'MISSION ENDED' : 'PROVISIONAL REVIEW'}
        </span>
      </div>
      <div className="debrief-hero">
        <div><span>{completed ? 'OUTPOST WINDOW COMPLETE' : missionState.status === 'failed' ? 'MISSION RUN FAILED' : 'CURRENT SIMULATED RUN'}</span><strong>{scenario.name}</strong><p>{missionState.failureReason ?? `${clock.display} · ${missionState.elapsedHours} of 168 simulated hours`}</p></div>
        <div className="debrief-score"><small>PROJECT SCORE</small><strong>{score.total}<i> / 100</i></strong><span>{score.standard}</span></div>
      </div>

      <div className="debrief-section">
        <div className="debrief-section__heading"><Gauge size={15} /><h3>Evaluation breakdown</h3></div>
        <div className="debrief-score-categories">
          {Object.entries(score.categories).map(([id, category]) => (
            <div className="debrief-score-category" key={id}>
              <div><strong>{category.label}</strong><span>{category.score} / {category.maximum}</span></div>
              <div className="debrief-score-category__track" role="progressbar" aria-label={category.label} aria-valuemin={0} aria-valuemax={category.maximum} aria-valuenow={category.score}><span style={{ width: `${category.score / category.maximum * 100}%` }} /></div>
              <small>{category.explanation}</small>
            </div>
          ))}
        </div>
        <p className="debrief-method">{score.formula} The score is deterministic project scoring, not a NASA evaluation or operational-readiness rating.</p>
      </div>

      <div className="debrief-section">
        <div className="debrief-section__heading"><ArrowUpRight size={15} /><h3>Resource change · start to finish</h3></div>
        <div className="debrief-resource-table" role="table" aria-label="Starting and ending resource values">
          <div className="debrief-resource-table__row debrief-resource-table__row--head" role="row"><span>Resource</span><span>Start</span><span>End</span><span>Change</span><span>Run minimum</span></div>
          {resourceReview.map((resource) => (
            <div className="debrief-resource-table__row" role="row" key={resource.stateKey}>
              <strong>{resource.label}</strong><span>{format(resource.initial)} {resource.unit}</span><span>{format(resource.final)} {resource.unit}</span>
              <span className={resource.delta < 0 ? 'is-negative' : 'is-positive'}>{signed(resource.delta)} {resource.unit}</span>
              <span className={resource.critical ? 'is-negative' : ''}>{format(resource.minimum)} {resource.unit}</span>
            </div>
          ))}
        </div>
        {lowestMargin.length > 0 ? (
          <p className="debrief-risk"><CircleAlert size={14} /><span>Critical-threshold observations: {lowestMargin.map((resource) => `${resource.label} reached ${format(resource.minimum)} ${resource.unit} (threshold ${resource.criticalBelow})`).join('; ')}.</span></p>
        ) : <p className="debrief-safe"><ShieldCheck size={14} /> No recorded value for these tracked resources crossed its configured critical threshold.</p>}
      </div>

      <div className="debrief-section">
        <div className="debrief-section__heading"><BookOpenCheck size={15} /><h3>Scenario objectives</h3></div>
        <ul className="debrief-objectives">
          {objectives.map((objective) => <li key={objective.id} className={`debrief-objective debrief-objective--${objective.status}`}><span className="debrief-objective__status">{objective.status.replace('-', ' ')}</span><strong>{objective.title}</strong><p>{objective.description}</p></li>)}
        </ul>
      </div>

      <div className="debrief-section">
        <div className="debrief-section__heading"><ArrowDownRight size={15} /><h3>Recorded cause and effect</h3></div>
        {causeResults.length > 0 ? (
          <ol className="debrief-cause-list">
            {causeResults.map((decision) => (
              <li key={`${decision.eventId}-${decision.consequencesAtHour}`}>
                <div className="debrief-cause-list__meta"><span>HOUR {decision.consequencesAtHour} · {decision.severity.toUpperCase()} MODEL LABEL</span><strong>{decision.eventTitle}</strong><small>Chosen response · {decision.choiceLabel}</small></div>
                <div className="debrief-cause-list__chain" aria-label="Configured causal chain and observed consequence">
                  {decision.causalChain.map((link, index) => <span key={`${link}-${index}`}>{index > 0 && <i aria-hidden="true">↓</i>}{link}</span>)}
                  <span className="debrief-cause-list__observed">Observed one-hour resource changes: {decision.changes.length > 0 ? decision.changes.map((change) => `${change.label} ${signed(change.delta)} ${change.unit}`).join(' · ') : 'no tracked inventory change'}</span>
                </div>
                <p><strong>Configured trade-off:</strong> {decision.tradeoff}</p>
                <p className="debrief-cause-list__lesson"><strong>Lesson:</strong> {decision.lesson}</p>
              </li>
            ))}
          </ol>
        ) : <p className="debrief-empty">No event decisions were recorded in this run. The hourly resource trail and configured scenario remain available for review.</p>}
      </div>

      <div className="debrief-insights">
        <article><small>MOST PROTECTIVE RECORDED DECISION</small><strong>{strongestDecision?.choiceLabel ?? 'No decisions recorded'}</strong><p>{strongestDecision ? `At hour ${strongestDecision.consequencesAtHour}, the calculated snapshot retained ${score.decisionEvaluations.find((item) => item.eventId === strongestDecision.eventId)?.essentialThresholdsPreserved ? 'all five' : 'some'} essential resources above their configured critical thresholds.` : 'Choose event responses to create a decision record for the debrief.'}</p></article>
        <article><small>LARGEST MEASURED TRADE-OFF</small><strong>{largestTradeoff?.eventTitle ?? 'No event trade-offs recorded'}</strong><p>{largestTradeoff ? `${largestTradeoff.choiceLabel} · ${largestTradeoff.tradeoff} Observed one-hour deltas: ${trackedResources.filter((resource) => Math.abs(largestTradeoff.deltas[resource.stateKey]) >= 0.001).map((resource) => `${resource.label} ${signed(largestTradeoff.deltas[resource.stateKey])} ${resource.unit}`).join(', ') || 'no tracked resource delta'}.` : 'The run contains no student-selected event decision to compare.'}</p></article>
      </div>
      <p className="panel-footnote">Hourly values, decision records, objective status, and project score are derived from this stored local run. Any event severity text is an instructional label, not an assessed lunar hazard.</p>
    </section>
  )
}

function tradeoffMagnitude(decision) {
  return trackedResources.reduce((total, resource) => (
    total + Math.abs(decision.deltas?.[resource.stateKey] ?? 0) / resource.capacity
  ), 0)
}

export default MissionDebriefPanel
