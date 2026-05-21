import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { IconPlus, IconRefresh } from '../components/Icons'

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
      liste = liste.filter(
        (b) => b.projekt_id === Number(filterProjekt)
      )
    }
    // Neueste zuerst
    return [...liste].sort((a, b) =>
      String(b.datum || '').localeCompare(String(a.datum || ''))
    )
  }, [berichte, filterProjekt])

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
          <div className="subtitel">
            Tageseinsätze aller Projekte
          </div>
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
              gridTemplateColumns: '1fr auto',
              alignItems: 'end',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 4 }}>
              {filterProjekt && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setFilterProjekt('')}
                >
                  Filter zurücksetzen
                </button>
              )}
              {filterProjekt && (
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {gefiltert.length} von {berichte.length} Einträgen
                </span>
              )}
            </div>
          </div>
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
            text="Mit dem gewählten Filter sind keine Einträge sichtbar."
          />
        ) : (
          <div className="tabelle-wrap">
            <table>
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Datum</th>
                  <th>Projekt</th>
                  <th>Ersteller</th>
                  <th>Wetter</th>
                </tr>
              </thead>
              <tbody>
                {gefiltert.map((b) => {
                  const proj = projekteMap.get(b.projekt_id)
                  const pers = personalMap.get(b.personal_id)
                  return (
                    <tr
                      key={b.id}
                      className="zeile-klickbar"
                      onClick={() =>
                        navigate(`/bautagesberichte/${b.id}`)
                      }
                    >
                      <td className="col-id">#{b.id}</td>
                      <td className="primary-cell">{b.datum || '—'}</td>
                      <td className="muted-cell">
                        {proj ? projekteModul.displayName(proj) : `#${b.projekt_id}`}
                      </td>
                      <td className="muted-cell">
                        {pers ? personalModul.displayName(pers) : `#${b.personal_id}`}
                      </td>
                      <td
                        className={
                          b.wetter ? 'muted-cell' : 'empty'
                        }
                      >
                        {b.wetter || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Sektion>
    </div>
  )
}
