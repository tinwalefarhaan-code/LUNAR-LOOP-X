import { useMemo } from 'react'
import * as THREE from 'three'
import { Stars } from '@react-three/drei'

const continentShapes = [
  { longitude: -1.65, latitude: 0.62, width: 0.42, height: 0.65 },
  { longitude: -0.84, latitude: 0.28, width: 0.34, height: 0.42 },
  { longitude: -0.28, latitude: 0.78, width: 0.3, height: 0.26 },
  { longitude: 0.55, latitude: 0.5, width: 0.4, height: 0.62 },
  { longitude: 1.18, latitude: 0.04, width: 0.42, height: 0.56 },
  { longitude: 2.35, latitude: -0.55, width: 0.48, height: 0.4 },
  { longitude: -2.55, latitude: -0.38, width: 0.34, height: 0.48 },
]

function longitudeDistance(left, right) {
  const difference = Math.abs(left - right) % (Math.PI * 2)
  return Math.min(difference, Math.PI * 2 - difference)
}

function makeEarthGeometry() {
  const geometry = new THREE.SphereGeometry(2.05, 56, 40)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)
  const ocean = new THREE.Color('#32678a')
  const land = new THREE.Color('#7e896f')
  const cloud = new THREE.Color('#b5c1bd')
  const ice = new THREE.Color('#aebfc0')

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const y = positions.getY(index)
    const z = positions.getZ(index)
    const longitude = Math.atan2(z, x)
    const latitude = Math.asin(y / 2.05)
    const noise = Math.sin(longitude * 17 + latitude * 9)
      * Math.cos(longitude * 8 - latitude * 23) * 0.12
    const onLand = continentShapes.some((shape) => {
      const dx = longitudeDistance(longitude, shape.longitude) / shape.width
      const dy = (latitude - shape.latitude) / shape.height
      return dx * dx + dy * dy < 1 + noise
    })
    const cloudBand = Math.sin(longitude * 5 + latitude * 12)
      + Math.sin(longitude * 12 - latitude * 19) * 0.35
    const color = Math.abs(latitude) > 1.32
      ? ice
      : cloudBand > 1.12
        ? cloud
        : onLand
          ? land
          : ocean
    color.toArray(colors, index * 3)
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

function Earth() {
  const geometry = useMemo(() => makeEarthGeometry(), [])

  return (
    <group position={[-30, 29, -48]} rotation={[0.12, 0.7, -0.08]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.94}
          metalness={0}
          emissive="#10202a"
          emissiveIntensity={0.23}
        />
      </mesh>
      <mesh scale={1.075}>
        <sphereGeometry args={[2.05, 32, 24]} />
        <meshBasicMaterial
          color="#6aa2c1"
          side={THREE.BackSide}
          transparent
          opacity={0.13}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function LunarLighting() {
  return (
    <>
      <color attach="background" args={['#03070d']} />
      <fog attach="fog" args={['#070c12', 66, 145]} />
      <hemisphereLight args={['#b7cbd4', '#302a22', 0.48]} />
      <directionalLight
        position={[-32, 48, -22]}
        intensity={2.25}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={125}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-bias={-0.00015}
      />
      <Stars radius={112} depth={64} count={180} factor={0.78} saturation={0} fade speed={0} />
      <Earth />
    </>
  )
}

export default LunarLighting
