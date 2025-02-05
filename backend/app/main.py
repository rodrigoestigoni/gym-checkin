from fastapi import FastAPI
from .database import engine, Base
from . import routes

# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gym CheckIn API")

app.include_router(routes.router)
