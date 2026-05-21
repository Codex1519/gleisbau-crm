import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { StatusBadge } from '../components/StatusBadge'
import { IconPlus, IconSearch, IconRefresh } from '../components/Icons'
import { ladeFkDaten } from '../lib/fkLoader'
import { formatiereWert } from '../components/FormField'

export function ListPage({ modulKey }) {
  const navigate = useNavigate()
  const modul = findModul(modulKey)

  const [daten, setDaten] = useState([])
  const [fkLabels, setFkLabels] = useState({})
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [suche, setSuche] = useState('')

  useEffect(() => {
    if (!modul) return
    setSuche('')
    laden()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulKey])

  async function laden() {
    setLade(true)
    setFehler(null)
    try {
      const [liste, fk] = await Promise.all([
        api.list(modul.pfad),
        ladeFkDaten(modul),
      ])
      setDaten(liste)
      setFkLabels(fk.fkLabels)
    } catch (e) {
      setFehler(e.message)
    } finally {
      setLade(false)
    }
  }

  // Gefilterte Daten — Volltextsuche über searchKeys + FK-Labels
  const gefiltert = useMemo(() => {
    if (!modul) return []
    const q = suche.trim().toLowerCase()
    if (!q) return daten

    return daten.filter((e) => {
      // Konfigurierte Suchfelder
      for (const key of modul.searchKeys) {
        const v = e[key]
        if (v && String(v).toLowerCase().includes(q)) return true
      }
      // FK-Labels
      for (const f of modul.felder) {
        if (f.type !== 'fk') continue
        const label = fkLabels?.[f.fk.module]?.get(e[f.name])
        if (label && label.toLowerCase().includes(q)) return true
      }
      // displayName
      const dn = modul.displayName(e)
      if (dn && dn.toLowerCase().includes(q)) return true
      return false
    })
  }, [daten, suche, fkLabels, modul])

  if (!modul) {
    return (
      <div className="content">
        <Alert titel="Modul nicht gefunden">„{modulKey}" existiert nicht.</Alert>
      </div>
    )
  }

  const spalten = modul.listSpalten

  return (
    <div className="content">
      <Breadcrumb items={[{ label: 'Module', to: '/' }, { label: modul.label }]} />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            {modul.label}
            <span className="badge">{daten.length}</span>
          </h1>
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
          <Link to={`/${modul.key}/neu`} className="btn btn-primary">
            <IconPlus />
            Neuen {modul.einzahl} anlegen
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Fehler beim Laden">{fehler}</Alert>}

      {modul.searchKeys.length > 0 && daten.length > 0 && (
        <div className="toolbar">
          <div className="search">
            <IconSearch className="icon search-icon" />
            <input
              type="text"
              placeholder={`${modul.label} durchsuchen…`}
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
            />
          </div>
          {suche && (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {gefiltert.length} von {daten.length} Einträgen
            </span>
          )}
        </div>
      )}

      <Sektion tight>
        {lade ? (
          <LadeBlock text={`Lade ${modul.label}…`} />
        ) : daten.length === 0 ? (
          <EmptyState
            titel={`Noch keine ${modul.label}`}
            text={`Lege den ersten Eintrag an, um zu beginnen.`}
            aktionen={
              <Link to={`/${modul.key}/neu`} className="btn btn-primary">
                <IconPlus />
                Neuen {modul.einzahl} anlegen
              </Link>
            }
          />
        ) : gefiltert.length === 0 ? (
          <EmptyState
            titel="Keine Treffer"
            text={`Die Suche nach „${suche}" liefert keine Ergebnisse.`}
          />
        ) : (
          <div className="tabelle-wrap">
            <table>
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  {spalten.map((key) => {
                    const f = modul.felder.find((x) => x.name === key)
                    return <th key={key}>{f?.label ?? key}</th>
                  })}
                </tr>
              </thead>
              <tbody>
                {gefiltert.map((e) => (
                  <tr
                    key={e.id}
                    className="zeile-klickbar"
                    onClick={() => navigate(`/${modul.key}/${e.id}`)}
                  >
                    <td className="col-id">#{e.id}</td>
                    {spalten.map((key, idx) => {
                      const f = modul.felder.find((x) => x.name === key)
                      const isPrimary = idx === 0
                      // Enum-Felder als Status-Badge rendern
                      if (f?.type === 'enum') {
                        return (
                          <td key={key}>
                            <StatusBadge
                              optionen={f.optionen}
                              value={e[key]}
                            />
                          </td>
                        )
                      }
                      const formatted = f
                        ? formatiereWert(f, e[key], fkLabels)
                        : e[key]
                      return (
                        <td
                          key={key}
                          className={
                            formatted == null
                              ? 'empty'
                              : isPrimary
                              ? 'primary-cell'
                              : 'muted-cell'
                          }
                        >
                          {formatted ?? '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sektion>
    </div>
  )
}
