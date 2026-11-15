export const missionNavigation = [
  { id: 'mission-selection', label: 'Missions' },
  { id: 'learning-path', label: 'Learning Path' },
  { id: 'experiment-lab', label: 'Experiment Lab' },
  { id: 'learning-glossary', label: 'Glossary' },
  { id: 'mission-control', label: 'Mission Control' },
  { id: 'lunar-base', label: 'Lunar Base' },
  { id: 'resource-intelligence', label: 'Resource Intelligence' },
  { id: 'mission-events', label: 'Mission Events' },
  { id: 'mission-debrief', label: 'Mission Debrief' },
  { id: 'science-assumptions', label: 'Science & Assumptions' },
]

export const missionDays = Array.from({ length: 7 }, (_, index) => ({
  day: index + 1,
  label: `Day ${String(index + 1).padStart(2, '0')}`,
}))

export const missionObjectives = [
  'Trace how an outpost system can affect another.',
  'Make a mission choice and identify its trade-offs.',
  'Review the seven-day mission story in a debrief.',
]
