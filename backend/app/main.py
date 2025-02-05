from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(SCRIPT_DIR))

from app.database import engine, Base
from app.logger_middleware import LoggingMiddleware

from app import routes

# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym CheckIn API")
app.add_middleware(LoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou especifique os domínios permitidos, por exemplo: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router)
