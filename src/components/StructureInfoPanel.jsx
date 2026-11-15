import { Activity, Info, ShieldCheck } from 'lucide-react'

function StructureInfoPanel({ structure, simulationStatus, inspection }) {
  if (!structure) {
    return (
      <div className="structure-info structure-info--empty" role="status">
        <Info size={17} />
        <span>Select a structure in the viewport or structure guide to inspect its role.</span>
      </div>
    )
  }

  return (
    <article className="structure-info" aria-labelledby="selected-structure-title">
      <div className="structure-info__heading">
        <div>
          <div className="section-heading__eyebrow">SELECTED STRUCTURE</div>
          <h3 id="selected-structure-title">{structure.name}</h3>
        </div>
        <span className="structure-demo-status"><ShieldCheck size={13} /> DEMO MODEL</span>
      </div>

      <div className="structure-info__grid">
        <div className="structure-info__block">
          <span className="structure-info__label">PURPOSE</span>
          <p>{structure.purpose}</p>
        </div>
        <div className="structure-info__block">
          <span className="structure-info__label">SYSTEMS SUPPORTED</span>
          <div className="system-tags">
            {structure.systems.map((system) => <span key={system}>{system}</span>)}
          </div>
        </div>
      </div>

      <div className="structure-explanation">
        <Activity size={15} aria-hidden="true" />
        <p><strong>Why it matters</strong>{structure.explanation}</p>
      </div>

      <div className="structure-info__status">
        <span className="structure-info__status-label">CURRENT SIMULATION STATUS</span>
        <span className={`structure-simulation-status structure-simulation-status--${simulationStatus?.tone ?? 'context'}`}>
          {simulationStatus?.label ?? structure.demoStatus}
        </span>
        <span>{simulationStatus?.detail ?? structure.demoStatus}</span>
      </div>

      {inspection?.metrics?.length > 0 && (
        <div className="structure-metrics" aria-label="Current simulation readout">
          <span className="structure-info__status-label">SIMULATION READOUT</span>
          <div className="structure-metrics__grid">
            {inspection.metrics.map((item) => (
              <div className="structure-metrics__item" key={item.label}>
                <span>{item.label}</span><strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {inspection?.relevantEvents?.length > 0 && (
        <div className="structure-active-events" role="status">
          <span>{inspection.currentEventStatus ?? 'Related mission event'}</span>
          <strong>{inspection.relevantEvents.map((event) => event.title).join(' · ')}</strong>
        </div>
      )}
    </article>
  )
}

export default StructureInfoPanel
