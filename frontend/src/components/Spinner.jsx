export function Spinner({ groesse = 'sm' }) {
  return (
    <span
      className={`spinner${groesse === 'lg' ? ' spinner-lg' : ''}`}
      aria-hidden="true"
    />
  )
}

export function LadeBlock({ text = 'Daten werden geladen…' }) {
  return (
    <div className="loading-row">
      <Spinner groesse="lg" />
      <span>{text}</span>
    </div>
  )
}
