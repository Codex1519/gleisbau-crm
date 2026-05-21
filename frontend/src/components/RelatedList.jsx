import { Link } from 'react-router-dom'
import { findModul } from '../modules'
import { EmptyState } from './EmptyState'

// Zeigt verknüpfte Einträge als kompakte Liste innerhalb einer Sektion.
// modulKey: aus welchem Modul stammen die Einträge
// eintraege: Array<Entity>
// renderSubtext(entity) → optionaler Untertitel pro Zeile
export function RelatedList({ modulKey, eintraege, renderSubtext, leerText }) {
  const modul = findModul(modulKey)
  if (!modul) return null

  if (eintraege.length === 0) {
    return (
      <EmptyState
        titel={leerText || `Keine ${modul.label}`}
        text={`Es sind noch keine ${modul.label} verknüpft.`}
      />
    )
  }

  return (
    <ul className="related-list">
      {eintraege.map((e) => (
        <li key={e.id} className="related-item">
          <Link to={`/${modul.key}/${e.id}`} className="related-link">
            <div className="related-main">
              <div className="related-title">{modul.displayName(e)}</div>
              {renderSubtext && (
                <div className="related-sub">{renderSubtext(e)}</div>
              )}
            </div>
            <span className="related-id">#{e.id}</span>
          </Link>
        </li>
      ))}

      <style>{`
        .related-list {
          list-style: none;
          padding: 0;
          margin: -6px 0;
        }
        .related-item + .related-item .related-link {
          border-top: 1px solid var(--border);
        }
        .related-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 4px;
          text-decoration: none;
          color: inherit;
          transition: background 100ms ease;
          border-radius: 4px;
        }
        .related-link:hover {
          background: var(--accent-soft);
        }
        .related-link:hover .related-title {
          color: var(--accent);
        }
        .related-main { min-width: 0; flex: 1; }
        .related-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
        }
        .related-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .related-id {
          font-size: 11.5px;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </ul>
  )
}
