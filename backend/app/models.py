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
    modality = Column(String, index=True)  # ex.: "academia", "corrida", "calorias", "passos", "artes marciais", "personalizado"
    target = Column(Integer)               # meta, ex.: 18 (treinos, km, etc.)
    start_date = Column(DateTime, default=func.now())
    end_date = Column(DateTime)
    duration_days = Column(Integer)        # calculado ou informado
    rules = Column(Text, default="Aqui você pode definir algumas regras, como um castigo para quem perder, um prêmio para quem ganhar")
    created_by = Column(Integer, ForeignKey("users.id"))
    private = Column(Boolean, default=True)  # se true, somente usuários convidados podem participar
    creator = relationship("User", back_populates="created_challenges")
    # Relacionamento com participantes
    participants = relationship("ChallengeParticipant", back_populates="challenge")

class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=func.now())
    progress = Column(Integer, default=0)           # por exemplo, número de treinos, km, etc.
    submission_image = Column(String, nullable=True)  # URL da foto enviada (se houver)
    approved = Column(Boolean, default=False)         # o criador precisa aprovar o participante
    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", backref="challenge_participations")