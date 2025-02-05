from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import shutil
from . import schemas, crud, auth, database
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

# Endpoint para atualizar o perfil do usuário com upload de imagem
@router.put("/users/me", response_model=schemas.User)
def update_profile(username: str = None, file: UploadFile = File(None), db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    # Se houver arquivo, salve-o
    if file:
        file_location = f"static/profile_images/{current_user.id}_{file.filename}"
        os.makedirs(os.path.dirname(file_location), exist_ok=True)
        with open(file_location, "wb") as f:
            shutil.copyfileobj(file.file, f)
        current_user.profile_image = file_location  # ou uma URL baseada nisso
    if username:
        current_user.username = username
    db.commit()
    db.refresh(current_user)
    return current_user

# Endpoint para listar todos os usuários (admin)
@router.get("/admin/users", response_model=list[schemas.User])
def list_users(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return crud.get_all_users(db)