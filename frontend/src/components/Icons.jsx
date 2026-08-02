// Zentrales Register für alle Inline-SVG-Icons.
// Stroke übernimmt currentColor → Icons passen sich der Schriftfarbe an.

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, className = 'icon', viewBox = '0 0 20 20' }) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/* ---------- Sidebar-Modul-Icons ---------- */
export const IconBuilding = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M4 17V5h8v12M12 9h4v8M6 8h2M6 11h2M6 14h2M14 12h0.01M14 15h0.01" />
  </Svg>
)
export const IconUser = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="10" cy="7" r="3" />
    <path {...stroke} d="M4 17c0-3 3-5 6-5s6 2 6 5" />
  </Svg>
)
export const IconUsers = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="8" cy="7" r="2.5" />
    <circle {...stroke} cx="14" cy="8" r="2" />
    <path {...stroke} d="M3 16c0-2.5 2.5-4.5 5-4.5s5 2 5 4.5M13 16c0-2 1.5-3.5 3-3.5s2 1 2.5 2" />
  </Svg>
)
export const IconBriefcase = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M3 7h14v9H3zM7 7V5h6v2" />
    <path {...stroke} d="M3 11h14" />
  </Svg>
)
export const IconTruck = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M2 6h9v8H2zM11 9h4l2 3v2h-6z" />
    <circle {...stroke} cx="6" cy="15.5" r="1.3" />
    <circle {...stroke} cx="14.5" cy="15.5" r="1.3" />
  </Svg>
)
export const IconClock = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="10" cy="10" r="7" />
    <path {...stroke} d="M10 6v4l3 2" />
  </Svg>
)
export const IconDocument = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M5 3h7l3 3v11H5z M12 3v3h3" />
    <path {...stroke} d="M8 11h5M8 14h5" />
  </Svg>
)
export const IconBadge = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="10" cy="8" r="4" />
    <path {...stroke} d="m7 11-1 6 4-2 4 2-1-6" />
  </Svg>
)
export const IconPhone = (p) => (
  <Svg {...p}>
    <path
      {...stroke}
      d="M6 3 7.5 6 6 7.5c1 2.5 3 4.5 5.5 5.5L13 11.5 16 13v3c-7 0-13-6-13-13z"
    />
  </Svg>
)
export const IconHome = (p) => (
  <Svg {...p}>
    <path {...stroke} d="m3 9 7-6 7 6v8H3z M8 17v-5h4v5" />
  </Svg>
)

