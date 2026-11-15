import {
  BatteryCharging,
  CircleDot,
  Droplets,
  House,
  Microscope,
  RadioTower,
  ShieldCheck,
  Sprout,
  Sun,
  Truck,
  Warehouse,
} from 'lucide-react'
import { structureList } from '../data/structureData.js'

const structureIcons = {
  habitat: House,
  solar: Sun,
  rover: Truck,
  greenhouse: Sprout,
  storage: Warehouse,
  'energy-storage': BatteryCharging,
  'water-recovery': Droplets,
  communications: RadioTower,
  'science-lab': Microscope,
  astronaut: ShieldCheck,
}

function StructureSelector({ selectedId, hoveredId, onSelect }) {
  return (
    <div className="structure-selector" aria-label="Select an outpost structure">
      {structureList.map((structure) => {
        const Icon = structureIcons[structure.id] ?? CircleDot
        const selected = selectedId === structure.id
        const hovered = hoveredId === structure.id

        return (
          <button
            className={`structure-selector__item${selected ? ' structure-selector__item--selected' : ''}${hovered ? ' structure-selector__item--hovered' : ''}`}
            key={structure.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(structure.id)}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{structure.shortName}</span>
          </button>
        )
      })}
    </div>
  )
}

export default StructureSelector
