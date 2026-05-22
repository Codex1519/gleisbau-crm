import { useRef, useState } from 'react'
import { api } from '../api'
import { Spinner } from './Spinner'
import { IconUpload, IconCheck, IconAlert } from './Icons'

// CSV-Import für Zeiterfassungen.
// Erwartetes Format (Header-Zeile erforderlich):
//   datum,personal_id,projekt_id,start,ende,pause_minuten
//   2026-05-20,1,1,08:00,17:00,30
//
// personalIds / projektIds: Set gültiger IDs zur Existenzprüfung.

const ERWARTETE_SPALTEN = [
  'datum',
  'personal_id',
  'projekt_id',
  'start',
  'ende',
  'pause_minuten',
]

function parseCsv(text) {
  const zeilen = text
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter((z) => z.length > 0)
  if (zeilen.length === 0) return { header: [], rows: [] }
  const header = zeilen[0].split(',').map((h) => h.trim().toLowerCase())
  const rows = zeilen.slice(1).map((z) => z.split(',').map((c) => c.trim()))
  return { header, rows }
}

function istGueltigesDatum(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s + 'T00:00:00')
  return !Number.isNaN(d.getTime())
}

function istGueltigeZeit(s) {
  return /^\d{2}:\d{2}$/.test(s)
}

