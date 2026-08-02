# FastAPI Framework importieren
print("main.py wird geladen")
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import get_current_user
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
    benutzer as benutzer_router,
    feld,
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

    bautagesberichte_cols = {c["name"] for c in inspector.get_columns("bautagesberichte")}

    # Neue Spalten von v0.2 (wetter) und v0.5 (erweitertes Bautagebuch).
    # name -> SQL-Typ. Nur fehlende werden per ALTER TABLE angelegt.
    neue_spalten = {
        "wetter": "VARCHAR(100)",
        "ersteller_id": "INTEGER",
        "temperatur": "INTEGER",
        "arbeiten_durchgefuehrt": "TEXT",
        "personal_anwesend": "TEXT",
        "maschinen_eingesetzt": "TEXT",
        "materiallieferungen": "TEXT",
        "behinderungen": "TEXT",
        "besondere_vorkommnisse": "TEXT",
        "baufortschritt": "INTEGER",
        "bemerkungen": "TEXT",
    }

    with engine.begin() as conn:
        for name, typ in neue_spalten.items():
            if name not in bautagesberichte_cols:
                conn.execute(
                    text(f"ALTER TABLE bautagesberichte ADD COLUMN {name} {typ}")
                )
                print(f"Migration: Spalte '{name}' zu bautagesberichte hinzugefügt")

        # Bestandsdaten übernehmen: alter Ersteller (personal_id) -> ersteller_id,
        # alte Kurzbeschreibung -> arbeiten_durchgefuehrt.
        if "personal_id" in bautagesberichte_cols:
            conn.execute(
                text(
                    "UPDATE bautagesberichte SET ersteller_id = personal_id "
                    "WHERE ersteller_id IS NULL AND personal_id IS NOT NULL"
                )
            )
        if "beschreibung" in bautagesberichte_cols:
            conn.execute(
                text(
                    "UPDATE bautagesberichte "
                    "SET arbeiten_durchgefuehrt = beschreibung "
                    "WHERE arbeiten_durchgefuehrt IS NULL "
                    "AND beschreibung IS NOT NULL AND TRIM(beschreibung) <> ''"
                )
            )

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

    # v0.7: Audit-Spalten auf allen Tabellen (wer hat angelegt/geändert?)
    inspector = inspect(engine)
    with engine.begin() as conn:
        for tabelle in inspector.get_table_names():
            vorhanden = {c["name"] for c in inspector.get_columns(tabelle)}
            for spalte in ("erstellt_von", "geaendert_von"):
                if spalte not in vorhanden:
                    conn.execute(
                        text(f"ALTER TABLE {tabelle} ADD COLUMN {spalte} VARCHAR(50)")
                    )
                    print(f"Migration: Spalte '{spalte}' zu {tabelle} hinzugefügt")


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

# Auth-Router: /auth/login ist öffentlich, /benutzer/* prüft Admin selbst
app.include_router(benutzer_router.router)

# Feld-Zugang: kein JWT — schützt sich selbst über den FELD_KEY-Link-Code
app.include_router(feld.router)

# Alle Daten-Router nur mit gültigem Login erreichbar
geschuetzt = [Depends(get_current_user)]
app.include_router(kunden.router, dependencies=geschuetzt)
app.include_router(maschinen.router, dependencies=geschuetzt)
app.include_router(personal.router, dependencies=geschuetzt)
app.include_router(projekte.router, dependencies=geschuetzt)
app.include_router(ansprechpartner.router, dependencies=geschuetzt)
app.include_router(notfallkontakte.router, dependencies=geschuetzt)
app.include_router(qualifikationen.router, dependencies=geschuetzt)
app.include_router(zeiterfassungen.router, dependencies=geschuetzt)
app.include_router(dokumente.router, dependencies=geschuetzt)
app.include_router(bautagesberichte.router, dependencies=geschuetzt)


def erstelle_admin_falls_leer() -> None:
    """Beim ersten Start: Admin-Konto anlegen (Passwort danach ändern!)."""
    from auth import hash_passwort
    from database import Session

    db = Session()
    try:
        if db.query(models.Benutzer).count() == 0:
            db.add(
                models.Benutzer(
                    benutzername="admin",
                    passwort_hash=hash_passwort("gleisbau2026"),
                    rolle="admin",
                    aktiv=1,
                )
            )
            db.commit()
            print("Admin-Konto angelegt: admin / gleisbau2026 — bitte Passwort ändern!")
    finally:
        db.close()


erstelle_admin_falls_leer()


@app.get("/")
async def root():
    return {"message": "Hello World"}
