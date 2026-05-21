import { Link } from 'react-router-dom'
import { MODULE } from '../modules'
import { Breadcrumb } from '../components/Breadcrumb'
import { ModulIcon, IconChevronRight } from '../components/Icons'

export function Dashboard() {
  return (
    <div className="content">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="page-header">
        <div className="titel-block">
          <h1>Willkommen</h1>
          <div className="subtitel">
            Übersicht über alle Module des Gleisbau-CRM
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {MODULE.map((m) => (
          <Link key={m.key} to={`/${m.key}`} className="dashboard-card">
            <div className="dashboard-card-icon" aria-hidden="true">
              <ModulIcon name={m.icon} />
            </div>
            <div className="dashboard-card-body">
              <div className="dashboard-card-title">{m.label}</div>
              <div className="dashboard-card-text">
                {m.einzahl}-Verwaltung
              </div>
            </div>
            <div className="dashboard-card-footer">
              <span>Öffnen</span>
              <IconChevronRight />
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }

        .dashboard-card {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 18px 18px 0;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-xs);
          text-decoration: none;
          color: var(--text);
          min-height: 152px;
          transition: border-color 150ms ease, box-shadow 150ms ease,
            transform 150ms ease;
        }

        .dashboard-card:hover {
          border-color: var(--accent-soft-border);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .dashboard-card:focus-visible {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
        }

        .dashboard-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          background: var(--accent-soft);
          color: var(--accent);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid var(--accent-soft-border);
        }
        .dashboard-card-icon svg {
          width: 20px;
          height: 20px;
        }

        .dashboard-card-body {
          flex: 1;
          min-width: 0;
        }
        .dashboard-card-title {
          font-weight: 600;
          font-size: 15px;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .dashboard-card-text {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .dashboard-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
          padding: 10px 0;
          border-top: 1px solid var(--border);
          margin-top: auto;
        }
        .dashboard-card-footer svg {
          width: 14px;
          height: 14px;
          transition: transform 150ms ease;
        }

        .dashboard-card:hover .dashboard-card-footer {
          color: var(--accent);
        }
        .dashboard-card:hover .dashboard-card-footer svg {
          transform: translateX(3px);
        }
      `}</style>
    </div>
  )
}
