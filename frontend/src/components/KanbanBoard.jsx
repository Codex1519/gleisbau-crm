import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core'
import { PROJEKT_STATUS } from '../modules'

// Optimistisches Kanban-Board für Projekte.
// onStatusChange wird beim Drop in eine andere Spalte aufgerufen
// (Aufrufer kümmert sich um PUT + Fehler-Rollback).
export function KanbanBoard({ projekte, kundenMap, onStatusChange }) {
  const [aktivId, setAktivId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  const projekteNachStatus = useMemo(() => {
    const buckets = new Map(PROJEKT_STATUS.map((s) => [s.value, []]))
    for (const p of projekte) {
      const status = PROJEKT_STATUS.some((s) => s.value === p.status)
        ? p.status
        : PROJEKT_STATUS[0].value
      buckets.get(status).push(p)
    }
    return buckets
  }, [projekte])

  const aktivesProjekt = useMemo(
    () => projekte.find((p) => p.id === aktivId) || null,
    [aktivId, projekte]
  )

  function handleDragEnd(event) {
    setAktivId(null)
    const { active, over } = event
    if (!over) return
    const projektId = active.id
    const neuerStatus = over.id
    const projekt = projekte.find((p) => p.id === projektId)
    if (!projekt) return
    if (projekt.status === neuerStatus) return
    if (!PROJEKT_STATUS.some((s) => s.value === neuerStatus)) return
    onStatusChange(projekt, neuerStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setAktivId(e.active.id)}
      onDragCancel={() => setAktivId(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {PROJEKT_STATUS.map((spalte) => (
          <KanbanSpalte
            key={spalte.value}
            spalte={spalte}
            projekte={projekteNachStatus.get(spalte.value)}
            kundenMap={kundenMap}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {aktivesProjekt ? (
          <KanbanKarte
            projekt={aktivesProjekt}
            kundenMap={kundenMap}
            overlay
          />
        ) : null}
      </DragOverlay>

      <KanbanStyles />
    </DndContext>
  )
}

/* ============================================================ */

function KanbanSpalte({ spalte, projekte, kundenMap }) {
  const { setNodeRef, isOver } = useDroppable({ id: spalte.value })
  return (
    <section
      ref={setNodeRef}
      className={`kanban-spalte${isOver ? ' ist-ueber' : ''}`}
      aria-label={spalte.label}
    >
      <header className={`kanban-spalte-header farbe-${spalte.farbe}`}>
        <span className="kanban-spalte-titel">{spalte.label}</span>
        <span className="kanban-spalte-count">{projekte.length}</span>
      </header>
      <div className="kanban-spalte-body">
        {projekte.length === 0 ? (
          <div className="kanban-leer">Keine Projekte</div>
        ) : (
          projekte.map((p) => (
            <KanbanKarte
              key={p.id}
              projekt={p}
              kundenMap={kundenMap}
            />
          ))
        )}
      </div>
    </section>
  )
}

function KanbanKarte({ projekt, kundenMap, overlay = false }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: projekt.id,
    disabled: overlay,
  })
  const dragStartPos = useRef(null)
  const kunde = kundenMap.get(projekt.kunden_id)

  const inhalt = (
    <>
      <div className="kanban-karte-titel">
        {projekt.name || `Projekt #${projekt.id}`}
      </div>
      <div className="kanban-karte-meta">
        <span className="kanban-karte-kunde">
          {kunde?.name || `Kunde #${projekt.kunden_id || '—'}`}
        </span>
        {projekt.start_datum && (
          <span className="kanban-karte-datum">
            ab {projekt.start_datum}
          </span>
        )}
      </div>
    </>
  )

  if (overlay) {
    return (
      <div
        className="kanban-karte kanban-karte-overlay"
        role="presentation"
      >
        <div className="kanban-karte-inhalt">{inhalt}</div>
      </div>
    )
  }

  // Klick navigiert zur Detailseite, aber nur wenn nicht gedraggt wurde.
  // dnd-kit feuert Klick-Events selbst bei minimaler Bewegung — wir
  // merken uns die Mouse-Down-Position und prüfen die Distanz beim Klick.
  function handlePointerDown(e) {
    dragStartPos.current = { x: e.clientX, y: e.clientY }
  }
  function handleClick(e) {
    const s = dragStartPos.current
    if (s) {
      const dx = Math.abs(e.clientX - s.x)
      const dy = Math.abs(e.clientY - s.y)
      if (dx > 4 || dy > 4) return // war ein Drag
    }
    navigate(`/projekte/${projekt.id}`)
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        handlePointerDown(e)
        listeners?.onPointerDown?.(e)
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/projekte/${projekt.id}`)
        }
      }}
      className={`kanban-karte${isDragging ? ' wird-gezogen' : ''}`}
      aria-label={`Projekt ${projekt.name || projekt.id} öffnen`}
    >
      <div className="kanban-karte-inhalt">{inhalt}</div>
    </div>
  )
}

/* ============================================================ */

function KanbanStyles() {
  return (
    <style>{`
      .kanban-board {
        display: grid;
        grid-template-columns: repeat(4, minmax(220px, 1fr));
        gap: 12px;
        align-items: start;
        overflow-x: auto;
        padding-bottom: 8px;
      }
      @media (max-width: 1000px) {
        .kanban-board { grid-template-columns: repeat(2, minmax(240px, 1fr)); }
      }
      @media (max-width: 640px) {
        .kanban-board { grid-template-columns: minmax(240px, 1fr); }
      }

      .kanban-spalte {
        background: var(--bg-muted);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        display: flex;
        flex-direction: column;
        min-height: 320px;
        transition: background 120ms ease, border-color 120ms ease;
      }
      .kanban-spalte.ist-ueber {
        background: var(--accent-soft);
        border-color: var(--accent-soft-border);
      }

      .kanban-spalte-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 11px 14px;
        border-bottom: 1px solid var(--border);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .kanban-spalte-titel {
        position: relative;
        padding-left: 14px;
      }
      .kanban-spalte-titel::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .kanban-spalte-header.farbe-grau .kanban-spalte-titel::before { background: var(--slate-400); }
      .kanban-spalte-header.farbe-blau .kanban-spalte-titel::before { background: #2563eb; }
      .kanban-spalte-header.farbe-gelb .kanban-spalte-titel::before { background: #ca8a04; }
      .kanban-spalte-header.farbe-gruen .kanban-spalte-titel::before { background: #059669; }

      .kanban-spalte-header.farbe-grau { color: var(--slate-700); }
      .kanban-spalte-header.farbe-blau { color: #1e40af; }
      .kanban-spalte-header.farbe-gelb { color: #854d0e; }
      .kanban-spalte-header.farbe-gruen { color: #065f46; }

      .kanban-spalte-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 20px;
        padding: 0 6px;
        border-radius: var(--r-full);
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        font-size: 11.5px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        text-transform: none;
        letter-spacing: 0;
      }

      .kanban-spalte-body {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }

      .kanban-leer {
        font-size: 12.5px;
        color: var(--text-muted);
        text-align: center;
        padding: 24px 8px;
        border: 1px dashed var(--border);
        border-radius: var(--r-md);
        background: var(--bg-surface);
      }

      .kanban-karte {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        box-shadow: var(--shadow-xs);
        transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
        touch-action: none;
        cursor: grab;
      }
      .kanban-karte:hover {
        border-color: var(--accent-soft-border);
        box-shadow: var(--shadow-sm);
      }
      .kanban-karte:active { cursor: grabbing; }
      .kanban-karte.wird-gezogen { opacity: 0.25; }
      .kanban-karte-overlay {
        cursor: grabbing;
        transform: rotate(2deg);
        box-shadow: var(--shadow-lg);
        border-color: var(--accent);
      }

      .kanban-karte-inhalt {
        padding: 11px 13px;
      }
      .kanban-karte:focus-visible {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
      }
      .kanban-karte-titel {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text);
        line-height: 1.3;
        word-break: break-word;
      }
      .kanban-karte-meta {
        margin-top: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px 10px;
        font-size: 11.5px;
        color: var(--text-muted);
      }
      .kanban-karte-kunde {
        color: var(--text-secondary);
        font-weight: 500;
      }
      .kanban-karte-datum {
        font-variant-numeric: tabular-nums;
      }
    `}</style>
  )
}
