import * as THREE from 'three'
import { structureLocations } from '../data/structureData.js'
import { terrainHeight } from './terrainMath.js'
import SelectableStructure from './SelectableStructure.jsx'

function GroundedStructure({ id, selectedId, structureStatuses, roverPosition = [0, 0], ...props }) {
  const [baseX, baseZ] = structureLocations[id]
  const x = baseX + (id === 'rover' ? roverPosition[0] : 0)
  const z = baseZ + (id === 'rover' ? roverPosition[1] : 0)
  return (
    <SelectableStructure
      id={id}
      position={[x, terrainHeight(x, z), z]}
      selected={selectedId === id}
      status={structureStatuses[id]}
      {...props}
    />
  )
}

function Habitat({ cutaway, ...props }) {
  return (
    <GroundedStructure id="habitat" name="Research habitat" ringRadius={2.1} labelHeight={4.5} {...props}>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.42, 1.56, 2.25, 20, 1]} />
        <meshStandardMaterial color="#b4b2a8" roughness={0.78} metalness={0.12} transparent={cutaway} opacity={cutaway ? 0.17 : 1} depthWrite={!cutaway} />
      </mesh>
      <mesh position={[0, 2.47, 0]} scale={[1, 0.38, 1]} castShadow>
        <sphereGeometry args={[1.38, 20, 12]} />
        <meshStandardMaterial color="#8b9698" roughness={0.7} metalness={0.16} transparent={cutaway} opacity={cutaway ? 0.13 : 1} depthWrite={!cutaway} />
      </mesh>
      <mesh position={[0, 0.82, 1.52]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.53, 0.53, 0.22, 16]} />
        <meshStandardMaterial color="#697a7e" roughness={0.66} metalness={0.32} />
      </mesh>
      <mesh position={[0, 0.75, 1.67]}>
        <boxGeometry args={[0.64, 0.72, 0.12]} />
        <meshStandardMaterial color="#43555d" roughness={0.52} metalness={0.28} />
      </mesh>
      <mesh position={[-0.93, 1.26, 0.9]} rotation={[0, -0.28, 0]} castShadow>
        <boxGeometry args={[0.55, 0.92, 0.16]} />
        <meshStandardMaterial color="#77878b" roughness={0.76} metalness={0.18} />
      </mesh>
      <mesh position={[0.55, 2.54, -0.3]}>
        <cylinderGeometry args={[0.13, 0.13, 0.5, 12]} />
        <meshStandardMaterial color="#596a6e" roughness={0.8} metalness={0.22} />
      </mesh>
      {cutaway && (
        <group>
          <mesh position={[-0.7, 0.72, -0.35]} castShadow><boxGeometry args={[0.8, 0.75, 1.25]} /><meshStandardMaterial color="#566b73" roughness={0.9} /></mesh>
          <mesh position={[0.55, 0.66, -0.55]} castShadow><boxGeometry args={[0.65, 0.62, 0.7]} /><meshStandardMaterial color="#89958a" roughness={0.82} /></mesh>
          <mesh position={[0.1, 1.3, -0.55]}><boxGeometry args={[0.55, 0.42, 0.35]} /><meshStandardMaterial color="#b29b65" roughness={0.76} /></mesh>
        </group>
      )}
    </GroundedStructure>
  )
}

