// Konfiguration aller Module für Liste, Formular und Detail-Anzeige
//
// felder[].type:  'text' | 'number' | 'date' | 'datetime-local' | 'textarea'
//                 | 'fk' | 'enum'
// felder[].fk:    { module: 'kunden', display: 'name' }  (nur bei type 'fk')
// felder[].optionen: [{ value, label, farbe? }]          (nur bei type 'enum')
//
// listSpalten:   Welche Felder in der Listenansicht erscheinen
// searchKeys:    Welche Felder bei der Suche durchsucht werden
// sektionen:     Gruppierung der Felder für die Detail-Ansicht
// displayName:   Wie ein Eintrag in Listen/Breadcrumbs erscheint

// Status-Werte für Projekte (auch vom Kanban-Board genutzt).
export const PROJEKT_STATUS = [
  { value: 'Anfrage', label: 'Anfrage', farbe: 'grau' },
  { value: 'In Planung', label: 'In Planung', farbe: 'blau' },
  { value: 'In Ausführung', label: 'In Ausführung', farbe: 'gelb' },
  { value: 'Abgeschlossen', label: 'Abgeschlossen', farbe: 'gruen' },
]

export const MODULE = [
  {
    key: 'kunden',
    label: 'Kunden',
    einzahl: 'Kunde',
    pfad: 'kunden',
    icon: 'building',
    displayName: (e) => e.name || `Kunde #${e.id}`,
    felder: [
      { name: 'name', label: 'Firmenname', type: 'text', required: true },
      { name: 'strasse', label: 'Straße', type: 'text' },
      { name: 'hausnummer', label: 'Hausnr.', type: 'text' },
      { name: 'plz', label: 'PLZ', type: 'text' },
      { name: 'ort', label: 'Ort', type: 'text' },
      { name: 'telefon', label: 'Telefon', type: 'text' },
      { name: 'email', label: 'E-Mail', type: 'text' },
    ],
    listSpalten: ['name', 'ort', 'telefon', 'email'],
    searchKeys: ['name', 'ort', 'plz', 'email', 'telefon'],
    sektionen: [
      { titel: 'Stammdaten', felder: ['name'] },
      { titel: 'Anschrift', felder: ['strasse', 'hausnummer', 'plz', 'ort'] },
      { titel: 'Kontakt', felder: ['telefon', 'email'] },
    ],
  },

  {
    key: 'ansprechpartner',
    label: 'Ansprechpartner',
    einzahl: 'Ansprechpartner',
    pfad: 'ansprechpartner',
    icon: 'user',
    displayName: (e) =>
      [e.vorname, e.nachname].filter(Boolean).join(' ') ||
      `Ansprechpartner #${e.id}`,
    felder: [
      {
        name: 'kunden_id',
        label: 'Kunde',
        type: 'fk',
        fk: { module: 'kunden', display: 'name' },
        required: true,
      },
      { name: 'nachname', label: 'Nachname', type: 'text', required: true },
      { name: 'vorname', label: 'Vorname', type: 'text' },
      { name: 'position', label: 'Position', type: 'text' },
      { name: 'telefon', label: 'Telefon', type: 'text' },
      { name: 'email', label: 'E-Mail', type: 'text' },
    ],
    listSpalten: ['kunden_id', 'nachname', 'vorname', 'position', 'telefon'],
    searchKeys: ['nachname', 'vorname', 'email', 'position'],
    sektionen: [
      { titel: 'Person', felder: ['nachname', 'vorname', 'position'] },
      { titel: 'Zuordnung', felder: ['kunden_id'] },
      { titel: 'Kontakt', felder: ['telefon', 'email'] },
    ],
  },

  {
    key: 'personal',
    label: 'Personal',
    einzahl: 'Mitarbeiter',
    pfad: 'personal',
    icon: 'users',
    displayName: (e) =>
      [e.vorname, e.nachname].filter(Boolean).join(' ') || `Personal #${e.id}`,
    felder: [
      { name: 'nachname', label: 'Nachname', type: 'text', required: true },
      { name: 'vorname', label: 'Vorname', type: 'text', required: true },
      { name: 'geburtsdatum', label: 'Geburtsdatum', type: 'date' },
      { name: 'position', label: 'Position', type: 'text' },
      { name: 'einstellungsdatum', label: 'Einstellung', type: 'date' },
      { name: 'crm_rolle', label: 'CRM-Rolle', type: 'text' },
      { name: 'strasse', label: 'Straße', type: 'text' },
      { name: 'hausnummer', label: 'Hausnr.', type: 'text' },
      { name: 'plz', label: 'PLZ', type: 'text' },
      { name: 'ort', label: 'Ort', type: 'text' },
      { name: 'telefon', label: 'Telefon', type: 'text' },
      { name: 'kranktage', label: 'Kranktage', type: 'number' },
      { name: 'urlaubstage', label: 'Urlaubstage', type: 'number' },
    ],
    listSpalten: ['nachname', 'vorname', 'position', 'telefon'],
    searchKeys: ['nachname', 'vorname', 'position', 'ort'],
    sektionen: [
      {
        titel: 'Stammdaten',
        felder: ['nachname', 'vorname', 'geburtsdatum'],
      },
      {
        titel: 'Anstellung',
        felder: ['position', 'einstellungsdatum', 'crm_rolle'],
      },
      {
        titel: 'Anschrift',
        felder: ['strasse', 'hausnummer', 'plz', 'ort', 'telefon'],
      },
      { titel: 'Abwesenheit', felder: ['kranktage', 'urlaubstage'] },
    ],
  },

  {
    key: 'projekte',
    label: 'Projekte',
    einzahl: 'Projekt',
    pfad: 'projekte',
    icon: 'briefcase',
    displayName: (e) => e.name || e.auftragsnummer || `Projekt #${e.id}`,
    felder: [
      { name: 'name', label: 'Projektname', type: 'text', required: true },
      {
        name: 'kunden_id',
        label: 'Kunde',
        type: 'fk',
        fk: { module: 'kunden', display: 'name' },
        required: true,
      },
      { name: 'auftragsnummer', label: 'Auftragsnummer', type: 'text' },
      { name: 'beschreibung', label: 'Beschreibung', type: 'textarea' },
      {
        name: 'status',
        label: 'Status',
        type: 'enum',
        optionen: PROJEKT_STATUS,
        required: true,
      },
      { name: 'start_datum', label: 'Start', type: 'date' },
      { name: 'end_datum', label: 'Ende', type: 'date' },
      { name: 'budget_geplant', label: 'Budget geplant (€)', type: 'number' },
      {
        name: 'budget_tatsaechlich',
        label: 'Budget tatsächlich (€)',
        type: 'number',
      },
    ],
    listSpalten: ['name', 'kunden_id', 'status', 'start_datum'],
    searchKeys: ['name', 'auftragsnummer', 'status', 'beschreibung'],
    sektionen: [
      {
        titel: 'Projekt',
        felder: ['name', 'auftragsnummer', 'status', 'beschreibung'],
      },
      { titel: 'Auftraggeber', felder: ['kunden_id'] },
      { titel: 'Zeitraum', felder: ['start_datum', 'end_datum'] },
      {
        titel: 'Budget',
        felder: ['budget_geplant', 'budget_tatsaechlich'],
      },
    ],
  },

  {
    key: 'maschinen',
    label: 'Maschinen',
    einzahl: 'Maschine',
    pfad: 'maschinen',
    icon: 'truck',
    displayName: (e) => e.kennzeichen || e.typ || `Maschine #${e.id}`,
    felder: [
      { name: 'typ', label: 'Typ', type: 'text', required: true },
      { name: 'kennzeichen', label: 'Kennzeichen', type: 'text' },
      { name: 'baujahr', label: 'Baujahr', type: 'number' },
      { name: 'status', label: 'Status', type: 'text' },
      { name: 'tuev_datum', label: 'TÜV bis', type: 'date' },
      {
        name: 'naechste_wartung',
        label: 'Nächste Wartung',
        type: 'date',
      },
    ],
    listSpalten: ['kennzeichen', 'typ', 'status', 'tuev_datum'],
    searchKeys: ['typ', 'kennzeichen', 'status'],
    sektionen: [
      {
        titel: 'Maschine',
        felder: ['typ', 'kennzeichen', 'baujahr', 'status'],
      },
      { titel: 'Wartung', felder: ['tuev_datum', 'naechste_wartung'] },
    ],
  },

  {
    key: 'zeiterfassungen',
    label: 'Zeiterfassungen',
    einzahl: 'Zeiterfassung',
    pfad: 'zeiterfassungen',
    icon: 'clock',
    displayName: (e) =>
      `Zeiterfassung #${e.id}${
        e.start_zeit ? ' · ' + String(e.start_zeit).slice(0, 10) : ''
      }`,
    felder: [
      {
        name: 'personal_id',
        label: 'Personal',
        type: 'fk',
        fk: { module: 'personal' },
        required: true,
      },
      {
        name: 'projekt_id',
        label: 'Projekt',
        type: 'fk',
        fk: { module: 'projekte', display: 'name' },
        required: true,
      },
      {
        name: 'start_zeit',
        label: 'Start',
        type: 'datetime-local',
        required: true,
      },
      {
        name: 'end_zeit',
        label: 'Ende',
        type: 'datetime-local',
        required: true,
      },
      { name: 'pause_minuten', label: 'Pause (Min.)', type: 'number' },
    ],
    listSpalten: [
      'personal_id',
      'projekt_id',
      'start_zeit',
      'end_zeit',
      'pause_minuten',
    ],
    searchKeys: [],
    sektionen: [
      { titel: 'Zuordnung', felder: ['personal_id', 'projekt_id'] },
      {
        titel: 'Zeitraum',
        felder: ['start_zeit', 'end_zeit', 'pause_minuten'],
      },
    ],
  },

  {
    key: 'bautagesberichte',
    label: 'Bautagesberichte',
    einzahl: 'Bautagesbericht',
    pfad: 'bautagesberichte',
    icon: 'document',
    displayName: (e) =>
      `Bericht ${e.datum || `#${e.id}`}`,
    // Liste / Formular / Detail werden von Custom-Komponenten gerendert
    // (BautagesberichteListe, BautagesberichtNeu, BautagesberichtDetail).
    // Diese Config dient v. a. Sidebar, displayName und FK-Auflösung.
    felder: [
      {
        name: 'projekt_id',
        label: 'Projekt',
        type: 'fk',
        fk: { module: 'projekte', display: 'name' },
        required: true,
      },
      {
        name: 'ersteller_id',
        label: 'Ersteller',
        type: 'fk',
        fk: { module: 'personal' },
        required: true,
      },
      { name: 'datum', label: 'Datum', type: 'date', required: true },
      { name: 'wetter', label: 'Wetter', type: 'text' },
      { name: 'arbeiten_durchgefuehrt', label: 'Durchgeführte Arbeiten', type: 'textarea' },
    ],
    listSpalten: ['datum', 'projekt_id', 'ersteller_id', 'wetter'],
    searchKeys: ['arbeiten_durchgefuehrt', 'wetter', 'bemerkungen'],
    sektionen: [
      { titel: 'Zuordnung', felder: ['projekt_id', 'ersteller_id'] },
      { titel: 'Bericht', felder: ['datum', 'wetter', 'arbeiten_durchgefuehrt'] },
    ],
  },

  {
    key: 'qualifikationen',
    label: 'Qualifikationen',
    einzahl: 'Qualifikation',
    pfad: 'qualifikationen',
    icon: 'badge',
    displayName: (e) => e.bezeichnung || `Qualifikation #${e.id}`,
    felder: [
      {
        name: 'personal_id',
        label: 'Personal',
        type: 'fk',
        fk: { module: 'personal' },
        required: true,
      },
      {
        name: 'bezeichnung',
        label: 'Bezeichnung',
        type: 'text',
        required: true,
      },
      { name: 'gueltig_bis', label: 'Gültig bis', type: 'date' },
    ],
    listSpalten: ['bezeichnung', 'personal_id', 'gueltig_bis'],
    searchKeys: ['bezeichnung'],
    sektionen: [
      {
        titel: 'Qualifikation',
        felder: ['bezeichnung', 'gueltig_bis'],
      },
      { titel: 'Zuordnung', felder: ['personal_id'] },
    ],
  },

  {
    key: 'notfallkontakte',
    label: 'Notfallkontakte',
    einzahl: 'Notfallkontakt',
    pfad: 'notfallkontakte',
    icon: 'phone',
    displayName: (e) =>
      [e.vorname, e.nachname].filter(Boolean).join(' ') ||
      `Notfallkontakt #${e.id}`,
    felder: [
      {
        name: 'personal_id',
        label: 'Personal',
        type: 'fk',
        fk: { module: 'personal' },
        required: true,
      },
      { name: 'nachname', label: 'Nachname', type: 'text', required: true },
      { name: 'vorname', label: 'Vorname', type: 'text', required: true },
      { name: 'telefon', label: 'Telefon', type: 'text', required: true },
      { name: 'beziehung', label: 'Beziehung', type: 'text' },
    ],
    listSpalten: [
      'nachname',
      'vorname',
      'telefon',
      'beziehung',
      'personal_id',
    ],
    searchKeys: ['nachname', 'vorname', 'telefon'],
    sektionen: [
      {
        titel: 'Kontakt',
        felder: ['nachname', 'vorname', 'telefon', 'beziehung'],
      },
      { titel: 'Zuordnung', felder: ['personal_id'] },
    ],
  },

  {
    key: 'dokumente',
    label: 'Dokumente',
    einzahl: 'Dokument',
    pfad: 'dokumente',
    icon: 'document',
    displayName: (e) =>
      `${e.typ || 'Dokument'} #${e.id}`,
    felder: [
      {
        name: 'projekt_id',
        label: 'Projekt',
        type: 'fk',
        fk: { module: 'projekte', display: 'name' },
        required: true,
      },
      { name: 'typ', label: 'Typ', type: 'text', required: true },
      { name: 'betrag', label: 'Betrag (€)', type: 'number' },
      { name: 'status', label: 'Status', type: 'text' },
      {
        name: 'ausstellungsdatum',
        label: 'Ausgestellt am',
        type: 'date',
      },
      {
        name: 'faelligkeitsdatum',
        label: 'Fällig am',
        type: 'date',
      },
    ],
    listSpalten: ['typ', 'projekt_id', 'betrag', 'status', 'faelligkeitsdatum'],
    searchKeys: ['typ', 'status'],
    sektionen: [
      {
        titel: 'Dokument',
        felder: ['typ', 'status', 'betrag'],
      },
      {
        titel: 'Termine',
        felder: ['ausstellungsdatum', 'faelligkeitsdatum'],
      },
      { titel: 'Zuordnung', felder: ['projekt_id'] },
    ],
  },
]

export function findModul(key) {
  return MODULE.find((m) => m.key === key)
}

export function findFeld(modul, name) {
  return modul.felder.find((f) => f.name === name)
}
