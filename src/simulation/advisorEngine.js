import { RESOURCE_DEFINITIONS } from './config.js'
import { getResourceStatus } from './resourceEngine.js'

const statusRank = { nominal: 0, monitor: 1, critical: 2 }

export function createMissionAdvice(state) {
  if (state.status === 'standby') {
    return {
      title: 'Ready for the first model step',
      recommendations: [{
        id: 'start',
        priority: 'info',
        recommendation: 'Start the mission, then advance the clock manually to see configured hourly changes.',
        reason: 'No resource values change until a student explicitly advances simulated time.',
      }],
      assumption: 'Rule-based educational guidance; not NASA software or an operational recommendation.',
    }
  }

  const warnings = RESOURCE_DEFINITIONS
    .map((resource) => ({
      ...resource,
      value: state.resources[resource.stateKey],
      status: getResourceStatus(resource.id, state.resources[resource.stateKey]),
    }))
    .filter((resource) => resource.status !== 'nominal')
    .sort((left, right) => statusRank[right.status] - statusRank[left.status])
  const recommendations = []

  warnings.forEach((resource) => {
    if (resource.id === 'power') {
      recommendations.push({
        id: 'power-reserve',
        priority: resource.status,
        recommendation: 'Review optional power loads before the next event choice.',
        reason: `Stored energy is ${resource.value.toFixed(1)} ${resource.unit}, at or below the configured ${resource.status === 'critical' ? 'critical' : 'monitor'} threshold. Lower sunlight or an added load can draw down this reserve.`,
      })
    } else if (resource.id === 'water') {
      recommendations.push({
        id: 'water-reserve',
        priority: resource.status,
        recommendation: 'Protect water inventory if a recovery interruption is active or selected.',
        reason: `Water is ${resource.value.toFixed(1)} ${resource.unit}. Recovery adds water only when the modeled recovery equipment receives power.`,
      })
    } else if (resource.id === 'food') {
      recommendations.push({
        id: 'food-reserve',
        priority: resource.status,
        recommendation: 'Check whether the greenhouse has both power and modeled water availability.',
        reason: `Food is ${resource.value.toFixed(1)} ${resource.unit}. Greenhouse production is scaled by its power allocation, available water, and any active event modifier.`,
      })
    } else if (resource.id === 'oxygen') {
      recommendations.push({
        id: 'oxygen-reserve',
        priority: resource.status,
        recommendation: 'Protect life-support processing in subsequent power allocation steps.',
        reason: `Oxygen is ${resource.value.toFixed(1)} ${resource.unit}. Modeled oxygen production scales with life-support power availability, while crew use continues.`,
      })
    } else if (resource.id === 'habitat') {
      recommendations.push({
        id: 'habitat-condition',
        priority: resource.status,
        recommendation: 'Preserve power for habitat controls when choosing an event response.',
        reason: `The habitat condition index is ${resource.value.toFixed(1)} points. It declines only when its configured control load is not fully supplied.`,
      })
    } else {
      recommendations.push({
        id: 'radiation-context',
        priority: resource.status,
        recommendation: 'Review the illustrative shielding index as a fixed context value.',
        reason: 'Radiation protection is not consumed or converted into a dose estimate by this model.',
      })
    }
  })

  if (state.systems && state.systems.pathways.lifeSupportAvailability < 1) {
    recommendations.push({
      id: 'life-support-dependency',
      priority: 'critical',
      recommendation: 'The last hourly step did not fully power life-support processing.',
      reason: 'The configured allocation order places life support first; this pathway can be limited only when available electrical energy is insufficient for its requested load.',
    })
  }

  if (state.systems && state.systems.pathways.waterRecoveryAvailability < 1) {
    recommendations.push({
      id: 'water-recovery-dependency',
      priority: state.systems.pathways.waterRecoveryAvailability === 0 ? 'critical' : 'monitor',
      recommendation: 'Water recovery was limited during the latest hourly step.',
      reason: `The modeled recovery pathway operated at ${Math.round(state.systems.pathways.waterRecoveryAvailability * 100)}%. The next water balance uses that actual recovery fraction.`,
    })
  }

  if (state.systems && state.systems.pathways.greenhouseProductionAvailability < 1) {
    recommendations.push({
      id: 'greenhouse-dependency',
      priority: state.systems.pathways.greenhouseProductionAvailability === 0 ? 'monitor' : 'info',
      recommendation: 'Greenhouse food output was below its configured full rate in the latest step.',
      reason: `Modeled production availability was ${Math.round(state.systems.pathways.greenhouseProductionAvailability * 100)}%, after power, water, and event factors were applied.`,
    })
  }

  if (state.systems && state.systems.pathways.habitatControlsAvailability < 1) {
    recommendations.push({
      id: 'habitat-control-dependency',
      priority: 'critical',
      recommendation: 'Habitat controls did not receive their full requested power in the latest step.',
      reason: `The model records ${Math.round(state.systems.pathways.habitatControlsAvailability * 100)}% availability and applies only the configured index loss; it does not predict real habitat conditions.`,
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'steady-state',
      priority: 'info',
      recommendation: 'All modeled resource values are above their configured monitor thresholds.',
      reason: 'Continue observing how the next hourly sunlight factor and any selected event change resource flows.',
    })
  }

  const hasRisks = recommendations.some((item) => item.priority === 'critical' || item.priority === 'monitor')

  return {
    title: hasRisks ? 'Model thresholds or pathways need attention' : 'No configured reserve warning',
    recommendations,
    assumption: 'Rule-based educational guidance derived from this saved model state; thresholds and relationships are simplified assumptions, not NASA guidance.',
  }
}
