import { getHourlyConditions } from '../simulation/dependencyEngine.js'
import { getMissionConfig } from '../simulation/scenarios.js'
import { stepResources } from '../simulation/resourceEngine.js'

export const DEFAULT_EXPERIMENT = {
  sunlightPercent: 50,
  addedDemandKwh: 1,
  energyReserveKwh: null,
  pauseNonessential: false,
  greenhouseOnline: true,
}

export function runExperiment(missionState, inputs = DEFAULT_EXPERIMENT) {
  const config = getMissionConfig(missionState.scenarioId)
  const baselineConditions = getHourlyConditions(missionState, config)
  const baseline = stepResources(missionState.resources, baselineConditions, config)
  const energyReserveKwh = Number.isFinite(inputs.energyReserveKwh)
    ? Math.min(config.resources.power.capacity, Math.max(0, inputs.energyReserveKwh))
    : missionState.resources.energyKwh
  const experimentResources = { ...missionState.resources, energyKwh: energyReserveKwh }
  const adjustedConditions = {
    ...baselineConditions,
    sunlightFactor: baselineConditions.sunlightFactor * Math.min(1, Math.max(0, Number(inputs.sunlightPercent) / 100 || 0)),
    extraPowerKwhPerHour: baselineConditions.extraPowerKwhPerHour + Math.max(0, Number(inputs.addedDemandKwh) || 0),
    powerLoadFactors: {
      ...baselineConditions.powerLoadFactors,
      nonessential: inputs.pauseNonessential ? 0 : baselineConditions.powerLoadFactors.nonessential,
      greenhouse: inputs.greenhouseOnline ? baselineConditions.powerLoadFactors.greenhouse : 0,
    },
    greenhouseWaterUseFactor: inputs.greenhouseOnline ? baselineConditions.greenhouseWaterUseFactor : 0,
  }
  const experimental = stepResources(experimentResources, adjustedConditions, config)

  return {
    baseline: {
      resources: baseline.resources,
      systems: baseline.systems,
      conditions: baselineConditions,
    },
    experimental: {
      resources: experimental.resources,
      systems: experimental.systems,
      conditions: adjustedConditions,
    },
    deltas: Object.fromEntries(Object.keys(baseline.resources).map((key) => [
      key,
      experimental.resources[key] - baseline.resources[key],
    ])),
    assumptions: [
      'One manually calculated model hour; no live mission state is changed.',
      'Sunlight percentage scales the scenario’s configured baseline illumination.',
      'Added demand is illustrative and joins the model’s existing low-priority demand.',
      'Turning off the greenhouse removes its modeled electrical load and irrigation for this step.',
    ],
  }
}
