import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchData } from '../contexts/SearchContext'
import { PROJEKT_STATUS } from '../modules'
import { StatusBadge } from './StatusBadge'
import { IconSearch, IconX } from './Icons'

const MIN_ZEICHEN = 2
const MAX_PRO_KATEGORIE = 5

// Plattformabhängiges Kürzel-Label: ⌘K auf Apple-Geräten, sonst Strg+K.
// (Der Handler akzeptiert ohnehin beide Tasten — nur die Anzeige variiert.)
const IST_APPLE = /Mac|iPhone|iPad|iPod/.test(
  navigator.userAgentData?.platform ?? navigator.platform ?? ''
)
const KUERZEL_LABEL = IST_APPLE ? '⌘K' : 'Strg+K'

// Hebt das erste Vorkommen von `query` in `text` fett hervor.
function Highlight({ text, query }) {
  const t = String(text ?? '')
  if (!query) return t
  const idx = t.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return t
  return (
    <>
      {t.slice(0, idx)}
      <strong>{t.slice(idx, idx + query.length)}</strong>
      {t.slice(idx + query.length)}
    </>
  )
}

function nameVollstaendig(p) {
  return [p.vorname, p.nachname].filter(Boolean).join(' ').trim()
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const { daten, fehler } = useSearchData()

  const [query, setQuery] = useState('')
  const [offen, setOffen] = useState(false)
  const [aktivIndex, setAktivIndex] = useState(0)
  const [mobilOffen, setMobilOffen] = useState(false)

  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Cmd/Ctrl+K fokussiert das Suchfeld
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMobilOffen(true)
        // nach dem Rendern fokussieren
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Klick außerhalb schließt das Dropdown
  useEffect(() => {
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOffen(false)
        setMobilOffen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const q = query.trim()
  const aktiv = q.length >= MIN_ZEICHEN

  // Gruppierte Ergebnisse + flache Liste für die Tastaturnavigation
  const { gruppen, flach } = useMemo(() => {
    if (!aktiv) return { gruppen: [], flach: [] }
    const ql = q.toLowerCase()
    const match = (val) => val != null && String(val).toLowerCase().includes(ql)

    const kunden = daten.kunden
      .filter((k) => match(k.name) || match(k.ort) || match(k.email))
      .slice(0, MAX_PRO_KATEGORIE)
      .map((k) => ({
        modul: 'kunden',
        id: k.id,
        to: `/kunden/${k.id}`,
        primaer: k.name || `Kunde #${k.id}`,
        sekundaer: k.ort || '',
      }))

    const personal = daten.personal
      .filter(
        (p) => match(p.vorname) || match(p.nachname) || match(p.position)
      )
      .slice(0, MAX_PRO_KATEGORIE)
      .map((p) => ({
        modul: 'personal',
        id: p.id,
        to: `/personal/${p.id}`,
        primaer: nameVollstaendig(p) || `Personal #${p.id}`,
        sekundaer: p.position || '',
      }))

    const projekte = daten.projekte
      .filter((p) => match(p.name) || match(p.beschreibung))
      .slice(0, MAX_PRO_KATEGORIE)
      .map((p) => ({
        modul: 'projekte',
        id: p.id,
        to: `/projekte/${p.id}`,
        primaer: p.name || `Projekt #${p.id}`,
        sekundaer: '',
        status: p.status,
      }))

    const maschinen = daten.maschinen
      .filter((m) => match(m.typ) || match(m.kennzeichen))
      .slice(0, MAX_PRO_KATEGORIE)
      .map((m) => ({
        modul: 'maschinen',
        id: m.id,
        to: `/maschinen/${m.id}`,
        primaer: m.kennzeichen || m.typ || `Maschine #${m.id}`,
        sekundaer: m.typ || '',
      }))

    const gruppen = [
      { titel: 'Kunden', items: kunden },
      { titel: 'Personal', items: personal },
      { titel: 'Projekte', items: projekte },
      { titel: 'Maschinen', items: maschinen },
    ].filter((g) => g.items.length > 0)

    const flach = gruppen.flatMap((g) => g.items)
    return { gruppen, flach }
  }, [aktiv, q, daten])

  // aktiven Index zurücksetzen wenn sich die Treffer ändern
  useEffect(() => {
    setAktivIndex(0)
  }, [q])

  // Dropdown öffnen sobald genug Zeichen eingegeben sind
  useEffect(() => {
    setOffen(aktiv)
  }, [aktiv])

  function gehe(to) {
    setOffen(false)
    setMobilOffen(false)
    setQuery('')
    navigate(to)
  }

  function onKeyDown(e) {
    if (!offen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAktivIndex((i) => Math.min(i + 1, Math.max(flach.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAktivIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const treffer = flach[aktivIndex]
      if (treffer) gehe(treffer.to)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOffen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div
      className={`global-search${mobilOffen ? ' mobil-offen' : ''}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="gs-mobil-toggle"
        aria-label="Suche öffnen"
        onClick={() => {
          setMobilOffen(true)
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      >
        <IconSearch />
      </button>

      <div className="gs-feld">
        <IconSearch className="icon gs-icon" />
        <input
          ref={inputRef}
          type="text"
          className="gs-input"
          placeholder="Suchen… (Kunden, Personal, Projekte, Maschinen)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => aktiv && setOffen(true)}
          onKeyDown={onKeyDown}
          aria-label="Globale Suche"
          aria-expanded={offen}
          role="combobox"
          aria-controls="gs-dropdown"
        />
        <kbd className="gs-kbd" aria-hidden="true">
          {KUERZEL_LABEL}
        </kbd>
        {(query || mobilOffen) && (
          <button
            type="button"
            className="gs-clear"
            aria-label="Suche schließen"
            onClick={() => {
              setQuery('')
              setOffen(false)
              setMobilOffen(false)
            }}
          >
            <IconX />
          </button>
        )}
      </div>

      {offen && (
        <div className="gs-dropdown" id="gs-dropdown" role="listbox">
          {fehler ? (
            <div className="gs-meldung gs-fehler">
              Daten konnten nicht geladen werden
            </div>
          ) : flach.length === 0 ? (
            <div className="gs-meldung">
              Keine Ergebnisse für „{q}"
            </div>
          ) : (
            gruppen.map((gruppe) => (
              <div className="gs-gruppe" key={gruppe.titel}>
                <div className="gs-gruppe-titel">{gruppe.titel}</div>
                {gruppe.items.map((item) => {
                  const idx = flach.indexOf(item)
                  return (
                    <button
                      type="button"
                      key={`${item.modul}-${item.id}`}
                      role="option"
                      aria-selected={idx === aktivIndex}
                      className={`gs-item${
                        idx === aktivIndex ? ' aktiv' : ''
                      }`}
                      onMouseEnter={() => setAktivIndex(idx)}
                      onClick={() => gehe(item.to)}
                    >
                      <span className="gs-item-primaer">
                        <Highlight text={item.primaer} query={q} />
                      </span>
                      {item.modul === 'projekte' && item.status ? (
                        <StatusBadge
                          optionen={PROJEKT_STATUS}
                          value={item.status}
                        />
                      ) : item.sekundaer ? (
                        <span className="gs-item-sekundaer">
                          <Highlight text={item.sekundaer} query={q} />
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
