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