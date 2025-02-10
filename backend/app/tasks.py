# backend/app/tasks.py
from celery import Celery
from datetime import datetime, timedelta
from database import SessionLocal
from config import MIN_TRAINING_DAYS
from models import CheckIn, WeeklyUpdate, User
from sqlalchemy import func
from sqlalchemy.orm import joinedload

celery = Celery('tasks', broker='redis://redis:6379/0')
celery.config_from_object('celeryconfig')

@celery.task
def update_weekly_ranking():
    db = SessionLocal()
    try:
        today = datetime.utcnow().date()
        # Sempre usar a semana completa anterior:
        last_sunday = today - timedelta(days=((today.isoweekday() % 7) + 7))
        last_saturday = last_sunday + timedelta(days=6)
        start_dt = datetime.combine(last_sunday, datetime.min.time())
        end_dt = datetime.combine(last_saturday, datetime.max.time())
        
        weekly_data = db.query(
            CheckIn.user_id,
            func.count(CheckIn.id).label("count")
        ).filter(
            CheckIn.timestamp >= start_dt,
            CheckIn.timestamp <= end_dt
        ).group_by(CheckIn.user_id).all()

        display_scores = {user_id: count for user_id, count in weekly_data}
        
        def calculate_points(count):
            if count < MIN_TRAINING_DAYS:
                return 0
            return 10 + 3 * (count - MIN_TRAINING_DAYS)
        
        weekly_record = db.query(WeeklyUpdate).filter(
            WeeklyUpdate.week_start == start_dt,
            WeeklyUpdate.week_end == end_dt
        ).first()
        if not weekly_record:
            eligible_scores = {user_id: count for user_id, count in weekly_data if count >= MIN_TRAINING_DAYS}
            if eligible_scores:
                users_to_update = db.query(User).filter(
                    User.id.in_(list(eligible_scores.keys()))
                ).all()
                for user_obj in users_to_update:
                    count = eligible_scores[user_obj.id]
                    total_points = calculate_points(count)
                    user_obj.weeks_won += 1
                    user_obj.points += total_points
                db.commit()
            new_update = WeeklyUpdate(
                week_start=start_dt,
                week_end=end_dt
            )
            db.add(new_update)
            db.commit()
    finally:
        db.close()
