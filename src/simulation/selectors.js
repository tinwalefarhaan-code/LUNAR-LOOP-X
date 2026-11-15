import { RESOURCE_DEFINITIONS, SIMULATION_CONFIG } from './config.js'
import { getResourceStatus } from './resourceEngine.js'
import { getMissionEvents } from './eventEngine.js'
import { getMissionConfig } from './scenarios.js'

const severityRank = { nominal: 0, monitor: 1, critical: 2 }
const statusLabels = { nominal: 'Nominal', monitor: 'Monitor', critical: 'Critical' }

function rounded(value) {
  return Math.round(value * 10) / 10
}

export function getDashboardResources(state) {
  return RESOURCE_DEFINITIONS.map((resource) => {
    const value = state.resources[resource.stateKey]
    const status = getResourceStatus(resource.id, value)
    return {
      ...resource,
      value: Math.round((value / resource.capacity) * 100),
      valueLabel: `${rounded(value).toFixed(1)} ${resource.unit}`,
      capacityLabel: `${resource.capacity} ${resource.unit}`,
      status,
      statusLabel: statusLabels[status],
    }
  })
}

function statusFromAvailability(value) {
  if (!Number.isFinite(value) || value <= 0) return 'critical'
  return value < 0.999 ? 'monitor' : 'nominal'
}

function strongestStatus(statuses) {
  return statuses.reduce((strongest, current) => (
    severityRank[current] > severityRank[strongest] ? current : strongest
  ), 'nominal')
}

export function getStructureStatuses(state) {
  const config = getMissionConfig(state.scenarioId)
  const greenhousePower = state.systems?.pathways.greenhousePowerAvailability ?? 1
  const greenhouseWater = state.systems?.pathways.greenhouseWaterAvailability
    ?? Math.min(1, state.resources.waterL / config.rates.water.minimumGreenhouseReserveLiters)
  const greenhouseProduction = state.systems?.pathways.greenhouseProductionAvailability ?? 1
  const greenhouseStatus = state.systems
    ? statusFromAvailability(Math.min(greenhousePower, greenhouseWater, greenhouseProduction))
    : 'context'
  const energyStatus = getResourceStatus('power', state.resources.energyKwh)
  const waterRecovery = state.systems?.pathways.waterRecoveryAvailability ?? 1
  const waterRecoveryStatus = state.systems
    ? strongestStatus([
      statusFromAvailability(waterRecovery),
      getResourceStatus('water', state.resources.waterL),
    ])
    : getResourceStatus('water', state.resources.waterL)
  const storedStatus = strongestStatus(['oxygen', 'water', 'food'].map((id) => (
    getResourceStatus(id, state.resources[SIMULATION_CONFIG.resources[id].stateKey])
  )))
  const crewStatus = strongestStatus([
    getResourceStatus('oxygen', state.resources.oxygenKg),
    getResourceStatus('food', state.resources.foodKg),
    getResourceStatus('habitat', state.resources.habitatCondition),
  ])
  const lastGeneration = state.systems?.solarGenerationPotentialKwh
  const sunlightStatus = state.systems
    ? (state.systems.sunlightFactor * state.systems.arrayPerformanceFactor < 0.25 ? 'monitor' : 'nominal')
    : 'nominal'

  return {
    habitat: {
      label: `Condition · ${statusLabels[getResourceStatus('habitat', state.resources.habitatCondition)]}`,
      tone: getResourceStatus('habitat', state.resources.habitatCondition),
      detail: `${rounded(state.resources.habitatCondition).toFixed(1)} points · linked to the modeled habitat-control power allocation.`,
    },
    solar: {
      label: Number.isFinite(lastGeneration)
        ? `Array · ${statusLabels[sunlightStatus]}`
        : 'Awaiting first hourly calculation',
      tone: sunlightStatus,
      detail: `${Number.isFinite(lastGeneration) ? `${rounded(lastGeneration).toFixed(2)} kWh potential for the last hour. ` : ''}Output uses the configured educational illumination curve and event multipliers.`,
    },
    rover: {
      label: 'Mobility not simulated',
      tone: 'context',
      detail: 'Rover movement, range, and electrical loads are outside the Phase 4 model.',
    },
    greenhouse: {
      label: state.systems ? `Greenhouse · ${statusLabels[greenhouseStatus]}` : 'Greenhouse · Awaiting first step',
      tone: greenhouseStatus,
      detail: state.systems
        ? `Power ${Math.round(greenhousePower * 100)}% · production ${Math.round(greenhouseProduction * 100)}% · water factor ${Math.round(greenhouseWater * 100)}%.`
        : 'Modeled power allocation and production readouts appear after the first hourly calculation.',
    },
    storage: {
      label: `Supplies · ${statusLabels[storedStatus]}`,
      tone: storedStatus,
      detail: 'Aggregated status from oxygen, water, and food inventories.',
    },
    'energy-storage': {
      label: `Energy inventory · ${statusLabels[energyStatus]}`,
      tone: energyStatus,
      detail: `${rounded(state.resources.energyKwh).toFixed(1)} kWh stored in the educational model. The scene facility is illustrative.`,
    },
    'water-recovery': {
      label: state.systems ? `Recovery pathway · ${statusLabels[waterRecoveryStatus]}` : 'Recovery · Awaiting first step',
      tone: waterRecoveryStatus,
      detail: `${state.systems ? `${Math.round(waterRecovery * 100)}% modeled recovery availability · ` : 'Recovery pathway awaiting first hourly calculation · '}water inventory ${rounded(state.resources.waterL).toFixed(1)} L.`,
    },
    communications: {
      label: 'Communications not simulated',
      tone: 'context',
      detail: 'Link availability, latency, and data flow are outside the educational mission model.',
    },
    'science-lab': {
      label: 'Research activity not simulated',
      tone: 'context',
      detail: 'Laboratory operations, sample analysis, and scientific results are outside the educational mission model.',
    },
    astronaut: {
      label: `Crew systems · ${statusLabels[crewStatus]}`,
      tone: crewStatus,
      detail: 'A status summary of modeled oxygen, food, and habitat condition; no health outcome is inferred.',
    },
  }
}

