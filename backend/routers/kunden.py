from fastapi import APIRouter, Depends
from database import get_db
from models import Kunde
from schemas import KundeCreate

router = APIRouter()


@router.get("/kunden")
async def read_kunden(db = Depends(get_db)):
    kunden = db.query(Kunde).all()
    return kunden

@router.post("/kunden")
async def create_kunde(kunde: KundeCreate, db = Depends(get_db)):
    neuer_kunde = Kunde(name=kunde.name, strasse=kunde.strasse, hausnummer=kunde.hausnummer, plz=kunde.plz, ort=kunde.ort, telefon=kunde.telefon, email=kunde.email)
    db.add(neuer_kunde)
    db.commit()
    db.refresh(neuer_kunde)
    return neuer_kunde