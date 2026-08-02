from fastapi import APIRouter, Depends, HTTPException
from auth import require_loeschen
from database import get_db
from models import Ansprechpartner
from schemas import AnsprechpartnerCreate, AnsprechpartnerUpdate

router = APIRouter()


@router.get("/ansprechpartner")
async def read_ansprechpartner_liste(db=Depends(get_db)):
    return db.query(Ansprechpartner).all()


@router.post("/ansprechpartner", status_code=201)
async def create_ansprechpartner(ap: AnsprechpartnerCreate, db=Depends(get_db)):
    neu = Ansprechpartner(**ap.model_dump())
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return neu


@router.get("/ansprechpartner/{id}")
async def read_ansprechpartner(id: int, db=Depends(get_db)):
    ap = db.query(Ansprechpartner).filter(Ansprechpartner.id == id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Ansprechpartner nicht gefunden")
    return ap


@router.delete("/ansprechpartner/{id}", dependencies=[Depends(require_loeschen)])
async def delete_ansprechpartner(id: int, db=Depends(get_db)):
    ap = db.query(Ansprechpartner).filter(Ansprechpartner.id == id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Ansprechpartner nicht gefunden")
    db.delete(ap)
    db.commit()
    return {"message": "Ansprechpartner gelöscht"}


@router.put("/ansprechpartner/{id}")
async def update_ansprechpartner(id: int, ap_update: AnsprechpartnerUpdate, db=Depends(get_db)):
    ap = db.query(Ansprechpartner).filter(Ansprechpartner.id == id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Ansprechpartner nicht gefunden")
    for feld, wert in ap_update.model_dump(exclude_unset=True).items():
        setattr(ap, feld, wert)
    db.commit()
    db.refresh(ap)
    return ap
