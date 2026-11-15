import { useRef } from 'react'

function SegmentedTabs({ id, label, items, value, onChange }) {
  const tabRefs = useRef([])

  function handleKeyDown(event, currentIndex) {
    let nextIndex = currentIndex

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % items.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + items.length) % items.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = items.length - 1
    } else {
      return
    }

    event.preventDefault()
    onChange(items[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="segmented-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(element) => {
            tabRefs.current[index] = element
          }}
          className="segmented-tabs__tab"
          id={`${id}-tab-${item.id}`}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          aria-controls={`${id}-panel`}
          tabIndex={value === item.id ? 0 : -1}
          onClick={() => onChange(item.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default SegmentedTabs
