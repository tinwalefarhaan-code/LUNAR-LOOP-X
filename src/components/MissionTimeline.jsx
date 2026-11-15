import { CheckCircle2, Circle, CircleDot, Clock3 } from 'lucide-react'
import { missionDays } from '../data/missionDemoData.js'
import { SIMULATION_CONFIG, TOTAL_MISSION_HOURS } from '../simulation/config.js'
import { getMissionClock } from '../simulation/missionEngine.js'

function MissionTimeline({ missionState }) {
  const clock = getMissionClock(missionState)
  const progress = Math.min(100, (missionState.elapsedHours / TOTAL_MISSION_HOURS) * 100)

  return (
    <section className="timeline-panel panel" aria-labelledby="timeline-title">
      <div className="panel-header panel-header--compact">
        <div>
          <div className="section-heading__eyebrow">MISSION WINDOW <span> / </span> 7 DAYS</div>
          <h2 id="timeline-title">Mission progress</h2>
        </div>
        <span className={`timeline-state${missionState.status === 'active' ? ' timeline-state--active' : ''}`}>
          {missionState.status === 'standby' ? 'STANDING BY' : missionState.status.toUpperCase()}
        </span>
      </div>

      <div className="timeline-summary">
        <span><strong>Day {String(clock.day).padStart(2, '0')}</strong> / {String(SIMULATION_CONFIG.mission.durationDays).padStart(2, '0')} <small>· {String(clock.hour).padStart(2, '0')}:00</small></span>
        <span>{missionState.elapsedHours} of {TOTAL_MISSION_HOURS} simulated hours</span>
      </div>
      <div
        className="timeline-progress"
        role="progressbar"
        aria-label="Simulated mission days complete"
        aria-valuemin={0}
        aria-valuemax={TOTAL_MISSION_HOURS}
        aria-valuenow={missionState.elapsedHours}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <ol className="timeline-days">
        {missionDays.map(({ day, label }) => {
          const current = day === clock.day && missionState.status !== 'complete'
          const complete = missionState.status === 'complete' || day < clock.day
          const Icon = complete ? CheckCircle2 : current ? CircleDot : Circle

          return (
            <li className={`timeline-day${current ? ' timeline-day--current' : ''}${complete ? ' timeline-day--complete' : ''}`} key={day}>
              <span className="timeline-day__marker"><Icon size={16} /></span>
              <span className="timeline-day__label">{label}</span>
              <span className="timeline-day__status">
                {complete ? 'Complete' : current ? (missionState.status === 'standby' ? 'Baseline' : 'Current') : 'Planned'}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="panel-footnote"><Clock3 size={13} /> Time advances only through explicit student controls; there is no background clock.</p>
    </section>
  )
}

export default MissionTimeline
