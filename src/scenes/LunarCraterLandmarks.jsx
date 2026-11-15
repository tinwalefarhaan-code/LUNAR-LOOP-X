import { useState } from 'react'
import SelectableStructure from './SelectableStructure.jsx'
import { CRATER_LANDMARKS } from '../learning/levelData.js'
import { terrainHeight } from './terrainMath.js'

function CraterLandmark({ crater, selectedId, onSelect, onHover }) {
  const [hovered, setHovered] = useState(false)
  const [x, z] = crater.position
  const surface = terrainHeight(x, z)
  const position = [x, surface + crater.depth * 0.79, z]
  const selected = selectedId === crater.id

  return (
    <SelectableStructure
      id={crater.id}
      name={crater.name}
      position={position}
      selected={selected}
      onSelect={onSelect}
      onHover={(id) => { setHovered(Boolean(id)); onHover(id) }}
      ringRadius={crater.radius * 0.72}
      labelHeight={Math.max(3, crater.depth + 1.4)}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, crater.depth * 0.23, 0]} castShadow>
        <torusGeometry args={[crater.radius * 0.93, selected || hovered ? 0.22 : 0.12, 5, 56]} />
        <meshStandardMaterial color={selected ? '#a6d9d5' : hovered ? '#bdc6b9' : '#766f63'} roughness={0.98} transparent={!selected && !hovered} opacity={selected ? 0.88 : hovered ? 0.7 : 0.44} />
      </mesh>
      <mesh position={[0, crater.depth * 0.25, 0]}>
        <cylinderGeometry args={[crater.radius * 0.82, crater.radius * 0.82, 0.12, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </SelectableStructure>
  )
}

function LunarCraterLandmarks({ selectedId, onSelect, onHover }) {
  return <group>{CRATER_LANDMARKS.map((crater) => <CraterLandmark key={crater.id} crater={crater} selectedId={selectedId} onSelect={onSelect} onHover={onHover} />)}</group>
}

export default LunarCraterLandmarks
