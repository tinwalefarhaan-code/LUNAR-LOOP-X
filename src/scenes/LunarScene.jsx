import { useEffect, useImperativeHandle, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { structureLocations } from '../data/structureData.js'
import LunarAstronaut from './LunarAstronaut.jsx'
import LunarLighting from './LunarLighting.jsx'
import LunarStructures from './LunarStructures.jsx'
import LunarTerrain from './LunarTerrain.jsx'
import { terrainHeight } from './terrainMath.js'
import LunarCraterLandmarks from './LunarCraterLandmarks.jsx'
import { CRATER_LANDMARKS } from '../learning/levelData.js'

const initialCamera = [29, 21, 34]
const initialTarget = [0, 1, 0]

function OrbitRig({ cameraApiRef }) {
  const { camera, invalidate } = useThree()
  const controlsRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => () => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
  }, [])

  useImperativeHandle(cameraApiRef, () => ({
    reset() {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      if (controlsRef.current) controlsRef.current.enabled = true
      camera.position.set(...initialCamera)
      camera.up.set(0, 1, 0)
      camera.updateProjectionMatrix()
      controlsRef.current?.target.set(...initialTarget)
      controlsRef.current?.update()
      invalidate()
    },
    focus(structureId, roverOffset = [0, 0]) {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      if (controlsRef.current) controlsRef.current.enabled = true
      const crater = CRATER_LANDMARKS.find((landmark) => landmark.id === structureId)
      const [baseX, baseZ] = crater?.position ?? structureLocations[structureId] ?? [0, 0]
      const [x, z] = structureId === 'rover'
        ? [baseX + roverOffset[0], baseZ + roverOffset[1]]
        : [baseX, baseZ]
      const target = new THREE.Vector3(x, terrainHeight(x, z) + 1.25, z)
      camera.position.copy(target).add(new THREE.Vector3(9, 7, 12))
      camera.updateProjectionMatrix()
      controlsRef.current?.target.copy(target)
      controlsRef.current?.update()
      invalidate()
    },
    approach(onComplete) {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
      const controls = controlsRef.current
      if (!controls) return

      controls.enabled = false
      const target = new THREE.Vector3(...initialTarget)
      const start = new THREE.Vector3(49, 31, 58)
      const end = new THREE.Vector3(...initialCamera)
      const startedAt = performance.now()
      const duration = 2400
      camera.position.copy(start)
      camera.lookAt(target)
      controls.target.copy(target)
      invalidate()

      const step = (now) => {
        const linear = Math.min(1, (now - startedAt) / duration)
        const eased = THREE.MathUtils.smoothstep(linear, 0, 1)
        camera.position.lerpVectors(start, end, eased)
        camera.lookAt(target)
        controls.target.copy(target)
        controls.update()
        invalidate()
        if (linear < 1) {
          animationFrameRef.current = requestAnimationFrame(step)
        } else {
          animationFrameRef.current = null
          controls.enabled = true
          onComplete?.()
        }
      }

      animationFrameRef.current = requestAnimationFrame(step)
    },
  }), [camera, invalidate])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={initialTarget}
      enableDamping
      dampingFactor={0.08}
      enablePan
      enableZoom
      minDistance={10}
      maxDistance={72}
      minPolarAngle={0.18}
      maxPolarAngle={1.48}
      zoomSpeed={0.72}
      panSpeed={0.72}
    />
  )
}

function RendererLifecycle({ onReady, onContextLost }) {
  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const handleContextLost = (event) => {
      event.preventDefault()
      onContextLost('The graphics context was lost. Reload the page to retry the 3D view.')
    }

    canvas.addEventListener('webglcontextlost', handleContextLost)
    onReady()

    return () => canvas.removeEventListener('webglcontextlost', handleContextLost)
  }, [gl, onContextLost, onReady])

  return null
}

function SceneContent({
  selectedId,
  structureStatuses,
  roverPosition,
  cutaway,
  onSelect,
  onHover,
  cameraApiRef,
  onReady,
  onContextLost,
}) {
  return (
    <>
      <LunarLighting />
      <LunarTerrain />
      <LunarStructures selectedId={selectedId} structureStatuses={structureStatuses} onSelect={onSelect} onHover={onHover} roverPosition={roverPosition} cutaway={cutaway && selectedId === 'habitat'} />
      <LunarCraterLandmarks selectedId={selectedId} onSelect={onSelect} onHover={onHover} />
      <LunarAstronaut selectedId={selectedId} status={structureStatuses.astronaut} onSelect={onSelect} onHover={onHover} />
      <OrbitRig cameraApiRef={cameraApiRef} />
      <RendererLifecycle onReady={onReady} onContextLost={onContextLost} />
    </>
  )
}

function LunarScene({
  selectedId,
  structureStatuses,
  roverPosition,
  cutaway,
  onSelect,
  onHover,
  cameraApiRef,
  onReady,
  onContextLost,
}) {
  return (
    <Canvas
      className="lunar-canvas"
      camera={{ position: initialCamera, fov: 42, near: 0.1, far: 180 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      shadows="soft"
      fallback={(
        <div className="scene-fallback" role="status">
          <strong>3D rendering is unavailable in this browser.</strong>
          <span>The rest of Mission Control remains available.</span>
        </div>
      )}
      onPointerMissed={() => onSelect(null)}
    >
      <SceneContent
        selectedId={selectedId}
        structureStatuses={structureStatuses}
        roverPosition={roverPosition}
        cutaway={cutaway}
        onSelect={onSelect}
        onHover={onHover}
        cameraApiRef={cameraApiRef}
        onReady={onReady}
        onContextLost={onContextLost}
      />
    </Canvas>
  )
}

export default LunarScene
