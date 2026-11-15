import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { structureLocations } from '../data/structureData.js'
import { terrainHeight } from './terrainMath.js'

function makeTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(86, 86, 200, 200)
  geometry.rotateX(-Math.PI / 2)

  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)
  const color = new THREE.Color()

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const z = positions.getZ(index)
    const height = terrainHeight(x, z)
    positions.setY(index, height)

    const grain = 0.5 + 0.5 * Math.sin(x * 3.13 + z * 2.71) * Math.cos(z * 4.2)
    const fineGrain = Math.sin(x * 8.6 + z * 6.7) * Math.cos(z * 9.4 - x * 4.8)
    const shade = THREE.MathUtils.clamp(0.56 + height * 0.045 + (grain - 0.5) * 0.07 + fineGrain * 0.018, 0.34, 0.74)
    color.setRGB(shade * 0.94, shade * 0.92, shade * 0.87)
    color.toArray(colors, index * 3)
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function createRockPositions() {
  let seed = 78619
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const anchors = Object.values(structureLocations)
  const rocks = []

  while (rocks.length < 68) {
    const x = (random() - 0.5) * 78
    const z = (random() - 0.5) * 78
    const tooCloseToOutpost = anchors.some(([anchorX, anchorZ]) =>
      Math.hypot(x - anchorX, z - anchorZ) < 3.5,
    )

    if (!tooCloseToOutpost) {
      rocks.push({
        x,
        z,
        scaleX: 0.18 + random() * 0.52,
        scaleY: 0.14 + random() * 0.34,
        scaleZ: 0.16 + random() * 0.47,
        rotation: random() * Math.PI * 2,
        shade: 0.55 + random() * 0.42,
      })
    }
  }

  return rocks
}

function SurfaceRocks() {
  const rocksRef = useRef(null)
  const rocks = useMemo(() => createRockPositions(), [])

  useEffect(() => {
    const mesh = rocksRef.current
    if (!mesh) return

    const transform = new THREE.Object3D()
    const rockColor = new THREE.Color()

    rocks.forEach((rock, index) => {
      transform.position.set(rock.x, terrainHeight(rock.x, rock.z) + rock.scaleY * 0.48, rock.z)
      transform.rotation.set(rock.rotation * 0.11, rock.rotation, rock.rotation * 0.08)
      transform.scale.set(rock.scaleX, rock.scaleY, rock.scaleZ)
      transform.updateMatrix()
      mesh.setMatrixAt(index, transform.matrix)

      const shade = rock.shade
      rockColor.setRGB(shade * 0.78, shade * 0.75, shade * 0.69)
      mesh.setColorAt(index, rockColor)
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [rocks])

  return (
    <instancedMesh ref={rocksRef} args={[undefined, undefined, rocks.length]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#a49b8b" roughness={1} metalness={0} />
    </instancedMesh>
  )
}

function LunarTerrain() {
  const geometry = useMemo(() => makeTerrainGeometry(), [])

  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>
      <SurfaceRocks />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]} receiveShadow>
        <planeGeometry args={[230, 230]} />
        <meshStandardMaterial color="#191a1a" roughness={1} />
      </mesh>
    </>
  )
}

export default LunarTerrain
