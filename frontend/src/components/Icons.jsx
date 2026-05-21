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
