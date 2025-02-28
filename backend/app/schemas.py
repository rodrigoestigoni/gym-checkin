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

class User(BaseModel):
    id: int
    username: str
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
    start_date: datetime
    duration_days: int
    end_date: datetime
    bet: Optional[str] = "Aqui você pode definir algumas regras, como um castigo para quem perder, um prêmio para quem ganhar"
    private: Optional[bool] = True

class ChallengeRulesBase(BaseModel):
    min_threshold: int
    min_points: int
    additional_unit: int
    additional_points: int
    unit_name: str = "treinos"
    period: str = "semana"

class ChallengeRulesCreate(ChallengeRulesBase):
    pass

class ChallengeRules(ChallengeRulesBase):
    id: int
    challenge_id: int
    
    class Config:
        orm_mode = True

class ChallengeCreate(ChallengeBase):
    pass

class Challenge(ChallengeBase):
    id: int
    code: str
    created_by: int
    creator: Optional[User]
    rules: Optional[ChallengeRules]
    
    class Config:
        orm_mode = True

class ChallengeParticipantBase(BaseModel):
    progress: Optional[int] = 0
    submission_image: Optional[str] = None

class ChallengeParticipant(BaseModel):
    id: int
    challenge_id: int
    user_id: int
    joined_at: datetime
    progress: Optional[int] = 0
    submission_image: Optional[str] = None
    approved: bool
    user: User

    class Config:
        orm_mode = True

class ChallengeParticipationResponse(BaseModel):
    challenge: Challenge
    participant: ChallengeParticipant

    class Config:
        orm_mode = True

class ChallengeParticipantResponse(BaseModel):
    id: int
    user: User   # usuário participante
    joined_at: datetime
    progress: Optional[float] = 0
    submission_image: Optional[str] = None
    approved: bool

    class Config:
        orm_mode = True

class ApproveRequest(BaseModel):
    participant_id: int

class AchievementBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

class Achievement(AchievementBase):
    id: int

    class Config:
        orm_mode = True

class UserAchievementBase(BaseModel):
    user_id: int
    achievement_id: int

class UserAchievement(UserAchievementBase):
    id: int
    earned_at: datetime
    achievement: Achievement

    class Config:
        orm_mode = True

class NotificationBase(BaseModel):
    user_id: int
    related_user_id: Optional[int] = None
    challenge_id: Optional[int] = None
    type: str
    message: str

class Notification(NotificationBase):
    id: int
    read: bool
    created_at: datetime

    class Config:
        orm_mode = True