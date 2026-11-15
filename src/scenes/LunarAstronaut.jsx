import { structureLocations } from '../data/structureData.js'
import { terrainHeight } from './terrainMath.js'
import SelectableStructure from './SelectableStructure.jsx'

function LunarAstronaut({ selectedId, status, onSelect, onHover }) {
  const [x, z] = structureLocations.astronaut

  return (
    <SelectableStructure
      id="astronaut"
      name="Crew member"
      position={[x, terrainHeight(x, z), z]}
      selected={selectedId === 'astronaut'}
      status={status}
      onSelect={onSelect}
      onHover={onHover}
      ringRadius={0.92}
      labelHeight={3.2}
    >
      <group>
        <mesh position={[0, 1.08, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.62, 4, 8]} />
          <meshStandardMaterial color="#c4c8bd" roughness={0.8} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.83, 0.02]} castShadow>
          <sphereGeometry args={[0.34, 16, 12]} />
          <meshStandardMaterial color="#dddcd1" roughness={0.5} metalness={0.08} />
        </mesh>
        <mesh position={[0, 1.84, 0.31]}>
          <sphereGeometry args={[0.225, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.53]} />
          <meshStandardMaterial
            color="#8297a0"
            roughness={0.23}
            metalness={0.26}
            transparent
            opacity={0.9}
          />
        </mesh>
        {[-0.39, 0.39].map((side) => (
          <group key={side} position={[side, 1.08, 0]} rotation={[0, 0, side > 0 ? -0.22 : 0.22]}>
            <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 9]} castShadow>
              <capsuleGeometry args={[0.12, 0.48, 3, 6]} />
              <meshStandardMaterial color="#bfc4ba" roughness={0.84} />
            </mesh>
            <mesh position={[0, -0.62, 0.02]} castShadow>
              <capsuleGeometry args={[0.135, 0.46, 3, 6]} />
              <meshStandardMaterial color="#abb4ad" roughness={0.87} />
            </mesh>
            <mesh position={[0, -0.99, 0.13]} castShadow>
              <boxGeometry args={[0.33, 0.18, 0.48]} />
              <meshStandardMaterial color="#7e8d8c" roughness={0.88} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.22, 1.18, 0.28]}>
          <boxGeometry args={[0.24, 0.27, 0.12]} />
          <meshStandardMaterial color="#b7a775" roughness={0.7} />
        </mesh>
      </group>
    </SelectableStructure>
  )
}

export default LunarAstronaut
