from fastapi import APIRouter, Depends, HTTPException
from auth import require_loeschen
from database import get_db
from models import Dokument
from schemas import DokumentCreate, DokumentUpdate

router = APIRouter()


@router.get("/dokumente")
async def read_dokumente(db=Depends(get_db)):
    return db.query(Dokument).all()


@router.post("/dokumente", status_code=201)
async def create_dokument(d: DokumentCreate, db=Depends(get_db)):
    neu = Dokument(**d.model_dump())
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return neu


@router.get("/dokumente/{id}")
async def read_dokument(id: int, db=Depends(get_db)):
    d = db.query(Dokument).filter(Dokument.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    return d


@router.delete("/dokumente/{id}", dependencies=[Depends(require_loeschen)])
async def delete_dokument(id: int, db=Depends(get_db)):
    d = db.query(Dokument).filter(Dokument.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    db.delete(d)
    db.commit()
    return {"message": "Dokument gelöscht"}


@router.put("/dokumente/{id}")
async def update_dokument(id: int, d_update: DokumentUpdate, db=Depends(get_db)):
    d = db.query(Dokument).filter(Dokument.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    for feld, wert in d_update.model_dump(exclude_unset=True).items():
        setattr(d, feld, wert)
    db.commit()
    db.refresh(d)
    return d
