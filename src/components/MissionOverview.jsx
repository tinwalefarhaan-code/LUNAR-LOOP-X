import { useState } from 'react'
import { CalendarDays, Check, Circle, CircleDot, Clock3, Pause, Play, RotateCcw, Users, X } from 'lucide-react'
import { SIMULATION_CONFIG, TOTAL_MISSION_HOURS } from '../simulation/config.js'
import { getMissionClock } from '../simulation/missionEngine.js'
import { getMissionObjectives } from '../simulation/objectiveEngine.js'
import { getMissionScenario } from '../simulation/scenarios.js'
import SegmentedTabs from './SegmentedTabs.jsx'

const briefingTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'objectives', label: 'Objectives' },
]

function MissionOverview({
  missionState,
  onStart,
  onPause,
  onAdvanceHour,
  onAdvanceDay,
  onReset,
  onRestart,
}) {
  const [activeTab, setActiveTab] = useState('overview')
  const tabSetId = 'mission-briefing'
  const clock = getMissionClock(missionState)
  const scenario = getMissionScenario(missionState.scenarioId)
  const objectives = getMissionObjectives(missionState)
  const missionActive = missionState.status === 'active'
  const missionPaused = missionState.status === 'paused'
  const missionTerminal = missionState.status === 'complete' || missionState.status === 'failed'
  const canAdvance = missionActive && !missionState.pendingEventId && !missionTerminal
  const statusLabel = missionState.status === 'active'
    ? 'MISSION ACTIVE · MANUAL CLOCK'
    : missionState.status === 'paused'
      ? 'PAUSED'
      : missionState.status === 'complete'
        ? 'MISSION COMPLETE'
        : missionState.status === 'failed'
          ? 'MISSION ENDED'
          : 'READY TO BEGIN'
  const primaryAction = missionTerminal
    ? { label: 'Replay mission', icon: <RotateCcw size={16} />, onClick: onRestart }
    : missionActive
      ? { label: 'Pause mission', icon: <Pause size={16} />, onClick: onPause }
      : missionPaused
        ? { label: 'Resume mission', icon: <Play size={16} fill="currentColor" />, onClick: onStart }
        : { label: 'Start Mission', icon: <Play size={16} fill="currentColor" />, onClick: onStart }

  return (
    <section className="mission-overview panel" aria-labelledby="mission-overview-title">
      <div className="mission-overview__main">
        <div className="panel-kicker">
          <span className="panel-kicker__line" />
          MISSION BRIEFING
          <span className="demo-pill">DEMONSTRATION VALUES</span>
        </div>
        <div className="mission-overview__heading">
          <div>
            <h2 id="mission-overview-title">{scenario.name}</h2>
            <p className="mission-overview__intro">{scenario.briefing}</p>
          </div>
            <span className={`mission-state${missionActive ? ' mission-state--active' : ''}`}>
            <span className="mission-state__dot" aria-hidden="true" />
              {statusLabel}
          </span>
        </div>

        <SegmentedTabs
          id={tabSetId}
          label="Mission briefing views"
          items={briefingTabs}
          value={activeTab}
          onChange={setActiveTab}
        />
        <div
          className="mission-overview__tab-panel"
          id={`${tabSetId}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabSetId}-tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === 'overview' ? (
            <p>
              Advance one simulated hour or day at a time. Resource flows follow documented educational assumptions and dependency rules; no clock runs in the background.
            </p>
          ) : (
              <ul className="objective-list objective-list--measured">
              {objectives.map((objective) => {
                const ObjectiveIcon = objective.status === 'completed'
                  ? Check
                  : objective.status === 'failed'
                    ? X
                    : objective.status === 'in-progress'
                      ? CircleDot
                      : Circle
                return (
                  <li className={`objective-list__item objective-list__item--${objective.status}`} key={objective.id}>
                  <ObjectiveIcon size={15} aria-hidden="true" />
                  <span><strong>{objective.title}</strong><small>{objective.status} · {objective.description}</small></span>
                  <b>{objective.progress}%</b>
                </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mission-overview__aside">
        <div className="mission-facts">
          <div className="mission-fact">
            <span className="mission-fact__icon"><CalendarDays size={16} /></span>
            <span className="mission-fact__label">MISSION DAY</span>
            <strong>{String(clock.day).padStart(2, '0')} <small>/ {String(SIMULATION_CONFIG.mission.durationDays).padStart(2, '0')}</small></strong>
            <span className="mission-fact__note">{String(clock.hour).padStart(2, '0')}:00 simulated hour</span>
          </div>
          <div className="mission-fact">
            <span className="mission-fact__icon"><Users size={16} /></span>
            <span className="mission-fact__label">CREW MANIFEST</span>
            <strong>04 <small>crew</small></strong>
            <span className="mission-fact__note">Fixed model assumption</span>
          </div>
        </div>
        <div className="mission-action">
          <div className="mission-action__copy">
            <span className="mission-action__label">{scenario.name.toUpperCase()} · 168-HOUR EXERCISE</span>
            <span className="mission-action__note">
              {missionState.pendingEventId
                ? 'Choose an event response; applying it calculates and advances one simulated hour.'
                : missionActive
                  ? 'Manual controls only. Nothing advances until you choose a step.'
                  : missionPaused
                    ? 'Resume to enable explicit hourly and daily steps.'
                    : missionTerminal
                      ? (missionState.failureReason ?? 'The seven-day simulation is complete.')
                      : 'Start a deterministic mission from the configured baseline.'}
            </span>
          </div>
          <div className="mission-control-actions">
            <button className={`button${missionActive ? ' button--secondary' : ' button--primary'}`} type="button" onClick={primaryAction.onClick}>
              {primaryAction.icon}{primaryAction.label}
            </button>
            <button className="button button--secondary" type="button" onClick={onReset} disabled={missionState.status === 'standby'}>
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        </div>
        <div className="mission-clock-controls" aria-label="Manual mission clock controls">
          <div className="mission-clock-controls__readout"><Clock3 size={15} /><span>{clock.display}</span><small>{missionState.elapsedHours} / {TOTAL_MISSION_HOURS} hours</small></div>
          <div className="mission-clock-controls__buttons">
            <button className="button button--secondary" type="button" onClick={onAdvanceHour} disabled={!canAdvance}>Advance 1 hour</button>
            <button className="button button--secondary" type="button" onClick={onAdvanceDay} disabled={!canAdvance}>Advance 1 day</button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MissionOverview