/* ---------- UI-Action-Icons ---------- */
export const IconPlus = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M10 4v12M4 10h12" strokeWidth="2" />
  </Svg>
)
export const IconTrash = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" />
  </Svg>
)
export const IconPencil = (p) => (
  <Svg {...p}>
    <path {...stroke} d="m13 3 4 4-9 9H4v-4l9-9Z M11 5l4 4" />
  </Svg>
)
export const IconSave = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M4 4h10l3 3v11H4zM6 4v5h7V4M6 18v-6h8v6" />
  </Svg>
)
export const IconX = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M5 5l10 10M15 5 5 15" strokeWidth="1.9" />
  </Svg>
)
export const IconPrint = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M6 8V3h8v5M6 14H4V8h12v6h-2M7 12h6v5H7z" />
  </Svg>
)
export const IconSonne = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="10" cy="10" r="3.5" />
    <path
      {...stroke}
      d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"
    />
  </Svg>
)
export const IconMond = (p) => (
  <Svg {...p}>
    <path
      {...stroke}
      d="M16.5 11.5A6.5 6.5 0 0 1 8.5 3.5a6.5 6.5 0 1 0 8 8Z"
    />
  </Svg>
)
export const IconZahnrad = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="10" cy="10" r="2.5" />
    <path
      {...stroke}
      d="M10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4"
    />
  </Svg>
)
export const IconUpload = (p) => (
  <Svg {...p}>
    <path
      {...stroke}
      d="M10 14V5m0 0L6.5 8.5M10 5l3.5 3.5M4 15h12"
    />
  </Svg>
)
export const IconRefresh = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M3 10a7 7 0 0 1 12-4.95M17 10a7 7 0 0 1-12 4.95M15 3v3h-3M5 17v-3h3" />
  </Svg>
)
export const IconArrowLeft = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M12 5 7 10l5 5M7 10h9" />
  </Svg>
)
export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path {...stroke} d="m8 5 5 5-5 5" />
  </Svg>
)
export const IconSearch = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="9" cy="9" r="5" />
    <path {...stroke} d="m13 13 4 4" />
  </Svg>
)
export const IconCheck = (p) => (
  <Svg {...p}>
    <path {...stroke} d="m4 10 4 4 8-8" strokeWidth="2" />
  </Svg>
)
export const IconAlert = (p) => (
  <Svg {...p}>
    <path {...stroke} d="M10 2 1.5 17h17L10 2Zm0 5v5m0 2.5v.5" />
  </Svg>
)
export const IconInfo = (p) => (
  <Svg {...p}>
    <circle {...stroke} cx="10" cy="10" r="8" />
    <path {...stroke} d="M10 9v5M10 6.5v.5" strokeWidth="1.8" />
  </Svg>
)
export const IconInbox = (p) => (
  <Svg {...p} viewBox="0 0 24 24" className="empty-state-icon">
    <path {...stroke} strokeWidth="1.5" d="M3 13h4l2 3h6l2-3h4M5 13l2-7h10l2 7v6H5v-6Z" />
  </Svg>
)

/* ---------- Wetter (eigener Stroke-Stil, ersetzt Emojis) ---------- */
const W = { viewBox: '0 0 24 24' }
const wolke = 'M6.5 15a3.5 3.5 0 0 1-.4-6.98A5.5 5.5 0 0 1 16.9 7.2 4 4 0 0 1 16 15H6.5Z'

export const WetterSonnig = (p) => (
  <Svg {...W} {...p}>
    <circle {...stroke} cx="12" cy="12" r="4" />
    <path
      {...stroke}
      d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"
    />
  </Svg>
)
export const WetterBewoelkt = (p) => (
  <Svg {...W} {...p}>
    <path
      {...stroke}
      d="M6.5 17a3.5 3.5 0 0 1-.4-6.98A5.5 5.5 0 0 1 16.9 9.2 4 4 0 0 1 16 17H6.5Z"
    />
  </Svg>
)
export const WetterLeichterRegen = (p) => (
  <Svg {...W} {...p}>
    <path {...stroke} d={wolke} />
    <path {...stroke} d="M9 18v1.5M13 18v1.5" />
  </Svg>
)
export const WetterStarkregen = (p) => (
  <Svg {...W} {...p}>
    <path {...stroke} d={wolke} />
    <path {...stroke} d="M8 17.5 7 21M12 17.5 11 21M16 17.5 15 21" />
  </Svg>
)
export const WetterFrost = (p) => (
  <Svg {...W} {...p}>
    <path
      {...stroke}
      d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M12 3l-2 2M12 3l2 2M12 21l-2-2M12 21l2-2"
    />
  </Svg>
)
export const WetterSchnee = (p) => (
  <Svg {...W} {...p}>
    <path {...stroke} d={wolke} />
    <path {...stroke} d="M8 18h.01M12 19.5h.01M16 18h.01" strokeWidth="2.4" />
  </Svg>
)
export const WetterSturm = (p) => (
  <Svg {...W} {...p}>
    <path
      {...stroke}
      d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h8a2 2 0 1 1-2 2"
    />
  </Svg>
)
export const WetterNebel = (p) => (
  <Svg {...W} {...p}>
    <path {...stroke} d="M6.5 13a3.5 3.5 0 0 1-.4-6.98A5.5 5.5 0 0 1 16.9 5.2 4 4 0 0 1 16 13H6.5Z" />
    <path {...stroke} d="M5 16.5h14M7 19.5h10" />
  </Svg>
)

