import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { IconPlus, IconRefresh } from '../components/Icons'
import {
  fortschrittFarbe,
  erstellerId,
  hatInhalt,
} from '../lib/bautagesbericht'
import { WetterSymbol } from '../components/Icons'

export function BautagesberichteListe() {
  const navigate = useNavigate()
  const projekteModul = findModul('projekte')
  const personalModul = findModul('personal')

  const [berichte, setBerichte] = useState([])
  const [projekte, setProjekte] = useState([])
  const [personal, setPersonal] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [filterProjekt, setFilterProjekt] = useState('')
  const [von, setVon] = useState('')
  const [bis, setBis] = useState('')

  useEffect(() => {
    laden()
  }, [])

  async function laden() {
    setLade(true)
    setFehler(null)
    try {
      const [b, pr, pers] = await Promise.all([
        api.list('bautagesberichte'),
        api.list('projekte'),
        api.list('personal'),
      ])
      setBerichte(b)
      setProjekte(pr)
      setPersonal(pers)
    } catch (e) {
      setFehler(e.message)
    } finally {
      setLade(false)
    }
  }

  const projekteMap = useMemo(
    () => new Map(projekte.map((p) => [p.id, p])),
    [projekte]
  )
  const personalMap = useMemo(
    () => new Map(personal.map((p) => [p.id, p])),
    [personal]
  )

  const gefiltert = useMemo(() => {
    let liste = berichte
    if (filterProjekt) {
      liste = liste.filter((b) => b.projekt_id === Number(filterProjekt))
    }
    if (von) liste = liste.filter((b) => b.datum && b.datum >= von)
    if (bis) liste = liste.filter((b) => b.datum && b.datum <= bis)
    return [...liste].sort((a, b) =>
      String(b.datum || '').localeCompare(String(a.datum || ''))
    )
  }, [berichte, filterProjekt, von, bis])

  // Montage-Berichte bündeln: zusammengehörige erscheinen als Block
  // (Kopfzeile + alle Berichte untereinander) an der Position des
  // neuesten Berichts; Einzelberichte bleiben chronologisch dazwischen.
  const bloecke = useMemo(() => {
    const gruppen = new Map() // "projektId||montage" -> Block
    const result = []
    for (const b of gefiltert) {
      if (b.montage) {
        const key = `${b.projekt_id}||${b.montage}`
        if (!gruppen.has(key)) {
          const block = { typ: 'gruppe', key, name: b.montage, projekt_id: b.projekt_id, berichte: [] }
          gruppen.set(key, block)
          result.push(block)
        }
        gruppen.get(key).berichte.push(b)
      } else {
        result.push({ typ: 'einzeln', bericht: b })
      }
    }
    return result
  }, [gefiltert])

  const istGefiltert = filterProjekt !== '' || von !== '' || bis !== ''

  return (
    <div className="content">
      <Breadcrumb
        items={[{ label: 'Module', to: '/' }, { label: 'Bautagesberichte' }]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            Bautagesberichte <span className="badge">{berichte.length}</span>
          </h1>
          <div className="subtitel">Tageseinsätze aller Projekte</div>
        </div>
        <div className="aktionen">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={laden}
            disabled={lade}
          >
            <IconRefresh />
            Aktualisieren
          </button>
          <Link to="/bautagesberichte/neu" className="btn btn-primary">
            <IconPlus />
            Neuer Bautagesbericht
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Fehler beim Laden">{fehler}</Alert>}

      {berichte.length > 0 && (
        <Sektion titel="Filter">
          <div
            className="felder"
            style={{
              gridTemplateColumns: '2fr 1fr 1fr',
              marginBottom: 0,
            }}
          >
            <label className="feld">
              <span className="feld-label">Projekt</span>
              <select
                value={filterProjekt}
                onChange={(e) => setFilterProjekt(e.target.value)}
                disabled={projekte.length === 0}
              >
                <option value="">Alle Projekte</option>
                {projekte.map((p) => (
                  <option key={p.id} value={p.id}>
                    {projekteModul.displayName(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="feld">
              <span className="feld-label">Von</span>
              <input
                type="date"
                value={von}
                max={bis || undefined}
                onChange={(e) => setVon(e.target.value)}
              />
            </label>
            <label className="feld">
              <span className="feld-label">Bis</span>
              <input
                type="date"
                value={bis}
                min={von || undefined}
                onChange={(e) => setBis(e.target.value)}
              />
            </label>
          </div>
          {istGefiltert && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 14,
                paddingTop: 14,
                borderTop: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setFilterProjekt('')
                  setVon('')
                  setBis('')
                }}
              >
                Filter zurücksetzen
              </button>
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {gefiltert.length} von {berichte.length} Einträgen
              </span>
            </div>
          )}
        </Sektion>
      )}

      <Sektion tight>
        {lade ? (
          <LadeBlock text="Lade Bautagesberichte…" />
        ) : berichte.length === 0 ? (
          <EmptyState
            titel="Noch keine Bautagesberichte"
            text="Erfasse den ersten Tageseinsatz auf einem Projekt."
            aktionen={
              <Link to="/bautagesberichte/neu" className="btn btn-primary">
                <IconPlus />
                Neuer Bautagesbericht
              </Link>
            }
          />
        ) : gefiltert.length === 0 ? (
          <EmptyState
            titel="Keine Treffer"
            text="Mit den gewählten Filtern sind keine Einträge sichtbar."
          />
        ) : (
          <div className="tabelle-wrap">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Projekt</th>
                  <th>Ersteller</th>
                  <th>Wetter</th>
                  <th>Fortschritt</th>
                  <th>Vorschau</th>
                </tr>
              </thead>
              <tbody>
                {bloecke.map((block) => {
                  if (block.typ === 'gruppe') {
                    const proj = projekteMap.get(Number(block.projekt_id))
                    return (
                      <Fragment key={block.key}>
                        <tr className="group-row">
                          <td colSpan={6}>
                            Montage „{block.name}"
                            {proj && ` — ${projekteModul.displayName(proj)}`}
                            <span className="group-count">
                              · {block.berichte.length} Bericht
                              {block.berichte.length === 1 ? '' : 'e'}
                            </span>
                          </td>
                        </tr>
                        {block.berichte.map((b) => zeile(b, true))}
                      </Fragment>
                    )
                  }
                  return zeile(block.bericht, false)
                })}
              </tbody>
            </table>
          </div>
        )}
      </Sektion>
    </div>
  )

  function zeile(b, inGruppe) {
    const proj = projekteMap.get(Number(b.projekt_id))
    const pers = personalMap.get(Number(erstellerId(b)))
    const pct = Number(b.baufortschritt) || 0
    const vorschau = b.arbeiten_durchgefuehrt || b.bemerkungen || ''
    return (
      <tr
        key={b.id}
        className={`zeile-klickbar${inGruppe ? ' montage-zeile' : ''}`}
        onClick={() => navigate(`/bautagesberichte/${b.id}`)}
      >
                      <td className="primary-cell">{b.datum || '—'}</td>
                      <td className="muted-cell">
                        {proj
                          ? projekteModul.displayName(proj)
                          : `#${b.projekt_id}`}
                      </td>
                      <td className="muted-cell">
                        {pers ? personalModul.displayName(pers) : '—'}
                      </td>
                      <td>
                        {hatInhalt(b.wetter) ? (
                          <span className="wetter-badge">
                            <WetterSymbol wert={b.wetter} />
                            {b.wetter}
                          </span>
                        ) : (
                          <span className="value-empty">—</span>
                        )}
                      </td>
                      <td>
                        <div className="fortschritt-mini">
                          <div className="bar">
                            <div
                              className={`fortschritt-fill farbe-${fortschrittFarbe(
                                pct
                              )}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="pct">{pct}%</span>
                        </div>
                      </td>
                      <td
                        className={vorschau ? 'muted-cell' : 'empty'}
                        style={{
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {vorschau || '—'}
                      </td>
      </tr>
    )
  }
}
