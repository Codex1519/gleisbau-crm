import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { findModul } from '../modules'
import { useToast } from '../contexts/ToastContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Alert } from '../components/Alert'
import { Sektion } from '../components/Sektion'
import { LadeBlock, Spinner } from '../components/Spinner'
import { ConfirmDialog } from '../components/Modal'
import {
  BautagesberichtFormFelder,
  bautagesberichtPayload,
  berichtZuForm,
} from '../components/BautagesberichtFormFelder'
import {
  WETTER_OPTIONEN,
  fortschrittFarbe,
  erstellerId,
  hatInhalt,
} from '../lib/bautagesbericht'
import { WetterSymbol } from '../components/Icons'
import {
  IconArrowLeft,
  IconPencil,
  IconSave,
  IconX,
  IconPrint,
} from '../components/Icons'
import { LoeschenButton } from '../components/LoeschenButton'

// Ein Feld der Dokumentansicht — wird nur gerendert wenn Inhalt vorhanden.
function DokFeld({ titel, wert }) {
  if (!hatInhalt(wert)) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="value-label">{titel}</div>
      <div className="dok-text">{wert}</div>
    </div>
  )
}

export function BautagesberichtDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const projekteModul = findModul('projekte')
  const personalModul = findModul('personal')

  const [bericht, setBericht] = useState(null)
  const [projekte, setProjekte] = useState([])
  const [personal, setPersonal] = useState([])
  const [lade, setLade] = useState(true)
  const [fehler, setFehler] = useState(null)

  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(null)
  const [speichere, setSpeichere] = useState(false)
  const [confirmOffen, setConfirmOffen] = useState(false)
  const [loesche, setLoesche] = useState(false)

  const [kunden, setKunden] = useState([])
  const [alleBerichte, setAlleBerichte] = useState([])

  useEffect(() => {
    setLade(true)
    setFehler(null)
    setEditMode(false)
    Promise.all([
      api.get('bautagesberichte', id),
      api.list('projekte'),
      api.list('personal'),
      api.list('kunden'),
      api.list('bautagesberichte'),
    ])
      .then(([b, pr, pers, k, alle]) => {
        setBericht(b)
        setProjekte(pr)
        setPersonal(pers)
        setKunden(k)
        setAlleBerichte(alle)
      })
      .catch((e) => setFehler(e.message))
      .finally(() => setLade(false))
  }, [id])

  const projektMap = useMemo(
    () => new Map(projekte.map((p) => [p.id, p])),
    [projekte]
  )
  const personalMap = useMemo(
    () => new Map(personal.map((p) => [p.id, p])),
    [personal]
  )

  function set(feld, wert) {
    setForm((f) => ({ ...f, [feld]: wert }))
  }
  function startEdit() {
    setForm(berichtZuForm(bericht))
    setFehler(null)
    setEditMode(true)
  }
  function cancelEdit() {
    setEditMode(false)
    setFehler(null)
  }
  async function speichern(e) {
    e.preventDefault()
    setSpeichere(true)
    setFehler(null)
    try {
      const payload = bautagesberichtPayload(form)
      const aktualisiert = await api.update('bautagesberichte', id, payload)
      setBericht(aktualisiert ?? { ...bericht, ...payload })
      setEditMode(false)
      toast.erfolg('Bautagesbericht aktualisiert')
    } catch (err) {
      setFehler(err.message)
    } finally {
      setSpeichere(false)
    }
  }
  async function loeschenBestaetigt() {
    setLoesche(true)
    try {
      await api.remove('bautagesberichte', id)
      toast.erfolg('Bautagesbericht gelöscht')
      navigate('/bautagesberichte')
    } catch (e) {
      setFehler(e.message)
      setLoesche(false)
      setConfirmOffen(false)
    }
  }

  const projekt = bericht ? projektMap.get(bericht.projekt_id) : null
  const ersteller = bericht
    ? personalMap.get(erstellerId(bericht))
    : null
  const kunde =
    projekt && projekt.kunden_id
      ? kunden.find((k) => k.id === projekt.kunden_id)
      : null

  // Zusammenhängende Montage-Berichte (gleiches Projekt + gleiche Montage)
  const montageTeile = useMemo(() => {
    if (!bericht?.montage) return []
    return alleBerichte
      .filter(
        (b) =>
          b.montage === bericht.montage &&
          b.projekt_id === bericht.projekt_id
      )
      .sort((x, y) => String(x.datum || '').localeCompare(String(y.datum || '')))
  }, [alleBerichte, bericht])

  // Netto-Arbeitszeit aus Von/Bis/Pause ("07:00"–"17:00" − 30 min)
  const arbeitszeitText = (() => {
    if (!bericht?.arbeitszeit_von || !bericht?.arbeitszeit_bis) return null
    const [vh, vm] = String(bericht.arbeitszeit_von).split(':').map(Number)
    const [bh, bm] = String(bericht.arbeitszeit_bis).split(':').map(Number)
    const pause = Number(bericht.pause_minuten) || 0
    const netto = bh * 60 + bm - (vh * 60 + vm) - pause
    const stunden = netto > 0 ? (netto / 60).toFixed(2) : null
    return `${bericht.arbeitszeit_von}–${bericht.arbeitszeit_bis} · ${pause} Min. Pause${
      stunden ? ` = ${stunden} h` : ''
    }`
  })()
  const projektName = projekt
    ? projekteModul.displayName(projekt)
    : bericht
    ? `Projekt #${bericht.projekt_id}`
    : ''
  const fortschritt = Number(bericht?.baufortschritt) || 0
  const wetterOpt = WETTER_OPTIONEN.find((o) => o.value === bericht?.wetter)

  if (lade) {
    return (
      <div className="content">
        <Breadcrumb
          items={[
            { label: 'Module', to: '/' },
            { label: 'Bautagesberichte', to: '/bautagesberichte' },
            { label: `#${id}` },
          ]}
        />
        <Sektion>
          <LadeBlock text="Lade Bautagesbericht…" />
        </Sektion>
      </div>
    )
  }

  if (!bericht) {
    return (
      <div className="content">
        <Alert titel="Nicht gefunden">{fehler || 'Bericht existiert nicht.'}</Alert>
        <Link to="/bautagesberichte" className="btn btn-secondary">
          <IconArrowLeft />
          Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  return (
    <div className="content">
      <Breadcrumb
        items={[
          { label: 'Module', to: '/' },
          { label: 'Bautagesberichte', to: '/bautagesberichte' },
          { label: `${projektName} · ${bericht.datum || `#${id}`}` },
        ]}
      />

      {fehler && (
        <Alert titel={editMode ? 'Speichern fehlgeschlagen' : 'Fehler'}>
          {fehler}
        </Alert>
      )}

      {editMode ? (
        /* ---------- Edit-Modus ---------- */
        <>
          <div className="page-header no-print">
            <div className="titel-block">
              <h1>Bautagesbericht bearbeiten</h1>
              <div className="subtitel">
                {projektName} · {bericht.datum}
              </div>
            </div>
            <div className="aktionen">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cancelEdit}
                disabled={speichere}
              >
                <IconX />
                Abbrechen
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={speichern}
                disabled={speichere}
              >
                {speichere ? <Spinner /> : <IconSave />}
                {speichere ? 'Speichert…' : 'Speichern'}
              </button>
            </div>
          </div>

          <form onSubmit={speichern}>
            <BautagesberichtFormFelder
              form={form}
              set={set}
              personal={personal}
              projekte={projekte}
              speichere={speichere}
            />
            <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
          </form>
        </>
      ) : (
        /* ---------- Dokument-Ansicht ---------- */
        <>
          {/* Dokument-Header */}
          <div className="dok-header">
            <div>
              <h1>{projektName}</h1>
              <div className="dok-sub">
                Bautagesbericht ·{' '}
                {ersteller
                  ? personalModul.displayName(ersteller)
                  : 'Ersteller unbekannt'}
                {kunde && <> · Kunde: {kunde.name}</>}
                {bericht.montage && montageTeile.length > 0 && (
                  <>
                    {' '}· Montage „{bericht.montage}" — Bericht{' '}
                    {montageTeile.findIndex((t) => t.id === bericht.id) + 1}{' '}
                    von {montageTeile.length}
                  </>
                )}
              </div>
            </div>
            <div className="dok-meta">
              <div className="dok-meta-item">
                <div className="label">Datum</div>
                <div className="wert">{bericht.datum || '—'}</div>
              </div>
              {hatInhalt(bericht.ort) && (
                <div className="dok-meta-item">
                  <div className="label">Ort</div>
                  <div className="wert">{bericht.ort}</div>
                </div>
              )}
              {arbeitszeitText && (
                <div className="dok-meta-item">
                  <div className="label">Arbeitszeit</div>
                  <div className="wert" style={{ fontSize: 14 }}>
                    {arbeitszeitText}
                  </div>
                </div>
              )}
              {hatInhalt(bericht.wetter) && (
                <div className="dok-meta-item">
                  <div className="label">Wetter</div>
                  <div className="wert">
                    <span className="dok-wetter-gross"><WetterSymbol wert={bericht.wetter} /></span>{' '}
                    {wetterOpt?.label || bericht.wetter}
                    {hatInhalt(bericht.temperatur) &&
                      ` · ${bericht.temperatur} °C`}
                  </div>
                </div>
              )}
              <div className="dok-meta-item" style={{ minWidth: 160 }}>
                <div className="label">Baufortschritt</div>
                <div className="wert" style={{ fontSize: 13 }}>
                  <div className="fortschritt-mini">
                    <div className="bar">
                      <div
                        className={`fortschritt-fill farbe-${fortschrittFarbe(
                          fortschritt
                        )}`}
                        style={{ width: `${fortschritt}%` }}
                      />
                    </div>
                    <span className="pct">{fortschritt}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aktionsleiste */}
          <div className="page-header no-print">
            <div className="titel-block" />
            <div className="aktionen">
              <Link to="/bautagesberichte" className="btn btn-secondary">
                <IconArrowLeft />
                Zurück
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                <IconPrint />
                Als PDF exportieren
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={startEdit}
              >
                <IconPencil />
                Bearbeiten
              </button>
              <LoeschenButton onClick={() => setConfirmOffen(true)} />
            </div>
          </div>

          {/* Inhalts-Sektionen — leere Felder werden ausgeblendet */}
          {(hatInhalt(bericht.arbeiten_durchgefuehrt) ||
            hatInhalt(bericht.personal_anwesend) ||
            hatInhalt(bericht.maschinen_eingesetzt) ||
            hatInhalt(bericht.materiallieferungen)) && (
            <Sektion titel="Baustellenaktivität">
              <DokFeld
                titel="Durchgeführte Arbeiten"
                wert={bericht.arbeiten_durchgefuehrt}
              />
              <DokFeld
                titel="Anwesendes Personal"
                wert={bericht.personal_anwesend}
              />
              <DokFeld
                titel="Eingesetzte Maschinen"
                wert={bericht.maschinen_eingesetzt}
              />
              <DokFeld
                titel="Materiallieferungen"
                wert={bericht.materiallieferungen}
              />
            </Sektion>
          )}

          {(hatInhalt(bericht.behinderungen) ||
            hatInhalt(bericht.besondere_vorkommnisse)) && (
            <Sektion titel="Besonderheiten">
              <DokFeld
                titel="Behinderungen / Störungen"
                wert={bericht.behinderungen}
              />
              <DokFeld
                titel="Besondere Vorkommnisse"
                wert={bericht.besondere_vorkommnisse}
              />
            </Sektion>
          )}

          {hatInhalt(bericht.bemerkungen) && (
            <Sektion titel="Bemerkungen">
              <DokFeld titel="" wert={bericht.bemerkungen} />
            </Sektion>
          )}

          {bericht.montage && montageTeile.length > 1 && (
            <Sektion
              titel={`Montage „${bericht.montage}"`}
              count={montageTeile.length}
            >
              <div className="montage-teile">
                {montageTeile.map((t, i) => (
                  <Link
                    key={t.id}
                    to={`/bautagesberichte/${t.id}`}
                    className={`montage-teil${
                      t.id === bericht.id ? ' aktuell' : ''
                    }`}
                  >
                    <span className="nr">Tag {i + 1}</span>
                    <span>{t.datum || `#${t.id}`}</span>
                    <span className="pct">
                      {Number(t.baufortschritt) || 0}%
                    </span>
                  </Link>
                ))}
              </div>
            </Sektion>
          )}

          {(bericht.unterschrift_auftragnehmer ||
            bericht.unterschrift_auftraggeber ||
            bericht.unterschrift_datum) && (
            <Sektion titel="Unterschriften">
              <div className="dok-unterschriften">
                <div className="dok-unterschrift">
                  <div className="value-label">Auftragnehmer</div>
                  {bericht.unterschrift_auftragnehmer ? (
                    <img
                      src={bericht.unterschrift_auftragnehmer}
                      alt="Unterschrift Auftragnehmer"
                    />
                  ) : (
                    <div className="fehlt">keine Unterschrift</div>
                  )}
                </div>
                <div className="dok-unterschrift">
                  <div className="value-label">Auftraggeber</div>
                  {bericht.unterschrift_auftraggeber ? (
                    <img
                      src={bericht.unterschrift_auftraggeber}
                      alt="Unterschrift Auftraggeber"
                    />
                  ) : (
                    <div className="fehlt">nicht vor Ort</div>
                  )}
                </div>
              </div>
              {bericht.unterschrift_datum && (
                <div style={{ marginTop: 12, fontSize: 13.5 }}>
                  <span className="value-label" style={{ marginRight: 8 }}>
                    Unterschrieben am
                  </span>
                  {bericht.unterschrift_datum}
                </div>
              )}
            </Sektion>
          )}
        </>
      )}

      <ConfirmDialog
        offen={confirmOffen}
        titel="Bautagesbericht löschen?"
        nachricht={`Möchtest du den Bericht „${projektName} · ${bericht.datum}" wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`}
        bestaetigenText={loesche ? 'Lösche…' : 'Endgültig löschen'}
        gefaehrlich
        onConfirm={loeschenBestaetigt}
        onCancel={() => !loesche && setConfirmOffen(false)}
      />
    </div>
  )
}
