import { MISSION_EVENT_PARAMETERS, SIMULATION_CONFIG } from './config.js'
import { getMissionScenario } from './scenarios.js'

const EVENT_DESCRIPTIONS = [
  {
    id: 'reduced-sunlight',
    facilityId: 'solar',
    title: 'Reduced local illumination',
    dayLabel: 'EVENT A',
    triggerCondition: 'Student-injected when available; represents lower local illumination.',
    description: 'Local illumination drops below the repeatable baseline curve, reducing available solar generation.',
    affectedSystems: ['Sunlight', 'Solar arrays', 'Stored power', 'Greenhouse'],
    causalChain: ['Sunlight factor', 'Solar generation', 'Stored electrical energy', 'Powered outpost systems'],
    explanation: 'The configured light multiplier reduces modeled array generation for the event duration. It does not represent a measured lunar location or forecast.',
    lesson: 'A lower energy input can shrink the stored-energy margin even when loads remain unchanged.',
    decisions: [
      {
        id: 'protect-core-services',
        label: 'Conserve power for core services',
        reason: 'Reduce optional greenhouse and nonessential electrical loads while retaining the modeled life-support, habitat-control, and water-recovery priorities.',
        tradeoff: 'The greenhouse receives less electrical demand, so modeled food output falls during this interval.',
      },
      {
        id: 'maintain-greenhouse',
        label: 'Preserve greenhouse operation',
        reason: 'Keep the greenhouse load at its configured level and shed the nonessential load.',
        tradeoff: 'This preserves modeled food production but draws more energy from storage during reduced illumination.',
      },
      {
        id: 'share-reduction',
        label: 'Share reductions across optional loads',
        reason: 'Partially reduce both greenhouse and nonessential loads.',
        tradeoff: 'This balances energy conservation with partial greenhouse output.',
      },
    ],
  },
  {
    id: 'array-interruption',
    facilityId: 'solar',
    title: 'Solar array interruption',
    dayLabel: 'EVENT B',
    triggerCondition: 'Student-injected when available; represents reduced array availability.',
    description: 'The modeled array field is temporarily unavailable for most of its configured output.',
    affectedSystems: ['Solar arrays', 'Stored power', 'Life support', 'Water recovery', 'Greenhouse'],
    causalChain: ['Array availability', 'Solar generation', 'Stored electrical energy', 'Power allocation priorities'],
    explanation: 'Array availability uses a configured educational multiplier for the event duration; it is not an equipment failure rate.',
    lesson: 'Stored energy can bridge a generation interruption, while lower-priority loads change the rate at which the reserve is used.',
    decisions: [
      {
        id: 'shed-research-loads',
        label: 'Shed greenhouse and nonessential loads',
        reason: 'Reduce both optional loads for the event interval.',
        tradeoff: 'The energy reserve is protected at the cost of modeled greenhouse production.',
      },
      {
        id: 'keep-greenhouse-on',
        label: 'Keep greenhouse equipment powered',
        reason: 'Retain the greenhouse load and remove the nonessential load.',
        tradeoff: 'Greenhouse output is retained while stored energy is drawn down faster.',
      },
      {
        id: 'moderate-array-response',
        label: 'Apply a moderate load reduction',
        reason: 'Partially curtail greenhouse and nonessential loads.',
        tradeoff: 'This keeps some greenhouse operation while reducing, but not eliminating, the extra draw on storage.',
      },
    ],
  },
  {
    id: 'water-recycling-fault',
    facilityId: 'water-recovery',
    title: 'Water-recovery interruption',
    dayLabel: 'EVENT C',
    triggerCondition: 'Student-injected when available; recovery equipment returns no modeled water.',
    description: 'The water-recovery process is interrupted; crew water use continues, but modeled recovery stops.',
    affectedSystems: ['Water inventory', 'Water recovery', 'Greenhouse', 'Stored power'],
    causalChain: ['Power to recovery equipment', 'Recovered water', 'Available water reserve', 'Greenhouse operation'],
    explanation: 'Recovery is set to zero for the event duration. Crew water use continues using the configured rate.',
    lesson: 'A recovery interruption increases net water draw. Reducing greenhouse irrigation saves water but can also reduce modeled food production.',
    decisions: [
      {
        id: 'pause-greenhouse-irrigation',
        label: 'Pause most greenhouse irrigation',
        reason: 'Reduce modeled greenhouse water use and output by the configured event-decision factors.',
        tradeoff: 'More water remains in storage, while greenhouse food production is substantially reduced.',
      },
      {
        id: 'conserve-crew-water',
        label: 'Conserve crew water and partly reduce irrigation',
        reason: 'Apply the configured conservation factors to crew use and greenhouse irrigation.',
        tradeoff: 'The model retains some greenhouse output while reducing both crew and greenhouse water withdrawals; it does not infer effects on crew welfare.',
      },
      {
        id: 'maintain-growing-plan',
        label: 'Maintain the planned growing cycle',
        reason: 'Keep crew use, irrigation, and greenhouse production at their configured rates.',
        tradeoff: 'This preserves modeled greenhouse output but draws more water while recovery is interrupted.',
      },
    ],
  },
  {
    id: 'greenhouse-interruption',
    facilityId: 'greenhouse',
    title: 'Greenhouse production interruption',
    dayLabel: 'EVENT D',
    triggerCondition: 'Student-injected when available; modeled greenhouse production is interrupted.',
    description: 'Greenhouse production pauses for the event interval while other resource processes continue.',
    affectedSystems: ['Greenhouse equipment', 'Food inventory', 'Water use', 'Stored power'],
    causalChain: ['Greenhouse production availability', 'Food production', 'Food inventory'],
    explanation: 'The greenhouse contributes no modeled food during this event. Its power and irrigation loads remain subject to the chosen operating plan.',
    lesson: 'Keeping equipment powered during a production interruption uses energy without adding food in this simplified model.',
    decisions: [
      {
        id: 'shed-greenhouse-load',
        label: 'Shed the interrupted greenhouse load',
        reason: 'Reduce greenhouse and nonessential electrical demand while production is unavailable.',
        tradeoff: 'The stored-energy reserve is protected; no greenhouse production is modeled during the interruption.',
      },
      {
        id: 'power-diagnostics',
        label: 'Keep equipment powered for diagnostics',
        reason: 'Retain greenhouse electrical demand while production remains interrupted.',
        tradeoff: 'The model draws more stored energy without food production; this represents a diagnostic-power exercise, not a repair simulation.',
      },
      {
        id: 'protect-water-loop',
        label: 'Protect recovery and reduce greenhouse demand',
        reason: 'Keep water-recovery demand intact and reduce greenhouse electrical and irrigation use.',
        tradeoff: 'This favors water recovery and stored power over greenhouse activity.',
      },
    ],
  },
  {
    id: 'increased-power-demand',
    facilityId: 'energy-storage',
    title: 'Increased mission power demand',
    dayLabel: 'EVENT E',
    triggerCondition: 'Student-injected when available; adds configured mission equipment demand.',
    description: 'An additional illustrative equipment demand is added to the hourly electrical load.',
    affectedSystems: ['Electrical power', 'Stored energy', 'Greenhouse', 'Water recovery'],
    causalChain: ['Additional equipment demand', 'Hourly electrical loads', 'Stored electrical energy'],
    explanation: 'The scenario adds a configured energy demand each hour at the lowest modeled power-allocation priority for the event duration.',
    lesson: 'Load reductions change how quickly stored energy is used; the model preserves the configured service priority order.',
    decisions: [
      {
        id: 'protect-essential-loops',
        label: 'Reduce greenhouse and nonessential loads',
        reason: 'Create the largest configured reduction in optional load while retaining modeled life support, habitat controls, and recovery priorities.',
        tradeoff: 'This reduces food production during the increased-demand interval.',
      },
      {
        id: 'preserve-greenhouse-load',
        label: 'Preserve greenhouse operation',
        reason: 'Keep the greenhouse at its configured load and shed most nonessential demand.',
        tradeoff: 'Food production is preserved, but the power reserve absorbs more of the added demand.',
      },
      {
        id: 'share-demand-reduction',
        label: 'Share reductions across optional loads',
        reason: 'Partly reduce greenhouse and nonessential demand.',
        tradeoff: 'This retains partial greenhouse output while providing a smaller reserve benefit.',
      },
    ],
  },
]

