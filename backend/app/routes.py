from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import os, shutil
from . import schemas, crud, auth, database, models
from .config import MIN_TRAINING_DAYS

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

from jose import JWTError  # se você estiver usando python-jose

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        token_data = auth.decode_token(token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    
    # Aqui, supondo que a sua classe TokenData tem a propriedade "username"
    if token_data is None or not token_data.username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    
    user = crud.get_user_by_username(db, token_data.username)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user


@router.get("/admin/users", response_model=list[schemas.User])
def list_users(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return crud.get_all_users(db)


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
    # Definir a semana atual: começando no último domingo.
    today = datetime.utcnow().date()
    days_to_subtract = (today.weekday() + 1) % 7  # Se hoje for domingo, subtrai 0.
    last_sunday = today - timedelta(days=days_to_subtract)
    start_dt = datetime.combine(last_sunday, datetime.min.time())
    now = datetime.utcnow()  # Fim: agora (para exibição, mesmo se a semana não estiver completa)

    # Defina o último sábado da semana
    last_saturday = last_sunday + timedelta(days=6)
    week_closed = now >= datetime.combine(last_saturday, datetime.max.time())
    end_dt = datetime.combine(last_saturday, datetime.max.time()) if week_closed else now

    # Consulta todos os checkins da semana atual (desde o último domingo até end_dt)
    weekly_data = db.query(
        models.CheckIn.user_id,
        func.count(models.CheckIn.id).label("count")
    ).filter(
        models.CheckIn.timestamp >= start_dt,
        models.CheckIn.timestamp <= end_dt
    ).group_by(models.CheckIn.user_id).all()
    
    # Cria um dicionário com a contagem real de checkins (sem filtro)
    display_scores = {user_id: count for user_id, count in weekly_data}
    
    # Função para calcular os pontos projetados com base no número de checkins
    def calculate_points(count):
        if count < MIN_TRAINING_DAYS:
            return 0
        return 10 + 3 * (count - MIN_TRAINING_DAYS)
    
    # Para atualização de pontos no banco (somente se a semana estiver completa)
    if week_closed:
        weekly_record = db.query(models.WeeklyUpdate).filter(
            models.WeeklyUpdate.week_start == start_dt,
            models.WeeklyUpdate.week_end == datetime.combine(last_saturday, datetime.max.time())
        ).first()
        if not weekly_record:
            # Filtra os usuários que cumpriram o mínimo
            eligible_scores = {user_id: count for user_id, count in weekly_data if count >= MIN_TRAINING_DAYS}
            if eligible_scores:
                users_to_update = db.query(models.User).filter(
                    models.User.id.in_(list(eligible_scores.keys()))
                ).all()
                for user_obj in users_to_update:
                    count = eligible_scores[user_obj.id]
                    total_points = calculate_points(count)
                    user_obj.weeks_won += 1
                    user_obj.points += total_points
                db.commit()
            new_update = models.WeeklyUpdate(
                week_start=start_dt,
                week_end=datetime.combine(last_saturday, datetime.max.time())
            )
            db.add(new_update)
            db.commit()

    # Para exibição: buscar os usuários que fizeram checkins na semana
    if display_scores:
        display_users = db.query(models.User).filter(
            models.User.id.in_(list(display_scores.keys()))
        ).all()
    else:
        display_users = []
    
    # Anexa a cada usuário o campo "weekly_score" e "calculated_points"
    for user_obj in display_users:
        count = display_scores.get(user_obj.id, 0)
        user_obj.weekly_score = count
        user_obj.calculated_points = calculate_points(count)
    
    # Ordena os usuários por weekly_score (decrescente)
    display_users.sort(key=lambda u: u.weekly_score, reverse=True)
    
    # Define o podium como os 3 primeiros (se existirem)
    podium_users = display_users[:3]
    podium_data = [
        {
            "id": u.id,
            "username": u.username,
            "profile_image": u.profile_image,
            "points": u.points,  # pontos acumulados (atualizados se a semana estiver fechada)
            "weekly_score": u.weekly_score,
            "calculated_points": u.calculated_points  # pontos projetados para esta semana
        }
        for u in podium_users
    ]
    
    # Para o resumo geral, mantemos a lógica anterior (usuários ordenados por weeks_won)
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
    
    # Retorne também o dicionário display_scores para depuração, se desejar.
    return {
        "podium": podium_data,
        "summary": summary_data,
        "weekly": list(display_scores.items())
    }




@router.get("/ranking/overall")
def overall_ranking(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.weeks_won.desc()).all()
    data = [
        {
            "id": u.id,
            "username": u.username,
            "profile_image": u.profile_image,
            "weeks_won": u.weeks_won,
            "points": u.points
        }
        for u in users
    ]
    return {"overall": data}

@router.post("/challenges/", response_model=schemas.Challenge)
def create_challenge(challenge: schemas.ChallengeCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    # O usuário criador é o usuário logado
    challenge_data = challenge.dict()
    challenge_data["created_by"] = current_user.id
    db_challenge = models.Challenge(**challenge_data)
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge

@router.get("/challenges/", response_model=list[schemas.Challenge])
def list_challenges(db: Session = Depends(get_db)):
    return db.query(models.Challenge).all()

@router.get("/challenges/{challenge_id}", response_model=schemas.Challenge)
def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    return challenge

@router.post("/challenges/{challenge_id}/join", response_model=schemas.ChallengeParticipant)
def join_challenge(challenge_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    existing = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Você já entrou neste desafio")
    participant = models.ChallengeParticipant(challenge_id=challenge_id, user_id=current_user.id)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant

@router.put("/challenges/{challenge_id}/participant", response_model=schemas.ChallengeParticipant)
def update_challenge_participant(
    challenge_id: int,
    progress: int = None,
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    participant = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participação não encontrada")
    
    if progress is not None:
        participant.progress = progress

    if file:
        directory = "static/challenge_submissions"
        os.makedirs(directory, exist_ok=True)
        filename = f"{current_user.id}_{challenge_id}_{file.filename}"
        file_location = f"{directory}/{filename}"
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        participant.submission_image = f"{backend_url}/static/challenge_submissions/{filename}"
    
    db.commit()
    db.refresh(participant)
    return participant

@router.get("/challenges/{challenge_id}/ranking", response_model=list[schemas.ChallengeParticipant])
def challenge_ranking(challenge_id: int, db: Session = Depends(get_db)):
    participants = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id
    ).order_by(models.ChallengeParticipant.progress.desc()).all()
    return participants