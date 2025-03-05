from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
import os, shutil
import logging
from . import schemas, crud, auth, database, models
from .config import MIN_TRAINING_DAYS

from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

router = APIRouter()
logger = logging.getLogger(__name__)

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

@router.get("/users/{user_id}/checkins/period/")
def get_checkins_by_period(
    user_id: int, 
    start_date: datetime, 
    end_date: datetime, 
    db: Session = Depends(get_db)
):
    return db.query(models.CheckIn).filter(
        models.CheckIn.user_id == user_id,
        models.CheckIn.timestamp >= start_date,
        models.CheckIn.timestamp <= end_date
    ).all()
    
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

@router.get("/ranking/", response_model=list[schemas.User])
def get_ranking(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.points.desc()).limit(limit).all()

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
        current_user.profile_image = f"https://ultimoingresso.com.br/api/static/profile_images/{filename}"
    if username:
        current_user.username = username
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/challenges/", response_model=schemas.Challenge)
def create_challenge(
    challenge: schemas.ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    data = challenge.dict()
    data["created_by"] = current_user.id
    if data.get("start_date") and data.get("duration_days") and not data.get("end_date"):
        data["end_date"] = data["start_date"] + timedelta(days=data["duration_days"] - 1)
    db_challenge = models.Challenge(**data)
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)

    # Adiciona o criador como participante aprovado
    participant = models.ChallengeParticipant(
        challenge_id=db_challenge.id,
        user_id=current_user.id,
        approved=True
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    return db_challenge


@router.get("/challenges/", response_model=list[schemas.Challenge])
def list_challenges(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    # Se o desafio for privado, somente o criador ou os convidados podem ver.
    # Aqui, por exemplo, retornamos apenas os desafios criados pelo usuário.
    return db.query(models.Challenge).filter(models.Challenge.created_by == current_user.id).all()

@router.get("/challenges/{challenge_id}", response_model=schemas.Challenge)
def get_challenge(challenge_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    # Opcional: verificar se o usuário tem permissão para ver este desafio.
    return challenge

@router.put("/challenges/{challenge_id}", response_model=schemas.Challenge)
def update_challenge(challenge_id: int, challenge: schemas.ChallengeCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    if db_challenge.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o criador pode editar o desafio")
    if db_challenge.start_date <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Desafio já iniciado não pode ser editado")
    data = challenge.dict()
    if data.get("start_date") and data.get("duration_days") and not data.get("end_date"):
        data["end_date"] = data["start_date"] + timedelta(days=data["duration_days"] - 1)
    if data.get("start_date") and data.get("end_date") and not data.get("duration_days"):
        data["duration_days"] = (data["end_date"].date() - data["start_date"].date()).days + 1
    for key, value in data.items():
        setattr(db_challenge, key, value)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge


@router.delete("/challenges/{challenge_id}")
def delete_challenge(challenge_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    if challenge.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado")
    if challenge.start_date <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Desafio já iniciado não pode ser excluído")
    db.delete(challenge)
    db.commit()
    return {"detail": "Desafio excluído com sucesso"}


@router.get("/challenges/{challenge_id}/participants", response_model=list[schemas.ChallengeParticipantResponse])
def get_challenge_participants(challenge_id: int, db: Session = Depends(get_db)):
    # Carrega os registros de participação aprovados, incluindo o usuário
    participants = db.query(models.ChallengeParticipant)\
        .options(joinedload(models.ChallengeParticipant.user))\
        .filter(
            models.ChallengeParticipant.challenge_id == challenge_id,
            models.ChallengeParticipant.approved == True
        ).all()
    return participants



@router.post("/challenges/{challenge_id}/join", response_model=schemas.ChallengeParticipant)
def join_challenge(challenge_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    existing = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id
    ).first()
    if existing:
        return existing  # Retorna o registro existente para que o frontend exiba “Aguardando aprovação”
    participant = models.ChallengeParticipant(challenge_id=challenge_id, user_id=current_user.id)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.get("/challenges/{challenge_id}/pending", response_model=list[schemas.ChallengeParticipant])
def list_pending_participants(challenge_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge or challenge.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    pending = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.approved == False
    ).all()
    return pending

@router.post("/challenges/{challenge_id}/approve", response_model=schemas.ChallengeParticipant)
def approve_participant(
    challenge_id: int,
    request: schemas.ApproveRequest,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge or challenge.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    participant = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.id == request.participant_id,
        models.ChallengeParticipant.challenge_id == challenge_id
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participação não encontrada")
    participant.approved = True
    db.commit()
    db.refresh(participant)
    return participant

@router.get("/challenges/{challenge_id}/activity")
def get_challenge_activity(challenge_id: int, limit: int = 10, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    # Verifica se o desafio existe
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Verifica se o usuário participa do desafio ou é o criador
    participation = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id,
        models.ChallengeParticipant.approved == True
    ).first()
    
    if not participation and challenge.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Você não participa deste desafio")
    
    # SOLUÇÃO TEMPORÁRIA:
    # Como seus check-ins atuais não têm challenge_id, buscaremos check-ins gerais 
    # e assumiremos que pertencem ao desafio para propósitos de demonstração
    recent_checkins = db.query(models.CheckIn).filter(
        models.CheckIn.user_id == current_user.id
    ).order_by(models.CheckIn.timestamp.desc()).limit(limit).all()
    
    # Formata os resultados
    activity = []
    for checkin in recent_checkins:
        # Busca o usuário relacionado ao check-in
        user = db.query(models.User).filter(models.User.id == checkin.user_id).first()
        activity.append({
            "id": checkin.id,
            "user_id": checkin.user_id,
            "username": user.username if user else "Usuário desconhecido",
            "profile_image": user.profile_image if user else None,
            "timestamp": checkin.timestamp,
            "duration": checkin.duration,
            "description": checkin.description,
            "type": "checkin"
        })
    
    # Limita ao número solicitado
    return activity
    
@router.get("/challenges/{challenge_id}/ranking")
def challenge_ranking(challenge_id: int, period: str = "weekly", db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    participation = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id,
        models.ChallengeParticipant.approved == True
    ).first()
    if not participation:
        raise HTTPException(status_code=403, detail="Você não participa deste desafio")
    
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")

    participants = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.approved == True
    ).options(joinedload(models.ChallengeParticipant.user)).all()

    if period == "weekly":
        today = datetime.utcnow().date()
        start_of_week = today - timedelta(days=today.weekday() + 1)  # Domingo
        start_dt = datetime.combine(start_of_week, datetime.min.time())
        end_dt = datetime.utcnow()

        checkins = db.query(models.CheckIn).filter(
            models.CheckIn.challenge_id == challenge_id,
            models.CheckIn.timestamp >= start_dt,
            models.CheckIn.timestamp <= end_dt
        ).all()
        checkin_counts = {}
        for c in checkins:
            checkin_counts[c.user_id] = checkin_counts.get(c.user_id, 0) + 1

        ranked = sorted(participants, key=lambda p: checkin_counts.get(p.user_id, 0), reverse=True)
    else:  # overall
        ranked = sorted(participants, key=lambda p: p.progress, reverse=True)

    current_rank = 1
    previous_score = None
    podium = []
    others = []
    for i, p in enumerate(ranked):
        score = checkin_counts.get(p.user_id, 0) if period == "weekly" else p.progress
        if i > 0 and score < previous_score:
            current_rank = i + 1
        previous_score = score
        user_data = {
            "id": p.user.id,
            "username": p.user.username,
            "profile_image": p.user.profile_image,
            "weekly_score": score,
            "rank": current_rank
        }
        if current_rank <= 3:
            podium.append(user_data)
        else:
            others.append(user_data)

    return {"podium": podium, "others": others, "title": challenge.title}

@router.post("/challenges/{challenge_id}/checkin", response_model=schemas.CheckIn)
def create_challenge_checkin(
    challenge_id: int,
    checkin: schemas.CheckInCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    # Verifica se o desafio existe
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")

    # Verifica se o usuário participa do desafio e está aprovado
    participation = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id,
        models.ChallengeParticipant.approved == True
    ).first()
    if not participation:
        raise HTTPException(status_code=403, detail="Você não participa deste desafio ou não foi aprovado")

    # Garante que o check-in é para o usuário atual
    if checkin.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado a criar check-in para outro usuário")

    # Cria o check-in vinculado ao desafio
    checkin_data = checkin.dict()
    checkin_data["challenge_id"] = challenge_id
    db_checkin = models.CheckIn(**checkin_data)
    db.add(db_checkin)
    db.commit()
    db.refresh(db_checkin)
    
    # Atualiza os pontos do desafio
    crud.update_challenge_points(db, current_user.id, challenge_id)
    
    return db_checkin

@router.get("/challenges/invite/{code}", response_model=schemas.Challenge)
def get_challenge_by_code(code: str, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.code == code).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    return challenge

@router.get("/challenges/{challenge_id}/participant-status", response_model=schemas.ChallengeParticipant)
def participant_status(challenge_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    participant = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participação não encontrada")
    return participant


@router.get("/challenge-participation/", response_model=list[schemas.ChallengeParticipationResponse])
def get_participated_challenges(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    participation = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.user_id == current_user.id
    ).all()
    challenge_ids = [p.challenge_id for p in participation]
    challenges = db.query(models.Challenge).options(joinedload(models.Challenge.creator)).filter(
        models.Challenge.id.in_(challenge_ids)
    ).all()
    challenge_dict = {c.id: c for c in challenges}
    response = []
    for p in participation:
        ch = challenge_dict.get(p.challenge_id)
        if ch:
            response.append({"challenge": ch, "participant": p})
    return response


@router.delete("/challenge-participants/{participant_id}", status_code=204)
def delete_challenge_participant(
    participant_id: int, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_user)
):
    participant = db.query(models.ChallengeParticipant).filter(models.ChallengeParticipant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participação não encontrada")
    challenge = db.query(models.Challenge).filter(models.Challenge.id == participant.challenge_id).first()
    # Permitir que o participante cancele OU que o criador remova o participante
    if not (participant.user_id == current_user.id or challenge.created_by == current_user.id):
        raise HTTPException(status_code=403, detail="Não autorizado")
    db.delete(participant)
    db.commit()
    return {"detail": "Participação removida com sucesso"}


@router.get("/challenge-invitations/", response_model=list[schemas.ChallengeParticipationResponse])
def all_challenge_invitations(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    created_challenges = db.query(models.Challenge).options(joinedload(models.Challenge.creator)).filter(
        models.Challenge.created_by == current_user.id
    ).all()
    created_ids = [c.id for c in created_challenges]
    pending = db.query(models.ChallengeParticipant).options(
        joinedload(models.ChallengeParticipant.user)
    ).filter(
        models.ChallengeParticipant.challenge_id.in_(created_ids),
        models.ChallengeParticipant.approved == False
    ).all()
    challenge_dict = {c.id: c for c in created_challenges}
    response = []
    for p in pending:
        ch = challenge_dict.get(p.challenge_id)
        if ch:
            response.append({"challenge": ch, "participant": p})
    return response

@router.post("/admin/recalculate-points", status_code=200)
def recalculate_points(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    crud.recalculate_all_points(db)
    return {"detail": "Points recalculated successfully"}

@router.post("/admin/recalculate-challenge-points", status_code=200)
def recalculate_challenge_points(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    crud.recalculate_all_challenge_points(db)
    return {"detail": "Challenge points recalculated successfully"}

@router.get("/ranking/weekly")
def weekly_ranking(db: Session = Depends(get_db)):
    today = datetime.utcnow()
    start_of_week = today - timedelta(days=(today.weekday() + 1) % 7)
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
    
    logger.debug(f"Week range: {start_of_week} to {end_of_week}")
    
    weekly_data = db.query(models.WeeklyPoints).filter(
        models.WeeklyPoints.week_start == start_of_week,
        models.WeeklyPoints.checkin_count > 0
    ).all()
    
    logger.debug(f"Weekly data: {[(wp.user_id, wp.checkin_count) for wp in weekly_data]}")
    
    if not weekly_data:
        return {
            "podium": [],
            "others": [],
            "week_range": {"start": start_of_week.strftime("%Y-%m-%d"), "end": end_of_week.strftime("%Y-%m-%d")}
        }
    
    display_scores = {wp.user_id: wp.checkin_count for wp in weekly_data}
    user_ids = list(display_scores.keys())
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()
    
    logger.debug(f"Users found: {[(user.id, user.username) for user in users]}")
    
    ranking_list = []
    for user in users:
        weekly_count = display_scores.get(user.id, 0)
        if weekly_count > 0:
            ranking_list.append({
                "id": user.id,
                "username": user.username,
                "profile_image": user.profile_image,
                "weekly_score": weekly_count,
                "rank": 0
            })
    
    logger.debug(f"Ranking list before sorting: {ranking_list}")
    
    ranking_list.sort(key=lambda x: x["weekly_score"], reverse=True)
    
    # Atribui ranks, considerando empates, e ajusta para pódio até 3º lugar
    current_rank = 1
    previous_score = None
    podium_data = []
    
    for i, user_data in enumerate(ranking_list):
        if i > 0 and user_data["weekly_score"] < previous_score:
            current_rank = i + 1
        # Limitar o rank ao máximo de 3, mesmo com empates
        user_data["rank"] = min(current_rank, 3)
        previous_score = user_data["weekly_score"]
        podium_data.append(user_data)
    
    logger.debug(f"Podium: {podium_data}")
    logger.debug(f"Others: []")  # Nenhum "Others", todos no pódio
    
    return {
        "podium": podium_data,
        "others": [],  # Removido "Others" para incluir todos no pódio até 3º
        "week_range": {"start": start_of_week.strftime("%Y-%m-%d"), "end": end_of_week.strftime("%Y-%m-%d")}
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

@router.post("/checkin/", response_model=schemas.CheckIn)
def create_checkin(checkin: schemas.CheckInCreate, current_user: schemas.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if checkin.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não autorizado")
    return crud.create_checkin(db, checkin)

@router.put("/checkins/{checkin_id}", response_model=schemas.CheckIn)
def update_checkin(checkin_id: int, update: schemas.CheckInUpdate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    checkin = crud.get_checkin(db, checkin_id)
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin não encontrado")
    if checkin.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Não autorizado")
    return crud.update_checkin(db, checkin, update)

@router.delete("/checkins/{checkin_id}", status_code=204)
def delete_checkin(checkin_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    checkin = crud.get_checkin(db, checkin_id)
    if not checkin:
        raise HTTPException(status_code=404, detail="Checkin não encontrado")
    if checkin.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Não autorizado")
    crud.delete_checkin(db, checkin)
    return

# Notificações
@router.get("/notifications/", response_model=list[schemas.Notification])
def get_notifications(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()

@router.put("/notifications/{notification_id}/read", response_model=schemas.Notification)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    notification.read = True
    db.commit()
    db.refresh(notification)
    return notification

# Conquistas
@router.get("/achievements/", response_model=list[schemas.UserAchievement])
def get_user_achievements(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == current_user.id
    ).all()

# Função auxiliar para criar notificações
def create_notification(db: Session, user_id: int, message: str, type: str, related_user_id: int = None, challenge_id: int = None):
    notification = models.Notification(
        user_id=user_id,
        related_user_id=related_user_id,
        challenge_id=challenge_id,
        type=type,
        message=message
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

# Modificar a rota de check-in para acionar notificações
@router.post("/challenges/{challenge_id}/checkin", response_model=schemas.CheckIn)
def create_challenge_checkin(
    challenge_id: int,
    checkin: schemas.CheckInCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    # O código existente para criar check-in...
    
    # Após criar o check-in, buscar o desafio e outros participantes
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if challenge:
        # Notificar outros participantes
        participants = db.query(models.ChallengeParticipant).filter(
            models.ChallengeParticipant.challenge_id == challenge_id,
            models.ChallengeParticipant.user_id != current_user.id,
            models.ChallengeParticipant.approved == True
        ).all()
        
        for participant in participants:
            create_notification(
                db,
                participant.user_id,
                f"{current_user.username} fez um check-in no desafio '{challenge.title}'",
                "checkin",
                related_user_id=current_user.id,
                challenge_id=challenge_id
            )
    
    return db_checkin  # Retorne o check-in criado

@router.post("/challenges/{challenge_id}/rules", response_model=schemas.ChallengeRules)
def create_challenge_rules(
    challenge_id: int,
    rules: schemas.ChallengeRulesCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    # Verificar se o desafio existe
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Desafio não encontrado")
    
    # Verificar se o usuário é o criador do desafio
    if challenge.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Apenas o criador pode definir regras")
    
    # Verificar se já existem regras
    existing_rules = db.query(models.ChallengeRules).filter(
        models.ChallengeRules.challenge_id == challenge_id
    ).first()
    
    if existing_rules:
        # Atualizar regras existentes
        for key, value in rules.dict().items():
            setattr(existing_rules, key, value)
        db_rules = existing_rules
    else:
        # Criar novas regras
        db_rules = models.ChallengeRules(challenge_id=challenge_id, **rules.dict())
        db.add(db_rules)
    
    db.commit()
    db.refresh(db_rules)
    return db_rules

@router.get("/challenges/{challenge_id}/rules", response_model=schemas.ChallengeRules)
def get_challenge_rules(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    rules = db.query(models.ChallengeRules).filter(
        models.ChallengeRules.challenge_id == challenge_id
    ).first()
    
    if not rules:
        raise HTTPException(status_code=404, detail="Regras não encontradas")
    
    return rules

# Função para calcular pontos com base nas regras específicas do desafio
def calculate_challenge_points(checkin_count: int, rules: models.ChallengeRules) -> int:
    """Calcula pontos baseado nas regras específicas do desafio."""
    if not rules or checkin_count < rules.min_threshold:
        return 0
    
    base_points = rules.min_points
    additional_count = max(0, checkin_count - rules.min_threshold)
    additional_points = (additional_count // rules.additional_unit) * rules.additional_points
    
    return base_points + additional_points

# Modificação na função update_weekly_points em crud.py
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