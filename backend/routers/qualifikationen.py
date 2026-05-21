from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import Qualifikation
from schemas import QualifikationCreate, QualifikationUpdate

router = APIRouter()


@router.get("/qualifikationen")
async def read_qualifikationen(db=Depends(get_db)):
    return db.query(Qualifikation).all()


@router.post("/qualifikationen", status_code=201)
async def create_qualifikation(q: QualifikationCreate, db=Depends(get_db)):
    neu = Qualifikation(**q.model_dump())
    db.add(neu)
    db.commit()
    db.refresh(neu)
    return neu


@router.get("/qualifikationen/{id}")
async def read_qualifikation(id: int, db=Depends(get_db)):
    q = db.query(Qualifikation).filter(Qualifikation.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Qualifikation nicht gefunden")
    return q


@router.delete("/qualifikationen/{id}")
async def delete_qualifikation(id: int, db=Depends(get_db)):
    q = db.query(Qualifikation).filter(Qualifikation.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Qualifikation nicht gefunden")
    db.delete(q)
    db.commit()
    return {"message": "Qualifikation gelöscht"}


@router.put("/qualifikationen/{id}")
async def update_qualifikation(id: int, q_update: QualifikationUpdate, db=Depends(get_db)):
    q = db.query(Qualifikation).filter(Qualifikation.id == id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Qualifikation nicht gefunden")
    for feld, wert in q_update.model_dump(exclude_unset=True).items():
        setattr(q, feld, wert)
    db.commit()
    db.refresh(q)
    return q
