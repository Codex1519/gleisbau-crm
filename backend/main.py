# FastAPI Framework importieren
print("main.py wird geladen")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, inspect
from database import Base, engine
import models
from routers import (
    kunden,
    maschinen,
    personal,
    projekte,
    ansprechpartner,
    notfallkontakte,
    qualifikationen,
    zeiterfassungen,
    dokumente,
    bautagesberichte,
)

# Alle Tabellen in einer Datenbank erstellen
Base.metadata.create_all(bind=engine)
print("Datenbank erstellt")


def fuehre_migrationen_aus() -> None:
    """Leichtgewichtige Migrationen für Schema-Änderungen seit v0.1.

    SQLite kennt kein "ADD COLUMN IF NOT EXISTS", daher prüfen wir per
    Reflection und führen ALTER TABLE nur einmal aus. Existierende Daten
    werden auf sinnvolle Defaults gehoben.
    """
    inspector = inspect(engine)

    # bautagesberichte.wetter (neu in v0.2)
    bautagesberichte_cols = {c["name"] for c in inspector.get_columns("bautagesberichte")}
    with engine.begin() as conn:
        if "wetter" not in bautagesberichte_cols:
            conn.execute(text("ALTER TABLE bautagesberichte ADD COLUMN wetter VARCHAR(100)"))
            print("Migration: Spalte 'wetter' zu bautagesberichte hinzugefügt")

        # projekte.status: bestehende NULL/leere Werte auf 'Anfrage' setzen
        # (für das Kanban-Board v0.2 — vier feste Status-Werte).
        result = conn.execute(
            text(
                "UPDATE projekte SET status = 'Anfrage' "
                "WHERE status IS NULL OR TRIM(status) = ''"
            )
        )
        if result.rowcount > 0:
            print(f"Migration: {result.rowcount} Projekt-Status auf 'Anfrage' gesetzt")


fuehre_migrationen_aus()

app = FastAPI(title="Gleisbau CRM")

# CORS für das lokale Vite-Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kunden.router)
app.include_router(maschinen.router)
app.include_router(personal.router)
app.include_router(projekte.router)
app.include_router(ansprechpartner.router)
app.include_router(notfallkontakte.router)
app.include_router(qualifikationen.router)
app.include_router(zeiterfassungen.router)
app.include_router(dokumente.router)
app.include_router(bautagesberichte.router)


@app.get("/")
async def root():
    return {"message": "Hello World"}