function metric(label, value) {
  return { label, value }
}

function formatFixed(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'Awaiting first hourly calculation'
}

export function getFacilityInspection(state, structureId) {
  const status = getStructureStatuses(state)[structureId]
  const pathways = state.systems?.pathways
  const allocations = state.systems?.powerAllocations
  const eventList = getMissionEvents(state)
  const relevantEvents = eventList.filter((event) => event.facilityId === structureId
    && ['available', 'decision-required', 'active'].includes(event.status))
  let metrics = []

  if (structureId === 'solar') {
    metrics = [
      metric('Modeled generation · last step', state.systems ? `${formatFixed(state.systems.solarGenerationPotentialKwh, 2)} kWh` : 'Awaiting first hourly calculation'),
      metric('Sunlight factor · last step', state.systems ? `${Math.round(state.systems.sunlightFactor * 100)}%` : 'Awaiting first hourly calculation'),
      metric('Array factor · last step', state.systems ? `${Math.round(state.systems.arrayPerformanceFactor * 100)}%` : 'Awaiting first hourly calculation'),
    ]
  } else if (structureId === 'habitat') {
    metrics = [
      metric('Habitat condition', `${formatFixed(state.resources.habitatCondition)} / ${SIMULATION_CONFIG.resources.habitat.capacity} pts`),
      metric('Oxygen inventory', `${formatFixed(state.resources.oxygenKg)} / ${SIMULATION_CONFIG.resources.oxygen.capacity} kg`),
      metric('Life-support allocation', pathways ? `${Math.round(pathways.lifeSupportAvailability * 100)}%` : 'Awaiting first hourly calculation'),
    ]
  } else if (structureId === 'greenhouse') {
    metrics = [
      metric('Food inventory', `${formatFixed(state.resources.foodKg)} / ${SIMULATION_CONFIG.resources.food.capacity} kg`),
      metric('Food produced · last step', state.systems ? `${formatFixed(state.systems.foodProducedKg, 3)} kg` : 'Awaiting first hourly calculation'),
      metric('Power / water factors', pathways ? `${Math.round(pathways.greenhousePowerAvailability * 100)}% / ${Math.round(pathways.greenhouseWaterAvailability * 100)}%` : 'Awaiting first hourly calculation'),
    ]
  } else if (structureId === 'water-recovery') {
    metrics = [
      metric('Water reserve', `${formatFixed(state.resources.waterL)} / ${SIMULATION_CONFIG.resources.water.capacity} L`),
      metric('Recovery availability', pathways ? `${Math.round(pathways.waterRecoveryAvailability * 100)}%` : 'Awaiting first hourly calculation'),
      metric('Water recovered · last step', state.systems ? `${formatFixed(state.systems.waterRecoveredL, 3)} L` : 'Awaiting first hourly calculation'),
    ]
  } else if (structureId === 'energy-storage') {
    metrics = [
      metric('Stored electrical energy', `${formatFixed(state.resources.energyKwh)} / ${SIMULATION_CONFIG.resources.power.capacity} kWh`),
      metric('Generation · demand · used', state.systems
        ? `${formatFixed(state.systems.solarGenerationPotentialKwh, 2)} · ${formatFixed(state.systems.powerDemandKwh, 2)} · ${formatFixed(state.systems.powerUsedKwh, 2)} kWh`
        : 'Awaiting first hourly calculation'),
      metric('Life support / habitat controls', allocations
        ? `${Math.round((allocations.lifeSupport?.fraction ?? 0) * 100)}% / ${Math.round((allocations.habitatControls?.fraction ?? 0) * 100)}% supplied`
        : 'Awaiting first hourly calculation'),
    ]
  } else if (structureId === 'storage') {
    metrics = [
      metric('Oxygen inventory', `${formatFixed(state.resources.oxygenKg)} kg`),
      metric('Water inventory', `${formatFixed(state.resources.waterL)} L`),
      metric('Food inventory', `${formatFixed(state.resources.foodKg)} kg`),
    ]
  }

  return {
    status,
    metrics,
    relevantEvents,
    currentEventStatus: relevantEvents.some((event) => event.status === 'active')
      ? 'Event effect active'
      : relevantEvents.some((event) => event.status === 'decision-required')
        ? 'Decision required'
        : relevantEvents.some((event) => event.status === 'available')
          ? 'Event response available'
          : null,
  }
}

