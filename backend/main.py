# FastAPI Framework importieren
print("main.py wird geladen")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import models
from routers import (
    kunden,
    maschinen,
    personal,
    projekte,
    ansprechpartner,
    notfallkontakte,
    qualifikationen,
    zeiterfassungen,
    dokumente,
    bautagesberichte,
)

# Alle Tabellen in einer Datenbank erstellen
Base.metadata.create_all(bind=engine)
print("Datenbank erstellt")

app = FastAPI(title="Gleisbau CRM")

# CORS für das lokale Vite-Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kunden.router)
app.include_router(maschinen.router)
app.include_router(personal.router)
app.include_router(projekte.router)
app.include_router(ansprechpartner.router)
app.include_router(notfallkontakte.router)
app.include_router(qualifikationen.router)
app.include_router(zeiterfassungen.router)
app.include_router(dokumente.router)
app.include_router(bautagesberichte.router)


@app.get("/")
async def root():
    return {"message": "Hello World"}
