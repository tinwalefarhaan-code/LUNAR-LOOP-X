import { useEffect, useMemo, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader.jsx'
import LunarEnvironmentPanel from '../components/LunarEnvironmentPanel.jsx'
import MissionDrawer from '../components/MissionDrawer.jsx'
import MissionHud from '../components/MissionHud.jsx'
import MissionCompletionExperience from '../components/MissionCompletionExperience.jsx'
import { CRATER_LANDMARKS } from '../learning/levelData.js'
import { loadLearningProgress, moveLearningRover, recordCraterInspection, recordEventDecision, recordExperiment, recordLanding, recordMissionRun, recordScienceView, recordStructureInspection, saveLearningProgress, setLearningMode } from '../learning/learningProgress.js'
import { MISSION_EVENTS } from '../simulation/eventEngine.js'
import { useMissionSimulation } from '../simulation/useMissionSimulation.js'

function MissionControlApp() {
  const simulation = useMissionSimulation()
  const { missionState } = simulation
  const [learningProgress, setLearningProgress] = useState(() => loadLearningProgress())
  const effectiveLearningProgress = useMemo(() => recordMissionRun(learningProgress, missionState), [learningProgress, missionState])
  const [activeSection, setActiveSection] = useState(() => (
    missionState.status === 'standby' && missionState.elapsedHours === 0 ? 'learning-path' : 'lunar-base'
  ))
  const [menuOpen, setMenuOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [selectedStructureId, setSelectedStructureId] = useState('habitat')
  const [completionVisible, setCompletionVisible] = useState(false)
  const completedRunShown = useRef(null)
  const cameraApiRef = useRef(null)

  useEffect(() => {
    saveLearningProgress(effectiveLearningProgress)
  }, [effectiveLearningProgress])

  useEffect(() => {
    if (!['complete', 'failed'].includes(missionState.status) || completedRunShown.current === missionState.runId) return
    completedRunShown.current = missionState.runId
    setCompletionVisible(true)
  }, [missionState.runId, missionState.status])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(media.matches)
    updatePreference()
    media.addEventListener?.('change', updatePreference)
    return () => media.removeEventListener?.('change', updatePreference)
  }, [])

  useEffect(() => {
    function closeOverlays(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOverlays)
    return () => window.removeEventListener('keydown', closeOverlays)
  }, [])

  function handleStartMission() {
    simulation.start()
    setAnnouncement('Mission active. Simulation time advances only through the explicit hour or day controls.')
  }

  function handlePauseMission() {
    simulation.pause()
    setAnnouncement('Mission clock paused. Resume before advancing simulated time.')
  }

  function handleResetMission() {
    setCompletionVisible(false)
    simulation.reset()
    setAnnouncement('Mission reset to the configured educational baseline.')
  }

  function handleRestartMission(scenarioId = missionState.scenarioId) {
    simulation.replay(scenarioId)
    setCompletionVisible(false)
    setActiveSection('lunar-base')
    setAnnouncement('Mission replay started from the selected scenario baseline.')
  }

  function handleLaunchScenario(scenarioId) {
    setCompletionVisible(false)
    simulation.selectScenario(scenarioId)
    simulation.start()
    setActiveSection('lunar-base')
    cameraApiRef.current?.reset()
    setAnnouncement('Selected scenario launched. Mission time advances only through explicit controls.')
  }

  function handleLandingActivity() {
    if (!reducedMotion) cameraApiRef.current?.approach?.()
    updateLearningProgress((progress) => recordLanding(progress))
    setAnnouncement('Landing approach complete. The camera sequence is a learning scene, not a lander simulation.')
  }

  function handleSelectStructure(structureId) {
    setSelectedStructureId(structureId)
    if (CRATER_LANDMARKS.some((crater) => crater.id === structureId)) {
      updateLearningProgress((progress) => recordCraterInspection(progress, structureId))
    } else if (structureId) {
      updateLearningProgress((progress) => recordStructureInspection(progress, structureId))
    }
  }

  function handleScienceView(structureId) {
    if (structureId) updateLearningProgress((progress) => recordScienceView(progress, structureId))
  }

  function handleRoverMove(dx, dz) {
    const next = moveLearningRover(effectiveLearningProgress, dx, dz)
    setLearningProgress(next)
    cameraApiRef.current?.focus('rover', next.roverPosition)
    setAnnouncement('Rover moved in the learning scene. Travel distance and power use are not simulated.')
  }

  function handleAdvanceHour() {
    simulation.advanceHour()
    setAnnouncement('Advanced one simulated hour.')
  }

  function handleAdvanceDay() {
    simulation.advanceDay()
    setAnnouncement('Advanced up to one simulated day.')
  }

  function handleTriggerEvent(eventId) {
    simulation.triggerEvent(eventId)
    const event = MISSION_EVENTS.find((item) => item.id === eventId)
    if (event?.facilityId) {
      setSelectedStructureId(event.facilityId)
      cameraApiRef.current?.focus(event.facilityId)
    }
    setAnnouncement(`${event?.title ?? 'Mission event'} selected. Choose a response to calculate its consequences.`)
  }

  function handleFocusStructure(structureId) {
    handleSelectStructure(structureId)
    cameraApiRef.current?.focus(structureId)
  }

  function handleResolveDecision(eventId, choiceId) {
    const event = MISSION_EVENTS.find((item) => item.id === eventId)
    const choice = event?.decisions.find((item) => item.id === choiceId)
    if (missionState.status !== 'active' || missionState.pendingEventId !== eventId || !choice) return
    simulation.resolveDecision(eventId, choiceId)
    updateLearningProgress((progress) => recordEventDecision(progress, eventId))
    setAnnouncement(`${choice?.label ?? 'Mission decision'} applied. One simulated hour of consequences was calculated.`)
  }

  function handleNavigate(sectionId) {
    setActiveSection(sectionId)
    setMenuOpen(false)
  }

  function handleLearningModeChange(mode) {
    updateLearningProgress((progress) => setLearningMode(progress, mode))
  }

  function updateLearningProgress(update) {
    setLearningProgress((progress) => update(recordMissionRun(progress, missionState)))
  }

  function handleOpenDebrief() {
    setCompletionVisible(false)
    handleNavigate('mission-debrief')
  }

  const drawerActions = {
    onStart: handleStartMission,
    onPause: handlePauseMission,
    onReset: handleResetMission,
    onRestart: handleRestartMission,
    onAdvanceHour: handleAdvanceHour,
    onAdvanceDay: handleAdvanceDay,
    onTriggerEvent: handleTriggerEvent,
    onResolveDecision: handleResolveDecision,
    onLaunchScenario: handleLaunchScenario,
    onFocusStructure: handleFocusStructure,
    onLanding: handleLandingActivity,
    onMoveRover: handleRoverMove,
    onExperimentRun: () => updateLearningProgress((progress) => recordExperiment(progress)),
    onNavigate: handleNavigate,
  }

  return (
    <div className="app-shell app-shell--world">
      <a className="skip-link" href="#world-canvas">Skip to the lunar environment</a>
      <AppHeader
        activeSection={activeSection}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onNavigate={handleNavigate}
      />
      <main className="main-content main-content--world" id="main-content">
        {!simulation.storageAvailable && (
          <p className="storage-notice world-storage-notice" role="status">Storage unavailable: mission history will not persist after this page closes.</p>
        )}
        <LunarEnvironmentPanel
          missionState={missionState}
          cameraApiRef={cameraApiRef}
          reducedMotion={reducedMotion}
          selectedId={selectedStructureId}
          onSelectStructure={handleSelectStructure}
          onScienceView={handleScienceView}
          learningMode={learningProgress.mode}
          roverPosition={learningProgress.roverPosition}
        />
        <MissionHud
          missionState={missionState}
          learningProgress={effectiveLearningProgress}
          onStart={handleStartMission}
          onPause={handlePauseMission}
          onRestart={handleRestartMission}
          onOpenBriefing={() => handleNavigate('mission-control')}
          onOpenEvents={() => handleNavigate('mission-events')}
          onOpenDebrief={handleOpenDebrief}
          onOpenLearning={() => handleNavigate('learning-path')}
          onLearningModeChange={handleLearningModeChange}
        />
        <MissionDrawer
          activeSection={activeSection}
          missionState={missionState}
          actions={drawerActions}
          runs={simulation.runs}
          onReplay={handleRestartMission}
          learningProgress={effectiveLearningProgress}
          onLearningUpdate={updateLearningProgress}
          onClose={() => handleNavigate('lunar-base')}
        />
      </main>
      {completionVisible && (
        <MissionCompletionExperience
          missionState={missionState}
          runs={simulation.runs}
          reducedMotion={reducedMotion}
          onDebrief={handleOpenDebrief}
          onReplay={handleRestartMission}
          onSkip={handleOpenDebrief}
        />
      )}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  )
}

export default MissionControlApp