export function getDependencyDisplay(state) {
  const edges = SIMULATION_CONFIG.dependencies
  const systems = state.systems
  if (!systems) return edges.map((edge) => ({ ...edge, value: 'Awaiting first hourly step' }))

  const { pathways } = systems
  const values = {
    'sunlight-to-solar-power': `${Math.round(pathways.solarGenerationFactor * 100)}% input factor`,
    'power-to-life-support': `${Math.round(pathways.lifeSupportAvailability * 100)}% powered`,
    'power-to-water-recovery': `${Math.round(pathways.waterRecoveryAvailability * 100)}% available`,
    'power-to-habitat-controls': `${Math.round(pathways.habitatControlsAvailability * 100)}% powered`,
    'power-to-greenhouse': `${Math.round(pathways.greenhousePowerAvailability * 100)}% operating · ${Math.round(pathways.greenhouseProductionAvailability * 100)}% production`,
    'water-to-greenhouse': `${Math.round(pathways.greenhouseWaterAvailability * 100)}% water factor`,
    'food-to-crew-availability': `${Math.round(pathways.crewFoodAvailability * 100)}% inventory factor`,
    'habitat-to-crew-environment': `${Math.round(pathways.crewEnvironmentAvailability * 100)}% index factor`,
  }

  return edges.map((edge) => ({ ...edge, value: values[edge.id] }))
}
