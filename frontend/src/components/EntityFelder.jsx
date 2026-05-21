// Rendert die Stammdaten-Sektionen einer Entity.
// Im Anzeige-Modus: <ValueGrid> (statisch).
// Im Edit-Modus:    Formularfelder (FormField) — bearbeitbar.
//
// Dieselbe Sektionen-Gruppierung aus modul.sektionen wird beidseitig
// benutzt — der Benutzer sieht im Edit-Modus die identische Struktur.

import { Sektion } from './Sektion'
import { ValueGrid } from './ValueGrid'
import { FormField } from './FormField'
import { fkOptionenFuerFeld } from '../lib/fkLoader'

export function EntityFelder({
  modul,
  entity,
  fkLabels,
  fkData,
  editMode,
  form,
  setForm,
  speichere,
}) {
  return (
    <>
      {modul.sektionen.map((sek) => {
        const felder = sek.felder
          .map((name) => modul.felder.find((f) => f.name === name))
          .filter(Boolean)

        return (
          <Sektion key={sek.titel} titel={sek.titel}>
            {editMode ? (
              <div className="felder">
                {felder.map((f) => (
                  <FormField
                    key={f.name}
                    feld={f}
                    wert={form[f.name]}
                    onChange={(v) => setForm({ ...form, [f.name]: v })}
                    fkOptionen={
                      f.type === 'fk' ? fkOptionenFuerFeld(f, fkData) : null
                    }
                    disabled={speichere}
                  />
                ))}
              </div>
            ) : (
              <ValueGrid
                felder={felder}
                entity={entity}
                fkLabels={fkLabels}
              />
            )}
          </Sektion>
        )
      })}
    </>
  )
}
