import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { StatusBadge } from '../components/StatusBadge'
import { IconPlus, IconUpload } from '../components/Icons'
import {
  RECHNUNG_STATUS,
  formatEuro,
  formatDatumDE,
} from '../lib/rechnung'

export function RechnungenListe() {
  const kundenModul = findModul('kunden')
  const toast = useToast()
  const navigate = useNavigate()
  const dateiRef = useRef(null)

  const [rechnungen, setRechnungen] = useState([])
  const [kunden, setKunden] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [tab, setTab] = useState('ausgang')
  const [laedtHoch, setLaedtHoch] = useState(false)

  useEffect(() => {
    laden()
  }, [])

  async function laden() {
    setLade(true)
    setFehler(null)
    try {
      const [r, k] = await Promise.all([
        api.list('rechnungen'),
        api.list('kunden'),
      ])
      setRechnungen(r)
      setKunden(k)
    } catch (e) {
      setFehler(e.message)
    } finally {
      setLade(false)
    }
  }

  const kundenMap = useMemo(
    () => new Map(kunden.map((k) => [k.id, k])),
    [kunden]
  )

  const ausgang = rechnungen.filter((r) => r.richtung === 'ausgang')
  const eingang = rechnungen.filter((r) => r.richtung === 'eingang')
  const sichtbar = tab === 'ausgang' ? ausgang : eingang

  const offenSumme = useMemo(
    () =>
      ausgang
        .filter((r) => r.status === 'gestellt')
        .reduce((s, r) => s + Number(r.brutto || 0), 0),
    [ausgang]
  )

  async function xmlHochladen(event) {
    const datei = event.target.files?.[0]
    event.target.value = ''
    if (!datei) return
    setLaedtHoch(true)
    try {
      const xml = await datei.text()
      const neu = await api.create('rechnungen/eingang', {
        dateiname: datei.name,
        xml,
      })
      setRechnungen((alle) => [neu, ...alle])
      setTab('eingang')
      toast.erfolg(
        `E-Rechnung erfasst: ${neu.extern_nummer || datei.name}`
      )
    } catch (e) {
      toast.fehler(e.message)
    } finally {
      setLaedtHoch(false)
    }
  }

  function kundenName(r) {
    if (r.richtung === 'eingang') return r.lieferant || '—'
    const k = kundenMap.get(Number(r.kunden_id))
    return k ? kundenModul.displayName(k) : `#${r.kunden_id}`
  }

  return (
    <div className="content">
      <Breadcrumb
        items={[{ label: 'Finanzen', to: '/rechnungen' }, { label: 'Rechnungen' }]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            Rechnungen <span className="badge">{rechnungen.length}</span>
          </h1>
          <div className="subtitel">
            Ausgangsrechnungen mit XRechnung-Export · Empfang von E-Rechnungen
            {offenSumme > 0 && (
              <> · offen: <strong>{formatEuro(offenSumme)}</strong></>
            )}
          </div>
        </div>
      </div>

      <div className="aktions-toolbar">
        <div className="at-gruppe">
          <div className="view-toggle" role="tablist" aria-label="Richtung">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'ausgang'}
              className={`view-toggle-btn${tab === 'ausgang' ? ' aktiv' : ''}`}
              onClick={() => setTab('ausgang')}
            >
              Ausgang ({ausgang.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'eingang'}
              className={`view-toggle-btn${tab === 'eingang' ? ' aktiv' : ''}`}
              onClick={() => setTab('eingang')}
            >
              Eingang ({eingang.length})
            </button>
          </div>
        </div>
        <div className="at-gruppe at-sekundaer">
          <input
            ref={dateiRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            style={{ display: 'none' }}
            onChange={xmlHochladen}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={laedtHoch}
            onClick={() => dateiRef.current?.click()}
            title="Empfangene E-Rechnung (XRechnung/ZUGFeRD-XML) hochladen"
          >
            <IconUpload />
            {laedtHoch ? 'Wird gelesen…' : 'E-Rechnung empfangen'}
          </button>
          <Link to="/rechnungen/neu" className="btn btn-primary">
            <IconPlus />
            Neue Rechnung
          </Link>
        </div>
      </div>

      {fehler && <Alert titel="Fehler beim Laden">{fehler}</Alert>}
      {lade ? (
        <LadeBlock text="Rechnungen werden geladen…" />
      ) : sichtbar.length === 0 ? (
        <EmptyState
          titel={
            tab === 'ausgang'
              ? 'Noch keine Ausgangsrechnungen'
              : 'Noch keine Eingangsrechnungen'
          }
          text={
            tab === 'ausgang'
              ? 'Lege eine neue Rechnung an — die Rechnungsnummer wird erst beim Festschreiben vergeben.'
              : 'Lade eine empfangene E-Rechnung (XML) hoch — seit 01.01.2025 müssen Unternehmen E-Rechnungen empfangen können.'
          }
        />
      ) : (
        <Sektion tight>
          <div className="tabelle-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nummer</th>
                  <th>{tab === 'ausgang' ? 'Kunde' : 'Lieferant'}</th>
                  <th>Datum</th>
                  <th>Fällig</th>
                  <th style={{ textAlign: 'right' }}>Brutto</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sichtbar.map((r) => (
                  <tr
                    key={r.id}
                    className="zeile-klickbar"
                    onClick={() => navigate(`/rechnungen/${r.id}`)}
                  >
                    <td>
                      <Link to={`/rechnungen/${r.id}`}>
                        {r.richtung === 'eingang'
                          ? r.extern_nummer || r.dateiname || `#${r.id}`
                          : r.nummer || `Entwurf #${r.id}`}
                      </Link>
                    </td>
                    <td>{kundenName(r)}</td>
                    <td>{formatDatumDE(r.datum)}</td>
                    <td>{formatDatumDE(r.faellig_am)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {formatEuro(r.richtung === 'eingang' ? r.betrag : r.brutto)}
                    </td>
                    <td>
                      <StatusBadge optionen={RECHNUNG_STATUS} value={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sektion>
      )}
    </div>
  )
}
