import { ArrowDownRight, ArrowUpRight, Info, Sparkles } from 'lucide-react'
import { RESOURCE_DEFINITIONS } from '../simulation/config.js'
import { createMissionAdvice } from '../simulation/advisorEngine.js'
import { getDependencyDisplay } from '../simulation/selectors.js'

function formatDelta(value, unit) {
  const rounded = Math.round(value * 100) / 100
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(2)} ${unit}`
}

function DecisionOutcome({ outcome }) {
  if (!outcome) {
    return (
      <div className="intelligence-empty">
        <Info size={15} aria-hidden="true" />
        <span>Choose a controlled event response to see its calculated resource deltas and cause-and-effect explanation here.</span>
      </div>
    )
  }

  const changedResources = RESOURCE_DEFINITIONS.filter((resource) => (
    Math.abs(outcome.deltas[resource.stateKey]) > 0.0001
  ))

  return (
    <article className="decision-outcome">
      <div className="decision-outcome__heading">
        <div>
          <span className="intelligence-section-label">LATEST STUDENT DECISION · AFTER HOUR {outcome.consequencesAtHour}</span>
          <h3>{outcome.eventTitle}</h3>
        </div>
        <span className="decision-outcome__choice">{outcome.choiceLabel}</span>
      </div>
      <div className="decision-outcome__block">
        <strong>What happened</strong>
        <p>{outcome.reason}</p>
      </div>
      <div className="dependency-chain" aria-label="Cause and effect chain">
        {outcome.causalChain.map((step, index) => (
          <span className="dependency-chain__step" key={`${step}-${index}`}>
            {index > 0 && <ArrowDownRight size={13} aria-hidden="true" />}
            <span>{step}</span>
          </span>
        ))}
      </div>
      <div className="decision-outcome__block">
        <strong>Why it happened</strong>
        <p>{outcome.explanation}</p>
      </div>
      <div className="decision-outcome__block">
        <strong>Systems affected</strong>
        <div className="event-system-tags">
          {outcome.affectedSystems.map((system) => <span key={system}>{system}</span>)}
        </div>
      </div>
      <div className="resource-delta-list" aria-label="Calculated resource changes during the decision hour">
        <strong>Resource change · before to after one simulated hour</strong>
        {changedResources.length === 0
          ? <span>No displayed inventory changed in that step.</span>
          : changedResources.map((resource) => {
            const delta = outcome.deltas[resource.stateKey]
            const DeltaIcon = delta < 0 ? ArrowDownRight : ArrowUpRight
            return (
              <span className={`resource-delta resource-delta--${delta < 0 ? 'down' : 'up'}`} key={resource.id}>
                <span>{resource.label}</span>
                <strong>
                  <DeltaIcon size={13} aria-hidden="true" />
                  {outcome.before[resource.stateKey].toFixed(1)} → {outcome.after[resource.stateKey].toFixed(1)} {resource.unit}
                  <small>({formatDelta(delta, resource.unit)})</small>
                </strong>
              </span>
            )
          })}
      </div>
      <div className="decision-outcome__block decision-outcome__tradeoff">
        <strong>Trade-off · what the student learned</strong>
        <p>{outcome.tradeoff} {outcome.lesson}</p>
      </div>
      <p className="panel-footnote">{outcome.assumptionLabel}</p>
    </article>
  )
}

function MissionIntelligencePanel({ missionState }) {
  const advice = createMissionAdvice(missionState)
  const dependencies = getDependencyDisplay(missionState)

  return (
    <section className="intelligence-panel panel" id="resource-intelligence-explainer" aria-labelledby="intelligence-title">
      <div className="panel-header panel-header--compact">
        <div>
          <div className="section-heading__eyebrow">DETERMINISTIC RULES <span> / </span> PHASE 04</div>
          <h2 id="intelligence-title">Mission dependency intelligence</h2>
        </div>
        <span className="advisor-state advisor-state--active"><span /> RULE-BASED</span>
      </div>

      <div className="intelligence-intro">
        <span className="intelligence-intro__icon"><Sparkles size={17} /></span>
        <p>Recommendations read the current model state and identify configured thresholds or dependency risks.</p>
      </div>

      <div className="advisor-recommendations">
        <div className="intelligence-section-label">MISSION ADVISOR · {advice.title.toUpperCase()}</div>
        {advice.recommendations.map((recommendation) => (
          <article className={`advisor-recommendation advisor-recommendation--${recommendation.priority}`} key={recommendation.id}>
            <strong>{recommendation.recommendation}</strong>
            <p>{recommendation.reason}</p>
          </article>
        ))}
        <p className="panel-footnote">{advice.assumption}</p>
      </div>

      <div className="dependency-map">
        <div className="intelligence-section-label">ACTIVE DEPENDENCY MAP</div>
        {dependencies.map((dependency) => (
          <div className="dependency-map__row" key={dependency.id}>
            <span className="dependency-map__path"><strong>{dependency.from}</strong><span aria-hidden="true">→</span><strong>{dependency.to}</strong></span>
            <span className="dependency-map__value">{dependency.value}</span>
            <small>{dependency.reason}</small>
          </div>
        ))}
      </div>

      <div className="decision-outcome-section">
        <div className="intelligence-section-label">CAUSE → SYSTEMS → CONSEQUENCES → LEARNING</div>
        <DecisionOutcome outcome={missionState.latestOutcome} />
      </div>
      <p className="panel-footnote"><Info size={13} /> Rule-based educational aid · not NASA AI and not an operational recommendation.</p>
    </section>
  )
}

export default MissionIntelligencePanel
