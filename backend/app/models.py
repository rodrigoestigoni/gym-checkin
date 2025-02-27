import random
import string
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)  # ex.: "Maratonista", "Leitor Voraz"
    description = Column(Text)
    earned_at = Column(DateTime, default=func.now())

class WeeklyPoints(Base):
    __tablename__ = "weekly_points"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    week_start = Column(DateTime, nullable=False)  # Sunday of the week
    week_end = Column(DateTime, nullable=False)    # Saturday of the week
    checkin_count = Column(Integer, default=0)     # Number of check-ins in the week
    points = Column(Integer, default=0)            # Calculated points for the week
    user = relationship("User", back_populates="weekly_points")

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
    weekly_points = relationship("WeeklyPoints", back_populates="user")
    created_challenges = relationship("Challenge", back_populates="creator")

class CheckIn(Base):
    __tablename__ = "checkins"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    duration = Column(Float, nullable=True)  # duração do treino em minutos
    description = Column(Text, nullable=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=True)

class WeeklyUpdate(Base):
    __tablename__ = "weekly_updates"
    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(DateTime, nullable=False)
    week_end = Column(DateTime, nullable=False)
    processed_at = Column(DateTime, server_default=func.now())

def generate_challenge_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase, k=length))

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, default=lambda: generate_challenge_code(6))
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    modality = Column(String, index=True)  # "academia", "corrida", "calorias", "passos", "artes marciais", "personalizado", etc.
    target = Column(Integer)              # Meta numérica (ex.: 18 treinos, 50 km, etc.)
    start_date = Column(DateTime, nullable=False)  # Data de início
    duration_days = Column(Integer, nullable=False) # Quantidade de dias do desafio
    end_date = Column(DateTime, nullable=False)      # Data de término
    bet = Column(Text, default="Aqui você pode definir algumas regras, como um castigo para quem perder, um prêmio para quem ganhar")
    private = Column(Boolean, default=True)          # Se o desafio é privado (apenas participantes convidados)
    created_by = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="created_challenges")
    participants = relationship("ChallengeParticipant", back_populates="challenge")

class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    joined_at = Column(DateTime, default=func.now())
    progress = Column(Integer, default=0)  # Por exemplo, quantidade de checkins feitos no desafio
    challenge_points = Column(Integer, default=0)  # Novo campo para pontos do desafio
    submission_image = Column(String, nullable=True)
    approved = Column(Boolean, default=False)
    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", backref="challenge_participations")
