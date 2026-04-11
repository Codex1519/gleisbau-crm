# FastAPI Framework importieren
print("main.py wird geladen")
from fastapi import FastAPI
from database import Base, engine 
import models
from routers import kunden

# Alle Tabellen in einer Datenbank erstellen
Base.metadata.create_all(bind=engine)
print("Datenbank erstellt")

app = FastAPI()
app.include_router(kunden.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}