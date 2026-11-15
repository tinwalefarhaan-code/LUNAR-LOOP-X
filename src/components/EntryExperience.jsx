import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Orbit, SkipForward } from 'lucide-react'

function EntryExperience({ cameraApiRef, reducedMotion }) {
  const [stage, setStage] = useState('briefing')
  const dialogRef = useRef(null)

  useEffect(() => {
    if (stage === 'entered') return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        cameraApiRef.current?.reset()
        setStage('entered')
        document.querySelector('.mission-hud__action')?.focus()
        return
      }
      if (event.key === 'Tab') {
        const buttons = dialogRef.current?.querySelectorAll('button')
        if (!buttons?.length) return
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    const initialFocus = dialogRef.current?.querySelector('.entry-experience__primary')
      ?? dialogRef.current?.querySelector('.entry-experience__skip')
    initialFocus?.focus()
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cameraApiRef, stage])

  if (stage === 'entered') return null

  function beginApproach() {
    if (reducedMotion || typeof cameraApiRef.current?.approach !== 'function') {
      setStage('ready')
      return
    }
    setStage('approaching')
    cameraApiRef.current.approach(() => setStage('ready'))
  }

  function skipEntry() {
    cameraApiRef.current?.reset()
    setStage('entered')
    document.querySelector('.mission-hud__action')?.focus()
  }

  return createPortal((
    <div
      ref={dialogRef}
      className={`entry-experience entry-experience--${stage}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-title"
      aria-describedby="entry-description"
    >
      <div className="entry-experience__content">
        <div className="entry-experience__mark" aria-hidden="true"><Orbit size={24} strokeWidth={1.5} /></div>
        <p className="entry-experience__eyebrow">LUNAR LOOP X <span>/</span> SURFACE OPERATIONS</p>
        <h1 id="entry-title">A research outpost<br />at the lunar south pole</h1>
        <p id="entry-description" className="entry-experience__description">
          An interactive, educational mission environment. Explore the facilities and see how the modeled systems depend on one another.
        </p>
        <div className="entry-experience__meta">
          <span>7-DAY SYSTEMS EXERCISE</span><span>ILLUSTRATIVE MODEL</span>
        </div>
        {stage === 'briefing' && (
          <button className="entry-experience__primary" type="button" onClick={beginApproach}>
            Begin surface approach <ArrowRight size={17} aria-hidden="true" />
          </button>
        )}
        {stage === 'approaching' && (
          <p className="entry-experience__status" role="status" aria-live="polite">Approaching the research outpost…</p>
        )}
        {stage === 'ready' && (
          <button className="entry-experience__primary" type="button" onClick={skipEntry}>
            Enter mission environment <ArrowRight size={17} aria-hidden="true" />
          </button>
        )}
        <button className="entry-experience__skip" type="button" onClick={skipEntry}>
          <SkipForward size={14} aria-hidden="true" /> Skip introduction
        </button>
      </div>
    </div>
  ), document.body)
}

export default EntryExperience
