import { SIMULATION_CONFIG } from './config.js'

const baselineResources = Object.fromEntries(
  Object.values(SIMULATION_CONFIG.resources).map(({ stateKey, initial }) => [stateKey, initial]),
)

export const MISSION_SCENARIOS = [
  {
    id: 'seven-day-survival',
    number: '01',
    name: 'Seven-day survival',
    shortName: 'Seven-day survival',
    subtitle: 'Keep the outpost operating for 168 hours.',
    cinematicIntroduction: 'Seven days of linked systems. Every manual step changes the mission state.',
    briefing: 'Maintain resource reserves and habitat condition while responding to the configured mission events. The clock advances only when you choose a step.',
    educationalExplanation: 'Follow how electrical supply affects life support, water recovery, greenhouse output, and the habitat condition index.',
    difficulty: 'Foundation',
    startingResources: { ...baselineResources },
    initialConditions: 'Configured baseline resource inventories and the repeatable educational illumination curve.',
    environmentalFactors: { sunlightMultiplier: 1, arrayPerformanceMultiplier: 1, waterRecoveryMultiplier: 1, greenhouseProductionMultiplier: 1 },
    powerLoadOverrides: {},
    availableEventIds: ['reduced-sunlight', 'array-interruption', 'water-recycling-fault', 'greenhouse-interruption', 'increased-power-demand'],
    eventWindows: {},
    constraints: ['168-hour mission window', 'Manual clock only', 'Five controlled events can be resolved once per run'],
    failureCriteria: ['Oxygen, water, or food inventory reaches zero', 'Habitat condition index reaches zero'],
    completionCriteria: 'Reach 168 simulated hours without a configured mission failure; scenario objectives are scored separately.',
    objectives: [
      { id: 'duration', type: 'duration', title: 'Complete 168 simulated hours', description: 'Advance the mission to the end of its seven-day window.', targetHours: 168 },
      { id: 'oxygen-reserve', type: 'minimum-resource', title: 'Protect oxygen reserve', description: 'Keep oxygen above its configured critical threshold throughout the run.', resourceKey: 'oxygenKg', threshold: 4 },
      { id: 'habitat-condition', type: 'minimum-resource', title: 'Maintain habitat condition', description: 'Keep the illustrative habitat index above its critical threshold.', resourceKey: 'habitatCondition', threshold: 45 },
      { id: 'event-responses', type: 'decision-count', title: 'Resolve two mission events', description: 'Choose and apply responses to two distinct eligible events.', eventIds: ['reduced-sunlight', 'array-interruption', 'water-recycling-fault', 'greenhouse-interruption', 'increased-power-demand'], requiredCount: 2 },
    ],
  },
  {
    id: 'darkness-challenge',
    number: '02',
    name: 'The darkness challenge',
    shortName: 'Darkness challenge',
    subtitle: 'Protect essential systems during reduced sunlight.',
    cinematicIntroduction: 'The array field begins under a reduced educational illumination factor. Stored energy becomes a tighter resource.',
    briefing: 'Prioritize essential services as the configured light multiplier limits generation. Use event responses to manage optional loads and understand the power allocation order.',
    educationalExplanation: 'Compare energy generation, stored energy, requested loads, and the service fractions recorded by the existing model.',
    difficulty: 'Advanced',
    startingResources: { ...baselineResources, energyKwh: 58, waterL: 620, foodKg: 78 },
    initialConditions: 'Reduced modeled sunlight and array performance from the first hour; no measured lunar lighting data is used.',
    environmentalFactors: { sunlightMultiplier: 0.38, arrayPerformanceMultiplier: 0.82, waterRecoveryMultiplier: 1, greenhouseProductionMultiplier: 1 },
    powerLoadOverrides: {},
    availableEventIds: ['reduced-sunlight', 'array-interruption', 'increased-power-demand'],
    eventWindows: { 'reduced-sunlight': 24, 'array-interruption': 48, 'increased-power-demand': 72 },
    constraints: ['Reduced light and array factors apply each hour', 'Optional-load decisions do not change the configured service priority order'],
    failureCriteria: ['Standard mission failure rules apply', 'Scenario reserve objectives can fail before inventory depletion'],
    completionCriteria: 'Reach 168 simulated hours without exhausting a resource or reaching zero habitat condition; complete the scenario objectives for the full objective score.',
    objectives: [
      { id: 'duration', type: 'duration', title: 'Complete 168 simulated hours', description: 'Reach the end of the seven-day mission window.', targetHours: 168 },
      { id: 'energy-reserve', type: 'minimum-resource', title: 'Protect stored energy', description: 'Keep the energy inventory above its configured critical threshold.', resourceKey: 'energyKwh', threshold: 18 },
      { id: 'life-support', type: 'minimum-pathway', title: 'Preserve life-support allocation', description: 'Keep the modeled life-support pathway fully supplied during every recorded hour.', pathway: 'lifeSupportAvailability', threshold: 0.999 },
      { id: 'power-decisions', type: 'decision-count', title: 'Respond to a power event', description: 'Resolve at least one reduced-light, array, or power-demand event.', eventIds: ['reduced-sunlight', 'array-interruption', 'increased-power-demand'], requiredCount: 1 },
    ],
  },
  {
    id: 'water-recovery-crisis',
    number: '03',
    name: 'Water recovery crisis',
    shortName: 'Water recovery',
    subtitle: 'Maintain water availability during a recovery interruption.',
    cinematicIntroduction: 'Water recovery starts at a reduced modeled availability. A controlled interruption can test the outpost’s response.',
    briefing: 'Protect the water inventory, watch greenhouse water availability, and choose a response when the recovery event is available.',
    educationalExplanation: 'Crew use, recovery allocation, irrigation, and water reserve are linked by explicit educational equations.',
    difficulty: 'Advanced',
    startingResources: { ...baselineResources, energyKwh: 68, waterL: 285, foodKg: 75 },
    initialConditions: 'Water recovery has a 35% illustrative availability multiplier before event effects.',
    environmentalFactors: { sunlightMultiplier: 0.88, arrayPerformanceMultiplier: 1, waterRecoveryMultiplier: 0.35, greenhouseProductionMultiplier: 1 },
    powerLoadOverrides: {},
    availableEventIds: ['water-recycling-fault', 'greenhouse-interruption', 'reduced-sunlight'],
    eventWindows: { 'water-recycling-fault': 24, 'greenhouse-interruption': 48, 'reduced-sunlight': 72 },
    constraints: ['Recovery availability is reduced from mission start', 'Water use continues during a recovery interruption'],
    failureCriteria: ['Standard mission failure rules apply', 'Water-reserve objective fails if the minimum recorded inventory crosses its threshold'],
    completionCriteria: 'Reach 168 simulated hours without a configured mission failure; preserve the water and pathway objectives for full objective credit.',
    objectives: [
      { id: 'duration', type: 'duration', title: 'Complete 168 simulated hours', description: 'Reach the end of the seven-day mission window.', targetHours: 168 },
      { id: 'water-reserve', type: 'minimum-resource', title: 'Protect water reserve', description: 'Keep water above the configured critical inventory threshold throughout the run.', resourceKey: 'waterL', threshold: 80 },
      { id: 'recovery-response', type: 'decision-count', title: 'Resolve the recovery interruption', description: 'Choose a response to the water-recovery event.', eventIds: ['water-recycling-fault'], requiredCount: 1 },
      { id: 'greenhouse-water', type: 'minimum-pathway', title: 'Maintain greenhouse water availability', description: 'Keep the modeled greenhouse water pathway above 25% for recorded hours.', pathway: 'greenhouseWaterAvailability', threshold: 0.25 },
    ],
  },
  {
    id: 'greenhouse-life-support',
    number: '04',
    name: 'Greenhouse vs life support',
    shortName: 'Greenhouse vs life support',
    subtitle: 'Balance optional production with essential services.',
    cinematicIntroduction: 'A larger configured greenhouse load competes for a smaller energy reserve while life support remains first in the model priority order.',
    briefing: 'Inspect the power allocation fractions and choose how to handle added demand and greenhouse interruptions. Protect the modeled life-support pathway.',
    educationalExplanation: 'This scenario makes the configured load order and trade-offs visible; it is not a real habitat operating procedure.',
    difficulty: 'Advanced',
    startingResources: { ...baselineResources, energyKwh: 52, waterL: 470, foodKg: 66 },
    initialConditions: 'Greenhouse requested load is raised by 35% and the initial stored energy is reduced.',
    environmentalFactors: { sunlightMultiplier: 0.82, arrayPerformanceMultiplier: 1, waterRecoveryMultiplier: 1, greenhouseProductionMultiplier: 1 },
    powerLoadOverrides: { greenhouse: 1.35 },
    availableEventIds: ['increased-power-demand', 'greenhouse-interruption', 'water-recycling-fault', 'array-interruption'],
    eventWindows: { 'increased-power-demand': 24, 'greenhouse-interruption': 48, 'water-recycling-fault': 72, 'array-interruption': 96 },
    constraints: ['Greenhouse demand is 35% higher than the baseline configuration', 'Configured power priority remains unchanged'],
    failureCriteria: ['Standard mission failure rules apply', 'Life-support objective fails if any recorded allocation is below full availability'],
    completionCriteria: 'Reach 168 simulated hours without a configured mission failure; maintain the scenario life-support and water objectives for full objective credit.',
    objectives: [
      { id: 'duration', type: 'duration', title: 'Complete 168 simulated hours', description: 'Reach the end of the seven-day mission window.', targetHours: 168 },
      { id: 'life-support', type: 'minimum-pathway', title: 'Protect life-support allocation', description: 'Keep the modeled life-support pathway fully supplied for all recorded hours.', pathway: 'lifeSupportAvailability', threshold: 0.999 },
      { id: 'water-reserve', type: 'minimum-resource', title: 'Maintain water reserve', description: 'Keep water above the configured critical threshold throughout the run.', resourceKey: 'waterL', threshold: 80 },
      { id: 'tradeoff-decision', type: 'decision-count', title: 'Make a greenhouse trade-off', description: 'Resolve an event that changes greenhouse or power demand.', eventIds: ['increased-power-demand', 'greenhouse-interruption', 'water-recycling-fault', 'array-interruption'], requiredCount: 1 },
    ],
  },
  {
    id: 'resource-emergency',
    number: '05',
    name: 'Resource emergency',
    shortName: 'Resource emergency',
    subtitle: 'Prioritize systems with restricted initial reserves.',
    cinematicIntroduction: 'The outpost begins with low modeled inventories and a narrow energy margin. Identify risks before selecting optional loads.',
    briefing: 'Read the reserve warnings, respond deliberately to events, and determine how long the configured systems can remain above critical thresholds.',
    educationalExplanation: 'The starting values are a challenge configuration, not a prediction, safety limit, or NASA reserve standard.',
    difficulty: 'Expert',
    startingResources: { ...baselineResources, energyKwh: 31, oxygenKg: 9, waterL: 145, foodKg: 20, habitatCondition: 70 },
    initialConditions: 'Restricted educational reserves, reduced energy storage, and 80% of the baseline illumination factor.',
    environmentalFactors: { sunlightMultiplier: 0.8, arrayPerformanceMultiplier: 1, waterRecoveryMultiplier: 1, greenhouseProductionMultiplier: 1 },
    powerLoadOverrides: {},
    availableEventIds: ['reduced-sunlight', 'array-interruption', 'water-recycling-fault', 'greenhouse-interruption', 'increased-power-demand'],
    eventWindows: { 'reduced-sunlight': 0, 'array-interruption': 0, 'water-recycling-fault': 24, 'greenhouse-interruption': 48, 'increased-power-demand': 72 },
    constraints: ['Low starting energy, oxygen, water, food, and habitat index', 'All available event responses are student-selected'],
    failureCriteria: ['Standard mission failure rules apply', 'Critical-reserve objectives can fail before standard mission failure'],
    completionCriteria: 'Reach 168 simulated hours without a configured mission failure; complete the reserve and early-response objectives for full objective credit.',
    objectives: [
      { id: 'duration', type: 'duration', title: 'Extend the mission', description: 'Advance toward the 168-hour window without exhausting modeled resources.', targetHours: 168 },
      { id: 'oxygen-reserve', type: 'minimum-resource', title: 'Protect oxygen reserve', description: 'Keep oxygen above the configured critical threshold.', resourceKey: 'oxygenKg', threshold: 4 },
      { id: 'water-reserve', type: 'minimum-resource', title: 'Protect water reserve', description: 'Keep water above the configured critical threshold.', resourceKey: 'waterL', threshold: 80 },
      { id: 'early-response', type: 'decision-count', title: 'Resolve an early risk', description: 'Choose a response to one of the events available in the opening window.', eventIds: ['reduced-sunlight', 'array-interruption'], requiredCount: 1 },
    ],
  },
]

const scenarioById = new Map(MISSION_SCENARIOS.map((scenario) => [scenario.id, scenario]))

export function getMissionScenario(scenarioId) {
  return scenarioById.get(scenarioId) ?? MISSION_SCENARIOS[0]
}

export function getMissionConfig(scenarioId) {
  const scenario = getMissionScenario(scenarioId)
  return {
    ...SIMULATION_CONFIG,
    rates: {
      ...SIMULATION_CONFIG.rates,
      powerLoadsKwhPerHour: {
        ...SIMULATION_CONFIG.rates.powerLoadsKwhPerHour,
        ...scenario.powerLoadOverrides,
      },
    },
  }
}

export function isKnownScenario(scenarioId) {
  return scenarioById.has(scenarioId)
}
