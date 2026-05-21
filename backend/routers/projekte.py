from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import Projekt
from schemas import ProjektCreate, ProjektUpdate

router = APIRouter()


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


@router.delete("/projekte/{id}")
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
