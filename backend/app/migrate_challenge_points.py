# migrate_challenge_points.py
from sqlalchemy import create_engine, func, Index
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import logging
import os
import sys

# Adicione o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importe seus modelos
from models import Challenge, ChallengeParticipant, CheckIn, ChallengeRules, ChallengePoints, Base
from database import engine 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_period_boundaries(timestamp):
    """Obtém domingo (início) e sábado (fim) da semana para uma data."""
    start = timestamp - timedelta(days=(timestamp.weekday() + 1) % 7)  # Move para domingo anterior
    start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)  # Sábado fim
    return start, end

def calculate_challenge_points(checkin_count, rules):
    """Calcula pontos baseado nas regras específicas do desafio."""
    if not rules or checkin_count < rules.min_threshold:
        return 0
    
    base_points = rules.min_points
    additional_count = max(0, checkin_count - rules.min_threshold)
    additional_points = (additional_count // rules.additional_unit) * rules.additional_points
    
    return base_points + additional_points

def migrate_challenge_points():
    """Migra pontos de desafios existentes para a nova tabela challenge_points."""
    db = SessionLocal()
    try:
        logger.info("Iniciando migração de pontos para a tabela challenge_points")
        
        # Obtém todos os desafios
        challenges = db.query(Challenge).all()
        logger.info(f"Processando {len(challenges)} desafios")
        
        for challenge in challenges:
            logger.info(f"Desafio {challenge.id}: {challenge.title}")
            rules = db.query(ChallengeRules).filter(
                ChallengeRules.challenge_id == challenge.id
            ).first()
            
            # Obtém todos os participantes aprovados
            participants = db.query(ChallengeParticipant).filter(
                ChallengeParticipant.challenge_id == challenge.id,
                ChallengeParticipant.approved == True
            ).all()
            logger.info(f"Processando {len(participants)} participantes")
            
            for participant in participants:
                # Obtém todos os check-ins deste usuário para este desafio
                checkins = db.query(CheckIn).filter(
                    CheckIn.user_id == participant.user_id,
                    CheckIn.challenge_id == challenge.id
                ).order_by(CheckIn.timestamp).all()
                
                if not checkins:
                    logger.info(f"Usuário {participant.user_id}: nenhum check-in encontrado")
                    continue
                
                # Agrupa check-ins por período (semana)
                grouped_checkins = {}
                total_points = 0
                
                for checkin in checkins:
                    period_start, period_end = get_period_boundaries(checkin.timestamp)
                    period_key = period_start.isoformat()
                    
                    if period_key not in grouped_checkins:
                        grouped_checkins[period_key] = {
                            "start": period_start,
                            "end": period_end,
                            "count": 0
                        }
                    
                    grouped_checkins[period_key]["count"] += 1
                
                # Cria registros de pontuação para cada período
                for period_key, period_data in grouped_checkins.items():
                    checkin_count = period_data["count"]
                    
                    # Calcula pontos
                    if rules:
                        points = calculate_challenge_points(checkin_count, rules)
                    else:
                        # Fallback para regra padrão
                        points = checkin_count * 5
                    
                    total_points += points
                    
                    # Verifica se já existe registro para este período
                    existing = db.query(ChallengePoints).filter(
                        ChallengePoints.challenge_id == challenge.id,
                        ChallengePoints.user_id == participant.user_id,
                        ChallengePoints.period_start == period_data["start"]
                    ).first()
                    
                    if existing:
                        existing.checkin_count = checkin_count
                        existing.points = points
                    else:
                        # Cria novo registro
                        new_record = ChallengePoints(
                            challenge_id=challenge.id,
                            user_id=participant.user_id,
                            period_start=period_data["start"],
                            period_end=period_data["end"],
                            checkin_count=checkin_count,
                            points=points
                        )
                        db.add(new_record)
                
                # Atualiza pontos totais do participante
                participant.challenge_points = total_points
                logger.info(f"Usuário {participant.user_id}: {len(checkins)} check-ins, {total_points} pontos totais")
        
        db.commit()
        logger.info("Migração de pontos concluída")
    except Exception as e:
        db.rollback()
        logger.error(f"Erro durante a migração: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_challenge_points()
