from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
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
        current_user.profile_image = f"https://ultimoingresso.com.br/api/static/profile_images/{filename}"
    if username:
        current_user.username = username
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/ranking/weekly")
def weekly_ranking(db: Session = Depends(get_db)):
    # Definir a semana para cálculo: queremos usar a semana completa já encerrada.
    today = datetime.utcnow().date()
    # Se hoje for segunda (weekday == 0), queremos a semana anterior.
    if today.weekday() == 0:
        # Se hoje é segunda, last_sunday será hoje - 8 dias (por exemplo, se hoje é 10/02, last_sunday = 02/02)
        last_sunday = today - timedelta(days=8)
    else:
        days_to_subtract = (today.weekday() + 1) % 7  # Por exemplo, se hoje for terça (weekday 1), subtrai 2 dias
        last_sunday = today - timedelta(days=days_to_subtract)
    
    start_dt = datetime.combine(last_sunday, datetime.min.time())
    now = datetime.utcnow()
    
    # Define o último sábado da semana considerada
    last_saturday = last_sunday + timedelta(days=6)
    week_closed = now >= datetime.combine(last_saturday, datetime.max.time())
    end_dt = datetime.combine(last_saturday, datetime.max.time()) if week_closed else now

    # Para debug
    print(f"today: {today}, last_sunday: {last_sunday}, last_saturday: {last_saturday}")
    print(f"now: {now}, week_closed: {week_closed}")
    
    # Consulta os checkins dentro do período definido
    weekly_data = db.query(
        models.CheckIn.user_id,
        func.count(models.CheckIn.id).label("count")
    ).filter(
        models.CheckIn.timestamp >= start_dt,
        models.CheckIn.timestamp <= end_dt
    ).group_by(models.CheckIn.user_id).all()
    print(f"weekly_data: {weekly_data}")
    
    display_scores = {user_id: count for user_id, count in weekly_data}
    print(f"display_scores: {display_scores}")
    
    def calculate_points(count):
        if count < MIN_TRAINING_DAYS:
            return 0
        return 10 + 3 * (count - MIN_TRAINING_DAYS)
    
    if week_closed:
        weekly_record = db.query(models.WeeklyUpdate).filter(
            models.WeeklyUpdate.week_start == start_dt,
            models.WeeklyUpdate.week_end == datetime.combine(last_saturday, datetime.max.time())
        ).first()
        print(f"weekly_record: {weekly_record}")
        if not weekly_record:
            eligible_scores = {user_id: count for user_id, count in weekly_data if count >= MIN_TRAINING_DAYS}
            print(f"eligible_scores: {eligible_scores}")
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
    
    if display_scores:
        display_users = db.query(models.User).filter(
            models.User.id.in_(list(display_scores.keys()))
        ).all()
    else:
        display_users = []
    
    for user_obj in display_users:
        count = display_scores.get(user_obj.id, 0)
        user_obj.weekly_score = count
        user_obj.calculated_points = calculate_points(count)
    
    groups = {}
    for user in display_users:
        score = user.weekly_score
        if score not in groups:
            groups[score] = []
        groups[score].append(user)
    
    sorted_scores = sorted(groups.keys(), reverse=True)
    
    podium_data = []
    others_data = []
    for i, score in enumerate(sorted_scores):
        rank = i + 1
        group_data = [
            {
                "id": u.id,
                "username": u.username,
                "profile_image": u.profile_image,
                "points": u.points,
                "weekly_score": u.weekly_score,
                "calculated_points": u.calculated_points,
                "rank": rank
            }
            for u in groups[score]
        ]
        if rank <= 3:
            podium_data.extend(group_data)
        else:
            others_data.extend(group_data)
    
    summary_users = db.query(models.User).order_by(models.User.weeks_won.desc()).all()
    summary_data = [
        {
            "id": u.id,
            "username": u.username,
            "profile_image": u.profile_image,
            "points": u.points,
            "weekly_score": display_scores.get(u.id, 0),
            "weeks_won": u.weeks_won,
        }
        for u in summary_users
    ]
    return {
        "podium": podium_data,
        "others": others_data,
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
    data = challenge.dict()
    data["created_by"] = current_user.id
    # Se o usuário informou start_date e duration_days mas não end_date, calcule end_date:
    if data.get("start_date") and data.get("duration_days") and not data.get("end_date"):
        data["end_date"] = data["start_date"] + timedelta(days=data["duration_days"] - 1)
    # Se informou start_date e end_date mas não duration_days, calcule a duração:
    if data.get("start_date") and data.get("end_date") and not data.get("duration_days"):
        data["duration_days"] = (data["end_date"].date() - data["start_date"].date()).days + 1
    db_challenge = models.Challenge(**data)
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    return db_challenge


@router.get("/challenges/{challenge_id}/participants/count")
def count_participants(challenge_id: int, db: Session = Depends(get_db)):
    count = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id
    ).count()
    return {"count": count}


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
def approve_participant(challenge_id: int, participant_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge or challenge.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    participant = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.id == participant_id,
        models.ChallengeParticipant.challenge_id == challenge_id
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participação não encontrada")
    participant.approved = True
    db.commit()
    db.refresh(participant)
    return participant

@router.get("/challenges/{challenge_id}/ranking", response_model=list[schemas.ChallengeParticipant])
def challenge_ranking(challenge_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    # Retorna os participantes aprovados ordenados por progress (descendente)
    participants = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.approved == True
    ).order_by(models.ChallengeParticipant.progress.desc()).all()
    return participants

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
    pending = db.query(models.ChallengeParticipant).filter(
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