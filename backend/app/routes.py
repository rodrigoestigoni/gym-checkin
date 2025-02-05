import os
import shutil

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from . import schemas, crud, auth, database, models
from .config import MIN_TRAINING_DAYS
from . import models
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer


router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependência para obter o DB
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/token", response_model=schemas.LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciais incorretas")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Função para obter o usuário atual
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    token_data = auth.decode_token(token)
    if token_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    user = crud.get_user_by_username(db, token_data.username)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

### Endpoint de registro de usuário
@router.post("/register/", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    user.username = user.username.lower()
    hashed_password = auth.get_password_hash(user.password)
    return crud.create_user(db, user, hashed_password)

### Endpoint de login
@router.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciais incorretas")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

### Endpoint para criar um checkin
@router.post("/checkin/", response_model=schemas.CheckIn)
def create_checkin(checkin: schemas.CheckInCreate, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Garante que o usuário está criando seu próprio checkin
    if checkin.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado")
    return crud.create_checkin(db, checkin)

### Endpoint para obter checkins do usuário (lista paginada)
@router.get("/users/{user_id}/checkins/", response_model=list[schemas.CheckIn])
def get_checkins(user_id: int, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_all_checkins_by_user(db, user_id, skip, limit)

### Endpoint para obter checkins de uma semana (calendário)
@router.get("/users/{user_id}/checkins/week/", response_model=list[schemas.CheckIn])
def get_weekly_checkins(user_id: int, week_offset: int = 0, db: Session = Depends(get_db)):
    # week_offset=0: semana atual, -1: semana passada, etc.
    today = datetime.now()
    # calcula o domingo da semana atual
    start_of_week = today - timedelta(days=today.weekday()+1)
    start_of_week = start_of_week + timedelta(weeks=week_offset)
    end_of_week = start_of_week + timedelta(days=6)
    return crud.get_checkins_by_user_between(db, user_id, start_of_week, end_of_week)

### Endpoint para ranking
@router.get("/ranking/", response_model=list[schemas.User])
def get_ranking(limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_ranking(db, limit)

# Endpoint para atualizar um checkin
@router.put("/checkins/{checkin_id}", response_model=schemas.CheckIn)
def update_checkin(checkin_id: int, update: schemas.CheckInUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    checkin = crud.get_checkin(db, checkin_id)
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin não encontrado")
    # Garante que o usuário possa editar seu próprio checkin ou é admin
    if checkin.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Não autorizado")
    updated = crud.update_checkin(db, checkin, update)
    return updated

# Endpoint para remover um checkin
@router.delete("/checkins/{checkin_id}", status_code=204)
def delete_checkin(checkin_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    checkin = crud.get_checkin(db, checkin_id)
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin não encontrado")
    if checkin.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Não autorizado")
    crud.delete_checkin(db, checkin)
    return

@router.put("/users/me", response_model=schemas.User)
def update_profile(
    username: str = None,
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    if file:
        directory = "static/profile_images"
        os.makedirs(directory, exist_ok=True)
        filename = f"{current_user.id}_{file.filename}"
        file_location = f"{directory}/{filename}"
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        current_user.profile_image = f"{backend_url}/static/profile_images/{filename}"
    if username:
        current_user.username = username
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/ranking/weekly")
def weekly_ranking(db: Session = Depends(get_db)):
    # Determina a última semana completa.
    # Supondo que a semana seja de domingo a sábado.
    today = datetime.utcnow().date()
    # Em Python, weekday(): Monday=0, ..., Sunday=6.
    # Para obter a última semana completa, vamos considerar:
    #   - Se hoje é domingo (6), a semana passada foi de domingo a sábado.
    #   - Caso contrário, encontre o último sábado.
    if today.weekday() == 6:
        last_saturday = today - timedelta(days=1)
    else:
        last_saturday = today - timedelta(days=today.weekday() + 2)
    last_sunday = last_saturday - timedelta(days=6)
    start_dt = datetime.combine(last_sunday, datetime.min.time())
    end_dt = datetime.combine(last_saturday, datetime.max.time())

    # Verifica se essa semana já foi processada
    weekly_record = db.query(models.WeeklyUpdate).filter(
        models.WeeklyUpdate.week_start == start_dt,
        models.WeeklyUpdate.week_end == end_dt
    ).first()

    if not weekly_record:
        # Se ainda não processada, consulta os checkins da última semana.
        weekly_data = db.query(models.CheckIn.user_id, func.count(models.CheckIn.id).label("count")).filter(
            models.CheckIn.timestamp >= start_dt,
            models.CheckIn.timestamp <= end_dt
        ).group_by(models.CheckIn.user_id).all()

        # Cria um dicionário {user_id: count} para usuários que atingiram o mínimo
        weekly_scores = { user_id: count for user_id, count in weekly_data }

        # Atualiza o campo weeks_won para cada usuário que atingiu o mínimo
        if weekly_scores:
            users_to_update = db.query(models.User).filter(models.User.id.in_(list(weekly_scores.keys()))).all()
            for user_obj in users_to_update:
                # Incrementa weeks_won em 1 para cada usuário elegível
                user_obj.weeks_won += 1
            db.commit()

        # Registra que essa semana foi processada
        new_update = models.WeeklyUpdate(week_start=start_dt, week_end=end_dt)
        db.add(new_update)
        db.commit()

    # para o podium, vamos considerar os checkins da última semana
    weekly_data = db.query(models.CheckIn.user_id, func.count(models.CheckIn.id).label("count")).filter(
        models.CheckIn.timestamp >= start_dt,
        models.CheckIn.timestamp <= end_dt
    ).group_by(models.CheckIn.user_id).all()
    weekly_scores = { user_id: count for user_id, count in weekly_data if count >= MIN_TRAINING_DAYS }
    
    eligible_users = []
    if weekly_scores:
        eligible_users = db.query(models.User).filter(models.User.id.in_(list(weekly_scores.keys()))).all()
    # Anexa o atributo "weekly_score" para ordenação
    for user_obj in eligible_users:
        user_obj.weekly_score = weekly_scores.get(user_obj.id, 0)
    
    podium_users = sorted(eligible_users, key=lambda u: u.weekly_score, reverse=True)[:3]
    podium_data = [
        {
            "id": u.id,
            "username": u.username,
            "profile_image": u.profile_image,
            "points": u.points,
            "weekly_score": u.weekly_score,
        }
        for u in podium_users
    ]
    
    # Resumo geral: retorna todos os usuários ordenados por weeks_won (descendente)
    summary_users = db.query(models.User).order_by(models.User.weeks_won.desc()).all()
    summary_data = [
        {
            "id": u.id,
            "username": u.username,
            "profile_image": u.profile_image,
            "weeks_won": u.weeks_won,
        }
        for u in summary_users
    ]
    
    return {"podium": podium_data, "summary": summary_data}
