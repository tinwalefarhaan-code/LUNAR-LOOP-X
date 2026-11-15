import { getMissionEvent } from './eventEngine.js'

export function applyMissionDecision(state, eventId, choiceId) {
  const event = getMissionEvent(eventId)
  const choice = event?.decisions.find((decision) => decision.id === choiceId)

  if (!event || !choice || state.status !== 'active' || state.pendingEventId !== eventId) {
    return state
  }

  const activeEffect = {
    eventId: event.id,
    title: event.title,
    remainingHours: event.durationHours,
    environmentEffect: event.environmentEffect,
    decisionModifiers: choice.modifiers,
  }

  return {
    ...state,
    pendingEventId: null,
    activeEvents: [...state.activeEvents, activeEffect],
    pendingDecision: {
      event,
      choice,
    },
  }
}

export function getDecisionOptions(eventId) {
  return getMissionEvent(eventId)?.decisions ?? []
}
