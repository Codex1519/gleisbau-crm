import { Link } from 'react-router-dom'

// items: [{ label: string, to?: string }, ...]  letzter Eintrag ohne to = aktuelle Seite
export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Brotkrumen-Navigation">
      {items.map((it, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {it.to && !last ? (
              <Link to={it.to}>{it.label}</Link>
            ) : (
              <span className={last ? 'breadcrumb-current' : ''}>
                {it.label}
              </span>
            )}
            {!last && <span className="breadcrumb-sep">›</span>}
          </span>
        )
      })}
    </nav>
  )
}
