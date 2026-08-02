"""Feld-Zugang: Bautagesberichte von der Baustelle ohne CRM-Login.

Zugriff über einen festen Link-Code (FELD_KEY, per .env auf dem Server).
Der Code erlaubt ausschließlich:
  - Stammdaten lesen (Namen + aktive Projekte, minimal)
  - einen Bautagesbericht anlegen
Kein Lesen von Berichten, kein Ändern, kein Löschen, kein CRM-Zugriff.
"""

import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_db
from models import Bautagesbericht, Personal, Projekt
from schemas import BautagesberichtCreate

router = APIRouter(prefix="/feld")

# Auf dem Server via docker-compose/.env gesetzt; der Fallback gilt nur
# für lokale Entwicklung ohne Docker.
FELD_KEY = os.environ.get("FELD_KEY", "dev-feld")

# Nur Baustellen-Personal darf über den Feld-Link Berichte senden.
# Abgleich gegen das Positions-Feld der Personal-Stammdaten
# (Teilstring, case-insensitive — "Oberpolier" zählt also auch).
FELD_QUALIFIKATIONEN = ("polier", "vorarbeiter", "facharbeiter", "bauhelfer")


def ist_feldpersonal(p: Personal) -> bool:
    position = (p.position or "").lower()
    return any(q in position for q in FELD_QUALIFIKATIONEN)


def pruefe_key(key: str = Query(default="")) -> None:
    if not FELD_KEY or not hmac.compare_digest(key, FELD_KEY):
        raise HTTPException(status_code=403, detail="Ungültiger Feld-Link")


@router.get("/stammdaten", dependencies=[Depends(pruefe_key)])
async def feld_stammdaten(db=Depends(get_db)):
    """Minimale Listen für das Melde-Formular: wer + welches Projekt.

    Personal ist auf Baustellen-Qualifikationen gefiltert — Büro-Personal
    erscheint nicht in der "Wer bist du?"-Auswahl.
    """
    personal = [
        {"id": p.id, "vorname": p.vorname, "nachname": p.nachname}
        for p in db.query(Personal).order_by(Personal.nachname, Personal.vorname)
        if ist_feldpersonal(p)
    ]
    projekte = [
        {"id": p.id, "name": p.name, "status": p.status}
        for p in db.query(Projekt)
        .filter(Projekt.status != "Abgeschlossen")
        .order_by(Projekt.name)
    ]
    return {"personal": personal, "projekte": projekte}


@router.post("/bautagesberichte", status_code=201, dependencies=[Depends(pruefe_key)])
async def feld_bautagesbericht(b: BautagesberichtCreate, db=Depends(get_db)):
    """Bericht von der Baustelle — landet als normaler Bautagesbericht im CRM.

    Serverseitig erzwungen: Der Ersteller muss existieren und eine
    Baustellen-Qualifikation haben (nicht nur die Liste im Formular filtern).
    """
    ersteller = db.query(Personal).filter(Personal.id == b.ersteller_id).first()
    if not ersteller or not ist_feldpersonal(ersteller):
        raise HTTPException(
            status_code=403,
            detail=(
                "Nur Baustellen-Personal (Polier, Vorarbeiter, Facharbeiter, "
                "Bauhelfer) darf Berichte über den Feld-Link senden."
            ),
        )
    neu = Bautagesbericht(**b.model_dump())
    neu.erstellt_von = "feld-link"
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return {"id": neu.id, "message": "Bericht gesendet"}
