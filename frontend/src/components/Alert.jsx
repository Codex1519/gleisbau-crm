import { IconAlert, IconInfo } from './Icons'

export function Alert({ typ = 'error', titel, kinder, children }) {
  const Icon = typ === 'info' ? IconInfo : IconAlert
  const inhalt = children ?? kinder
  return (
    <div className={`alert alert-${typ}`} role="alert">
      <Icon />
      <div>
        {titel && <div className="alert-title">{titel}</div>}
        <div className="alert-message">{inhalt}</div>
      </div>
    </div>
  )
}
