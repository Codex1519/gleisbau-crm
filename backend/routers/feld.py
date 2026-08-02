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


def pruefe_key(key: str = Query(default="")) -> None:
    if not FELD_KEY or not hmac.compare_digest(key, FELD_KEY):
        raise HTTPException(status_code=403, detail="Ungültiger Feld-Link")


@router.get("/stammdaten", dependencies=[Depends(pruefe_key)])
async def feld_stammdaten(db=Depends(get_db)):
    """Minimale Listen für das Melde-Formular: wer + welches Projekt."""
    personal = [
        {"id": p.id, "vorname": p.vorname, "nachname": p.nachname}
        for p in db.query(Personal).order_by(Personal.nachname, Personal.vorname)
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
    """Bericht von der Baustelle — landet als normaler Bautagesbericht im CRM."""
    neu = Bautagesbericht(**b.model_dump())
    neu.erstellt_von = "feld-link"
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return {"id": neu.id, "message": "Bericht gesendet"}
