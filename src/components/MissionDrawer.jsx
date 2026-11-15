import { X } from 'lucide-react'
import MissionDebriefPanel from './MissionDebriefPanel.jsx'
import MissionEventPanel from './MissionEventPanel.jsx'
import MissionIntelligencePanel from './MissionIntelligencePanel.jsx'
import MissionOverview from './MissionOverview.jsx'
import MissionTimeline from './MissionTimeline.jsx'
import MissionSelectionPanel from './MissionSelectionPanel.jsx'
import RunComparisonPanel from './RunComparisonPanel.jsx'
import ResourceDashboard from './ResourceDashboard.jsx'
import ScienceAssumptionsPanel from './ScienceAssumptionsPanel.jsx'
import LearningPathPanel from './LearningPathPanel.jsx'
import ExperimentLabPanel from './ExperimentLabPanel.jsx'
import LearningGlossaryPanel from './LearningGlossaryPanel.jsx'

const sectionTitles = {
  'mission-selection': ['Mission selection', 'MISSION DEPLOYMENT'],
  'learning-path': ['Moon learning path', 'SPACE EXPLORER ACADEMY'],
  'experiment-lab': ['Experiment Lab', 'INTERACTIVE CLASSROOM'],
  'learning-glossary': ['Explorer glossary', 'SPACE WORDS'],
  'mission-control': ['Mission briefing', 'MISSION CONTROL'],
  'resource-intelligence': ['Systems intelligence', 'RESOURCE INTELLIGENCE'],
  'mission-events': ['Mission events', 'EVENT OPERATIONS'],
  'mission-debrief': ['Mission history', 'MISSION DEBRIEF'],
  'science-assumptions': ['Science & assumptions', 'MODEL TRANSPARENCY'],
}

function MissionDrawer({ activeSection, missionState, actions, runs, onReplay, learningProgress, onLearningUpdate, onClose }) {
  if (activeSection === 'lunar-base') return null

  const [title, eyebrow] = sectionTitles[activeSection] ?? sectionTitles['mission-control']

  return (
    <>
      <button className="mission-drawer__scrim" type="button" onClick={onClose} aria-label="Close mission panel" />
      <aside className="mission-drawer" aria-label={title}>
        <div className="mission-drawer__header">
          <div><small>{eyebrow}</small><h2>{title}</h2></div>
          <button className="mission-drawer__close" type="button" onClick={onClose} aria-label="Close mission panel"><X size={18} /></button>
        </div>
        <div className="mission-drawer__content">
          {activeSection === 'learning-path' && <LearningPathPanel progress={learningProgress} onUpdate={onLearningUpdate} missionState={missionState} onLanding={actions.onLanding} onMoveRover={actions.onMoveRover} onFocusStructure={actions.onFocusStructure} onOpenExperiment={() => actions.onNavigate('experiment-lab')} onOpenMissions={() => actions.onNavigate('mission-selection')} onOpenEvents={() => actions.onNavigate('mission-events')} />}
          {activeSection === 'experiment-lab' && <ExperimentLabPanel missionState={missionState} onExperimentRun={actions.onExperimentRun} />}
          {activeSection === 'learning-glossary' && <LearningGlossaryPanel />}
          {activeSection === 'mission-selection' && (
            <MissionSelectionPanel missionState={missionState} onLaunch={actions.onLaunchScenario} />
          )}
          {activeSection === 'mission-control' && (
            <MissionOverview
              missionState={missionState}
              onStart={actions.onStart}
              onPause={actions.onPause}
              onAdvanceHour={actions.onAdvanceHour}
              onAdvanceDay={actions.onAdvanceDay}
              onReset={actions.onReset}
              onRestart={actions.onRestart}
            />
          )}
          {activeSection === 'resource-intelligence' && (
            <>
              <ResourceDashboard missionState={missionState} />
              <MissionIntelligencePanel missionState={missionState} />
            </>
          )}
          {activeSection === 'mission-events' && (
            <MissionEventPanel
              missionState={missionState}
              onTriggerEvent={actions.onTriggerEvent}
              onResolveDecision={actions.onResolveDecision}
              onFocusFacility={actions.onFocusStructure}
            />
          )}
          {activeSection === 'mission-debrief' && (
            <>
              <MissionTimeline missionState={missionState} />
              <MissionDebriefPanel missionState={missionState} />
              <RunComparisonPanel runs={runs} onReplay={onReplay} />
            </>
          )}
          {activeSection === 'science-assumptions' && <ScienceAssumptionsPanel />}
        </div>
      </aside>
    </>
  )
}

export default MissionDrawer
