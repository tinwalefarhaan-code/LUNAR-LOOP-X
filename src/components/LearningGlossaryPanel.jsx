import { useMemo, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { LEARNING_GLOSSARY } from '../learning/levelData.js'

function LearningGlossaryPanel() {
  const [query, setQuery] = useState('')
  const terms = useMemo(() => LEARNING_GLOSSARY.filter((item) => (
    `${item.term} ${item.pronunciation} ${item.definition}`.toLowerCase().includes(query.trim().toLowerCase())
  )), [query])

  return (
    <section className="learning-glossary panel" aria-labelledby="glossary-title">
      <div className="panel-header panel-header--compact">
        <div><div className="section-heading__eyebrow">SPACE WORDS <span>/</span> QUICK GUIDE</div><h2 id="glossary-title">Moon explorer glossary</h2></div>
        <BookOpen size={17} aria-hidden="true" />
      </div>
      <p className="learning-glossary__intro">New space words are explained in short sentences. Search a word or an idea.</p>
      <label className="learning-glossary__search"><Search size={15} /><span className="visually-hidden">Search glossary</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search space words…" /></label>
      <dl className="learning-glossary__terms">
        {terms.map((item) => <div key={item.term}><dt>{item.term}<small>{item.pronunciation}</small></dt><dd>{item.definition}</dd></div>)}
      </dl>
      {terms.length === 0 && <p className="learning-glossary__empty">No matching words. Try “Moon” or “energy.”</p>}
      <p className="panel-footnote">Short classroom explanations. Science details in each inspection panel explain this project’s assumptions separately.</p>
    </section>
  )
}

export default LearningGlossaryPanel
