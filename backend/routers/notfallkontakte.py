from fastapi import APIRouter, Depends, HTTPException
from auth import require_loeschen
from database import get_db
from models import Notfallkontakt
from schemas import NotfallkontaktCreate, NotfallkontaktUpdate

router = APIRouter()


@router.get("/notfallkontakte")
async def read_notfallkontakte(db=Depends(get_db)):
    return db.query(Notfallkontakt).all()


@router.post("/notfallkontakte", status_code=201)
async def create_notfallkontakt(nk: NotfallkontaktCreate, db=Depends(get_db)):
    neu = Notfallkontakt(**nk.model_dump())
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return neu


@router.get("/notfallkontakte/{id}")
async def read_notfallkontakt(id: int, db=Depends(get_db)):
    nk = db.query(Notfallkontakt).filter(Notfallkontakt.id == id).first()
    if not nk:
        raise HTTPException(status_code=404, detail="Notfallkontakt nicht gefunden")
    return nk


@router.delete("/notfallkontakte/{id}", dependencies=[Depends(require_loeschen)])
async def delete_notfallkontakt(id: int, db=Depends(get_db)):
    nk = db.query(Notfallkontakt).filter(Notfallkontakt.id == id).first()
    if not nk:
        raise HTTPException(status_code=404, detail="Notfallkontakt nicht gefunden")
    db.delete(nk)
    db.commit()
    return {"message": "Notfallkontakt gelöscht"}


@router.put("/notfallkontakte/{id}")
async def update_notfallkontakt(id: int, nk_update: NotfallkontaktUpdate, db=Depends(get_db)):
    nk = db.query(Notfallkontakt).filter(Notfallkontakt.id == id).first()
    if not nk:
        raise HTTPException(status_code=404, detail="Notfallkontakt nicht gefunden")
    for feld, wert in nk_update.model_dump(exclude_unset=True).items():
        setattr(nk, feld, wert)
    db.commit()
    db.refresh(nk)
    return nk
