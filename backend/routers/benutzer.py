"""Login + Benutzerverwaltung (v0.6).

/auth/login    — öffentlich
/auth/me       — eingeloggte Benutzer
/benutzer/*    — nur Admins (wird in main.py zusätzlich absichert)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import (
    ROLLEN,
    erstelle_token,
    get_current_user,
    hash_passwort,
    pruefe_passwort,
    require_admin,
)
from database import get_db
from models import Benutzer

router = APIRouter()


# ---------- Schemas ----------

class LoginDaten(BaseModel):
    benutzername: str
    passwort: str


class BenutzerCreate(BaseModel):
    benutzername: str
    passwort: str
    rolle: str = "sachbearbeiter"
    personal_id: int | None = None


class BenutzerUpdate(BaseModel):
    passwort: str | None = None
    rolle: str | None = None
    aktiv: bool | None = None
    personal_id: int | None = None


class PasswortAendern(BaseModel):
    altes_passwort: str
    neues_passwort: str


def _oeffentlich(b: Benutzer) -> dict:
    """Benutzer ohne Passwort-Hash ausgeben."""
    return {
        "id": b.id,
        "benutzername": b.benutzername,
        "rolle": b.rolle,
        "aktiv": bool(b.aktiv),
        "personal_id": b.personal_id,
        "created_at": b.created_at,
    }


# ---------- Auth ----------

@router.post("/auth/login")
async def login(daten: LoginDaten, db=Depends(get_db)):
    benutzer = (
        db.query(Benutzer)
        .filter(Benutzer.benutzername == daten.benutzername)
        .first()
    )
    if (
        benutzer is None
        or not benutzer.aktiv
        or not pruefe_passwort(daten.passwort, benutzer.passwort_hash)
    ):
        raise HTTPException(
            status_code=401, detail="Benutzername oder Passwort falsch"
        )
    return {"token": erstelle_token(benutzer), "benutzer": _oeffentlich(benutzer)}


@router.get("/auth/me")
async def me(benutzer: Benutzer = Depends(get_current_user)):
    return _oeffentlich(benutzer)


@router.post("/auth/passwort")
async def eigenes_passwort_aendern(
    daten: PasswortAendern,
    benutzer: Benutzer = Depends(get_current_user),
    db=Depends(get_db),
):
    if not pruefe_passwort(daten.altes_passwort, benutzer.passwort_hash):
        raise HTTPException(status_code=422, detail="Aktuelles Passwort ist falsch")
    if len(daten.neues_passwort) < 8:
        raise HTTPException(status_code=422, detail="Neues Passwort: mindestens 8 Zeichen")
    benutzer.passwort_hash = hash_passwort(daten.neues_passwort)
    db.add(benutzer)
    db.commit()
    return {"message": "Passwort geändert"}


# ---------- Benutzerverwaltung (Admin) ----------

@router.get("/benutzer", dependencies=[Depends(require_admin)])
async def read_benutzer(db=Depends(get_db)):
    return [_oeffentlich(b) for b in db.query(Benutzer).all()]


@router.post("/benutzer", status_code=201, dependencies=[Depends(require_admin)])
async def create_benutzer(daten: BenutzerCreate, db=Depends(get_db)):
    if daten.rolle not in ROLLEN:
        raise HTTPException(status_code=422, detail=f"Rolle muss eine von {ROLLEN} sein")
    if len(daten.passwort) < 8:
        raise HTTPException(status_code=422, detail="Passwort: mindestens 8 Zeichen")
    if db.query(Benutzer).filter(Benutzer.benutzername == daten.benutzername).first():
        raise HTTPException(status_code=409, detail="Benutzername existiert bereits")

    neuer = Benutzer(
        benutzername=daten.benutzername,
        passwort_hash=hash_passwort(daten.passwort),
        rolle=daten.rolle,
        personal_id=daten.personal_id,
        aktiv=1,
    )
    db.add(neuer)
    db.commit()
    db.refresh(neuer)
    return _oeffentlich(neuer)


@router.put("/benutzer/{id}", dependencies=[Depends(require_admin)])
async def update_benutzer(id: int, daten: BenutzerUpdate, db=Depends(get_db)):
    benutzer = db.query(Benutzer).filter(Benutzer.id == id).first()
    if benutzer is None:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    if daten.rolle is not None:
        if daten.rolle not in ROLLEN:
            raise HTTPException(status_code=422, detail=f"Rolle muss eine von {ROLLEN} sein")
        benutzer.rolle = daten.rolle
    if daten.passwort is not None:
        if len(daten.passwort) < 8:
            raise HTTPException(status_code=422, detail="Passwort: mindestens 8 Zeichen")
        benutzer.passwort_hash = hash_passwort(daten.passwort)
    if daten.aktiv is not None:
        benutzer.aktiv = 1 if daten.aktiv else 0
    if daten.personal_id is not None:
        benutzer.personal_id = daten.personal_id

    db.commit()
    db.refresh(benutzer)
    return _oeffentlich(benutzer)


@router.delete("/benutzer/{id}", dependencies=[Depends(require_admin)])
async def delete_benutzer(id: int, admin: Benutzer = Depends(require_admin), db=Depends(get_db)):
    if id == admin.id:
        raise HTTPException(status_code=422, detail="Du kannst dich nicht selbst löschen")
    benutzer = db.query(Benutzer).filter(Benutzer.id == id).first()
    if benutzer is None:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    db.delete(benutzer)
    db.commit()
    return {"message": "Benutzer gelöscht"}
