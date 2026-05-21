// Rendert ein einzelnes Formularfeld basierend auf seiner Config.
// Unterstützt: text, number, date, datetime-local, textarea, fk
//
// Bei fk-Feldern erwartet diese Komponente "fkOptionen" – ein Array
// { id, label }. Das Laden übernimmt der Aufrufer per Promise.all.

export function FormField({ feld, wert, onChange, fkOptionen, disabled }) {
  const id = `feld-${feld.name}`
  const wide = feld.type === 'textarea'

  return (
    <label className={`feld${wide ? ' feld-wide' : ''}`} htmlFor={id}>
      <span className="feld-label">
        {feld.label}
        {feld.required && (
          <span className="feld-required" aria-hidden="true">
            *
          </span>
        )}
      </span>

      {feld.type === 'textarea' ? (
        <textarea
          id={id}
          required={feld.required || undefined}
          disabled={disabled}
          value={wert ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : feld.type === 'enum' ? (
        <select
          id={id}
          required={feld.required || undefined}
          disabled={disabled}
          value={wert ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Bitte auswählen…
          </option>
          {feld.optionen?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : feld.type === 'fk' ? (
        <select
          id={id}
          required={feld.required || undefined}
          disabled={disabled || !fkOptionen || fkOptionen.length === 0}
          value={wert ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {!fkOptionen || fkOptionen.length === 0
              ? 'Keine Einträge verfügbar'
              : 'Bitte auswählen…'}
          </option>
          {fkOptionen?.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={feld.type}
          required={feld.required || undefined}
          disabled={disabled}
          value={wert ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  )
}

// Bereitet das Form-Objekt für den POST/PUT auf.
//
// Regeln gegen 422-Fehler von Pydantic:
//  - Leere String-/Textarea-/FK-/Number-Felder werden komplett aus dem
//    Payload ENTFERNT. Pydantic sieht das Feld dann als "nicht gesetzt"
//    und nimmt seinen Default. Das verhindert "Input should be a valid
//    string, input is null" bei optionalen str-Feldern.
//  - Datums- und Datetime-Felder behalten beim Leersein den Wert null.
//    Pydantic akzeptiert das für `date | None` / `datetime | None`.
//  - Gefüllte Number/FK-Werte werden zu Number() konvertiert.
//  - Pflichtfelder werden vom Browser über das `required`-Attribut
//    abgefangen, bevor abgesendet wird.
export function bereiteFormDatenAuf(modul, form) {
  const out = {}
  for (const f of modul.felder) {
    const v = form[f.name]
    const istLeer = v === '' || v == null

    if (istLeer) {
      // Datumsfelder dürfen null bleiben; alles andere wird ausgelassen.
      if (f.type === 'date' || f.type === 'datetime-local') {
        out[f.name] = null
      }
      // sonst: Feld wird nicht in den Payload aufgenommen
      continue
    }

    if (f.type === 'number' || f.type === 'fk') {
      out[f.name] = Number(v)
    } else {
      // text / textarea / date / datetime-local / enum: String beibehalten
      out[f.name] = v
    }
  }
  return out
}

export function leererForm(modul) {
  const obj = {}
  for (const f of modul.felder) obj[f.name] = ''
  return obj
}

// Konvertiert eine geladene Entity zurück in ein Form-Objekt (Strings, kein null).
// Wird beim Start des Edit-Modus genutzt, damit die Inputs gültige Werte haben.
export function entityZuForm(modul, entity) {
  const form = {}
  for (const f of modul.felder) {
    let v = entity?.[f.name]
    if (v == null) {
      form[f.name] = ''
      continue
    }
    if (f.type === 'datetime-local' && typeof v === 'string') {
      // Backend liefert "2025-05-20T08:30:00", Input braucht "2025-05-20T08:30"
      form[f.name] = v.slice(0, 16)
    } else {
      form[f.name] = String(v)
    }
  }
  return form
}

// Wert lesbar formatieren. fkLabels: { [moduleKey]: Map(id -> string) }
export function formatiereWert(feld, wert, fkLabels) {
  if (wert === null || wert === undefined || wert === '') return null

  if (feld.type === 'fk') {
    const map = fkLabels?.[feld.fk.module]
    const label = map?.get(Number(wert))
    return label || `#${wert}`
  }

  if (feld.type === 'datetime-local' && typeof wert === 'string') {
    return wert.slice(0, 16).replace('T', ' ')
  }

  if (feld.type === 'number') {
    return String(wert)
  }

  return String(wert)
}
