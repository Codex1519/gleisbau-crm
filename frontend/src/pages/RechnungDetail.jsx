import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { StatusBadge } from '../components/StatusBadge'
import {
  IconArrowLeft,
  IconCheck,
  IconDocument,
  IconPencil,
  IconPrint,
  IconTrash,
} from '../components/Icons'
import {
  RECHNUNG_STATUS,
  formatEuro,
  formatDatumDE,
  ladeXRechnung,
} from '../lib/rechnung'

export function RechnungDetail() {
  const { id } = useParams()
  const kundenModul = findModul('kunden')
  const projekteModul = findModul('projekte')
  const { darfLoeschen } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [rechnung, setRechnung] = useState(null)
  const [kunde, setKunde] = useState(null)
  const [projekt, setProjekt] = useState(null)
  const [firma, setFirma] = useState(null)
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [arbeitet, setArbeitet] = useState(false)

  useEffect(() => {
    async function laden() {
      setLade(true)
      setFehler(null)
      try {
        const r = await api.get('rechnungen', id)
        setRechnung(r)
        const [k, p, f] = await Promise.all([
          r.kunden_id ? api.get('kunden', r.kunden_id).catch(() => null) : null,
          r.projekt_id ? api.get('projekte', r.projekt_id).catch(() => null) : null,
          api.list('firmendaten').catch(() => null),
        ])
        setKunde(k)
        setProjekt(p)
        setFirma(f)
      } catch (e) {
        setFehler(e.message)
      } finally {
        setLade(false)
      }
    }
    laden()
  }, [id])

  async function festschreiben() {
    if (
      !window.confirm(
        'Rechnung festschreiben? Sie erhält die nächste fortlaufende Nummer und ist danach nicht mehr änderbar.'
      )
    )
      return
    setArbeitet(true)
    try {
      const r = await api.create(`rechnungen/${id}/festschreiben`, {})
      setRechnung(r)
      toast.erfolg(`Rechnung festgeschrieben: ${r.nummer}`)
    } catch (e) {
      toast.fehler(e.message)
    } finally {
      setArbeitet(false)
    }
  }

  async function statusSetzen(status) {
    setArbeitet(true)
    try {
      const r = await api.create(`rechnungen/${id}/status`, { status })
      setRechnung(r)
      toast.erfolg(`Status: ${status}`)
    } catch (e) {
      toast.fehler(e.message)
    } finally {
      setArbeitet(false)
    }
  }

  async function loeschen() {
    if (!window.confirm('Diesen Rechnungsentwurf endgültig löschen?')) return
    setArbeitet(true)
    try {
      await api.remove('rechnungen', id)
      toast.erfolg('Entwurf gelöscht')
      navigate('/rechnungen')
    } catch (e) {
      toast.fehler(e.message)
      setArbeitet(false)
    }
  }

  async function xmlDownload() {
    try {
      await ladeXRechnung(rechnung)
    } catch (e) {
      toast.fehler(e.message)
    }
  }

  if (lade) return <LadeBlock text="Rechnung wird geladen…" />
  if (fehler)
    return (
      <div className="content">
        <Alert titel="Fehler">{fehler}</Alert>
      </div>
    )
  if (!rechnung) return null

  const istAusgang = rechnung.richtung === 'ausgang'
  const istEntwurf = rechnung.status === 'entwurf'
  const titel = istAusgang
    ? rechnung.nummer || `Entwurf #${rechnung.id}`
    : rechnung.extern_nummer || rechnung.dateiname || `Eingang #${rechnung.id}`

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Finanzen', to: '/rechnungen' },
          { label: 'Rechnungen', to: '/rechnungen' },
          { label: titel },
        ]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>
            {titel}{' '}
            <StatusBadge optionen={RECHNUNG_STATUS} value={rechnung.status} />
          </h1>
          <div className="subtitel">
            {istAusgang
              ? kunde
                ? `Rechnung an ${kundenModul.displayName(kunde)}`
                : 'Ausgangsrechnung'
              : `Empfangene E-Rechnung${rechnung.lieferant ? ` von ${rechnung.lieferant}` : ''}`}
          </div>
        </div>
        <div className="aktionen">
          <Link to="/rechnungen" className="btn btn-ghost">
            <IconArrowLeft />
            Zurück
          </Link>
        </div>
      </div>

      <div className="aktions-toolbar no-print">
        <div className="at-gruppe">
          {istAusgang && istEntwurf && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={arbeitet}
                onClick={festschreiben}
                title="Nummer vergeben und Rechnung unveränderbar machen"
              >
                <IconCheck />
                Festschreiben
              </button>
              <Link to={`/rechnungen/${id}/bearbeiten`} className="btn btn-secondary">
                <IconPencil />
                Bearbeiten
              </Link>
            </>
          )}
          {istAusgang && rechnung.status === 'gestellt' && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={arbeitet}
                onClick={() => statusSetzen('bezahlt')}
              >
                <IconCheck />
                Als bezahlt markieren
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={arbeitet}
                onClick={() => statusSetzen('storniert')}
              >
                Stornieren
              </button>
            </>
          )}
          {!istAusgang && rechnung.status === 'eingegangen' && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={arbeitet}
              onClick={() => statusSetzen('bezahlt')}
            >
              <IconCheck />
              Als bezahlt markieren
            </button>
          )}
        </div>
        <div className="at-gruppe at-sekundaer">
          {istAusgang && !istEntwurf && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={xmlDownload}
              title="E-Rechnung im XRechnung-Format (EN 16931) herunterladen"
            >
              <IconDocument />
              XRechnung (XML)
            </button>
          )}
          {istAusgang && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              <IconPrint />
              Drucken / PDF
            </button>
          )}
          {istEntwurf && darfLoeschen && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={arbeitet}
              onClick={loeschen}
            >
              <IconTrash />
              Löschen
            </button>
          )}
        </div>
      </div>

      {istAusgang && istEntwurf && (
        <Alert typ="info" titel="Entwurf">
          Diese Rechnung hat noch keine Nummer. Beim Festschreiben wird die
          nächste fortlaufende Nummer vergeben (lückenloser Nummernkreis) —
          danach ist die Rechnung nicht mehr änderbar, nur noch stornierbar.
        </Alert>
      )}

      {istAusgang ? (
        <>
          <Sektion titel="Rechnungsdaten">
            <div className="value-grid">
              <div className="value-item">
                <div className="value-label">Rechnungsempfänger</div>
                <div className="value">
                  {kunde ? (
                    <Link to={`/kunden/${kunde.id}`}>
                      {kundenModul.displayName(kunde)}
                    </Link>
                  ) : (
                    '—'
                  )}
                  {kunde?.strasse && (
                    <div className="value-neben">
                      {kunde.strasse} {kunde.hausnummer}, {kunde.plz} {kunde.ort}
                    </div>
                  )}
                </div>
              </div>
              <div className="value-item">
                <div className="value-label">Projekt</div>
                <div className="value">
                  {projekt ? (
                    <Link to={`/projekte/${projekt.id}`}>
                      {projekteModul.displayName(projekt)}
                    </Link>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div className="value-item">
                <div className="value-label">Rechnungsdatum</div>
                <div className="value">{formatDatumDE(rechnung.datum)}</div>
              </div>
              <div className="value-item">
                <div className="value-label">Fällig am</div>
                <div className="value">
                  {formatDatumDE(rechnung.faellig_am)}
                  {rechnung.zahlungsziel_tage != null && (
                    <span className="value-neben">
                      {' '}
                      ({rechnung.zahlungsziel_tage} Tage)
                    </span>
                  )}
                </div>
              </div>
              <div className="value-item">
                <div className="value-label">Leistungszeitraum</div>
                <div className="value">
                  {rechnung.leistung_von || rechnung.leistung_bis
                    ? `${formatDatumDE(rechnung.leistung_von)} – ${formatDatumDE(rechnung.leistung_bis)}`
                    : '—'}
                </div>
              </div>
              <div className="value-item">
                <div className="value-label">Aussteller</div>
                <div className="value">
                  {firma?.name || '—'}
                  {firma?.ust_id && (
                    <div className="value-neben">USt-IdNr. {firma.ust_id}</div>
                  )}
                </div>
              </div>
            </div>
          </Sektion>

          <Sektion titel="Positionen" count={rechnung.positionen?.length} tight>
            <div className="tabelle-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Bezeichnung</th>
                    <th style={{ textAlign: 'right' }}>Menge</th>
                    <th>Einheit</th>
                    <th style={{ textAlign: 'right' }}>Einzelpreis</th>
                    <th style={{ textAlign: 'right' }}>USt</th>
                    <th style={{ textAlign: 'right' }}>Summe</th>
                  </tr>
                </thead>
                <tbody>
                  {(rechnung.positionen || []).map((p) => (
                    <tr key={p.pos}>
                      <td>{p.pos}</td>
                      <td>{p.bezeichnung}</td>
                      <td style={{ textAlign: 'right' }}>{Number(p.menge)}</td>
                      <td>{p.einheit}</td>
                      <td style={{ textAlign: 'right' }}>
                        {formatEuro(p.einzelpreis)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.ust_satz} %</td>
                      <td style={{ textAlign: 'right' }}>
                        {formatEuro(p.zeilensumme)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rechnung-summen">
              <div>
                <span>Netto</span>
                <strong>{formatEuro(rechnung.netto)}</strong>
              </div>
              {Object.entries(rechnung.ust || {}).map(([satz, w]) => (
                <div key={satz}>
                  <span>USt {satz} %</span>
                  <strong>{formatEuro(w.betrag)}</strong>
                </div>
              ))}
              <div className="summe-brutto">
                <span>Brutto</span>
                <strong>{formatEuro(rechnung.brutto)}</strong>
              </div>
            </div>
          </Sektion>

          {rechnung.bemerkung && (
            <Sektion titel="Bemerkung">
              <p className="value">{rechnung.bemerkung}</p>
            </Sektion>
          )}

          {firma?.iban && (
            <Sektion titel="Zahlung">
              <div className="value-grid">
                <div className="value-item">
                  <div className="value-label">IBAN</div>
                  <div className="value">{firma.iban}</div>
                </div>
                {firma.bic && (
                  <div className="value-item">
                    <div className="value-label">BIC</div>
                    <div className="value">{firma.bic}</div>
                  </div>
                )}
                {firma.bank && (
                  <div className="value-item">
                    <div className="value-label">Bank</div>
                    <div className="value">{firma.bank}</div>
                  </div>
                )}
              </div>
            </Sektion>
          )}
        </>
      ) : (
        <Sektion titel="Empfangene E-Rechnung">
          <div className="value-grid">
            <div className="value-item">
              <div className="value-label">Lieferant</div>
              <div className="value">{rechnung.lieferant || '—'}</div>
            </div>
            <div className="value-item">
              <div className="value-label">Rechnungsnummer</div>
              <div className="value">{rechnung.extern_nummer || '—'}</div>
            </div>
            <div className="value-item">
              <div className="value-label">Rechnungsdatum</div>
              <div className="value">{formatDatumDE(rechnung.datum)}</div>
            </div>
            <div className="value-item">
              <div className="value-label">Betrag (brutto)</div>
              <div className="value">{formatEuro(rechnung.betrag)}</div>
            </div>
            <div className="value-item">
              <div className="value-label">Datei</div>
              <div className="value">{rechnung.dateiname || '—'}</div>
            </div>
            <div className="value-item">
              <div className="value-label">Empfangen am</div>
              <div className="value">
                {formatDatumDE(rechnung.created_at?.slice(0, 10))}
              </div>
            </div>
          </div>
        </Sektion>
      )}
    </div>
  )
}