// Wetter-Wert → Icon-Komponente
const WETTER_ICONS = {
  Sonnig: WetterSonnig,
  'Bewölkt': WetterBewoelkt,
  'Leichter Regen': WetterLeichterRegen,
  Starkregen: WetterStarkregen,
  Frost: WetterFrost,
  Schnee: WetterSchnee,
  Sturm: WetterSturm,
  Nebel: WetterNebel,
}
export function WetterSymbol({ wert, ...rest }) {
  const Icon = WETTER_ICONS[wert] || WetterBewoelkt
  return <Icon {...rest} />
}

/* ---------- Große Status-Icons (Melden-Sonderscreens) ---------- */
export const IconSchloss = (p) => (
  <Svg {...W} {...p}>
    <rect {...stroke} x="5" y="10" width="14" height="10" rx="2" />
    <path {...stroke} d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2.5" />
  </Svg>
)
export const IconOffline = (p) => (
  <Svg {...W} {...p}>
    <path
      {...stroke}
      d="M2.5 8.5a14 14 0 0 1 8-3.9M15.5 5.2a14 14 0 0 1 6 3.3M5.5 12a9.5 9.5 0 0 1 4.5-2.6M14.8 9.9a9.5 9.5 0 0 1 3.7 2.1M8.5 15.4A5 5 0 0 1 12 14a5 5 0 0 1 3.5 1.4M12 19h.01M3 3l18 18"
    />
  </Svg>
)
export const IconAusweis = (p) => (
  <Svg {...W} {...p}>
    <rect {...stroke} x="3" y="6" width="18" height="13" rx="2" />
    <circle {...stroke} cx="8.5" cy="11.5" r="1.8" />
    <path {...stroke} d="M5.8 16c.4-1.4 1.5-2.2 2.7-2.2s2.3.8 2.7 2.2M14 10.5h4M14 13.5h4" />
  </Svg>
)
export const IconBarriere = (p) => (
  <Svg {...W} {...p}>
    <path {...stroke} d="M3 9h18v4H3zM5 13v7M19 13v7M5 5v4M19 5v4" />
    <path {...stroke} d="m6 13 3-4M11 13l3-4M16 13l3-4" />
  </Svg>
)
export const IconCheckKreis = (p) => (
  <Svg {...W} {...p}>
    <circle {...stroke} cx="12" cy="12" r="9" />
    <path {...stroke} d="m8 12.5 2.7 2.7L16.5 9" strokeWidth="2" />
  </Svg>
)
export const IconHelm = (p) => (
  <Svg {...W} {...p}>
    <path
      {...stroke}
      d="M4 15a8 8 0 0 1 5-7.4V11M15 11V7.6A8 8 0 0 1 20 15M10 6.5a2 2 0 0 1 4 0V11h-4V6.5Z"
    />
    <path {...stroke} d="M2.5 17.5c0-1.4 1.1-2.5 2.5-2.5h14c1.4 0 2.5 1.1 2.5 2.5H2.5Z" />
  </Svg>
)

/* ---------- Modul→Icon-Mapping ---------- */
export function ModulIcon({ name, ...rest }) {
  switch (name) {
    case 'building':
      return <IconBuilding {...rest} />
    case 'user':
      return <IconUser {...rest} />
    case 'users':
      return <IconUsers {...rest} />
    case 'briefcase':
      return <IconBriefcase {...rest} />
    case 'truck':
      return <IconTruck {...rest} />
    case 'clock':
      return <IconClock {...rest} />
    case 'document':
      return <IconDocument {...rest} />
    case 'badge':
      return <IconBadge {...rest} />
    case 'phone':
      return <IconPhone {...rest} />
    default:
      return <IconBuilding {...rest} />
  }
}