const EVENT_PARAMETERS_BY_ID = new Map(MISSION_EVENT_PARAMETERS.map((parameters) => [parameters.id, parameters]))

export const MISSION_EVENTS = EVENT_DESCRIPTIONS.map((event) => {
  const parameters = EVENT_PARAMETERS_BY_ID.get(event.id)
  return {
    ...event,
    severity: parameters.severity,
    availableAfterHours: parameters.availableAfterHours,
    durationHours: parameters.durationHours,
    environmentEffect: parameters.environmentEffect,
    decisions: event.decisions.map((decision) => ({
      ...decision,
      modifiers: parameters.decisions[decision.id] ?? {},
    })),
  }
})

export function getMissionEvent(eventId) {
  return MISSION_EVENTS.find((event) => event.id === eventId)
}

export function getMissionEvents(state) {
  const scenario = getMissionScenario(state.scenarioId)
  return MISSION_EVENTS
    .filter((event) => scenario.availableEventIds.includes(event.id))
    .map((event) => {
    const activeEffect = state.activeEvents.find((active) => active.eventId === event.id)
    const triggered = state.triggeredEventIds.includes(event.id)
    const pending = state.pendingEventId === event.id
    const availableAfterHours = scenario.eventWindows[event.id] ?? event.availableAfterHours
    const eligible = state.elapsedHours >= availableAfterHours
    const terminal = state.status === 'complete' || state.status === 'failed'
    const status = pending
      ? 'decision-required'
      : activeEffect?.remainingHours > 0 && !terminal
        ? 'active'
        : triggered
          ? 'resolved'
          : terminal
            ? 'not-run'
            : eligible
              ? 'available'
              : 'scheduled'
    const canTrigger = status === 'available' && state.status === 'active'
      && state.pendingEventId === null

    return {
      ...event,
      availableAfterHours,
      status,
      canTrigger,
      remainingHours: activeEffect?.remainingHours ?? 0,
      hoursUntilAvailable: Math.max(0, availableAfterHours - state.elapsedHours),
    }
  })
}

export function triggerMissionEvent(state, eventId) {
  const event = getMissionEvent(eventId)
  const eventStatus = getMissionEvents(state).find((item) => item.id === eventId)

  if (!event || !eventStatus?.canTrigger) return state

  return {
    ...state,
    pendingEventId: eventId,
    triggeredEventIds: [...state.triggeredEventIds, eventId],
  }
}

export function tickEventEffects(activeEvents) {
  return activeEvents
    .map((event) => ({ ...event, remainingHours: Math.max(0, event.remainingHours - 1) }))
    .filter((event) => event.remainingHours > 0)
}

export function isKnownMissionEvent(eventId) {
  return Boolean(getMissionEvent(eventId))
}

export function isValidEventDuration(eventId, hours) {
  const event = getMissionEvent(eventId)
  return Boolean(event && Number.isInteger(hours) && hours >= 0 && hours <= event.durationHours)
}

export function getMissionDurationHours() {
  return SIMULATION_CONFIG.mission.durationDays * SIMULATION_CONFIG.mission.hoursPerDay
}
