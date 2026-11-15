import {
  Droplets,
  House,
  ShieldCheck,
  Sprout,
  Wind,
  Zap,
} from 'lucide-react'

const resourceIcons = {
  oxygen: Wind,
  water: Droplets,
  food: Sprout,
  power: Zap,
  habitat: House,
  radiation: ShieldCheck,
}

function ResourceCard({ resource }) {
  const Icon = resourceIcons[resource.id]
  const statusTone = resource.status === 'critical'
    ? 'critical'
    : resource.status === 'monitor'
      ? 'monitor'
      : resource.status === 'context'
        ? 'context'
        : 'stable'

  return (
    <article className={`resource-card resource-card--${resource.tone}`}>
      <div className="resource-card__topline">
        <span className="resource-card__icon"><Icon size={17} strokeWidth={1.8} /></span>
        <span className={`status-chip status-chip--${statusTone}`}>
          {resource.statusLabel ?? resource.status}
        </span>
      </div>
      <div className="resource-card__name">{resource.name}</div>
      <div className="resource-card__value-row">
        <strong className="resource-card__reading">{resource.valueLabel ?? `${resource.value}%`}</strong>
        <span className="resource-card__system">{resource.system}</span>
      </div>
      <div
        className="resource-meter"
        role="progressbar"
        aria-label={`${resource.name}: ${resource.valueLabel ?? `${resource.value}%`}, ${resource.value} percent of configured capacity`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={resource.value}
      >
        <span className="resource-meter__fill" style={{ width: `${resource.value}%` }} />
      </div>
      <div className="resource-card__measure">{resource.measure} · capacity {resource.capacityLabel}</div>
    </article>
  )
}

export default ResourceCard
