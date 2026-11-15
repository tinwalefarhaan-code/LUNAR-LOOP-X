import { useState } from 'react'
import { FlaskConical, Sparkles } from 'lucide-react'
import { DEFAULT_EXPERIMENT, runExperiment } from '../learning/experimentEngine.js'

function ExperimentLabPanel({ missionState, onExperimentRun }) {
  const [inputs, setInputs] = useState(() => ({
    ...DEFAULT_EXPERIMENT,
    energyReserveKwh: missionState.resources.energyKwh,
  }))
  const [result, setResult] = useState(null)
  function update(key, value) {
    setInputs((current) => ({ ...current, [key]: value }))
    setResult(null)
  }

  function calculate() {
    setResult(runExperiment(missionState, inputs))
    onExperimentRun?.()
  }

  return (
    <section className="experiment-lab panel" aria-labelledby="experiment-lab-title">
      <div className="panel-header panel-header--compact"><div><div className="section-heading__eyebrow">INTERACTIVE CLASSROOM <span>/</span> ONE MODEL HOUR</div><h2 id="experiment-lab-title">Experiment Lab</h2></div><FlaskConical size={18} /></div>
      <p className="experiment-lab__intro">Change one or more teaching inputs, then compare the next calculated hour. This is a separate experiment; your mission does not change.</p>
      <div className="experiment-lab__inputs">
        <label>Available sunlight <strong>{inputs.sunlightPercent}% of this scenario’s baseline</strong><input type="range" min="0" max="100" step="5" value={inputs.sunlightPercent} onChange={(event) => update('sunlightPercent', Number(event.target.value))} /></label>
        <label>Added equipment demand <strong>{inputs.addedDemandKwh.toFixed(1)} kWh for one model hour</strong><input type="range" min="0" max="4" step="0.2" value={inputs.addedDemandKwh} onChange={(event) => update('addedDemandKwh', Number(event.target.value))} /></label>
        <label>Starting battery reserve <strong>{inputs.energyReserveKwh.toFixed(1)} kWh</strong><input type="range" min="0" max="160" step="1" value={inputs.energyReserveKwh} onChange={(event) => update('energyReserveKwh', Number(event.target.value))} /></label>
        <label className="experiment-lab__toggle"><input type="checkbox" checked={inputs.pauseNonessential} onChange={(event) => update('pauseNonessential', event.target.checked)} /><span><strong>Pause nonessential equipment</strong><small>Remove its configured load for this calculation.</small></span></label>
        <label className="experiment-lab__toggle"><input type="checkbox" checked={inputs.greenhouseOnline} onChange={(event) => update('greenhouseOnline', event.target.checked)} /><span><strong>Include greenhouse in the base plan</strong><small>When unchecked, its power load and irrigation are removed for this calculation.</small></span></label>
      </div>
      <button className="experiment-lab__run" type="button" onClick={calculate}><Sparkles size={15} /> Run one-hour experiment</button>
      {result && (
        <div className="experiment-results" aria-live="polite">
          <div className="experiment-results__heading"><span>MODEL OUTPUT · ONE SIMULATED HOUR</span><strong>Cause and effect</strong></div>
          <div className="experiment-results__power">
            <div><span>Solar generation</span><strong>{result.baseline.systems.solarGenerationPotentialKwh.toFixed(2)} <i>baseline</i></strong><strong>{result.experimental.systems.solarGenerationPotentialKwh.toFixed(2)} <i>experiment</i></strong></div>
            <div><span>Power used</span><strong>{result.baseline.systems.powerUsedKwh.toFixed(2)} <i>baseline</i></strong><strong>{result.experimental.systems.powerUsedKwh.toFixed(2)} <i>experiment</i></strong></div>
            <div><span>Life support supply</span><strong>{Math.round(result.baseline.systems.pathways.lifeSupportAvailability * 100)}% <i>baseline</i></strong><strong>{Math.round(result.experimental.systems.pathways.lifeSupportAvailability * 100)}% <i>experiment</i></strong></div>
          </div>
          <div className="experiment-results__resource-list">
            {[
              ['energyKwh', 'Stored energy', 'kWh'],
              ['oxygenKg', 'Oxygen', 'kg'],
              ['waterL', 'Water', 'L'],
              ['foodKg', 'Food', 'kg'],
            ].map(([key, label, unit]) => <div key={key}><span>{label}</span><strong>{result.baseline.resources[key].toFixed(2)} → {result.experimental.resources[key].toFixed(2)} {unit}</strong><small>{result.deltas[key] > 0 ? '+' : ''}{result.deltas[key].toFixed(2)} {unit}</small></div>)}
          </div>
          <ol className="experiment-results__chain"><li>Changed input</li><li>Changes light, demand, or stored energy</li><li>Model reallocates power by its configured priority</li><li>Linked resources update for one step</li></ol>
          <p className="experiment-results__limits">{result.assumptions.join(' ')}</p>
        </div>
      )}
      <p className="panel-footnote">Inputs are illustrative project assumptions, not measured lunar conditions. The exercise uses the existing resource and dependency equations for the selected scenario.</p>
    </section>
  )
}

export default ExperimentLabPanel
