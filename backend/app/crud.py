from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from . import models, schemas, config

def get_all_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(username=user.username, password_hash=hashed_password, is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(func.lower(models.User.username) == username.lower()).first()

def create_checkin(db: Session, checkin: schemas.CheckInCreate):
    db_checkin = models.CheckIn(**checkin.dict(exclude_unset=True))
    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)
    return db_checkin


def get_checkins_by_user_between(db: Session, user_id: int, start_date: datetime, end_date: datetime):
    return db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user_id,
        models.CheckIn.timestamp >= start_date,
        models.CheckIn.timestamp <= end_date
    ).all()

def get_all_checkins_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 10):
    return db.query(models.CheckIn).filter(models.CheckIn.user_id == user_id).offset(skip).limit(limit).all()

def update_user_status_and_points(db: Session, user_id: int):
    # Define início da semana (supondo domingo como início)
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday()+1) 
    end_of_week = start_of_week + timedelta(days=6)
    checkins = get_checkins_by_user_between(db, user_id, start_of_week, end_of_week)
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        if len(checkins) >= config.MIN_TRAINING_DAYS:
            user.status = "verde"
            # some pontos para cada semana completa
            user.points += 10
        else:
            user.status = "normal"
        db.commit()

def get_ranking(db: Session, limit: int = 10):
    return db.query(models.User).order_by(models.User.points.desc()).limit(limit).all()

def get_checkin(db: Session, checkin_id: int):
    return db.query(models.CheckIn).filter(models.CheckIn.id == checkin_id).first()

def update_checkin(db: Session, checkin, update: schemas.CheckInUpdate):
    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(checkin, key, value)
    db.commit()
    db.refresh(checkin)
    return checkin

def delete_checkin(db: Session, checkin):
    db.delete(checkin)
    db.commit()

def get_all_users(db: Session):
    return db.query(models.User).all()