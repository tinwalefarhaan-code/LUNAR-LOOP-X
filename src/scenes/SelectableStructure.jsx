import { useState } from 'react'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

function SelectableStructure({
  id,
  name,
  position,
  selected,
  status,
  onSelect,
  onHover,
  children,
  ringRadius = 2.1,
  labelHeight = 4.4,
}) {
  const [hovered, setHovered] = useState(false)

  function handlePointerOver(event) {
    event.stopPropagation()
    setHovered(true)
    onHover(id)
  }

  function handlePointerOut(event) {
    event.stopPropagation()
    setHovered(false)
    onHover(null)
  }

  function handleSelect(event) {
    event.stopPropagation()
    onSelect(id)
  }

  return (
    <group
      position={position}
      onClick={handleSelect}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {children}
      {(selected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <ringGeometry args={[ringRadius, ringRadius + (selected ? 0.14 : 0.08), 48]} />
          <meshBasicMaterial
            color={selected ? '#8bd9e3' : '#b5c8cb'}
            side={THREE.DoubleSide}
            transparent
            opacity={selected ? 0.88 : 0.52}
            depthWrite={false}
          />
        </mesh>
      )}
      <Html position={[0, labelHeight, 0]} center distanceFactor={16} zIndexRange={[8, 0]}>
        <div
          className={`scene-object-label${selected ? ' scene-object-label--selected' : ''}`}
          style={{ display: selected || hovered ? 'grid' : 'none' }}
          aria-hidden="true"
        >
          <strong>{name}</strong>
          {status && <span className={`scene-object-label__status scene-object-label__status--${status.tone}`}>{status.label}</span>}
        </div>
      </Html>
    </group>
  )
}

export default SelectableStructure
