import { RESOURCE_DEFINITIONS, SIMULATION_CONFIG } from './config.js'
import { evaluateDependencies } from './dependencyEngine.js'

function clamp(value, minimum, maximum) {
  if (!Number.isFinite(value)) return minimum
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeResources(resources, config) {
  return Object.values(config.resources).reduce((normalized, definition) => {
    const value = resources?.[definition.stateKey]
    normalized[definition.stateKey] = Number.isFinite(value)
      ? clamp(value, 0, definition.capacity)
      : definition.initial
    return normalized
  }, {})
}

function normalizeConditions(conditions, config) {
  const powerLoadFactors = Object.keys(config.rates.powerLoadsKwhPerHour).reduce((factors, key) => ({
    ...factors,
    [key]: clamp(conditions?.powerLoadFactors?.[key] ?? 1, 0, 1),
  }), {})

  return {
    sunlightFactor: clamp(conditions?.sunlightFactor ?? 0, 0, 1),
    arrayPerformanceFactor: clamp(conditions?.arrayPerformanceFactor ?? 0, 0, 1),
    waterRecoveryFactor: clamp(conditions?.waterRecoveryFactor ?? 0, 0, 1),
    greenhouseProductionFactor: clamp(conditions?.greenhouseProductionFactor ?? 0, 0, 1),
    powerLoadFactors,
    crewWaterUseFactor: clamp(conditions?.crewWaterUseFactor ?? 1, 0, 1),
    greenhouseWaterUseFactor: clamp(conditions?.greenhouseWaterUseFactor ?? 1, 0, 1),
    extraPowerKwhPerHour: Number.isFinite(conditions?.extraPowerKwhPerHour)
      ? Math.max(0, conditions.extraPowerKwhPerHour)
      : 0,
  }
}

function allocatePower(energyBudgetKwh, demands, priority) {
  let remainingKwh = Math.max(0, energyBudgetKwh)
  const allocations = {}

  priority.forEach((system) => {
    const demand = Math.max(0, demands[system] ?? 0)
    const allocated = Math.min(demand, remainingKwh)
    allocations[system] = {
      requestedKwh: demand,
      allocatedKwh: allocated,
      fraction: demand > 0 ? allocated / demand : 0,
    }
    remainingKwh -= allocated
  })

  return {
    allocations,
    totalAllocatedKwh: Object.values(allocations)
      .reduce((total, allocation) => total + allocation.allocatedKwh, 0),
  }
}

export function getResourceStatus(resourceId, value) {
  const resource = SIMULATION_CONFIG.resources[resourceId]
  if (!resource || !Number.isFinite(value)) return 'critical'
  if (value <= resource.criticalBelow) return 'critical'
  if (value <= resource.monitorBelow) return 'monitor'
  return 'nominal'
}

export function stepResources(resources, conditions, config = SIMULATION_CONFIG) {
  const currentResources = normalizeResources(resources, config)
  const currentConditions = normalizeConditions(conditions, config)
  const rates = config.rates
  const crewSize = config.mission.crewSize
  const powerConfig = config.resources.power
  const solarDependency = evaluateDependencies(currentResources, currentConditions, {}, config)
    .pathways.solarGenerationFactor
  const generationPotentialKwh = rates.solarGenerationKwhPerHourAtFullIllumination
    * solarDependency
  const demand = Object.fromEntries(
    Object.entries(rates.powerLoadsKwhPerHour).map(([system, load]) => [
      system,
      load * currentConditions.powerLoadFactors[system],
    ]),
  )
  demand.eventDemand = currentConditions.extraPowerKwhPerHour
  const energyBudgetKwh = currentResources.energyKwh + generationPotentialKwh
  const power = allocatePower(energyBudgetKwh, demand, rates.powerPriority)
  const energyKwh = clamp(
    currentResources.energyKwh + generationPotentialKwh - power.totalAllocatedKwh,
    0,
    powerConfig.capacity,
  )
  const serviceFractions = Object.fromEntries(
    Object.entries(power.allocations).map(([system, allocation]) => [system, allocation.fraction]),
  )
  const dependencyState = evaluateDependencies(currentResources, currentConditions, {
    lifeSupport: serviceFractions.lifeSupport,
    waterRecovery: serviceFractions.waterRecovery,
    habitatControls: serviceFractions.habitatControls,
    greenhouse: serviceFractions.greenhouse,
  }, config)
  const pathways = dependencyState.pathways

  const oxygenConsumedKg = rates.oxygen.consumedKgPerCrewHour * crewSize
  const oxygenProducedKg = rates.oxygen.producedKgPerCrewHourWhenPowered
    * crewSize
    * pathways.lifeSupportAvailability
  const oxygenKg = clamp(
    currentResources.oxygenKg + oxygenProducedKg - oxygenConsumedKg,
    0,
    config.resources.oxygen.capacity,
  )

  const crewWaterUsedL = rates.water.usedLitersPerCrewHour
    * crewSize
    * currentConditions.crewWaterUseFactor
  const greenhouseWaterAvailability = pathways.greenhouseWaterAvailability
  const greenhouseWaterUsedL = rates.water.greenhouseUseLitersPerHour
    * currentConditions.greenhouseWaterUseFactor
    * pathways.greenhousePowerAvailability
    * greenhouseWaterAvailability
  const waterRecoveredL = crewWaterUsedL
    * rates.water.recoveryFractionWhenPowered
    * pathways.waterRecoveryAvailability
  const waterL = clamp(
    currentResources.waterL + waterRecoveredL - crewWaterUsedL - greenhouseWaterUsedL,
    0,
    config.resources.water.capacity,
  )

  const foodConsumedKg = rates.food.consumedKgPerCrewHour * crewSize
  const foodProducedKg = rates.food.producedKgPerHourWhenGreenhouseReady
    * pathways.greenhouseProductionAvailability
    * greenhouseWaterAvailability
  const foodKg = clamp(
    currentResources.foodKg + foodProducedKg - foodConsumedKg,
    0,
    config.resources.food.capacity,
  )

  const habitatLoss = rates.habitat.conditionLossPointsPerHourWhenControlsUnpowered
    * (1 - pathways.habitatControlsAvailability)
  const habitatCondition = clamp(
    currentResources.habitatCondition - habitatLoss,
    0,
    config.resources.habitat.capacity,
  )
  const radiationProtection = clamp(
    currentResources.radiationProtection,
    0,
    config.resources.radiation.capacity,
  )
  const nextResources = {
    energyKwh,
    oxygenKg,
    waterL,
    foodKg,
    habitatCondition,
    radiationProtection,
  }
  const deltas = Object.fromEntries(
    RESOURCE_DEFINITIONS.map(({ stateKey }) => [
      stateKey,
      nextResources[stateKey] - currentResources[stateKey],
    ]),
  )

  return {
    resources: nextResources,
    systems: {
      sunlightFactor: conditions.sunlightFactor,
      arrayPerformanceFactor: conditions.arrayPerformanceFactor,
      solarGenerationPotentialKwh: generationPotentialKwh,
      powerDemandKwh: Object.values(demand).reduce((total, value) => total + value, 0),
      powerUsedKwh: power.totalAllocatedKwh,
      powerAllocations: power.allocations,
      pathways,
      dependencyEdges: dependencyState.dependencyEdges,
      oxygenProducedKg,
      oxygenConsumedKg,
      waterRecoveredL,
      crewWaterUsedL,
      greenhouseWaterUsedL,
      foodProducedKg,
      foodConsumedKg,
      habitatConditionLoss: habitatLoss,
    },
    deltas,
    statuses: Object.fromEntries(
      RESOURCE_DEFINITIONS.map(({ id, stateKey }) => [
        id,
        getResourceStatus(id, nextResources[stateKey]),
      ]),
    ),
  }
}

export function getResourceDeltas(before, after) {
  return Object.fromEntries(
    RESOURCE_DEFINITIONS.map(({ stateKey }) => [stateKey, after[stateKey] - before[stateKey]]),
  )
}
