import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { Stundenzettel } from '../components/Stundenzettel'
import { IconPlus, IconRefresh } from '../components/Icons'

export function ZeiterfassungenListe() {
  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')

  const [zeiten, setZeiten] = useState([])
  const [personal, setPersonal] = useState([])
  const [projekte, setProjekte] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)

  const [filterPersonal, setFilterPersonal] = useState('')
  const [filterProjekt, setFilterProjekt] = useState('')

  useEffect(() => {
    laden()
  }, [])

  async function laden() {
    setLade(true)
    setFehler(null)
    try {
      const [z, p, pr] = await Promise.all([
        api.list('zeiterfassungen'),
        api.list('personal'),
        api.list('projekte'),
      ])
      setZeiten(z)
      setPersonal(p)
      setProjekte(pr)
    } catch (e) {
      setFehler(e.message)
    } finally {
      setLade(false)
    }
  }

  const personalMap = useMemo(
    () => new Map(personal.map((p) => [p.id, p])),
    [personal]
  )
  const projekteMap = useMemo(
    () => new Map(projekte.map((p) => [p.id, p])),
    [projekte]
  )

  const gefiltert = useMemo(() => {
    return zeiten.filter((z) => {
      if (filterPersonal && z.personal_id !== Number(filterPersonal))
        return false
      if (filterProjekt && z.projekt_id !== Number(filterProjekt))
        return false
      return true
    })
  }, [zeiten, filterPersonal, filterProjekt])

  const istGefiltert = filterPersonal !== '' || filterProjekt !== ''

  return (
    <div className="content">
      <Breadcrumb
        items={[{ label: 'Module', to: '/' }, { label: 'Zeiterfassungen' }]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            Zeiterfassungen <span className="badge">{zeiten.length}</span>
          </h1>
          <div className="subtitel">
            Stundenzettel aller Mitarbeiter und Projekte
          </div>
        </div>
        <div className="aktionen">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={laden}
            disabled={lade}
            title="Liste neu laden"
          >
            <IconRefresh />
            Aktualisieren
          </button>
          <Link to="/zeiterfassungen/neu" className="btn btn-primary">
            <IconPlus />
            Neue Zeiterfassung
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Fehler beim Laden">{fehler}</Alert>}

      {zeiten.length > 0 && (
        <Sektion titel="Filter">
          <div className="filter-grid">
            <label className="feld">
              <span className="feld-label">Mitarbeiter</span>
              <select
                value={filterPersonal}
                onChange={(e) => setFilterPersonal(e.target.value)}
                disabled={personal.length === 0}
              >
                <option value="">Alle Mitarbeiter</option>
                {personal.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personalModul.displayName(p)}
                  </option>
                ))}
              </select>
            </label>

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

            <div className="filter-actions">
              {istGefiltert && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setFilterPersonal('')
                    setFilterProjekt('')
                  }}
                >
                  Filter zurücksetzen
                </button>
              )}
              {istGefiltert && (
                <span className="filter-hinweis">
                  {gefiltert.length} von {zeiten.length} Einträgen
                </span>
              )}
            </div>
          </div>
          <style>{`
            .filter-grid {
              display: grid;
              grid-template-columns: 1fr 1fr auto;
              gap: 14px;
              align-items: end;
            }
            .filter-actions {
              display: flex;
              align-items: center;
              gap: 12px;
              padding-bottom: 4px;
            }
            .filter-hinweis {
              font-size: 12.5px;
              color: var(--text-muted);
            }
            @media (max-width: 720px) {
              .filter-grid { grid-template-columns: 1fr; }
            }
          `}</style>
        </Sektion>
      )}

      <Sektion tight>
        {lade ? (
          <LadeBlock text="Lade Zeiterfassungen…" />
        ) : zeiten.length === 0 ? (
          <EmptyState
            titel="Noch keine Zeiterfassungen"
            text="Erfasse die erste Arbeitszeit eines Mitarbeiters auf einem Projekt."
            aktionen={
              <Link to="/zeiterfassungen/neu" className="btn btn-primary">
                <IconPlus />
                Neue Zeiterfassung
              </Link>
            }
          />
        ) : gefiltert.length === 0 ? (
          <EmptyState
            titel="Keine Treffer"
            text="Mit den gewählten Filtern sind keine Einträge sichtbar."
          />
        ) : (
          <Stundenzettel
            zeiten={gefiltert}
            variant="voll"
            personalMap={personalMap}
            projekteMap={projekteMap}
          />
        )}
      </Sektion>
    </div>
  )
}
