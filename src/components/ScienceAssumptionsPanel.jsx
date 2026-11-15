import { BookOpen, CircleHelp, ShieldCheck } from 'lucide-react'

const modelNotes = [
  {
    title: 'Illustrative, deterministic values',
    text: 'Resource quantities and condition indices are configured for an educational exercise. They are not measured lunar conditions or mission specifications.',
  },
  {
    title: 'Explicit dependencies',
    text: 'The model connects sunlight to generation, electrical availability to powered systems, water to greenhouse operation, and inventories to displayed availability.',
  },
  {
    title: 'Student-controlled time',
    text: 'The clock advances only when an explicit hour or day step is selected. Event decisions apply documented modifiers within the model.',
  },
]

function ScienceAssumptionsPanel() {
  return (
    <section className="science-panel panel" aria-labelledby="science-panel-title">
      <div className="panel-header">
        <div>
          <div className="section-heading__eyebrow">MODEL TRANSPARENCY <span>/</span> EDUCATIONAL USE</div>
          <h2 id="science-panel-title">Scientific assumptions</h2>
        </div>
        <span className="science-panel__badge"><ShieldCheck size={14} /> No live data</span>
      </div>
      <p className="science-panel__intro">
        LUNAR LOOP X is a learning simulator. The mission engine is deterministic so learners can inspect how its configured assumptions produce each outcome.
      </p>
      <div className="science-panel__notes">
        {modelNotes.map((note, index) => (
          <article className="science-note" key={note.title}>
            <span className="science-note__index">0{index + 1}</span>
            <div><h3>{note.title}</h3><p>{note.text}</p></div>
          </article>
        ))}
      </div>
      <div className="science-panel__source">
        <BookOpen size={17} aria-hidden="true" />
        <p><strong>Source of truth:</strong> the project’s <code>docs/SIMULATION_ASSUMPTIONS.md</code> documents the configured equations, thresholds, dependency links, event effects, and limitations.</p>
      </div>
      <p className="science-panel__disclaimer"><CircleHelp size={14} /> This interface does not provide operational, flight, safety, or medical guidance and has no NASA API connection.</p>
    </section>
  )
}

export default ScienceAssumptionsPanel
