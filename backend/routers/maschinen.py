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