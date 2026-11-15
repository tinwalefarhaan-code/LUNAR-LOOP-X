import { Activity, AlertTriangle, Play, Radio, RotateCcw, Pause } from 'lucide-react'
import MissionObjectiveOverlay from './MissionObjectiveOverlay.jsx'
import { getMissionEvents } from '../simulation/eventEngine.js'
import { getMissionClock } from '../simulation/missionEngine.js'
import { getDashboardResources, getStructureStatuses } from '../simulation/selectors.js'
import { getMissionScenario } from '../simulation/scenarios.js'
import LearningWorldOverlay from './LearningWorldOverlay.jsx'

function MissionHud({ missionState, learningProgress, onStart, onPause, onRestart, onOpenBriefing, onOpenEvents, onOpenDebrief, onOpenLearning, onLearningModeChange }) {
  const clock = getMissionClock(missionState)
  const resources = getDashboardResources(missionState)
  const structureStatuses = getStructureStatuses(missionState)
  const flaggedResources = resources.filter((resource) => resource.status === 'critical' || resource.status === 'monitor')
  const events = getMissionEvents(missionState)
  const pendingEvent = events.find((event) => event.status === 'decision-required')
  const activeEvent = events.find((event) => event.status === 'active')
  const availableEvent = events.find((event) => event.status === 'available')
  const visibleEvent = pendingEvent ?? activeEvent ?? availableEvent
  const scenario = getMissionScenario(missionState.scenarioId)
  const missionAction = missionState.status === 'active'
    ? { label: 'Pause', icon: <Pause size={14} />, run: onPause }
    : missionState.status === 'complete' || missionState.status === 'failed'
      ? { label: 'Replay', icon: <RotateCcw size={14} />, run: onRestart }
      : { label: missionState.status === 'paused' ? 'Resume' : 'Start mission', icon: <Play size={14} />, run: onStart }
  const habitatTone = structureStatuses.habitat.tone
  const resourceWarning = flaggedResources.length > 0
    ? `${flaggedResources.slice(0, 2).map((resource) => `${resource.label} ${resource.statusLabel.toLowerCase()}`).join(' · ')}${flaggedResources.length > 2 ? ` +${flaggedResources.length - 2}` : ''}`
    : 'Systems nominal'

  return (
    <section className="mission-hud" aria-label="Mission status and controls">
      <div className="mission-hud__identity">
        <span className="mission-hud__icon"><Activity size={15} /></span>
        <div><small>MISSION ELAPSED</small><strong>D{String(clock.day).padStart(2, '0')} <i>/</i> {clock.display}</strong></div>
      </div>
      <div className="mission-hud__phase"><small>MISSION PHASE</small><strong>{scenario.shortName} · Day {clock.day}/7</strong></div>
      <div className={`mission-hud__condition mission-hud__condition--${habitatTone}`}>
        <span className="mission-hud__signal" />
        <div><small>BASE CONDITION</small><strong>{structureStatuses.habitat.label.replace('Condition · ', '')}</strong></div>
      </div>
      <button className={`mission-hud__event${pendingEvent ? ' mission-hud__event--pending' : availableEvent ? ' mission-hud__event--available' : ''}`} type="button" onClick={onOpenEvents}>
        {pendingEvent || availableEvent ? <AlertTriangle size={14} /> : <Radio size={14} />}
        <span><small>{pendingEvent ? 'RESPONSE REQUIRED' : availableEvent ? 'EVENT AVAILABLE' : activeEvent ? 'EVENT ACTIVE' : 'EVENTS'}</small><strong>{visibleEvent ? visibleEvent.title : 'No active event'}</strong></span>
      </button>
      <button className="mission-hud__action" type="button" onClick={missionAction.run}>
        {missionAction.icon}{missionAction.label}
      </button>
      {['complete', 'failed'].includes(missionState.status) && (
        <button className="mission-hud__debrief" type="button" onClick={onOpenDebrief}>Mission debrief</button>
      )}
      <button className={`mission-hud__resources${flaggedResources.length > 0 ? ' mission-hud__resources--warn' : ''}`} type="button" onClick={onOpenBriefing} aria-label={`Open mission briefing and resource details. ${resourceWarning}`}>
        {flaggedResources.length > 0 ? <AlertTriangle size={14} /> : <Activity size={14} />}
        <span>{resourceWarning}</span>
      </button>
      <span className="mission-hud__demo">DEMONSTRATION VALUES</span>
      <MissionObjectiveOverlay missionState={missionState} />
      <LearningWorldOverlay progress={learningProgress} onOpen={onOpenLearning} onModeChange={onLearningModeChange} />
    </section>
  )
}

export default MissionHud