function SolarArrays(props) {
  return (
    <GroundedStructure id="solar" name="Solar array field" ringRadius={4.9} labelHeight={4.1} {...props}>
      {[-3.25, 3.25].map((x) => (
        <group key={x} position={[x, 1.25, 0]}>
          <mesh position={[0, -0.65, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.13, 1.3, 8]} />
            <meshStandardMaterial color="#90928c" roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh rotation={[-0.2, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.25, 0.11, 2.5]} />
            <meshStandardMaterial color="#345165" roughness={0.53} metalness={0.27} />
          </mesh>
          {[-1.05, 0, 1.05].map((line) => (
            <mesh key={`row-${line}`} position={[0, 0.07, line]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[3.16, 0.018, 0.018]} />
              <meshStandardMaterial color="#81929a" roughness={0.5} metalness={0.35} />
            </mesh>
          ))}
          {[-1.08, 0, 1.08].map((line) => (
            <mesh key={`column-${line}`} position={[line, 0.07, 0]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.018, 0.018, 2.42]} />
              <meshStandardMaterial color="#81929a" roughness={0.5} metalness={0.35} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.15, 0.58, 1.05]} />
        <meshStandardMaterial color="#8d928a" roughness={0.78} metalness={0.15} />
      </mesh>
    </GroundedStructure>
  )
}

function Greenhouse(props) {
  const frameMaterial = '#8ca29d'

  return (
    <GroundedStructure id="greenhouse" name="Greenhouse module" ringRadius={2.5} labelHeight={4.2} {...props}>
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[3.4, 2.25, 3.1]} />
        <meshPhysicalMaterial
          color="#9cbab1"
          transparent
          opacity={0.18}
          roughness={0.2}
          metalness={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {[-1.68, 1.68].map((x) => (
        <mesh key={`frame-x-${x}`} position={[x, 1.35, 0]}>
          <boxGeometry args={[0.09, 2.35, 3.25]} />
          <meshStandardMaterial color={frameMaterial} roughness={0.72} metalness={0.2} />
        </mesh>
      ))}
      {[-1.52, 1.52].map((z) => (
        <mesh key={`frame-z-${z}`} position={[0, 1.35, z]}>
          <boxGeometry args={[3.42, 2.35, 0.09]} />
          <meshStandardMaterial color={frameMaterial} roughness={0.72} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 2.53, 0]}>
        <boxGeometry args={[3.55, 0.09, 3.4]} />
        <meshStandardMaterial color="#a6b6ab" roughness={0.5} metalness={0.14} />
      </mesh>
      {[-0.72, 0, 0.72].map((x) => (
        <mesh key={`grow-bed-${x}`} position={[x, 0.42, 0]} castShadow>
          <boxGeometry args={[0.48, 0.72, 1.75]} />
          <meshStandardMaterial color="#394b3c" roughness={0.94} />
        </mesh>
      ))}
      <mesh position={[0, 0.82, -0.35]}>
        <boxGeometry args={[1.75, 0.65, 0.62]} />
        <meshStandardMaterial color="#65805d" roughness={0.9} />
      </mesh>
    </GroundedStructure>
  )
}

function ResourceStorage(props) {
  return (
    <GroundedStructure id="storage" name="Resource storage" ringRadius={2.2} labelHeight={3.9} {...props}>
      {[-0.78, 0.78].map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.72, 0.72, 1.55, 16, 1]} />
            <meshStandardMaterial
              color={index === 0 ? '#89979a' : '#75858a'}
              roughness={0.72}
              metalness={0.2}
            />
          </mesh>
          <mesh position={[0, 1.59, 0]} castShadow>
            <sphereGeometry args={[0.71, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#9aa4a0" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.8, 0.73]}>
            <boxGeometry args={[0.23, 0.28, 0.035]} />
            <meshStandardMaterial color="#b7a36f" roughness={0.82} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.19, 0]} castShadow>
        <boxGeometry args={[2.2, 0.34, 1.7]} />
        <meshStandardMaterial color="#4b5a5f" roughness={0.9} metalness={0.12} />
      </mesh>
    </GroundedStructure>
  )
}

function EnergyStorage(props) {
  return (
    <GroundedStructure id="energy-storage" name="Energy storage facility" ringRadius={2.2} labelHeight={3.3} {...props}>
      {[-0.72, 0, 0.72].map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.58, 1.55, 0.82]} />
            <meshStandardMaterial color={index === 1 ? '#78898c' : '#687a80'} roughness={0.76} metalness={0.24} />
          </mesh>
          <mesh position={[0, 1.63, 0]}>
            <boxGeometry args={[0.46, 0.08, 0.68]} />
            <meshStandardMaterial color="#a3b2ab" roughness={0.5} metalness={0.24} />
          </mesh>
          <mesh position={[0, 0.9, 0.421]}>
            <boxGeometry args={[0.26, 0.08, 0.025]} />
            <meshStandardMaterial color="#ad9b69" roughness={0.65} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[2.65, 0.32, 1.45]} />
        <meshStandardMaterial color="#4e5c61" roughness={0.9} metalness={0.16} />
      </mesh>
    </GroundedStructure>
  )
}

function WaterRecovery(props) {
  return (
    <GroundedStructure id="water-recovery" name="Water recovery facility" ringRadius={2.15} labelHeight={3.55} {...props}>
      {[-0.64, 0.64].map((x, index) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.58, 0.62, 1.55, 14, 1]} />
            <meshStandardMaterial color={index === 0 ? '#89989a' : '#6f8183'} roughness={0.72} metalness={0.2} />
          </mesh>
          <mesh position={[0, 1.64, 0]} castShadow>
            <sphereGeometry args={[0.58, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#a1aba6" roughness={0.68} metalness={0.18} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.68, 0.56, 0.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 1.34, 8]} />
        <meshStandardMaterial color="#748789" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[2.45, 0.32, 1.45]} />
        <meshStandardMaterial color="#4c5b5e" roughness={0.88} metalness={0.16} />
      </mesh>
    </GroundedStructure>
  )
}

function Communications(props) {
  return (
    <GroundedStructure id="communications" name="Communications antenna" ringRadius={1.75} labelHeight={5.2} {...props}>
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.13, 3.8, 8]} />
        <meshStandardMaterial color="#9aa4a0" roughness={0.68} metalness={0.22} />
      </mesh>
      <mesh position={[0, 3.74, 0]} rotation={[0.42, 0, -0.25]} castShadow>
        <sphereGeometry args={[0.9, 18, 10, 0, Math.PI, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#a9b4ae" roughness={0.56} metalness={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 3.74, 0]} rotation={[0.42, 0, -0.25]}>
        <torusGeometry args={[0.89, 0.035, 5, 24, Math.PI]} />
        <meshStandardMaterial color="#778789" roughness={0.58} metalness={0.28} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.66, 0.85, 0.28, 8]} />
        <meshStandardMaterial color="#626f71" roughness={0.86} metalness={0.16} />
      </mesh>
    </GroundedStructure>
  )
}

