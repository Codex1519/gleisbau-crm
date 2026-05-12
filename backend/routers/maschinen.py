from schemas import MaschineCreate, MaschineUpdate
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models import Maschine

router = APIRouter()

@router.get("/maschinen")
async def read_maschinen(db = Depends(get_db)):
    maschinen = db.query(Maschine).all()
    return maschinen

@router.post("/maschinen", status_code=201)
async def create_maschine(maschine: MaschineCreate, db = Depends(get_db)):
    neue_maschine = Maschine(typ=maschine.typ, baujahr=maschine.baujahr, status=maschine.status, tuev_datum=maschine.tuev_datum, kennzeichen=maschine.kennzeichen, naechste_wartung=maschine.naechste_wartung)
    db.add(neue_maschine)
    db.commit()
    db.refresh(neue_maschine)
    return neue_maschine

@router.get("/maschinen/{id}")
async def read_maschine(id: int, db = Depends(get_db)):
    maschine = db.query(Maschine).filter(Maschine.id== id).first()
    if not maschine:
        raise HTTPException(status_code=404, detail="Maschine nicht gefunden")
    return maschine

@router.delete("/maschinen/{id}")
async def delete_maschine(id: int, db = Depends(get_db)):
    maschine = db.query(Maschine).filter(Maschine.id == id).first()
    if not maschine:
        raise HTTPException(status_code=404, detail="Maschine nicht gefunden")
    db.delete(maschine)
    db.commit()
    return {"message": "Maschine gelöscht"}

@router.put("/maschinen/{id}")
async def update_maschine(id: int, maschine_update: MaschineUpdate, db = Depends(get_db)):
    maschine = db.query(Maschine).filter(Maschine.id == id).first()
    if not maschine:
        raise HTTPException(status_code=404, detail="Maschine nicht gefunden")
    if maschine_update.name is not None:
        maschine.typ = maschine_update.typ
    if maschine.baujahr is not None:
        maschine.baujahr = maschine_update.baujahr
    if maschine.status is not None:
        maschine.status = maschine_update.status
    if maschine.tuev_datum is not None:
        maschine.tuev_datum = maschine_update.tuev_datum
    if maschine.kennzeichen is not None:
        maschine.kennzeichen = maschine_update.kennzeichen
    if maschine.naechste_wartung is not None:
        maschine.naechste_wartung = maschine_update.naechste_wartung
    db.commit()
    db.refresh(maschine)
    return maschine



