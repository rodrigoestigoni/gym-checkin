from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from . import models, schemas, config

import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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

def get_week_boundaries(timestamp: datetime):
    """Get the Sunday (start) and Saturday (end) of the week for a given timestamp."""
    start = timestamp - timedelta(days=(timestamp.weekday() + 1) % 7)  # Move to previous Sunday
    start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)  # Saturday end
    return start, end

def calculate_weekly_points(checkin_count: int) -> int:
    """Calculate points based on weekly check-ins."""
    if checkin_count < config.MIN_TRAINING_DAYS:
        return 0
    return 10 + 3 * (checkin_count - config.MIN_TRAINING_DAYS)

def recalculate_all_points(db: Session):
    """Recalculate WeeklyPoints and total points for all users based on existing check-ins."""
    logger.debug("Starting recalculation of all points")
    
    # Limpa os registros existentes de WeeklyPoints
    db.query(models.WeeklyPoints).delete()
    db.commit()
    logger.debug("Cleared existing WeeklyPoints")

    # Obtém todos os check-ins ordenados por timestamp
    checkins = db.query(models.CheckIn).order_by(models.CheckIn.timestamp.asc()).all()
    logger.debug(f"Total check-ins found: {len(checkins)}")
    
    # Processa check-ins por semana e usuário
    weekly_counts = {}  # (user_id, week_start) -> checkin_count
    for i, checkin in enumerate(checkins):
        week_start, week_end = get_week_boundaries(checkin.timestamp)
        key = (checkin.user_id, week_start)
        weekly_counts[key] = weekly_counts.get(key, 0) + 1
        logger.debug(f"Checkin {i+1}/{len(checkins)}: user_id={checkin.user_id}, timestamp={checkin.timestamp}, week_start={week_start}, count={weekly_counts[key]}")
    
    logger.debug(f"Weekly counts: {weekly_counts}")
    
    # Cria WeeklyPoints para cada entrada
    for (user_id, week_start), checkin_count in weekly_counts.items():
        week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
        weekly_points = models.WeeklyPoints(
            user_id=user_id,
            week_start=week_start,
            week_end=week_end,
            checkin_count=checkin_count,
            points=calculate_weekly_points(checkin_count)
        )
        db.add(weekly_points)
        logger.debug(f"Added WeeklyPoints: user_id={user_id}, week_start={week_start}, checkin_count={checkin_count}, points={weekly_points.points}")
        db.flush()

    # Atualiza os pontos totais dos usuários
    users = db.query(models.User).all()
    for user in users:
        total_points = db.query(func.sum(models.WeeklyPoints.points)).filter(
            models.WeeklyPoints.user_id == user.id
        ).scalar() or 0
        user.points = total_points
        logger.debug(f"Updated user {user.id} ({user.username}) points to {total_points}")
    
    db.commit()
    logger.debug("Recalculation completed")

# Em crud.py
def recalculate_all_challenge_points(db: Session):
    """Recalcula pontos para todos os participantes de todos os desafios."""
    logger.debug("Iniciando recálculo de pontos para todos os desafios")
    
    # Obtém todos os desafios
    challenges = db.query(models.Challenge).all()
    for challenge in challenges:
        logger.debug(f"Processando desafio {challenge.id}: {challenge.title}")
        
        # Obtém regras do desafio
        rules = db.query(models.ChallengeRules).filter(
            models.ChallengeRules.challenge_id == challenge.id
        ).first()
        
        # Obtém todos os participantes aprovados
        participants = db.query(models.ChallengeParticipant).filter(
            models.ChallengeParticipant.challenge_id == challenge.id,
            models.ChallengeParticipant.approved == True
        ).all()
        
        for participant in participants:
            # Conta check-ins do desafio
            checkin_count = db.query(models.CheckIn).filter(
                models.CheckIn.user_id == participant.user_id,
                models.CheckIn.challenge_id == challenge.id
            ).count()
            
            # Atualiza progresso
            participant.progress = checkin_count
            
            # Calcula pontos
            if rules:
                challenge_points = calculate_challenge_points(checkin_count, rules)
            else:
                # Fallback para regra padrão
                challenge_points = checkin_count * 5
            
            participant.challenge_points = challenge_points
            logger.debug(f"Usuário {participant.user_id}: {checkin_count} check-ins, {challenge_points} pontos")
    
    db.commit()
    logger.debug("Recálculo de pontos para desafios concluído")
    
