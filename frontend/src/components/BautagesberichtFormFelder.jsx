import { Sektion } from './Sektion'
import { findModul } from '../modules'
import { WETTER_OPTIONEN, fortschrittFarbe } from '../lib/bautagesbericht'

// Geteilte Formular-Sektionen für Bautagesberichte (Neu + Edit).
// form: State-Objekt, set(feld, wert): Setter, personal/projekte: Optionslisten.
export function BautagesberichtFormFelder({
  form,
  set,
  personal,
  projekte,
  speichere,
  lockProjekt = false,
}) {
  const personalModul = findModul('personal')
  const projekteModul = findModul('projekte')
  const keinPersonal = personal.length === 0
  const keineProjekte = projekte.length === 0
  const fortschritt = Number(form.baufortschritt) || 0

  return (
    <>
      <Sektion titel="Grunddaten">
        <div className="felder" style={{ marginBottom: 0 }}>
          <label className="feld">
            <span className="feld-label">
              Datum<span className="feld-required">*</span>
            </span>
            <input
              type="date"
              required
              value={form.datum}
              disabled={speichere}
              onChange={(e) => set('datum', e.target.value)}
            />
          </label>

          <label className="feld">
            <span className="feld-label">
              Projekt<span className="feld-required">*</span>
            </span>
            <select
              required
              value={form.projekt_id}
              disabled={lockProjekt || keineProjekte || speichere}
              onChange={(e) => set('projekt_id', e.target.value)}
            >
              <option value="" disabled>
                {keineProjekte ? 'Keine Projekte vorhanden' : 'Bitte auswählen…'}
              </option>
              {projekte.map((p) => (
                <option key={p.id} value={p.id}>
                  {projekteModul.displayName(p)}
                </option>
              ))}
            </select>
          </label>

          <label className="feld">
            <span className="feld-label">
              Ersteller<span className="feld-required">*</span>
            </span>
            <select
              required
              value={form.ersteller_id}
              disabled={keinPersonal || speichere}
              onChange={(e) => set('ersteller_id', e.target.value)}
            >
              <option value="" disabled>
                {keinPersonal ? 'Keine Mitarbeiter vorhanden' : 'Bitte auswählen…'}
              </option>
              {personal.map((p) => (
                <option key={p.id} value={p.id}>
                  {personalModul.displayName(p)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Sektion>

      <Sektion titel="Wetter & Bedingungen">
        <div className="felder" style={{ marginBottom: 0 }}>
          <label className="feld">
            <span className="feld-label">Wetter</span>
            <select
              value={form.wetter}
              disabled={speichere}
              onChange={(e) => set('wetter', e.target.value)}
            >
              <option value="">— keine Angabe —</option>
              {WETTER_OPTIONEN.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.icon} {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="feld">
            <span className="feld-label">Temperatur (°C)</span>
            <input
              type="number"
              step="1"
              placeholder="z. B. 18"
              value={form.temperatur}
              disabled={speichere}
              onChange={(e) => set('temperatur', e.target.value)}
            />
          </label>
        </div>
      </Sektion>

      <Sektion titel="Baustellenaktivität">
        <div className="felder" style={{ marginBottom: 0 }}>
          <label className="feld feld-wide">
            <span className="feld-label">Durchgeführte Arbeiten</span>
            <textarea
              rows={5}
              placeholder="Was wurde heute gemacht?"
              value={form.arbeiten_durchgefuehrt}
              disabled={speichere}
              onChange={(e) => set('arbeiten_durchgefuehrt', e.target.value)}
            />
          </label>
          <label className="feld">
            <span className="feld-label">Anwesendes Personal</span>
            <textarea
              placeholder="Welche Mitarbeiter waren vor Ort?"
              value={form.personal_anwesend}
              disabled={speichere}
              onChange={(e) => set('personal_anwesend', e.target.value)}
            />
          </label>
          <label className="feld">
            <span className="feld-label">Eingesetzte Maschinen</span>
            <textarea
              placeholder="Welche Maschinen wurden genutzt?"
              value={form.maschinen_eingesetzt}
              disabled={speichere}
              onChange={(e) => set('maschinen_eingesetzt', e.target.value)}
            />
          </label>
          <label className="feld feld-wide">
            <span className="feld-label">Materiallieferungen</span>
            <textarea
              placeholder="Was wurde geliefert?"
              value={form.materiallieferungen}
              disabled={speichere}
              onChange={(e) => set('materiallieferungen', e.target.value)}
            />
          </label>
        </div>
      </Sektion>

      <Sektion titel="Besonderheiten">
        <div className="felder" style={{ marginBottom: 0 }}>
          <label className="feld feld-wide">
            <span className="feld-label">Behinderungen / Störungen</span>
            <textarea
              placeholder="Verzögerungen, Probleme, Ausfälle…"
              value={form.behinderungen}
              disabled={speichere}
              onChange={(e) => set('behinderungen', e.target.value)}
            />
          </label>
          <label className="feld feld-wide">
            <span className="feld-label">Besondere Vorkommnisse</span>
            <textarea
              placeholder="Unfälle, Mängel, wichtige Ereignisse…"
              value={form.besondere_vorkommnisse}
              disabled={speichere}
              onChange={(e) => set('besondere_vorkommnisse', e.target.value)}
            />
          </label>
        </div>
      </Sektion>

      <Sektion titel="Fortschritt & Notizen">
        <div className="feld" style={{ marginBottom: 16 }}>
          <span className="feld-label">
            Baufortschritt: <strong>{fortschritt}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={fortschritt}
            disabled={speichere}
            onChange={(e) => set('baufortschritt', e.target.value)}
            className="fortschritt-slider"
          />
          <div className="fortschritt-balken" aria-hidden="true">
            <div
              className={`fortschritt-fill farbe-${fortschrittFarbe(
                fortschritt
              )}`}
              style={{ width: `${fortschritt}%` }}
            />
          </div>
        </div>

        <label className="feld feld-wide" style={{ marginBottom: 0 }}>
          <span className="feld-label">Bemerkungen</span>
          <textarea
            placeholder="Sonstige Notizen…"
            value={form.bemerkungen}
            disabled={speichere}
            onChange={(e) => set('bemerkungen', e.target.value)}
          />
        </label>
      </Sektion>
    </>
  )
}

// Baut den bereinigten POST/PUT-Payload aus dem Form-State.
export function bautagesberichtPayload(form) {
  const payload = {
    projekt_id: Number(form.projekt_id),
    ersteller_id: Number(form.ersteller_id),
    datum: form.datum,
  }
  const textFelder = [
    'wetter',
    'arbeiten_durchgefuehrt',
    'personal_anwesend',
    'maschinen_eingesetzt',
    'materiallieferungen',
    'behinderungen',
    'besondere_vorkommnisse',
    'bemerkungen',
  ]
  for (const f of textFelder) {
    payload[f] = form[f] && form[f].trim() ? form[f] : null
  }
  payload.temperatur =
    form.temperatur !== '' && form.temperatur != null
      ? Number(form.temperatur)
      : null
  payload.baufortschritt = Number(form.baufortschritt) || 0
  return payload
}

// Wandelt eine geladene Entity in den Form-State (Strings, kein null).
export function berichtZuForm(bericht) {
  const s = (v) => (v == null ? '' : String(v))
  return {
    projekt_id: s(bericht.projekt_id),
    ersteller_id: s(bericht.ersteller_id ?? bericht.personal_id),
    datum: bericht.datum ? String(bericht.datum).slice(0, 10) : '',
    wetter: s(bericht.wetter),
    temperatur: s(bericht.temperatur),
    arbeiten_durchgefuehrt: s(bericht.arbeiten_durchgefuehrt),
    personal_anwesend: s(bericht.personal_anwesend),
    maschinen_eingesetzt: s(bericht.maschinen_eingesetzt),
    materiallieferungen: s(bericht.materiallieferungen),
    behinderungen: s(bericht.behinderungen),
    besondere_vorkommnisse: s(bericht.besondere_vorkommnisse),
    baufortschritt: s(bericht.baufortschritt ?? 0),
    bemerkungen: s(bericht.bemerkungen),
  }
}
