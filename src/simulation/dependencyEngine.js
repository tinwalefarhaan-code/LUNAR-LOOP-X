import { SIMULATION_CONFIG } from './config.js'
import { getMissionScenario } from './scenarios.js'

const FACTOR_KEYS = [
  'sunlightFactor',
  'arrayPerformanceFactor',
  'waterRecoveryFactor',
  'greenhouseProductionFactor',
]

function boundedFactor(value) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function multiplyFactors(left, right) {
  return FACTOR_KEYS.reduce((factors, key) => ({
    ...factors,
    [key]: factors[key] * boundedFactor(right[key] ?? 1),
  }), left)
}

function combineModifiers(activeEvents) {
  return activeEvents.reduce((combined, event) => {
    const eventEffect = event.environmentEffect ?? {}
    const decisionEffect = event.decisionModifiers ?? {}
    const factors = multiplyFactors(combined.factors, eventEffect)
    const withDecisionFactors = multiplyFactors(factors, decisionEffect)
    const powerLoadFactors = Object.keys(combined.powerLoadFactors).reduce((next, key) => ({
      ...next,
      [key]: combined.powerLoadFactors[key]
        * boundedFactor(decisionEffect.powerLoadFactors?.[key] ?? 1),
    }), {})

    return {
      factors: withDecisionFactors,
      powerLoadFactors,
      crewWaterUseFactor: combined.crewWaterUseFactor
        * boundedFactor(decisionEffect.crewWaterUseFactor ?? 1),
      greenhouseWaterUseFactor: combined.greenhouseWaterUseFactor
        * boundedFactor(decisionEffect.greenhouseWaterUseFactor ?? 1),
      extraPowerKwhPerHour: combined.extraPowerKwhPerHour
        + Math.max(0, Number.isFinite(eventEffect.extraPowerKwhPerHour)
          ? eventEffect.extraPowerKwhPerHour
          : 0),
    }
  }, {
    factors: {
      sunlightFactor: 1,
      arrayPerformanceFactor: 1,
      waterRecoveryFactor: 1,
      greenhouseProductionFactor: 1,
    },
    powerLoadFactors: Object.fromEntries(
      Object.keys(SIMULATION_CONFIG.rates.powerLoadsKwhPerHour).map((key) => [key, 1]),
    ),
    crewWaterUseFactor: 1,
    greenhouseWaterUseFactor: 1,
    extraPowerKwhPerHour: 0,
  })
}

export function getHourlyConditions(state, config = SIMULATION_CONFIG) {
  const scenario = getMissionScenario(state.scenarioId)
  const { hoursPerDay } = config.mission
  const hourOfDay = state.elapsedHours % hoursPerDay
  const activeEvents = state.activeEvents.filter((event) => event.remainingHours > 0)
  const modifiers = combineModifiers(activeEvents)
  const profileFactor = config.sunlightHourlyProfile[hourOfDay] ?? 0
  const environment = scenario.environmentalFactors

  return {
    hourOfDay,
    activeEvents,
    activeEventIds: activeEvents.map((event) => event.eventId),
    sunlightFactor: boundedFactor(profileFactor * environment.sunlightMultiplier * modifiers.factors.sunlightFactor),
    arrayPerformanceFactor: boundedFactor(environment.arrayPerformanceMultiplier * modifiers.factors.arrayPerformanceFactor),
    waterRecoveryFactor: boundedFactor(environment.waterRecoveryMultiplier * modifiers.factors.waterRecoveryFactor),
    greenhouseProductionFactor: boundedFactor(environment.greenhouseProductionMultiplier * modifiers.factors.greenhouseProductionFactor),
    powerLoadFactors: modifiers.powerLoadFactors,
    crewWaterUseFactor: modifiers.crewWaterUseFactor,
    greenhouseWaterUseFactor: modifiers.greenhouseWaterUseFactor,
    extraPowerKwhPerHour: modifiers.extraPowerKwhPerHour,
  }
}

export function evaluateDependencies(state, conditions, availability = {}, config = SIMULATION_CONFIG) {
  const resourceConfig = config.resources
  const waterThreshold = config.rates.water.minimumGreenhouseReserveLiters
  const dependencyIds = new Set(config.dependencies.map((dependency) => dependency.id))
  const applyDependency = (id, value) => dependencyIds.has(id) ? boundedFactor(value) : 0
  const pathways = {
    solarGenerationFactor: applyDependency(
      'sunlight-to-solar-power',
      conditions.sunlightFactor * conditions.arrayPerformanceFactor,
    ),
    lifeSupportAvailability: applyDependency('power-to-life-support', availability.lifeSupport ?? 0),
    waterRecoveryAvailability: applyDependency('power-to-water-recovery',
      (availability.waterRecovery ?? 0)
        * (conditions.powerLoadFactors.waterRecovery ?? 1)
        * conditions.waterRecoveryFactor,
    ),
    habitatControlsAvailability: applyDependency('power-to-habitat-controls',
      (availability.habitatControls ?? 0) * (conditions.powerLoadFactors.habitatControls ?? 1),
    ),
    greenhousePowerAvailability: applyDependency('power-to-greenhouse',
      (availability.greenhouse ?? 0) * (conditions.powerLoadFactors.greenhouse ?? 1),
    ),
    greenhouseProductionAvailability: applyDependency('power-to-greenhouse',
      (availability.greenhouse ?? 0)
        * (conditions.powerLoadFactors.greenhouse ?? 1)
        * conditions.greenhouseProductionFactor,
    ),
    greenhouseWaterAvailability: applyDependency('water-to-greenhouse', state.waterL / waterThreshold),
    crewFoodAvailability: applyDependency('food-to-crew-availability', state.foodKg / resourceConfig.food.capacity),
    crewEnvironmentAvailability: applyDependency('habitat-to-crew-environment',
      state.habitatCondition / resourceConfig.habitat.capacity,
    ),
  }

  return {
    pathways,
    dependencyEdges: config.dependencies.map((dependency) => ({
      ...dependency,
      active: dependency.id === 'sunlight-to-solar-power'
        ? pathways.solarGenerationFactor > 0
        : dependency.id === 'power-to-life-support'
          ? pathways.lifeSupportAvailability > 0
          : dependency.id === 'power-to-water-recovery'
            ? pathways.waterRecoveryAvailability > 0
            : dependency.id === 'power-to-habitat-controls'
              ? pathways.habitatControlsAvailability > 0
              : dependency.id === 'power-to-greenhouse'
                ? pathways.greenhousePowerAvailability > 0
                : dependency.id === 'water-to-greenhouse'
                  ? pathways.greenhouseWaterAvailability > 0
                  : dependency.id === 'food-to-crew-availability'
                    ? pathways.crewFoodAvailability > 0
                    : pathways.crewEnvironmentAvailability > 0,
    })),
  }
}
