from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from models import Kunde
from schemas import KundeCreate, KundeUpdate

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

@router.get("/kunden/{id}")
async def read_kunde(id: int, db = Depends(get_db)):
    kunde = db.query(Kunde).filter(Kunde.id == id).first()
    if not kunde:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    return kunde

@router.delete("/kunden/{id}")
async def delete_kunde(id: int, db = Depends(get_db)):
    kunde = db.query(Kunde).filter(Kunde.id == id).first()
    if not kunde:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    db.delete(kunde)
    db.commit()
    return {"message": "Kunde gelöscht"}

@router.put("/kunden/{id}")
async def update_kunde(id: int, kunde_update: KundeUpdate, db = Depends(get_db)):
    kunde = db.query(Kunde).filter(Kunde.id == id).first()
    if not kunde:
        raise HTTPException(status_code=404, detail="Kunde nicht gefunden")
    if kunde_update.name is not None:
        kunde.name = kunde_update.name
    if kunde_update.strasse is not None:
        kunde.strasse = kunde_update.strasse
    if kunde_update.hausnummer is not None:
        kunde.hausnummer = kunde_update.hausnummer
    if kunde_update.plz is not None:
        kunde.plz = kunde_update.plz
    if kunde_update.ort is not None:
        kunde.ort = kunde_update.ort
    if kunde_update.telefon is not None:
        kunde.telefon = kunde_update.telefon
    if kunde_update.email is not None:
        kunde.email = kunde_update.email
    db.commit()
    db.refresh(kunde)
    return kunde

@router.post("/kunden", status_code=201)
async def create_kunde(kunde: KundeCreate, db = Depends(get_db)):
    neuer_kunde = Kunde(name=kunde.name, strasse=kunde.strasse, hausnummer=kunde.hausnummer, plz=kunde.plz, ort=kunde.ort, telefon=kunde.telefon, email=kunde.email)
    db.add(neuer_kunde)
    db.commit()
    db.refresh(neuer_kunde)
    return neuer_kunde