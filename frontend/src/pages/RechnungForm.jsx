import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { LadeBlock } from '../components/Spinner'
import { Sektion } from '../components/Sektion'
import { IconPlus, IconTrash } from '../components/Icons'
import {
  EINHEITEN,
  UST_SAETZE,
  berechneSummen,
  formatEuro,
} from '../lib/rechnung'

function heuteISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function leerePosition() {
  return { bezeichnung: '', menge: '1', einheit: 'Stück', einzelpreis: '', ust_satz: 19 }
}

export function RechnungForm() {
  const { id } = useParams() // gesetzt = Entwurf bearbeiten
  const kundenModul = findModul('kunden')
  const projekteModul = findModul('projekte')
  const toast = useToast()
  const navigate = useNavigate()

  const [kunden, setKunden] = useState([])
  const [projekte, setProjekte] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)
  const [speichert, setSpeichert] = useState(false)

  const [form, setForm] = useState({
    kunden_id: '',
    projekt_id: '',
    datum: heuteISO(),
    leistung_von: '',
    leistung_bis: '',
    zahlungsziel_tage: 14,
    bemerkung: '',
  })
  const [positionen, setPositionen] = useState([leerePosition()])

  useEffect(() => {
    async function laden() {
      try {
        const [k, p] = await Promise.all([
          api.list('kunden'),
          api.list('projekte'),
        ])
        setKunden(k)
        setProjekte(p)
        if (id) {
          const r = await api.get('rechnungen', id)
          if (r.status !== 'entwurf') {
            navigate(`/rechnungen/${id}`, { replace: true })
            return
          }
          setForm({
            kunden_id: r.kunden_id ?? '',
            projekt_id: r.projekt_id ?? '',
            datum: r.datum || heuteISO(),
            leistung_von: r.leistung_von || '',
            leistung_bis: r.leistung_bis || '',
            zahlungsziel_tage: r.zahlungsziel_tage ?? 14,
            bemerkung: r.bemerkung || '',
          })
          if (r.positionen?.length) {
            setPositionen(
              r.positionen.map((p) => ({
                bezeichnung: p.bezeichnung || '',
                menge: p.menge ?? '1',
                einheit: p.einheit || 'Stück',
                einzelpreis: p.einzelpreis ?? '',
                ust_satz: p.ust_satz ?? 19,
              }))
            )
          }
        }
      } catch (e) {
        setFehler(e.message)
      } finally {
        setLade(false)
      }
    }
    laden()
  }, [id, navigate])

  function setFeld(name, wert) {
    setForm((f) => ({ ...f, [name]: wert }))
  }

  function setPosition(i, name, wert) {
    setPositionen((alle) =>
      alle.map((p, idx) => (idx === i ? { ...p, [name]: wert } : p))
    )
  }

  const summen = useMemo(() => berechneSummen(positionen), [positionen])

  const gueltig =
    form.kunden_id &&
    form.datum &&
    positionen.length > 0 &&
    positionen.every(
      (p) =>
        p.bezeichnung.trim() &&
        Number(p.menge) > 0 &&
        p.einzelpreis !== '' &&
        !Number.isNaN(Number(p.einzelpreis))
    )

  async function speichern(event) {
    event.preventDefault()
    if (!gueltig || speichert) return
    setSpeichert(true)
    try {
      const daten = {
        kunden_id: Number(form.kunden_id),
        projekt_id: form.projekt_id ? Number(form.projekt_id) : null,
        datum: form.datum,
        leistung_von: form.leistung_von || null,
        leistung_bis: form.leistung_bis || null,
        zahlungsziel_tage: Number(form.zahlungsziel_tage) || 14,
        bemerkung: form.bemerkung || null,
        positionen: positionen.map((p) => ({
          bezeichnung: p.bezeichnung.trim(),
          menge: Number(p.menge),
          einheit: p.einheit,
          einzelpreis: Number(p.einzelpreis),
          ust_satz: Number(p.ust_satz),
        })),
      }
      const r = id
        ? await api.update('rechnungen', id, daten)
        : await api.create('rechnungen', daten)
      toast.erfolg(id ? 'Entwurf aktualisiert' : 'Rechnungsentwurf angelegt')
      navigate(`/rechnungen/${r.id}`)
    } catch (e) {
      toast.fehler(e.message)
    } finally {
      setSpeichert(false)
    }
  }

  if (lade) return <LadeBlock text="Formular wird vorbereitet…" />

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Finanzen', to: '/rechnungen' },
          { label: 'Rechnungen', to: '/rechnungen' },
          { label: id ? 'Entwurf bearbeiten' : 'Neue Rechnung' },
        ]}
      />

      <div className="page-header">
        <div className="titel-block">
          <h1>{id ? 'Entwurf bearbeiten' : 'Neue Rechnung'}</h1>
          <div className="subtitel">
            Die Rechnungsnummer wird erst beim Festschreiben vergeben —
            Entwürfe bleiben frei änderbar.
          </div>
        </div>
      </div>

      {fehler && <Alert titel="Fehler">{fehler}</Alert>}

      <form onSubmit={speichern}>
        <Sektion titel="Empfänger &amp; Termine">
          <div className="felder">
            <label className="feld">
              <span className="feld-label">
                Kunde <span className="feld-required">*</span>
              </span>
              <select
                value={form.kunden_id}
                onChange={(e) => setFeld('kunden_id', e.target.value)}
                required
              >
                <option value="">— Kunde wählen —</option>
                {kunden.map((k) => (
                  <option key={k.id} value={k.id}>
                    {kundenModul.displayName(k)}
                  </option>
                ))}
              </select>
            </label>
            <label className="feld">
              <span className="feld-label">Projekt (optional)</span>
              <select
                value={form.projekt_id}
                onChange={(e) => setFeld('projekt_id', e.target.value)}
              >
                <option value="">— kein Projekt —</option>
                {projekte.map((p) => (
                  <option key={p.id} value={p.id}>
                    {projekteModul.displayName(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="feld">
              <span className="feld-label">
                Rechnungsdatum <span className="feld-required">*</span>
              </span>
              <input
                type="date"
                value={form.datum}
                onChange={(e) => setFeld('datum', e.target.value)}
                required
              />
            </label>
            <label className="feld">
              <span className="feld-label">Zahlungsziel (Tage)</span>
              <input
                type="number"
                min="0"
                value={form.zahlungsziel_tage}
                onChange={(e) => setFeld('zahlungsziel_tage', e.target.value)}
              />
            </label>
            <label className="feld">
              <span className="feld-label">Leistungszeitraum von</span>
              <input
                type="date"
                value={form.leistung_von}
                onChange={(e) => setFeld('leistung_von', e.target.value)}
              />
            </label>
            <label className="feld">
              <span className="feld-label">Leistungszeitraum bis</span>
              <input
                type="date"
                value={form.leistung_bis}
                onChange={(e) => setFeld('leistung_bis', e.target.value)}
              />
            </label>
          </div>
        </Sektion>

        <Sektion
          titel="Positionen"
          count={positionen.length}
          aktionen={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPositionen((alle) => [...alle, leerePosition()])}
            >
              <IconPlus />
              Position
            </button>
          }
          tight
        >
          <div className="tabelle-wrap">
            <table className="positionen-tabelle">
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>Pos</th>
                  <th>Bezeichnung</th>
                  <th style={{ width: '10%' }}>Menge</th>
                  <th style={{ width: '12%' }}>Einheit</th>
                  <th style={{ width: '14%' }}>Einzelpreis €</th>
                  <th style={{ width: '10%' }}>USt %</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Summe</th>
                  <th style={{ width: '4%' }} />
                </tr>
              </thead>
              <tbody>
                {positionen.map((p, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={p.bezeichnung}
                        placeholder="z. B. Gleisbauarbeiten lt. Aufmaß"
                        onChange={(e) => setPosition(i, 'bezeichnung', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={p.menge}
                        onChange={(e) => setPosition(i, 'menge', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={p.einheit}
                        onChange={(e) => setPosition(i, 'einheit', e.target.value)}
                      >
                        {EINHEITEN.map((e2) => (
                          <option key={e2} value={e2}>
                            {e2}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={p.einzelpreis}
                        onChange={(e) => setPosition(i, 'einzelpreis', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={p.ust_satz}
                        onChange={(e) => setPosition(i, 'ust_satz', e.target.value)}
                      >
                        {UST_SAETZE.map((s) => (
                          <option key={s} value={s}>
                            {s} %
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatEuro(Number(p.menge || 0) * Number(p.einzelpreis || 0))}
                    </td>
                    <td>
                      {positionen.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon-edit"
                          title="Position entfernen"
                          onClick={() =>
                            setPositionen((alle) => alle.filter((_, idx) => idx !== i))
                          }
                        >
                          <IconTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rechnung-summen">
            <div>
              <span>Netto</span>
              <strong>{formatEuro(summen.netto)}</strong>
            </div>
            {summen.ust.map((u) => (
              <div key={u.satz}>
                <span>USt {u.satz} %</span>
                <strong>{formatEuro(u.betrag)}</strong>
              </div>
            ))}
            <div className="summe-brutto">
              <span>Brutto</span>
              <strong>{formatEuro(summen.brutto)}</strong>
            </div>
          </div>
        </Sektion>

        <Sektion titel="Bemerkung">
          <label className="feld feld-wide">
            <span className="feld-label">Hinweis auf der Rechnung (optional)</span>
            <textarea
              rows={3}
              value={form.bemerkung}
              placeholder="z. B. Zahlbar ohne Abzug. Es gilt die Steuerschuldnerschaft nach ..."
              onChange={(e) => setFeld('bemerkung', e.target.value)}
            />
          </label>
        </Sektion>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(id ? `/rechnungen/${id}` : '/rechnungen')}
          >
            Abbrechen
          </button>
          <button type="submit" className="btn btn-primary" disabled={!gueltig || speichert}>
            {speichert
              ? 'Wird gespeichert…'
              : id
                ? 'Entwurf speichern'
                : 'Als Entwurf anlegen'}
          </button>
        </div>
      </form>
    </div>
  )
}
