import { Info } from 'lucide-react'
import { getDashboardResources } from '../simulation/selectors.js'
import ResourceCard from './ResourceCard.jsx'

function ResourceDashboard({ missionState }) {
  const resources = getDashboardResources(missionState)

  return (
    <section className="resource-section" id="resource-intelligence" aria-labelledby="resource-title">
      <div className="section-heading">
        <div>
          <div className="section-heading__eyebrow">LIVE MODEL STATE <span> / </span> 06 DOMAINS</div>
          <h2 id="resource-title">Resource intelligence</h2>
        </div>
        <div className="data-disclaimer">
          <Info size={15} aria-hidden="true" />
          <span>Educational model output · not NASA telemetry</span>
        </div>
      </div>
      <div className="resource-grid">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
      <p className="simulation-disclaimer">Values are calculated from the project’s documented educational assumptions and update only when simulated time advances.</p>
    </section>
  )
}

export default ResourceDashboard
