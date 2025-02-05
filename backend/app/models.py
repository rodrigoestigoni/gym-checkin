# models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    is_admin = Column(Boolean, default=False)
    status = Column(String, default="normal")
    points = Column(Integer, default=0)
    profile_image = Column(String, nullable=True)  # Armazena o caminho ou URL da imagem
    weeks_won = Column(Integer, default=0)  # NOVO: total de semanas vencidas

class CheckIn(Base):
    __tablename__ = "checkins"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    duration = Column(Float, nullable=True)  # duração do treino em minutos
    description = Column(Text, nullable=True)

class WeeklyUpdate(Base):
    __tablename__ = "weekly_updates"
    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(DateTime, nullable=False)
    week_end = Column(DateTime, nullable=False)
    processed_at = Column(DateTime, server_default=func.now())