export function CsvImportModal({
  offen,
  onClose,
  personalIds,
  projektIds,
  onFertig,
}) {
  const inputRef = useRef(null)
  const [zeilen, setZeilen] = useState([]) // [{ daten, fehler: [] }]
  const [dateiName, setDateiName] = useState('')
  const [parseFehler, setParseFehler] = useState(null)
  const [importiere, setImportiere] = useState(false)
  const [ergebnis, setErgebnis] = useState(null) // { ok, fehlgeschlagen }

  if (!offen) return null

  function reset() {
    setZeilen([])
    setDateiName('')
    setParseFehler(null)
    setErgebnis(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function schliessen() {
    reset()
    onClose?.()
  }

  function dateiGewaehlt(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setDateiName(file.name)
    setParseFehler(null)
    setErgebnis(null)

    const reader = new FileReader()
    reader.onload = () => {
      const { header, rows } = parseCsv(String(reader.result))

      // Header prüfen
      const fehlend = ERWARTETE_SPALTEN.filter((s) => !header.includes(s))
      if (fehlend.length > 0) {
        setZeilen([])
        setParseFehler(
          `Fehlende Spalten im Header: ${fehlend.join(', ')}. ` +
            `Erwartet: ${ERWARTETE_SPALTEN.join(',')}`
        )
        return
      }

      const idx = Object.fromEntries(
        ERWARTETE_SPALTEN.map((s) => [s, header.indexOf(s)])
      )

      const verarbeitet = rows.map((cols) => {
        const daten = {
          datum: cols[idx.datum] ?? '',
          personal_id: cols[idx.personal_id] ?? '',
          projekt_id: cols[idx.projekt_id] ?? '',
          start: cols[idx.start] ?? '',
          ende: cols[idx.ende] ?? '',
          pause_minuten: cols[idx.pause_minuten] ?? '',
        }
        const fehler = validiere(daten, personalIds, projektIds)
        return { daten, fehler }
      })
      setZeilen(verarbeitet)
    }
    reader.onerror = () => setParseFehler('Datei konnte nicht gelesen werden.')
    reader.readAsText(file)
  }

  const valide = zeilen.filter((z) => z.fehler.length === 0)
  const invalide = zeilen.filter((z) => z.fehler.length > 0)

  async function bestaetigen() {
    setImportiere(true)
    let ok = 0
    let fehlgeschlagen = 0
    for (const z of valide) {
      try {
        await api.create('zeiterfassungen', zuPayload(z.daten))
        ok += 1
      } catch {
        fehlgeschlagen += 1
      }
    }
    setImportiere(false)
    setErgebnis({ ok, fehlgeschlagen })
    if (ok > 0) onFertig?.()
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !importiere) schliessen()
      }}
    >
      <div
        className="modal modal-csv"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-title"
      >
        <div className="modal-body">
          <div className="modal-title" id="csv-title">
            Zeiterfassungen importieren
          </div>
          <div className="modal-message">
            CSV-Format:{' '}
            <code style={{ fontSize: 12 }}>
              datum,personal_id,projekt_id,start,ende,pause_minuten
            </code>
          </div>

          {ergebnis ? (
            <div className="csv-ergebnis">
              <div className="csv-ergebnis-zeile ok">
                <IconCheck /> {ergebnis.ok} Zeiterfassung(en) importiert
              </div>
              {ergebnis.fehlgeschlagen > 0 && (
                <div className="csv-ergebnis-zeile fehler">
                  <IconAlert /> {ergebnis.fehlgeschlagen} fehlgeschlagen
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ margin: '14px 0' }}>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={dateiGewaehlt}
                  style={{ display: 'none' }}
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="btn btn-secondary"
                  style={{ cursor: 'pointer' }}
                >
                  <IconUpload />
                  {dateiName || 'CSV-Datei auswählen…'}
                </label>
              </div>

              {parseFehler && (
                <div className="alert alert-error" style={{ marginBottom: 12 }}>
                  <IconAlert />
                  <div>
                    <div className="alert-title">CSV ungültig</div>
                    <div className="alert-message">{parseFehler}</div>
                  </div>
                </div>
              )}

              {zeilen.length > 0 && (
                <>
                  <div className="csv-zusammenfassung">
                    <span className="status-badge farbe-gruen">
                      {valide.length} gültig
                    </span>
                    {invalide.length > 0 && (
                      <span className="status-badge farbe-rot">
                        {invalide.length} fehlerhaft
                      </span>
                    )}
                  </div>
                  <div className="csv-vorschau tabelle-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Personal</th>
                          <th>Projekt</th>
                          <th>Start</th>
                          <th>Ende</th>
                          <th>Pause</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {zeilen.map((z, i) => {
                          const ungueltig = z.fehler.length > 0
                          return (
                            <tr
                              key={i}
                              className={ungueltig ? 'csv-zeile-fehler' : ''}
                            >
                              <td>{z.daten.datum}</td>
                              <td>{z.daten.personal_id}</td>
                              <td>{z.daten.projekt_id}</td>
                              <td>{z.daten.start}</td>
                              <td>{z.daten.ende}</td>
                              <td>{z.daten.pause_minuten || '0'}</td>
                              <td>
                                {ungueltig ? (
                                  <span className="csv-fehlertext">
                                    {z.fehler.join('; ')}
                                  </span>
                                ) : (
                                  <span className="status-badge farbe-gruen">
                                    OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={schliessen}
            disabled={importiere}
          >
            {ergebnis ? 'Schließen' : 'Abbrechen'}
          </button>
          {!ergebnis && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={bestaetigen}
              disabled={importiere || valide.length === 0}
            >
              {importiere ? <Spinner /> : null}
              {importiere
                ? 'Importiere…'
                : `Import bestätigen (${valide.length})`}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .modal.modal-csv { width: min(820px, calc(100% - 32px)); }
        .csv-zusammenfassung { display: flex; gap: 8px; margin-bottom: 10px; }
        .csv-vorschau { max-height: 320px; overflow: auto; border: 1px solid var(--border); border-radius: var(--r-md); }
        .csv-vorschau table { font-size: 12.5px; }
        tr.csv-zeile-fehler td { background: var(--danger-soft); }
        .csv-fehlertext { color: var(--danger-text); font-size: 11.5px; }
        .csv-ergebnis { margin: 16px 0; display: flex; flex-direction: column; gap: 8px; }
        .csv-ergebnis-zeile { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; }
        .csv-ergebnis-zeile.ok { color: var(--success-text); }
        .csv-ergebnis-zeile.fehler { color: var(--danger-text); }
        .csv-ergebnis-zeile svg { width: 18px; height: 18px; }
      `}</style>
    </div>
  )
}

function validiere(d, personalIds, projektIds) {
  const fehler = []
  if (!d.datum) fehler.push('Datum fehlt')
  else if (!istGueltigesDatum(d.datum)) fehler.push('Datum ungültig')

  if (!d.personal_id) fehler.push('personal_id fehlt')
  else if (!/^\d+$/.test(d.personal_id))
    fehler.push('personal_id keine Zahl')
  else if (personalIds && !personalIds.has(Number(d.personal_id)))
    fehler.push('Mitarbeiter unbekannt')

  if (!d.projekt_id) fehler.push('projekt_id fehlt')
  else if (!/^\d+$/.test(d.projekt_id)) fehler.push('projekt_id keine Zahl')
  else if (projektIds && !projektIds.has(Number(d.projekt_id)))
    fehler.push('Projekt unbekannt')

  if (!d.start) fehler.push('Start fehlt')
  else if (!istGueltigeZeit(d.start)) fehler.push('Start ungültig (HH:MM)')

  if (!d.ende) fehler.push('Ende fehlt')
  else if (!istGueltigeZeit(d.ende)) fehler.push('Ende ungültig (HH:MM)')

  if (
    d.start &&
    d.ende &&
    istGueltigeZeit(d.start) &&
    istGueltigeZeit(d.ende) &&
    d.ende <= d.start
  ) {
    fehler.push('Ende nicht nach Start')
  }

  if (d.pause_minuten && !/^\d+$/.test(d.pause_minuten))
    fehler.push('Pause keine Zahl')

  return fehler
}

function zuPayload(d) {
  return {
    personal_id: Number(d.personal_id),
    projekt_id: Number(d.projekt_id),
    start_zeit: `${d.datum}T${d.start}`,
    end_zeit: `${d.datum}T${d.ende}`,
    pause_minuten: d.pause_minuten ? Number(d.pause_minuten) : 0,
  }
}
