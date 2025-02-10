# backend/app/celeryconfig.py
from celery.schedules import crontab

beat_schedule = {
    'update-weekly-ranking-every-sunday': {
        'task': 'backend.app.tasks.update_weekly_ranking',
        'schedule': crontab(hour=1, minute=0, day_of_week=0),
    },
}

broker_url = 'redis://redis:6379/0'
