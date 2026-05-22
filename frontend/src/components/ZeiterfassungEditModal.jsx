import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { findModul } from '../modules'
import { Spinner } from './Spinner'
import { IconSave } from './Icons'
import {
  berechneNettoMinuten,
  formatStunden,
} from '../lib/zeiterfassung'

// Modal zum Bearbeiten einer Zeiterfassung (PUT /zeiterfassungen/:id).
// personal / projekte werden vom Aufrufer übergeben (bereits geladen).
//
// Props:
//   eintrag        – die zu bearbeitende Zeiterfassung (oder null = geschlossen)
//   personal, projekte – Listen für die Dropdowns
//   onClose()      – Modal schließen ohne Speichern
//   onGespeichert(aktualisiert) – nach erfolgreichem PUT
export function ZeiterfassungEditModal({
  eintrag,
  personal,
  projekte,
  onClose,
  onGespeichert,
}) {
  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')

  const [form, setForm] = useState(null)
  const [speichere, setSpeichere] = useState(false)
  const [fehler, setFehler] = useState(null)

  useEffect(() => {
    if (!eintrag) {
      setForm(null)
      return
    }
    setFehler(null)
    setForm({
      personal_id: String(eintrag.personal_id ?? ''),
      projekt_id: String(eintrag.projekt_id ?? ''),
      start_zeit: eintrag.start_zeit
        ? String(eintrag.start_zeit).slice(0, 16)
        : '',
      end_zeit: eintrag.end_zeit
        ? String(eintrag.end_zeit).slice(0, 16)
        : '',
      pause_minuten: String(eintrag.pause_minuten ?? 0),
    })
  }, [eintrag])

  useEffect(() => {
    if (!eintrag) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !speichere) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [eintrag, speichere, onClose])

  const minuten = useMemo(() => {
    if (!form) return null
    return berechneNettoMinuten({
      start_zeit: form.start_zeit,
      end_zeit: form.end_zeit,
      pause_minuten: form.pause_minuten,
    })
  }, [form])

  if (!eintrag || !form) return null

  async function speichern(e) {
    e.preventDefault()
    setFehler(null)
    setSpeichere(true)
    try {
      // Payload-Bereinigung wie in den anderen Modulen: Pflicht-Zahlenfelder
      // als Number, Pause default 0. Keine leeren Strings senden.
      const payload = {
        personal_id: Number(form.personal_id),
        projekt_id: Number(form.projekt_id),
        start_zeit: form.start_zeit,
        end_zeit: form.end_zeit,
        pause_minuten:
          form.pause_minuten === '' ? 0 : Number(form.pause_minuten),
      }
      const aktualisiert = await api.update(
        'zeiterfassungen',
        eintrag.id,
        payload
      )
      onGespeichert?.(aktualisiert ?? { ...eintrag, ...payload })
    } catch (err) {
      setFehler(err.message)
      setSpeichere(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !speichere) onClose?.()
      }}
    >
      <div
        className="modal modal-breit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ze-edit-title"
      >
        <form onSubmit={speichern}>
          <div className="modal-body">
            <div className="modal-title" id="ze-edit-title">
              Zeiterfassung #{eintrag.id} bearbeiten
            </div>

            {fehler && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>
                <div>
                  <div className="alert-title">Speichern fehlgeschlagen</div>
                  <div className="alert-message">{fehler}</div>
                </div>
              </div>
            )}

            <div className="felder" style={{ marginTop: 14, marginBottom: 0 }}>
              <label className="feld">
                <span className="feld-label">
                  Mitarbeiter
                  <span className="feld-required">*</span>
                </span>
                <select
                  required
                  value={form.personal_id}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, personal_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Bitte auswählen…
                  </option>
                  {personal.map((p) => (
                    <option key={p.id} value={p.id}>
                      {personalModul.displayName(p)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="feld">
                <span className="feld-label">
                  Projekt
                  <span className="feld-required">*</span>
                </span>
                <select
                  required
                  value={form.projekt_id}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, projekt_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Bitte auswählen…
                  </option>
                  {projekte.map((p) => (
                    <option key={p.id} value={p.id}>
                      {projekteModul.displayName(p)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="feld">
                <span className="feld-label">
                  Start
                  <span className="feld-required">*</span>
                </span>
                <input
                  type="datetime-local"
                  required
                  value={form.start_zeit}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, start_zeit: e.target.value })
                  }
                />
              </label>

              <label className="feld">
                <span className="feld-label">
                  Ende
                  <span className="feld-required">*</span>
                </span>
                <input
                  type="datetime-local"
                  required
                  value={form.end_zeit}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, end_zeit: e.target.value })
                  }
                />
              </label>

              <label className="feld">
                <span className="feld-label">Pause (Min.)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.pause_minuten}
                  disabled={speichere}
                  onChange={(e) =>
                    setForm({ ...form, pause_minuten: e.target.value })
                  }
                />
              </label>

              <div className="feld">
                <span className="feld-label">Berechnete Arbeitszeit</span>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                    paddingTop: 6,
                  }}
                >
                  {minuten != null ? `${formatStunden(minuten)} h` : '— h'}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={speichere}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={speichere}
            >
              {speichere ? <Spinner /> : <IconSave />}
              {speichere ? 'Speichert…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal.modal-breit { width: min(620px, calc(100% - 32px)); }
        .modal.modal-breit .felder {
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 540px) {
          .modal.modal-breit .felder { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
