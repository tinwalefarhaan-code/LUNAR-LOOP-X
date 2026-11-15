import { useState } from 'react'
import { ArrowRight, Compass, Gauge } from 'lucide-react'
import { RESOURCE_DEFINITIONS } from '../simulation/config.js'
import { MISSION_EVENTS } from '../simulation/eventEngine.js'
import { MISSION_SCENARIOS } from '../simulation/scenarios.js'

function MissionSelectionPanel({ missionState, onLaunch }) {
  const [confirmScenarioId, setConfirmScenarioId] = useState(null)
  const replacingRun = missionState.status === 'active' || missionState.status === 'paused'

  return (
    <section className="scenario-selection" aria-label="Available lunar mission scenarios">
      <p className="scenario-selection__intro">
        Choose a configured mission exercise. Each launch begins a new deterministic run; all values are educational assumptions.
      </p>
      {replacingRun && (
        <p className="scenario-selection__notice" role="status">
          Launching a scenario replaces the current unfinished run. Terminal runs are saved locally for comparison.
        </p>
      )}
      <div className="scenario-list">
        {MISSION_SCENARIOS.map((scenario) => (
          <article className={`scenario-card${missionState.scenarioId === scenario.id ? ' scenario-card--current' : ''}`} key={scenario.id}>
            <div className="scenario-card__topline">
              <span className="scenario-card__number">MISSION {scenario.number}</span>
              <span className="scenario-card__difficulty"><Gauge size={12} /> {scenario.difficulty}</span>
            </div>
            <h3>{scenario.name}</h3>
            <p className="scenario-card__subtitle">{scenario.subtitle}</p>
            <p className="scenario-card__briefing">{scenario.briefing}</p>
            <div className="scenario-card__meta">
              <span><Compass size={12} /> {scenario.availableEventIds.length} configured events</span>
              <span>{scenario.objectives.length} measurable objectives</span>
            </div>
            <details className="scenario-card__details">
              <summary>Mission profile · objectives, conditions &amp; constraints</summary>
              <p className="scenario-card__cinematic">{scenario.cinematicIntroduction}</p>
              <p><strong>Starting resource configuration:</strong> {RESOURCE_DEFINITIONS.map((resource) => `${resource.label} ${scenario.startingResources[resource.stateKey]} ${resource.unit}`).join(' · ')}.</p>
              <p><strong>Available events:</strong> {scenario.availableEventIds.map((eventId) => MISSION_EVENTS.find((event) => event.id === eventId)?.title ?? eventId).join(' · ')}.</p>
              <p><strong>Starting conditions:</strong> {scenario.initialConditions}</p>
              <p><strong>Completion:</strong> {scenario.completionCriteria}</p>
              <p><strong>Failure criteria:</strong> {scenario.failureCriteria.join('; ')}.</p>
              <p><strong>Learning focus:</strong> {scenario.educationalExplanation}</p>
              <div><strong>Constraints</strong><ul>{scenario.constraints.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><strong>Objectives</strong><ul>{scenario.objectives.map((objective) => <li key={objective.id}>{objective.title} — {objective.description}</li>)}</ul></div>
            </details>
            {confirmScenarioId === scenario.id ? (
              <div className="scenario-card__confirm" role="group" aria-label={`Confirm starting ${scenario.name}`}>
                <span>This replaces the current run. Saved terminal runs stay in your local archive.</span>
                <button type="button" onClick={() => onLaunch(scenario.id)}>Confirm launch <ArrowRight size={14} /></button>
                <button type="button" onClick={() => setConfirmScenarioId(null)}>Keep current run</button>
              </div>
            ) : (
              <button className="scenario-card__launch" type="button" onClick={() => replacingRun ? setConfirmScenarioId(scenario.id) : onLaunch(scenario.id)}>
                {replacingRun ? 'Select scenario' : 'Launch mission'} <ArrowRight size={14} />
              </button>
            )}
          </article>
        ))}
      </div>
      <p className="scenario-selection__disclaimer">Mission runs are educational simulations stored in this browser. They are not real lunar mission records or NASA evaluations.</p>
    </section>
  )
}

export default MissionSelectionPanel
