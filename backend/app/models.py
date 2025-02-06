# models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
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
    created_challenges = relationship("Challenge", back_populates="creator")

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

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    modality = Column(String, index=True)  # Ex.: "academia", "corrida", "calorias", etc.
    target = Column(Integer)  # Meta do desafio (ex.: 18 treinos, 50 km, etc.)
    duration_days = Column(Integer)  # Duração do desafio em dias, ex.: 30
    start_date = Column(DateTime, default=func.now())
    end_date = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="created_challenges")

class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=func.now())
    progress = Column(Integer, default=0)  # Pode representar treinos realizados, km percorridos, etc.
    submission_image = Column(String, nullable=True)  # URL da imagem enviada pelo usuário (após processamento)
    challenge = relationship("Challenge", backref="participants")
    user = relationship("User", backref="challenge_participations")