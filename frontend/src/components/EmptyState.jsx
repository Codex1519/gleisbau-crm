import { IconInbox } from './Icons'

export function EmptyState({
  titel = 'Noch keine Einträge',
  text,
  icon,
  aktionen,
}) {
  return (
    <div className="empty-state">
      {icon || <IconInbox />}
      <div className="empty-state-title">{titel}</div>
      {text && <div className="empty-state-text">{text}</div>}
      {aktionen && <div className="empty-state-actions">{aktionen}</div>}
    </div>
  )
}
