// Wiederverwendbare Karte (Section). Header optional, Body optional „tight"
// für Tabellen die randlos in die Karte fließen sollen.

export function Sektion({ titel, count, aktionen, tight = false, children }) {
  return (
    <section className="card">
      {(titel || aktionen) && (
        <div className="card-header">
          <h3>
            {titel}
            {count != null && (
              <span className="sektion-count"> · {count}</span>
            )}
          </h3>
          {aktionen && <div className="aktionen">{aktionen}</div>}
        </div>
      )}
      <div className={`card-body${tight ? ' tight' : ''}`}>{children}</div>
    </section>
  )
}
