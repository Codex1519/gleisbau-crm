from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import require_loeschen
from database import get_db
from models import Personal, Projekt, ProjektPersonal
from schemas import ProjektCreate, ProjektUpdate

router = APIRouter()


class ZuweisungCreate(BaseModel):
    personal_id: int


@router.get("/projekte")
async def read_projekte(db=Depends(get_db)):
    return db.query(Projekt).all()


@router.post("/projekte", status_code=201)
async def create_projekt(projekt: ProjektCreate, db=Depends(get_db)):
    neues_projekt = Projekt(**projekt.model_dump())
    db.add(neues_projekt)
    db.commit()
    db.refresh(neues_projekt)
    return neues_projekt


@router.get("/projekte/{id}")
async def read_projekt(id: int, db=Depends(get_db)):
    projekt = db.query(Projekt).filter(Projekt.id == id).first()
    if not projekt:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    return projekt


@router.delete("/projekte/{id}", dependencies=[Depends(require_loeschen)])
async def delete_projekt(id: int, db=Depends(get_db)):
    projekt = db.query(Projekt).filter(Projekt.id == id).first()
    if not projekt:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    db.delete(projekt)
    db.commit()
    return {"message": "Projekt gelöscht"}


@router.put("/projekte/{id}")
async def update_projekt(id: int, projekt_update: ProjektUpdate, db=Depends(get_db)):
    projekt = db.query(Projekt).filter(Projekt.id == id).first()
    if not projekt:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    for feld, wert in projekt_update.model_dump(exclude_unset=True).items():
        setattr(projekt, feld, wert)
    db.commit()
    db.refresh(projekt)
    return projekt


# ---------- Personal-Zuweisung (projekt_personal) ----------
# Steuert, wer über das Feld-Formular Bautagesberichte für dieses
# Projekt einreichen darf.

@router.get("/projekte/{id}/personal")
async def read_projekt_personal(id: int, db=Depends(get_db)):
    zuweisungen = (
        db.query(ProjektPersonal).filter(ProjektPersonal.projekt_id == id).all()
    )
    personal = {p.id: p for p in db.query(Personal)}
    return [
        {
            "personal_id": z.personal_id,
            "vorname": personal[z.personal_id].vorname
            if z.personal_id in personal
            else None,
            "nachname": personal[z.personal_id].nachname
            if z.personal_id in personal
            else None,
            "position": personal[z.personal_id].position
            if z.personal_id in personal
            else None,
        }
        for z in zuweisungen
    ]


@router.post("/projekte/{id}/personal", status_code=201)
async def create_projekt_personal(
    id: int, daten: ZuweisungCreate, db=Depends(get_db)
):
    if not db.query(Projekt).filter(Projekt.id == id).first():
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    if not db.query(Personal).filter(Personal.id == daten.personal_id).first():
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    vorhanden = (
        db.query(ProjektPersonal)
        .filter(
            ProjektPersonal.projekt_id == id,
            ProjektPersonal.personal_id == daten.personal_id,
        )
        .first()
    )
    if vorhanden:
        raise HTTPException(status_code=409, detail="Bereits zugewiesen")
    db.add(ProjektPersonal(projekt_id=id, personal_id=daten.personal_id))
    db.commit()
    return {"message": "Zugewiesen"}


@router.delete("/projekte/{id}/personal/{personal_id}")
async def delete_projekt_personal(id: int, personal_id: int, db=Depends(get_db)):
    zuweisung = (
        db.query(ProjektPersonal)
        .filter(
            ProjektPersonal.projekt_id == id,
            ProjektPersonal.personal_id == personal_id,
        )
        .first()
    )
    if not zuweisung:
        raise HTTPException(status_code=404, detail="Zuweisung nicht gefunden")
    db.delete(zuweisung)
    db.commit()
    return {"message": "Zuweisung entfernt"}
