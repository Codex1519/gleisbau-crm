from fastapi import APIRouter, Depends, HTTPException
from auth import require_loeschen
from database import get_db
from models import Bautagesbericht
from schemas import BautagesberichtCreate, BautagesberichtUpdate

router = APIRouter()


@router.get("/bautagesberichte")
async def read_bautagesberichte(db=Depends(get_db)):
    return db.query(Bautagesbericht).all()


@router.post("/bautagesberichte", status_code=201)
async def create_bautagesbericht(b: BautagesberichtCreate, db=Depends(get_db)):
    neu = Bautagesbericht(**b.model_dump())
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return neu


@router.get("/bautagesberichte/{id}")
async def read_bautagesbericht(id: int, db=Depends(get_db)):
    b = db.query(Bautagesbericht).filter(Bautagesbericht.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bautagesbericht nicht gefunden")
    return b


@router.delete("/bautagesberichte/{id}", dependencies=[Depends(require_loeschen)])
async def delete_bautagesbericht(id: int, db=Depends(get_db)):
    b = db.query(Bautagesbericht).filter(Bautagesbericht.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bautagesbericht nicht gefunden")
    db.delete(b)
    db.commit()
    return {"message": "Bautagesbericht gelöscht"}


@router.put("/bautagesberichte/{id}")
async def update_bautagesbericht(id: int, b_update: BautagesberichtUpdate, db=Depends(get_db)):
    b = db.query(Bautagesbericht).filter(Bautagesbericht.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bautagesbericht nicht gefunden")
    for feld, wert in b_update.model_dump(exclude_unset=True).items():
        setattr(b, feld, wert)
    db.commit()
    db.refresh(b)
    return b
