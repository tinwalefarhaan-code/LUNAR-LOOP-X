import { BookOpen, Compass } from 'lucide-react'
import { LEVEL_BY_ID } from '../learning/levelData.js'

function LearningWorldOverlay({ progress, onOpen, onModeChange }) {
  const level = LEVEL_BY_ID.get(progress.currentLevelId)
  const explorer = progress.mode === 'explorer'

  return (
    <div className="learning-world-overlay" aria-label="Learning mode controls">
      <div className="learning-world-overlay__mode" role="group" aria-label="Learning mode">
        <button type="button" aria-pressed={explorer} className={explorer ? 'is-active' : ''} onClick={() => onModeChange('explorer')}><Compass size={13} /> Explore</button>
        <button type="button" aria-pressed={!explorer} className={!explorer ? 'is-active' : ''} onClick={() => onModeChange('mission')}><BookOpen size={13} /> Mission</button>
      </div>
      <button className="learning-world-overlay__lesson" type="button" onClick={onOpen}>
        <span><small>{explorer ? 'FREE EXPLORATION' : `LEVEL ${level?.number ?? '01'} · MISSION MODE`}</small><strong>{explorer ? 'Explore the Moon at your pace' : level?.objective}</strong></span><BookOpen size={15} />
      </button>
    </div>
  )
}

export default LearningWorldOverlay