function ScienceLab(props) {
  return (
    <GroundedStructure id="science-lab" name="Lunar research laboratory" ringRadius={2.4} labelHeight={4} {...props}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow><boxGeometry args={[3.5, 1.9, 2.8]} /><meshStandardMaterial color="#9a9b90" roughness={0.78} metalness={0.12} /></mesh>
      <mesh position={[0, 2.12, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><boxGeometry args={[3.1, 0.16, 3.1]} /><meshStandardMaterial color="#68797b" roughness={0.76} metalness={0.19} /></mesh>
      {[-1.05, 1.05].map((x) => <mesh key={x} position={[x, 1.25, 1.42]}><boxGeometry args={[0.52, 0.62, 0.06]} /><meshStandardMaterial color="#6b8b96" emissive="#1c3942" emissiveIntensity={0.2} roughness={0.34} /></mesh>)}
      <mesh position={[0, 0.62, 1.46]}><boxGeometry args={[0.54, 1.15, 0.08]} /><meshStandardMaterial color="#52646b" roughness={0.72} metalness={0.18} /></mesh>
      <mesh position={[0.95, 2.34, -0.5]} castShadow><cylinderGeometry args={[0.065, 0.09, 0.55, 8]} /><meshStandardMaterial color="#9da69e" roughness={0.67} metalness={0.24} /></mesh>
    </GroundedStructure>
  )
}

function Rover(props) {
  return (
    <GroundedStructure id="rover" name="Lunar rover" ringRadius={1.8} labelHeight={3.1} {...props}>
      <group rotation={[0, -0.35, 0]}>
        <mesh position={[0, 0.86, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.65, 0.48, 2.05]} />
          <meshStandardMaterial color="#9b9a8b" roughness={0.82} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.2, -0.25]} castShadow>
          <boxGeometry args={[0.94, 0.45, 0.9]} />
          <meshStandardMaterial color="#727f80" roughness={0.67} metalness={0.18} />
        </mesh>
        {[-0.91, 0.91].flatMap((x) => [-0.65, 0.65].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.5, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.22, 12]} />
            <meshStandardMaterial color="#303b3d" roughness={0.95} />
          </mesh>
        )))}
        <mesh position={[0.58, 1.52, -0.5]} rotation={[0, 0, -0.34]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.86, 6]} />
          <meshStandardMaterial color="#b8b9a8" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0.72, 1.92, -0.59]}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial color="#b5a77a" roughness={0.65} metalness={0.12} />
        </mesh>
      </group>
    </GroundedStructure>
  )
}

function LunarStructures({ selectedId, structureStatuses, onSelect, onHover, roverPosition, cutaway }) {
  const shared = { selectedId, structureStatuses, onSelect, onHover }

  return (
    <group>
      <Habitat {...shared} cutaway={cutaway} />
      <SolarArrays {...shared} />
      <Greenhouse {...shared} />
      <ResourceStorage {...shared} />
      <EnergyStorage {...shared} />
      <WaterRecovery {...shared} />
      <Communications {...shared} />
      <ScienceLab {...shared} />
      <Rover {...shared} roverPosition={roverPosition} />
    </group>
  )
}

export default LunarStructures
