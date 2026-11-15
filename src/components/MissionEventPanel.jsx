import { AlertTriangle, BatteryCharging, Crosshair, Droplets, Leaf, Sun, Zap } from 'lucide-react'
import { getMissionEvents } from '../simulation/eventEngine.js'
import { structureList } from '../data/structureData.js'

const eventIcons = {
  'reduced-sunlight': Sun,
  'array-interruption': BatteryCharging,
  'water-recycling-fault': Droplets,
  'greenhouse-interruption': Leaf,
  'increased-power-demand': Zap,
}

const statusLabels = {
  scheduled: 'Scheduled',
  available: 'Available',
  'decision-required': 'Choose response',
  active: 'Active',
  resolved: 'Resolved',
  'not-run': 'Not run',
}

function MissionEventPanel({ missionState, onTriggerEvent, onResolveDecision, onFocusFacility }) {
  const events = getMissionEvents(missionState)
  const surfacedEvent = events.find((event) => event.status === 'decision-required')
    ?? events.find((event) => event.status === 'available')
    ?? events.find((event) => event.status === 'active')

  return (
    <section className="events-panel panel" id="mission-events" aria-labelledby="events-title">
      <div className="panel-header panel-header--compact">
        <div>
          <div className="section-heading__eyebrow">CONTROLLED SCENARIOS <span> / </span> 05 EVENTS</div>
          <h2 id="events-title">Mission events</h2>
        </div>
        <span className="count-chip">{String(events.length).padStart(2, '0')}</span>
      </div>
      <p className="event-panel-intro">Events are deterministic and student-triggered when eligible. Triggering pauses the clock until you select a response.</p>
      {surfacedEvent && (
        <div className={`mission-event-alert mission-event-alert--${surfacedEvent.status}`} role={surfacedEvent.status === 'decision-required' ? 'alert' : 'status'}>
          <AlertTriangle size={17} />
          <div><small>{surfacedEvent.status === 'decision-required' ? 'DECISION REQUIRED' : surfacedEvent.status === 'available' ? 'NEW EVENT AVAILABLE' : 'ACTIVE EVENT'}</small><strong>{surfacedEvent.title}</strong><span>Affected facility · {structureList.find((structure) => structure.id === surfacedEvent.facilityId)?.shortName ?? 'Outpost systems'}</span></div>
          {onFocusFacility && <button type="button" onClick={() => onFocusFacility(surfacedEvent.facilityId)} aria-label={`Focus ${surfacedEvent.facilityId} in the lunar scene`}><Crosshair size={15} /> Focus</button>}
        </div>
      )}
      <div className="event-list">
        {events.map((event) => {
          const Icon = eventIcons[event.id]
          const pending = event.status === 'decision-required'
          const currentActive = event.status === 'active'
          const statusTone = event.status === 'resolved'
            ? 'neutral'
            : event.status === 'active' || event.status === 'decision-required'
              ? 'amber'
              : 'blue'

          return (
            <article className={`event-item event-item--${event.status}`} key={event.id}>
              <span className={`event-item__icon event-item__icon--${statusTone}`}>
                <Icon size={16} aria-hidden="true" />
              </span>
              <div className="event-item__body">
                <div className="event-item__meta">
                  <span>{event.dayLabel} · {event.severity.toUpperCase()} MODEL LABEL</span>
                  <span className={`event-status event-status--${statusTone}`}>{statusLabels[event.status]}</span>
                </div>
                <h3>{event.title}</h3>
                <p className="event-item__facility">Affected facility · {structureList.find((structure) => structure.id === event.facilityId)?.name ?? 'Outpost systems'}</p>
                <p>{event.description}</p>
                <p className="event-item__trigger"><strong>Trigger condition:</strong> {event.triggerCondition} Available after {event.availableAfterHours} elapsed hours; active duration {event.durationHours} hours.</p>
                <div className="event-system-tags" aria-label={`Affected systems: ${event.affectedSystems.join(', ')}`}>
                  {event.affectedSystems.map((system) => <span key={system}>{system}</span>)}
                </div>

                {pending && (
                  <div className="event-decision-list">
                    <strong className="event-decision-list__heading">Choose a modeled response</strong>
                    {event.decisions.map((decision) => (
                      <button
                        className="event-decision"
                        type="button"
                        key={decision.id}
                        disabled={missionState.status !== 'active'}
                        onClick={() => onResolveDecision(event.id, decision.id)}
                      >
                        <span className="event-decision__title">{decision.label}</span>
                        <span>{decision.reason}</span>
                        <small><strong>Trade-off:</strong> {decision.tradeoff}</small>
                        <span className="event-decision__action">{missionState.status === 'active' ? 'Apply choice · calculate next hour' : 'Resume mission to apply'}</span>
                      </button>
                    ))}
                  </div>
                )}

                {currentActive && (
                  <p className="event-item__runtime">Applied for {event.remainingHours} more simulated hour{event.remainingHours === 1 ? '' : 's'}.</p>
                )}
                {event.status === 'available' && (
                  <button
                    className="event-trigger-button"
                    type="button"
                    disabled={!event.canTrigger}
                    onClick={() => onTriggerEvent(event.id)}
                  >
                    {missionState.pendingEventId
                      ? 'Resolve current event first'
                      : missionState.status === 'active'
                        ? 'Trigger scenario'
                      : missionState.status === 'paused'
                        ? 'Resume mission to trigger'
                        : 'Unavailable for this run'}
                  </button>
                )}
                {event.status === 'scheduled' && (
                  <p className="event-item__runtime">Available after {event.availableAfterHours} elapsed hours · {event.hoursUntilAvailable} simulated hours remaining.</p>
                )}
                {event.status === 'resolved' && <p className="event-item__runtime">Resolved for this mission run; it will not repeat until reset.</p>}
                {event.status === 'not-run' && <p className="event-item__runtime">The mission ended before this scenario was triggered.</p>}
              </div>
            </article>
          )
        })}
      </div>
      <p className="panel-footnote">All event severity, timing, durations, and effects are configurable educational assumptions; no random damage is used.</p>
    </section>
  )
}

export default MissionEventPanel
