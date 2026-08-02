import { useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../contexts/ToastContext'
import { Sektion } from './Sektion'
import { Spinner } from './Spinner'
import { IconPlus, IconX } from './Icons'

// Personal-Zuweisung eines Projekts (projekt_personal).
// Nur zugewiesene Mitarbeiter können über das Feld-Formular
// Bautagesberichte für dieses Projekt einreichen.
export function ProjektZuweisung({ projektId, personal }) {
  const toast = useToast()
  const [zuweisungen, setZuweisungen] = useState(null)
  const [auswahl, setAuswahl] = useState('')
  const [arbeitet, setArbeitet] = useState(false)

  useEffect(() => {
    setZuweisungen(null)
    api
      .list(`projekte/${projektId}/personal`)
      .then(setZuweisungen)
      .catch(() => setZuweisungen([]))
  }, [projektId])

  const zugewiesenIds = new Set((zuweisungen || []).map((z) => z.personal_id))
  const verfuegbar = personal.filter((p) => !zugewiesenIds.has(p.id))

  async function hinzufuegen(e) {
    e.preventDefault()
    if (!auswahl) return
    setArbeitet(true)
    try {
      await api.create(`projekte/${projektId}/personal`, {
        personal_id: Number(auswahl),
      })
      const p = personal.find((x) => x.id === Number(auswahl))
      setZuweisungen((z) => [
        ...(z || []),
        {
          personal_id: p.id,
          vorname: p.vorname,
          nachname: p.nachname,
          position: p.position,
        },
      ])
      setAuswahl('')
      toast.erfolg('Mitarbeiter zugewiesen')
    } catch (err) {
      toast.fehler(err.message)
    } finally {
      setArbeitet(false)
    }
  }

  async function entfernen(personalId) {
    setArbeitet(true)
    try {
      await api.remove(`projekte/${projektId}/personal`, personalId)
      setZuweisungen((z) => z.filter((x) => x.personal_id !== personalId))
      toast.erfolg('Zuweisung entfernt')
    } catch (err) {
      toast.fehler(err.message)
    } finally {
      setArbeitet(false)
    }
  }

  return (
    <Sektion
      titel="Zugewiesenes Personal"
      count={zuweisungen?.length ?? undefined}
    >
      <p className="zuweisung-hinweis">
        Nur zugewiesene Mitarbeiter können über das Feld-Formular
        Bautagesberichte für dieses Projekt einreichen.
      </p>

      {zuweisungen === null ? (
        <Spinner />
      ) : (
        <>
          {zuweisungen.length === 0 ? (
            <p className="zuweisung-leer">
              Noch niemand zugewiesen — das Projekt erscheint bei keinem
              Mitarbeiter im Melde-Formular.
            </p>
          ) : (
            <ul className="zuweisung-liste">
              {zuweisungen.map((z) => (
                <li key={z.personal_id} className="zuweisung-zeile">
                  <span>
                    <strong>
                      {[z.vorname, z.nachname].filter(Boolean).join(' ') ||
                        `#${z.personal_id}`}
                    </strong>
                    {z.position && (
                      <span className="zuweisung-position">
                        {' '}
                        — {z.position}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="pa-entfernen"
                    title="Zuweisung entfernen"
                    aria-label="Zuweisung entfernen"
                    disabled={arbeitet}
                    onClick={() => entfernen(z.personal_id)}
                  >
                    <IconX />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {verfuegbar.length > 0 && (
            <form className="zuweisung-add" onSubmit={hinzufuegen}>
              <select
                value={auswahl}
                disabled={arbeitet}
                onChange={(e) => setAuswahl(e.target.value)}
              >
                <option value="">Mitarbeiter auswählen…</option>
                {verfuegbar.map((p) => (
                  <option key={p.id} value={p.id}>
                    {[p.vorname, p.nachname].filter(Boolean).join(' ')}
                    {p.position ? ` — ${p.position}` : ''}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={arbeitet || !auswahl}
              >
                <IconPlus />
                Zuweisen
              </button>
            </form>
          )}
        </>
      )}
    </Sektion>
  )
}