def update_weekly_points(db: Session, user_id: int, timestamp: datetime):
    """Update WeeklyPoints for the given user and week."""
    logger.debug(f"Updating points for user {user_id} at {timestamp}")
    week_start, week_end = get_week_boundaries(timestamp)
    logger.debug(f"Week: {week_start} to {week_end}")
    
    # Get or create WeeklyPoints entry
    weekly_points = db.query(models.WeeklyPoints).filter(
        models.WeeklyPoints.user_id == user_id,
        models.WeeklyPoints.week_start == week_start
    ).first()
    
    if not weekly_points:
        weekly_points = models.WeeklyPoints(
            user_id=user_id,
            week_start=week_start,
            week_end=week_end,
            checkin_count=0,
            points=0
        )
        db.add(weekly_points)
        db.flush()  # Ensure the new record is in the DB before querying check-ins
    
    # Count check-ins for the week
    checkin_count = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user_id,
        models.CheckIn.timestamp >= week_start,
        models.CheckIn.timestamp <= week_end
    ).count()
    
    # Update WeeklyPoints
    weekly_points.checkin_count = checkin_count
    weekly_points.points = calculate_weekly_points(checkin_count)
    db.flush()  # Ensure WeeklyPoints is updated before summing
    
    # Update user's total points
    total_points = db.query(func.sum(models.WeeklyPoints.points)).filter(
        models.WeeklyPoints.user_id == user_id
    ).scalar() or 0
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.points = total_points
    
    logger.debug(f"Checkin count: {checkin_count}, Points: {weekly_points.points}, Total: {total_points}")
    db.commit()  # Final commit to save all changes

def create_checkin(db: Session, checkin: schemas.CheckInCreate):
    db_checkin = models.CheckIn(**checkin.dict(exclude_unset=True))
    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)
    update_weekly_points(db, checkin.user_id, db_checkin.timestamp)
    return db_checkin

def update_checkin(db: Session, checkin, update: schemas.CheckInUpdate):
    original_timestamp = checkin.timestamp
    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(checkin, key, value)
    db.commit()
    db.refresh(checkin)
    
    # Update points for both weeks if timestamp changed
    if 'timestamp' in update_data and update_data['timestamp'] != original_timestamp:
        update_weekly_points(db, checkin.user_id, original_timestamp)
        update_weekly_points(db, checkin.user_id, checkin.timestamp)
    else:
        update_weekly_points(db, checkin.user_id, checkin.timestamp)
    return checkin

def delete_checkin(db: Session, checkin):
    timestamp = checkin.timestamp
    user_id = checkin.user_id
    db.delete(checkin)
    db.commit()
    update_weekly_points(db, user_id, timestamp)

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

def get_all_users(db: Session):
    return db.query(models.User).all()

def calculate_challenge_points(checkin_count, rules):
    """Calcula pontos baseado nas regras específicas do desafio."""
    if not rules or checkin_count < rules.min_threshold:
        return 0
    
    base_points = rules.min_points
    additional_count = max(0, checkin_count - rules.min_threshold)
    additional_points = (additional_count // rules.additional_unit) * rules.additional_points
    
    return base_points + additional_points

def update_challenge_points(db: Session, user_id: int, challenge_id: int):
    """Atualiza a pontuação do usuário em um desafio específico."""
    # Buscar o desafio e suas regras
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        return
    
    rules = db.query(models.ChallengeRules).filter(
        models.ChallengeRules.challenge_id == challenge_id
    ).first()
    
    # Buscar a participação do usuário
    participant = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == user_id
    ).first()
    
    if not participant:
        return
    
    # Contar checkins do desafio
    checkin_count = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user_id,
        models.CheckIn.challenge_id == challenge_id
    ).count()
    
    # Calcular pontos
    if rules:
        challenge_points = calculate_challenge_points(checkin_count, rules)
    else:
        # Fallback para a regra padrão
        challenge_points = calculate_weekly_points(checkin_count)
    
    # Atualizar pontos do participante
    participant.progress = checkin_count
    participant.challenge_points = challenge_points
    db.commit()
    
    return participant