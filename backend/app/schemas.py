# backend/app/schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    is_admin: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class User(UserBase):
    id: int
    status: str
    points: int
    profile_image: Optional[str] = None

    class Config:
        orm_mode = True

class LoginResponse(Token):
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None

class CheckInBase(BaseModel):
    duration: Optional[float] = None
    description: Optional[str] = None

class CheckInCreate(CheckInBase):
    user_id: int
    timestamp: Optional[datetime] = None

class CheckIn(CheckInBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        orm_mode = True

class CheckInUpdate(BaseModel):
    duration: Optional[float]
    description: Optional[str]
    timestamp: Optional[datetime] = None

class UserUpdate(BaseModel):
    username: Optional[str]
    profile_image: Optional[str]  # armazena o caminho/URL da imagem

class ChallengeBase(BaseModel):
    title: str
    description: Optional[str] = None
    modality: str
    target: int
    # Em vez de pedir duração e data de fim separadamente, podemos definir:
    # Se o usuário informar a duração (em dias) ou a data final, um dos dois será calculado.
    duration_days: Optional[int] = None  
    end_date: Optional[datetime] = None  
    rules: Optional[str] = "Aqui você pode definir algumas regras, como um castigo para quem perder, um prêmio para quem ganhar"
    private: Optional[bool] = True

class ChallengeCreate(ChallengeBase):
    start_date: datetime  # o criador informa a data de início; a data final ou a duração deve ser informada (pelo menos uma)

class Challenge(ChallengeBase):
    id: int
    start_date: datetime
    created_by: int

    class Config:
        orm_mode = True

class ChallengeParticipantBase(BaseModel):
    progress: Optional[int] = 0
    submission_image: Optional[str] = None

class ChallengeParticipant(ChallengeParticipantBase):
    id: int
    challenge_id: int
    user_id: int
    joined_at: datetime
    approved: bool

    class Config:
        orm_mode = True