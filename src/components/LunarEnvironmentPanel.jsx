import { lazy, Suspense, useCallback, useState } from 'react'
import { AlertTriangle, Eye, EyeOff, Focus, LoaderCircle, RotateCcw } from 'lucide-react'
import { structureList } from '../data/structureData.js'
import { getStructureStatuses } from '../simulation/selectors.js'
import SceneErrorBoundary from '../scenes/SceneErrorBoundary.jsx'
import { hasWebGLSupport } from '../scenes/webglSupport.js'
import EntryExperience from './EntryExperience.jsx'
import SegmentedTabs from './SegmentedTabs.jsx'
import StructureInfoPanel from './StructureInfoPanel.jsx'
import StructureSelector from './StructureSelector.jsx'
import ScienceInsightPanel from './ScienceInsightPanel.jsx'
import { getFacilityInspection } from '../simulation/selectors.js'
import { CRATER_LANDMARKS } from '../learning/levelData.js'

const LunarScene = lazy(() => import('../scenes/LunarScene.jsx'))

const inspectorTabs = [
  { id: 'details', label: 'Facility' },
  { id: 'guide', label: 'System guide' },
  { id: 'science', label: 'Science insight' },
]

function SceneLoading({ message = 'Preparing the lunar environment…' }) {
  return (
    <div className="scene-loading" role="status" aria-live="polite">
      <LoaderCircle size={22} className="scene-loading__spinner" />
      <strong>{message}</strong>
      <span>Loading the procedural terrain and outpost</span>
    </div>
  )
}

function SceneUnavailable({ message }) {
  return (
    <div className="scene-unavailable" role="alert">
      <span className="scene-unavailable__icon"><AlertTriangle size={21} /></span>
      <strong>3D environment unavailable</strong>
      <p>{message || 'This browser could not start WebGL. The facility guide and mission controls remain available.'}</p>
    </div>
  )
}

function SystemGuide({ onSelect }) {
  return (
    <div className="system-guide">
      {structureList.map((structure) => (
        <button
          className="system-guide__item"
          key={structure.id}
          type="button"
          onClick={() => onSelect(structure.id)}
        >
          <span className="system-guide__name">{structure.shortName}</span>
          <span className="system-guide__purpose">{structure.purpose}</span>
          <span className="system-guide__systems">{structure.systems.join(' · ')}</span>
        </button>
      ))}
    </div>
  )
}

