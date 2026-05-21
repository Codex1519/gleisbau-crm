import { Link } from 'react-router-dom'
import { formatiereWert } from './FormField'

// Zeigt eine Liste Felder als Label-Wert-Paare in einem Grid.
// FK-Werte werden zu Links auf die Detailseite des verknüpften Eintrags.
export function ValueGrid({ felder, entity, fkLabels }) {
  return (
    <div className="value-grid">
      {felder.map((f) => {
        const roh = entity[f.name]
        const formatted = formatiereWert(f, roh, fkLabels)

        let inhalt
        if (formatted == null) {
          inhalt = <span className="value-empty">—</span>
        } else if (f.type === 'fk' && roh) {
          inhalt = <Link to={`/${f.fk.module}/${roh}`}>{formatted}</Link>
        } else if (f.type === 'textarea') {
          inhalt = <span className="value-multiline">{formatted}</span>
        } else {
          inhalt = formatted
        }

        return (
          <div key={f.name} className="value-item">
            <div className="value-label">{f.label}</div>
            <div className="value">{inhalt}</div>
          </div>
        )
      })}
    </div>
  )
}
