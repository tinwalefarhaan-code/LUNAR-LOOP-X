import {
  Activity,
  Award,
  BookOpen,
  BookMarked,
  ClipboardList,
  Compass,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Orbit,
  Radio,
  X,
} from 'lucide-react'
import { missionNavigation } from '../data/missionDemoData.js'

const navigationIcons = {
  'mission-selection': Compass,
  'learning-path': Award,
  'experiment-lab': FlaskConical,
  'learning-glossary': BookMarked,
  'mission-control': LayoutDashboard,
  'lunar-base': Orbit,
  'resource-intelligence': Activity,
  'mission-events': Radio,
  'mission-debrief': ClipboardList,
  'science-assumptions': BookOpen,
}

function AppHeader({ activeSection, menuOpen, onMenuToggle, onNavigate }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <button
          className="brand"
          type="button"
          onClick={() => onNavigate('lunar-base')}
          aria-label="LUNAR LOOP X, Mission Control"
        >
          <span className="brand__mark" aria-hidden="true">
            <Orbit size={20} strokeWidth={1.8} />
          </span>
          <span className="brand__copy">
            <span className="brand__name">LUNAR LOOP <b>X</b></span>
            <span className="brand__subname">MISSION INTELLIGENCE</span>
          </span>
        </button>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={onMenuToggle}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav
          className={`primary-nav${menuOpen ? ' primary-nav--open' : ''}`}
          id="primary-navigation"
          aria-label="Main navigation"
        >
          {missionNavigation.map((item) => {
            const Icon = navigationIcons[item.id]

            return (
              <button
                key={item.id}
                className={`primary-nav__link${activeSection === item.id ? ' primary-nav__link--active' : ''}`}
                aria-current={activeSection === item.id ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
                type="button"
              >
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="topbar__mode" aria-label="Educational demonstration mode">
          <span className="mode-indicator" aria-hidden="true" />
          <span>EDUCATIONAL MODE</span>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
