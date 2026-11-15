import { Atom, BookOpen, Link2, ScanSearch, TriangleAlert } from 'lucide-react'

function ScienceInsightPanel({ structure, inspection }) {
  if (!structure) {
    return <div className="science-insight science-insight--empty">Select a facility to open its science insight.</div>
  }

  const science = structure.science

  return (
    <article className="science-insight" aria-labelledby="science-insight-title">
      <div className="science-insight__heading">
        <span className="science-insight__icon"><Atom size={16} /></span>
        <div><small>SCIENCE INSIGHT · EDUCATIONAL</small><h3 id="science-insight-title">{structure.name}</h3></div>
      </div>
      <section className="science-insight__section">
        <h4><BookOpen size={14} /> General scientific concept</h4>
        <p>{science.concept}</p>
      </section>
      <section className="science-insight__section">
        <h4><ScanSearch size={14} /> What affects this system</h4>
        <ul>{science.affectedBy.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="science-insight__section">
        <h4><Link2 size={14} /> Connected systems</h4>
        <div className="science-insight__tags">{science.dependsOn.map((item) => <span key={item}>{item}</span>)}</div>
      </section>
      {inspection?.metrics?.length > 0 && (
        <section className="science-insight__readout" aria-label="Current educational simulation values">
          <h4>Current model readout</h4>
          {inspection.metrics.map((item) => (
            <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>
          ))}
        </section>
      )}
      <section className="science-insight__classification">
        <div><strong>Project representation</strong><p>{science.modelRepresents}</p></div>
        <div><strong>Model limits</strong><p>{science.modelOmits}</p></div>
      </section>
      {inspection?.relevantEvents?.length > 0 && (
        <div className="science-insight__event">
          <TriangleAlert size={14} />
          <span><strong>{inspection.currentEventStatus ?? 'Related mission event'}</strong> · {inspection.relevantEvents.map((event) => event.title).join(', ')}</span>
        </div>
      )}
      <p className="science-insight__note">General science context and configured project assumptions are labeled separately. This is not NASA telemetry or an engineering specification.</p>
    </article>
  )
}

export default ScienceInsightPanel
