from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import Zeiterfassung
from schemas import ZeiterfassungCreate, ZeiterfassungUpdate

router = APIRouter()


@router.get("/zeiterfassungen")
async def read_zeiterfassungen(db=Depends(get_db)):
    return db.query(Zeiterfassung).all()


@router.post("/zeiterfassungen", status_code=201)
async def create_zeiterfassung(z: ZeiterfassungCreate, db=Depends(get_db)):
    neu = Zeiterfassung(**z.model_dump())
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return neu


@router.get("/zeiterfassungen/{id}")
async def read_zeiterfassung(id: int, db=Depends(get_db)):
    z = db.query(Zeiterfassung).filter(Zeiterfassung.id == id).first()
    if not z:
        raise HTTPException(status_code=404, detail="Zeiterfassung nicht gefunden")
    return z


@router.delete("/zeiterfassungen/{id}")
async def delete_zeiterfassung(id: int, db=Depends(get_db)):
    z = db.query(Zeiterfassung).filter(Zeiterfassung.id == id).first()
    if not z:
        raise HTTPException(status_code=404, detail="Zeiterfassung nicht gefunden")
    db.delete(z)
    db.commit()
    return {"message": "Zeiterfassung gelöscht"}


@router.put("/zeiterfassungen/{id}")
async def update_zeiterfassung(id: int, z_update: ZeiterfassungUpdate, db=Depends(get_db)):
    z = db.query(Zeiterfassung).filter(Zeiterfassung.id == id).first()
    if not z:
        raise HTTPException(status_code=404, detail="Zeiterfassung nicht gefunden")
    for feld, wert in z_update.model_dump(exclude_unset=True).items():
        setattr(z, feld, wert)
    db.commit()
    db.refresh(z)
    return z
