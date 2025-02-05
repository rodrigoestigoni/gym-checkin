from fastapi import FastAPI
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(SCRIPT_DIR))

from app.database import engine, Base

from . import routes

# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym CheckIn API")

app.include_router(routes.router)
