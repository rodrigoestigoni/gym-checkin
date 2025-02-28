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
    ""