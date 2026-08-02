import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_BASE } from '../api'
import {
  STANDARD_ROLLEN,
  serializePersonalAnwesend,
} from '../components/PersonalAnwesendFeld'
import { SignaturFeld } from '../components/SignaturFeld'
import { WETTER_OPTIONEN } from '../lib/bautagesbericht'
import { formatStunden, heuteISO } from '../lib/zeiterfassung'
import { Spinner } from '../components/Spinner'

// Feld-Formular: Bautagesbericht von der Baustelle, Zasta-Stil.
// Eine Frage pro Bildschirm, Pflichtfelder blockieren "Weiter".
//
// Bewusst KEINE Personen-Speicherung: Jeder Aufruf startet neutral bei
// "Wer bist du?". Lokal gemerkt wird ausschließlich der Link-Code
// (damit der Start vom Homescreen ohne Query-Parameter funktioniert) —
// der identifiziert das Gerät, nie eine Person.

const KEY_STORAGE = 'gleisbau_feld_key'

function feldFetch(pfad, key, options) {
  const sep = pfad.includes('?') ? '&' : '?'
  return fetch(`${API_BASE}${pfad}${sep}key=${encodeURIComponent(key)}`, options)
}

// "07:30" -> Minuten seit Mitternacht
function zeitZuMinuten(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

export function Melden() {
  const [searchParams] = useSearchParams()

  const key = useMemo(() => {
    const ausUrl = searchParams.get('key')
    if (ausUrl) {
      localStorage.setItem(KEY_STORAGE, ausUrl)
      return ausUrl
    }
    return localStorage.getItem(KEY_STORAGE) || ''
  }, [searchParams])

  // Alte Geräte: früher gespeicherte Personen-Auswahl entfernen
  useEffect(() => {
    localStorage.removeItem('gleisbau_feld_wer')
  }, [])

  const [stammdaten, setStammdaten] = useState(null)
  const [ladeFehler, setLadeFehler] = useState(null)
  const [schritt, setSchritt] = useState(0)
  const [sende, setSende] = useState(false)
  const [sendeFehler, setSendeFehler] = useState(null)
  const [fertig, setFertig] = useState(false)

  const [a, setA] = useState(() => ({
    ersteller_id: null,
    projekt_id: null,
    datum: heuteISO(),
    ort: '',
    wetter: '',
    temperatur: '',
    von: '',
    bis: '',
    pause: '30',
    arbeiten: '',
    counts: Object.fromEntries(STANDARD_ROLLEN.map((r) => [r, 0])),
    extra: [],
    maschinen: '',
    material: '',
    problemeJa: null,
    behinderungen: '',
    vorkommnisse: '',
    fortschritt: 0,
    bemerkungen: '',
    sigAuftragnehmer: '',
    sigAuftraggeber: '',
    agNichtVorOrt: false,
    sigDatum: heuteISO(),
  }))

  function set(feld, wert) {
    setA((alt) => ({ ...alt, [feld]: wert }))
  }

  useEffect(() => {
    if (!key) {
      setLadeFehler('kein-key')
      return
    }
    feldFetch('/feld/stammdaten', key)
      .then(async (r) => {
        if (r.status === 403) throw new Error('key')
        if (!r.ok) throw new Error('server')
        setStammdaten(await r.json())
      })
      .catch((e) =>
        setLadeFehler(e.message === 'key' ? 'kein-key' : 'server')
      )
  }, [key])

  const personalGesamt =
    STANDARD_ROLLEN.reduce((s, r) => s + (Number(a.counts[r]) || 0), 0) +
    a.extra.reduce(
      (s, e) => s + (e.bezeichnung.trim() ? Number(e.anzahl) || 0 : 0),
      0
    )

  // Netto-Arbeitszeit in Minuten (Bis − Von − Pause)
  const nettoMinuten = useMemo(() => {
    const von = zeitZuMinuten(a.von)
    const bis = zeitZuMinuten(a.bis)
    if (von == null || bis == null) return null
    return bis - von - (Number(a.pause) || 0)
  }, [a.von, a.bis, a.pause])

  // ---------- Schritte ----------
  const schritte = [
    {
      id: 'wer',
      frage: 'Wer bist du?',
      valid: () => !!a.ersteller_id,
    },
    {
      id: 'projekt',
      frage: 'Auf welcher Baustelle warst du heute?',
      valid: () => !!a.projekt_id,
    },
    {
      id: 'datum',
      frage: 'Für welchen Tag ist der Bericht?',
      valid: () => !!a.datum,
    },
    {
      id: 'ort',
      frage: 'Wo ist die Baustelle?',
      hinweis: 'Ort oder Streckenabschnitt, z. B. „Hamburg-Harburg, Gleis 3".',
      valid: () => a.ort.trim().length > 0,
    },
    {
      id: 'wetter',
      frage: 'Wie war das Wetter?',
      hinweis: 'Optional — einfach Weiter, wenn egal.',
      valid: () => true,
    },
    {
      id: 'zeit',
      frage: 'Wie lange wurde gearbeitet?',
      hinweis: 'Von, Bis und Pause — die Stunden rechnen wir aus.',
      valid: () => nettoMinuten != null && nettoMinuten > 0,
    },
    {
      id: 'arbeiten',
      frage: 'Was wurde heute gemacht?',
      valid: () => a.arbeiten.trim().length > 0,
    },
    {
      id: 'personal',
      frage: 'Wer war heute vor Ort?',
      hinweis: 'Mindestens eine Person angeben.',
      valid: () => personalGesamt >= 1,
    },
    {
      id: 'maschinen',
      frage: 'Welche Maschinen waren im Einsatz?',
      valid: () => a.maschinen.trim().length > 0,
    },
    {
      id: 'material',
      frage: 'Gab es Materiallieferungen?',
      valid: () => a.material.trim().length > 0,
    },
    {
      id: 'probleme',
      frage: 'Gab es Probleme oder besondere Vorkommnisse?',
      valid: () => a.problemeJa !== null,
    },
    {
      id: 'fortschritt',
      frage: 'Wie weit ist die Baustelle?',
      valid: () => true,
    },
    {
      id: 'sig_an',
      frage: 'Unterschrift Auftragnehmer',
      hinweis: 'Das bist du — unterschreibe mit dem Finger.',
      valid: () => !!a.sigAuftragnehmer,
    },
    {
      id: 'sig_ag',
      frage: 'Unterschrift Auftraggeber',
      hinweis: 'Vertreter des Auftraggebers vor Ort unterschreiben lassen.',
      valid: () => !!a.sigAuftraggeber || a.agNichtVorOrt,
    },
    {
      id: 'sig_datum',
      frage: 'Datum der Unterschrift',
      valid: () => !!a.sigDatum,
    },
    {
      id: 'fertig',
      frage: 'Alles richtig?',
      valid: () => true,
    },
  ]

  const aktuell = schritte[schritt]
  const istLetzter = schritt === schritte.length - 1

  function weiter() {
    if (!aktuell.valid()) return
    if (istLetzter) absenden()
    else setSchritt((s) => s + 1)
  }
  function zurueck() {
    setSendeFehler(null)
    setSchritt((s) => Math.max(0, s - 1))
  }

  async function absenden() {
    setSende(true)
    setSendeFehler(null)
    try {
      const payload = {
        projekt_id: a.projekt_id,
        ersteller_id: a.ersteller_id,
        datum: a.datum,
        ort: a.ort.trim(),
        arbeitszeit_von: a.von,
        arbeitszeit_bis: a.bis,
        pause_minuten: Number(a.pause) || 0,
        arbeiten_durchgefuehrt: a.arbeiten.trim(),
        personal_anwesend: serializePersonalAnwesend(a.counts, a.extra),
        maschinen_eingesetzt: a.maschinen.trim(),
        materiallieferungen: a.material.trim(),
        baufortschritt: Number(a.fortschritt) || 0,
        unterschrift_auftragnehmer: a.sigAuftragnehmer,
        unterschrift_datum: a.sigDatum,
      }
      if (a.wetter) payload.wetter = a.wetter
      if (a.temperatur !== '') payload.temperatur = Number(a.temperatur)
      if (a.sigAuftraggeber)
        payload.unterschrift_auftraggeber = a.sigAuftraggeber
      if (a.problemeJa && a.behinderungen.trim())
        payload.behinderungen = a.behinderungen.trim()
      if (a.problemeJa && a.vorkommnisse.trim())
        payload.besondere_vorkommnisse = a.vorkommnisse.trim()
      if (a.bemerkungen.trim()) payload.bemerkungen = a.bemerkungen.trim()

      const r = await feldFetch('/feld/bautagesberichte', key, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error(`Senden fehlgeschlagen (${r.status})`)
      setFertig(true)
    } catch (e) {
      setSendeFehler(
        e.message.includes('Failed to fetch')
          ? 'Keine Verbindung — bitte später erneut versuchen.'
          : e.message
      )
    } finally {
      setSende(false)
    }
  }

  function neuerBericht() {
    setA({
      ersteller_id: null,
      projekt_id: null,
      datum: heuteISO(),
      ort: '',
      wetter: '',
      temperatur: '',
      von: '',
      bis: '',
      pause: '30',
      arbeiten: '',
      counts: Object.fromEntries(STANDARD_ROLLEN.map((r) => [r, 0])),
      extra: [],
      maschinen: '',
      material: '',
      problemeJa: null,
      behinderungen: '',
      vorkommnisse: '',
      fortschritt: 0,
      bemerkungen: '',
      sigAuftragnehmer: '',
      sigAuftraggeber: '',
      agNichtVorOrt: false,
      sigDatum: heuteISO(),
    })
    setFertig(false)
    setSchritt(0)
  }

  // ---------- Sonderscreens ----------
  if (ladeFehler === 'kein-key') {
    return (
      <MeldenRahmen>
        <div className="melden-zentriert">
          <div className="melden-emoji">🔒</div>
          <h1>Ungültiger Link</h1>
          <p>
            Dieser Link funktioniert nicht (mehr). Bitte den aktuellen
            Berichts-Link vom Bauleiter anfordern.
          </p>
        </div>
      </MeldenRahmen>
    )
  }
  if (ladeFehler === 'server') {
    return (
      <MeldenRahmen>
        <div className="melden-zentriert">
          <div className="melden-emoji">📡</div>
          <h1>Keine Verbindung</h1>
          <p>Der Server ist gerade nicht erreichbar. Später erneut öffnen.</p>
          <button
            className="btn btn-primary melden-weiter"
            onClick={() => window.location.reload()}
          >
            Neu versuchen
          </button>
        </div>
      </MeldenRahmen>
    )
  }
  if (!stammdaten) {
    return (
      <MeldenRahmen>
        <div className="melden-zentriert">
          <Spinner groesse="lg" />
          <p>Lade…</p>
        </div>
      </MeldenRahmen>
    )
  }
  if (fertig) {
    return (
      <MeldenRahmen>
        <div className="melden-zentriert">
          <div className="melden-emoji">✅</div>
          <h1>Bericht gesendet!</h1>
          <p>Dein Bautagesbericht ist im Büro angekommen. Danke!</p>
          <button
            className="btn btn-primary melden-weiter"
            onClick={neuerBericht}
          >
            Neuen Bericht starten
          </button>
        </div>
      </MeldenRahmen>
    )
  }

  // ---------- Schritt-Inhalte ----------
  const person = stammdaten.personal.find((p) => p.id === a.ersteller_id)
  const projekt = stammdaten.projekte.find((p) => p.id === a.projekt_id)

  function inhalt() {
    switch (aktuell.id) {
      case 'wer':
        return (
          <div className="melden-liste">
            {stammdaten.personal.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`melden-wahl${
                  a.ersteller_id === p.id ? ' aktiv' : ''
                }`}
                onClick={() => {
                  set('ersteller_id', p.id)
                  setTimeout(() => setSchritt((s) => s + 1), 200)
                }}
              >
                {[p.vorname, p.nachname].filter(Boolean).join(' ')}
              </button>
            ))}
            {stammdaten.personal.length === 0 && (
              <p className="melden-leer">
                Keine Baustellen-Mitarbeiter gefunden. Es erscheinen nur
                Personen, deren Position im CRM Polier, Vorarbeiter,
                Facharbeiter oder Bauhelfer ist — bitte im Büro melden.
              </p>
            )}
          </div>
        )

      case 'projekt':
        return (
          <div className="melden-liste">
            {stammdaten.projekte.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`melden-wahl${
                  a.projekt_id === p.id ? ' aktiv' : ''
                }`}
                onClick={() => {
                  set('projekt_id', p.id)
                  setTimeout(() => setSchritt((s) => s + 1), 200)
                }}
              >
                {p.name}
                {p.kunde && (
                  <span className="melden-wahl-sub">Kunde: {p.kunde}</span>
                )}
              </button>
            ))}
            {stammdaten.projekte.length === 0 && (
              <p className="melden-leer">
                Keine aktiven Projekte — bitte im Büro melden.
              </p>
            )}
          </div>
        )

      case 'datum':
        return (
          <input
            type="date"
            className="melden-datum"
            value={a.datum}
            max={heuteISO()}
            onChange={(e) => set('datum', e.target.value)}
          />
        )

      case 'ort':
        return (
          <input
            type="text"
            className="melden-datum"
            placeholder="z. B. Hamburg-Harburg, Gleis 3"
            value={a.ort}
            autoFocus
            onChange={(e) => set('ort', e.target.value)}
          />
        )

      case 'wetter':
        return (
          <>
            <div className="melden-wetter">
              {WETTER_OPTIONEN.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  className={`melden-wetter-tile${
                    a.wetter === w.value ? ' aktiv' : ''
                  }`}
                  onClick={() =>
                    set('wetter', a.wetter === w.value ? '' : w.value)
                  }
                >
                  <span className="ico">{w.icon}</span>
                  <span>{w.label}</span>
                </button>
              ))}
            </div>
            <label className="melden-temp">
              <span>Temperatur (°C)</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="z. B. 18"
                value={a.temperatur}
                onChange={(e) => set('temperatur', e.target.value)}
              />
            </label>
          </>
        )

      case 'zeit':
        return (
          <div className="melden-zeit">
            <div className="melden-zeit-felder">
              <label>
                <span>Von</span>
                <input
                  type="time"
                  value={a.von}
                  onChange={(e) => set('von', e.target.value)}
                />
              </label>
              <label>
                <span>Bis</span>
                <input
                  type="time"
                  value={a.bis}
                  onChange={(e) => set('bis', e.target.value)}
                />
              </label>
              <label>
                <span>Pause (Min.)</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  inputMode="numeric"
                  value={a.pause}
                  onChange={(e) => set('pause', e.target.value)}
                />
              </label>
            </div>
            <div
              className={`melden-zeit-summe${
                nettoMinuten != null && nettoMinuten <= 0 ? ' fehler' : ''
              }`}
            >
              {nettoMinuten == null
                ? 'Von und Bis eintragen'
                : nettoMinuten <= 0
                ? 'Ende muss nach dem Anfang liegen'
                : `= ${formatStunden(nettoMinuten)} Stunden`}
            </div>
          </div>
        )

      case 'arbeiten':
        return (
          <textarea
            className="melden-text"
            placeholder="Kurz beschreiben, was heute gemacht wurde…"
            value={a.arbeiten}
            autoFocus
            onChange={(e) => set('arbeiten', e.target.value)}
          />
        )

      case 'personal':
        return (
          <div className="melden-zaehler">
            {STANDARD_ROLLEN.map((rolle) => (
              <div className="melden-zaehler-zeile" key={rolle}>
                <span className="name">{rolle}</span>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label={`Weniger ${rolle}`}
                    onClick={() =>
                      set('counts', {
                        ...a.counts,
                        [rolle]: Math.max(0, (a.counts[rolle] || 0) - 1),
                      })
                    }
                  >
                    −
                  </button>
                  <span className="anzahl">{a.counts[rolle] || 0}</span>
                  <button
                    type="button"
                    aria-label={`Mehr ${rolle}`}
                    onClick={() =>
                      set('counts', {
                        ...a.counts,
                        [rolle]: (a.counts[rolle] || 0) + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            {a.extra.map((e, i) => (
              <div className="melden-zaehler-zeile" key={i}>
                <input
                  type="text"
                  className="extra-name"
                  placeholder="Qualifikation…"
                  value={e.bezeichnung}
                  onChange={(ev) =>
                    set(
                      'extra',
                      a.extra.map((x, idx) =>
                        idx === i
                          ? { ...x, bezeichnung: ev.target.value }
                          : x
                      )
                    )
                  }
                />
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => {
                      const n = (Number(e.anzahl) || 1) - 1
                      if (n <= 0)
                        set(
                          'extra',
                          a.extra.filter((_, idx) => idx !== i)
                        )
                      else
                        set(
                          'extra',
                          a.extra.map((x, idx) =>
                            idx === i ? { ...x, anzahl: String(n) } : x
                          )
                        )
                    }}
                  >
                    −
                  </button>
                  <span className="anzahl">{Number(e.anzahl) || 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        'extra',
                        a.extra.map((x, idx) =>
                          idx === i
                            ? {
                                ...x,
                                anzahl: String((Number(x.anzahl) || 1) + 1),
                              }
                            : x
                        )
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="melden-extra-add"
              onClick={() =>
                set('extra', [...a.extra, { bezeichnung: '', anzahl: '1' }])
              }
            >
              + Weitere Qualifikation
            </button>

            <div className="melden-summe">
              Gesamt: <strong>{personalGesamt}</strong>{' '}
              {personalGesamt === 1 ? 'Person' : 'Personen'}
            </div>
          </div>
        )

      case 'maschinen':
        return (
          <>
            <textarea
              className="melden-text"
              placeholder="z. B. Bagger, Stopfmaschine…"
              value={a.maschinen}
              onChange={(e) => set('maschinen', e.target.value)}
            />
            <button
              type="button"
              className="melden-chip"
              onClick={() => set('maschinen', 'Keine Maschinen im Einsatz')}
            >
              Keine Maschinen im Einsatz
            </button>
          </>
        )

      case 'material':
        return (
          <>
            <textarea
              className="melden-text"
              placeholder="z. B. 20 t Schotter, Schwellen…"
              value={a.material}
              onChange={(e) => set('material', e.target.value)}
            />
            <button
              type="button"
              className="melden-chip"
              onClick={() => set('material', 'Keine Lieferungen')}
            >
              Keine Lieferungen
            </button>
          </>
        )

      case 'probleme':
        return (
          <>
            <div className="melden-janein">
              <button
                type="button"
                className={`melden-wahl${
                  a.problemeJa === false ? ' aktiv' : ''
                }`}
                onClick={() => {
                  set('problemeJa', false)
                  setTimeout(() => setSchritt((s) => s + 1), 200)
                }}
              >
                Nein, alles gut ✌️
              </button>
              <button
                type="button"
                className={`melden-wahl${
                  a.problemeJa === true ? ' aktiv' : ''
                }`}
                onClick={() => set('problemeJa', true)}
              >
                Ja, gab es
              </button>
            </div>
            {a.problemeJa === true && (
              <div className="melden-probleme">
                <label>
                  <span>Behinderungen / Störungen</span>
                  <textarea
                    placeholder="Verzögerungen, Ausfälle…"
                    value={a.behinderungen}
                    onChange={(e) => set('behinderungen', e.target.value)}
                  />
                </label>
                <label>
                  <span>Besondere Vorkommnisse</span>
                  <textarea
                    placeholder="Unfälle, Mängel…"
                    value={a.vorkommnisse}
                    onChange={(e) => set('vorkommnisse', e.target.value)}
                  />
                </label>
              </div>
            )}
          </>
        )

      case 'fortschritt':
        return (
          <div className="melden-fortschritt">
            <div className="pct">{a.fortschritt}%</div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={a.fortschritt}
              onChange={(e) => set('fortschritt', Number(e.target.value))}
            />
            <div className="fortschritt-balken">
              <div
                className="fortschritt-fill farbe-blau"
                style={{ width: `${a.fortschritt}%` }}
              />
            </div>
          </div>
        )

      case 'sig_an':
        return (
          <SignaturFeld
            key="sig-an"
            wert={a.sigAuftragnehmer}
            onChange={(v) => set('sigAuftragnehmer', v)}
          />
        )

      case 'sig_ag':
        return (
          <>
            <SignaturFeld
              key="sig-ag"
              wert={a.sigAuftraggeber}
              onChange={(v) => {
                set('sigAuftraggeber', v)
                if (v) set('agNichtVorOrt', false)
              }}
            />
            <button
              type="button"
              className={`melden-chip${a.agNichtVorOrt ? ' aktiv' : ''}`}
              onClick={() => {
                set('agNichtVorOrt', !a.agNichtVorOrt)
                if (!a.agNichtVorOrt) set('sigAuftraggeber', '')
              }}
            >
              {a.agNichtVorOrt
                ? '✓ Auftraggeber nicht vor Ort'
                : 'Auftraggeber nicht vor Ort'}
            </button>
          </>
        )

      case 'sig_datum':
        return (
          <input
            type="date"
            className="melden-datum"
            value={a.sigDatum}
            max={heuteISO()}
            onChange={(e) => set('sigDatum', e.target.value)}
          />
        )

      case 'fertig':
        return (
          <div className="melden-zusammenfassung">
            <dl>
              <div>
                <dt>Wer</dt>
                <dd>
                  {person
                    ? [person.vorname, person.nachname]
                        .filter(Boolean)
                        .join(' ')
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Projekt</dt>
                <dd>
                  {projekt?.name || '—'}
                  {projekt?.kunde && ` · ${projekt.kunde}`}
                </dd>
              </div>
              <div>
                <dt>Datum</dt>
                <dd>{a.datum}</dd>
              </div>
              <div>
                <dt>Ort</dt>
                <dd>{a.ort}</dd>
              </div>
              <div>
                <dt>Arbeitszeit</dt>
                <dd>
                  {a.von}–{a.bis} · {Number(a.pause) || 0} Min. Pause ={' '}
                  {formatStunden(nettoMinuten)} h
                </dd>
              </div>
              {a.wetter && (
                <div>
                  <dt>Wetter</dt>
                  <dd>
                    {a.wetter}
                    {a.temperatur !== '' && ` · ${a.temperatur} °C`}
                  </dd>
                </div>
              )}
              <div>
                <dt>Arbeiten</dt>
                <dd>{a.arbeiten}</dd>
              </div>
              <div>
                <dt>Personal</dt>
                <dd>{serializePersonalAnwesend(a.counts, a.extra)}</dd>
              </div>
              <div>
                <dt>Maschinen</dt>
                <dd>{a.maschinen}</dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd>{a.material}</dd>
              </div>
              {a.problemeJa && (a.behinderungen || a.vorkommnisse) && (
                <div>
                  <dt>Probleme</dt>
                  <dd>
                    {[a.behinderungen, a.vorkommnisse]
                      .filter(Boolean)
                      .join(' · ')}
                  </dd>
                </div>
              )}
              <div>
                <dt>Fortschritt</dt>
                <dd>{a.fortschritt}%</dd>
              </div>
              <div>
                <dt>Unterschrift</dt>
                <dd>
                  Auftragnehmer ✓ ·{' '}
                  {a.sigAuftraggeber
                    ? 'Auftraggeber ✓'
                    : 'Auftraggeber nicht vor Ort'}{' '}
                  · {a.sigDatum}
                </dd>
              </div>
            </dl>
            <label className="melden-bemerkung">
              <span>Bemerkung (optional)</span>
              <textarea
                placeholder="Noch etwas fürs Büro?"
                value={a.bemerkungen}
                onChange={(e) => set('bemerkungen', e.target.value)}
              />
            </label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <MeldenRahmen>
      <header className="melden-kopf">
        {schritt > 0 ? (
          <button
            type="button"
            className="melden-zurueck"
            onClick={zurueck}
            aria-label="Zurück"
          >
            ←
          </button>
        ) : (
          <span className="melden-zurueck-platz" />
        )}
        <div className="melden-progress">
          <div
            className="melden-progress-fill"
            style={{
              width: `${((schritt + 1) / schritte.length) * 100}%`,
            }}
          />
        </div>
        <span className="melden-schrittzahl">
          {schritt + 1}/{schritte.length}
        </span>
      </header>

      <div className="melden-inhalt">
        <h1 className="melden-frage">{aktuell.frage}</h1>
        {aktuell.hinweis && (
          <p className="melden-hinweis">{aktuell.hinweis}</p>
        )}
        {inhalt()}
        {schritt === 0 && (
          <p className="melden-tipp">
            💡 Tipp: Speichere diese Seite über das Browser-Menü auf deinem
            Startbildschirm — dann ist sie immer nur einen Tipp entfernt.
          </p>
        )}
      </div>

      <footer className="melden-fuss">
        {sendeFehler && (
          <div className="melden-fehler">{sendeFehler}</div>
        )}
        <button
          type="button"
          className="btn btn-primary melden-weiter"
          disabled={!aktuell.valid() || sende}
          onClick={weiter}
        >
          {sende ? (
            <Spinner />
          ) : istLetzter ? (
            'Bericht absenden'
          ) : (
            'Weiter'
          )}
        </button>
      </footer>
    </MeldenRahmen>
  )
}

function MeldenRahmen({ children }) {
  return (
    <div className="melden">
      <div className="melden-karte">{children}</div>
    </div>
  )
}
