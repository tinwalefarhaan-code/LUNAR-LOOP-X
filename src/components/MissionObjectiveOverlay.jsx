import { useState } from 'react'
import { CheckCircle2, Circle, CircleDot, XCircle } from 'lucide-react'
import { getMissionObjectives } from '../simulation/objectiveEngine.js'

const statusLabel = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  completed: 'Completed',
  failed: 'Failed',
}

function MissionObjectiveOverlay({ missionState }) {
  const [expanded, setExpanded] = useState(false)
  const objectives = getMissionObjectives(missionState)
  const completed = objectives.filter((objective) => objective.status === 'completed').length

  return (
    <div className="objective-overlay">
      <button
        className="objective-overlay__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls="mission-objective-list"
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="objective-overlay__meter">{completed}/{objectives.length}</span>
        <span>Objectives</span>
        <small>{Math.round(objectives.reduce((sum, objective) => sum + objective.progress, 0) / Math.max(1, objectives.length))}%</small>
      </button>
      {expanded && (
        <section className="objective-overlay__panel" id="mission-objective-list" aria-label="Current mission objectives">
          <div className="objective-overlay__header"><div><small>SCENARIO OBJECTIVES</small><strong>{completed} of {objectives.length} complete</strong></div><button type="button" onClick={() => setExpanded(false)} aria-label="Close objectives"><XCircle size={16} /></button></div>
          <ol>
            {objectives.map((objective) => {
              const Icon = objective.status === 'completed'
                ? CheckCircle2
                : objective.status === 'failed'
                  ? XCircle
                  : objective.status === 'in-progress'
                    ? CircleDot
                    : Circle
              return (
                <li className={`objective-overlay__item objective-overlay__item--${objective.status}`} key={objective.id}>
                  <Icon size={15} aria-hidden="true" />
                  <span><strong>{objective.title}</strong><small>{statusLabel[objective.status]} · {objective.description}</small></span>
                  <b>{objective.progress}%</b>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}

export default MissionObjectiveOverlay