function LunarEnvironmentPanel({ missionState, cameraApiRef, reducedMotion, selectedId, onSelectStructure, onScienceView, learningMode = 'explorer', roverPosition = [0, 0] }) {
  const [activeTab, setActiveTab] = useState('details')
  const [hoveredId, setHoveredId] = useState(null)
  const [webglStatus] = useState(() => (
    typeof document !== 'undefined' && hasWebGLSupport() ? 'available' : 'unavailable'
  ))
  const [sceneLoading, setSceneLoading] = useState(true)
  const [sceneError, setSceneError] = useState('')
  const [cutaway, setCutaway] = useState(false)
  const tabSetId = 'environment-inspector'
  const selectedStructure = structureList.find((structure) => structure.id === selectedId)
    ?? CRATER_LANDMARKS.find((crater) => crater.id === selectedId)
  const structureStatuses = getStructureStatuses(missionState)
  const inspection = getFacilityInspection(missionState, selectedId)

  const handleSceneReady = useCallback(() => setSceneLoading(false), [])
  const handleContextLost = useCallback((message) => {
    setSceneLoading(false)
    setSceneError(message)
  }, [])
  const handleSceneError = useCallback((error) => {
    setSceneLoading(false)
    setSceneError(`The 3D view could not be rendered. ${error.message}`)
  }, [])

  function selectStructure(structureId) {
    onSelectStructure(structureId)
    setActiveTab('details')
  }

  function selectInspectorTab(tabId) {
    setActiveTab(tabId)
    if (tabId === 'science') onScienceView?.(selectedId)
  }

  function focusSelectedStructure() {
    if (selectedId) cameraApiRef.current?.focus(selectedId)
  }

  return (
    <section className="environment-panel world-environment" id="lunar-base" aria-label="Interactive lunar research outpost">
      <div className="scene-viewport world-viewport" id="world-canvas" tabIndex={-1} aria-label="Interactive lunar environment viewport">
        {webglStatus === 'unavailable' && (
          <SceneUnavailable message="WebGL is unavailable or disabled in this browser. Use the facility selector and guide; mission systems remain available." />
        )}
        {webglStatus === 'available' && !sceneError && (
          <Suspense fallback={<SceneLoading />}>
            <SceneErrorBoundary
              key="lunar-scene-error-boundary"
              onError={handleSceneError}
              fallback={<SceneUnavailable message={sceneError} />}
            >
              <LunarScene
                selectedId={selectedId}
                structureStatuses={structureStatuses}
                roverPosition={roverPosition}
                cutaway={cutaway}
                onSelect={selectStructure}
                onHover={setHoveredId}
                cameraApiRef={cameraApiRef}
                onReady={handleSceneReady}
                onContextLost={handleContextLost}
              />
            </SceneErrorBoundary>
          </Suspense>
        )}
        {webglStatus === 'available' && sceneLoading && !sceneError && (
          <div className="scene-loading scene-loading--overlay" role="status" aria-live="polite">
            <LoaderCircle size={22} className="scene-loading__spinner" />
            <strong>Rendering the outpost…</strong>
          </div>
        )}
        {webglStatus === 'available' && sceneError && <SceneUnavailable message={sceneError} />}

        <div className="world-caption">
          <span className="world-caption__overline">SOUTH POLE FIELD SITE <i /> {learningMode === 'mission' ? 'GUIDED MISSION' : 'FREE EXPLORATION'}</span>
          <strong>Research outpost</strong>
          <small>Procedural lunar environment · educational model</small>
        </div>

        {webglStatus === 'available' && !sceneError && (
          <div className="scene-viewport__controls world-camera-controls" aria-label="Scene camera controls">
            <button
              type="button"
              onClick={() => cameraApiRef.current?.reset()}
              aria-label="Reset camera to the full outpost view"
              title="Reset camera"
            >
              <RotateCcw size={15} /> <span>Reset view</span>
            </button>
            <button
              type="button"
              onClick={() => setCutaway((open) => !open)}
              disabled={selectedId !== 'habitat'}
              aria-label={cutaway ? 'Close habitat cutaway view' : 'Open habitat cutaway view'}
              title={selectedId === 'habitat' ? 'Toggle habitat cutaway' : 'Select the habitat to open its cutaway'}
            >
              {cutaway ? <EyeOff size={15} /> : <Eye size={15} />} <span>{cutaway ? 'Close cutaway' : 'Habitat cutaway'}</span>
            </button>
            <button
              type="button"
              onClick={focusSelectedStructure}
              disabled={!selectedId}
              aria-label={selectedStructure ? `Focus camera on ${selectedStructure.name}` : 'Select a facility to focus the camera'}
              title="Focus selected facility"
            >
              <Focus size={15} /> <span>Focus facility</span>
            </button>
          </div>
        )}

        <nav className="world-facility-rail" aria-label="Select a facility to inspect">
          <div className="world-facility-rail__label">FACILITIES</div>
          <StructureSelector selectedId={selectedId} hoveredId={hoveredId} onSelect={selectStructure} />
        </nav>

        <aside className="world-inspector" aria-label="Selected facility information">
          <div className="world-inspector__topline">
            <span>FACILITY INSPECTION</span>
            <span className="world-inspector__live"><i /> MODEL STATE</span>
          </div>
          <SegmentedTabs
            id={tabSetId}
            label="Facility information views"
            items={inspectorTabs}
            value={activeTab}
            onChange={selectInspectorTab}
          />
          <div
            className="world-inspector__content"
            id={`${tabSetId}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabSetId}-tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === 'details'
              ? <StructureInfoPanel structure={selectedStructure} simulationStatus={structureStatuses[selectedId]} inspection={inspection} />
              : activeTab === 'science'
                ? <ScienceInsightPanel structure={selectedStructure} inspection={inspection} />
                : <SystemGuide onSelect={selectStructure} />}
          </div>
          <p className="world-inspector__disclaimer">Illustrative values only · no NASA telemetry</p>
        </aside>

        <div className="scene-viewport__hint world-camera-hint">
          Drag to orbit <span>·</span> Scroll to zoom <span>·</span> Right-drag to pan
        </div>

        <EntryExperience cameraApiRef={cameraApiRef} reducedMotion={reducedMotion} />
      </div>
    </section>
  )
}

export default LunarEnvironmentPanel
