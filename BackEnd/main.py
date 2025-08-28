import random
import string
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
from passlib.context import CryptContext
import uvicorn
import os
from dotenv import load_dotenv

# Importaciones locales
from database import get_db, engine
from models import Base, Profesora, Asistencia, Clase
from auth import get_current_admin, get_current_user, create_access_token
from startup_admin import ensure_admin
from pydantic import BaseModel

# Crear las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Asistencia TecnoAcademia")
# --- Router de asistencia añadido ---
from routers.asistencia import router as asistencia_router
app.include_router(asistencia_router)


# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Esquemas Pydantic
class ProfesoraCreate(BaseModel):
    nombre: str
    email: str
    password: str
    especialidad: str

class ProfesoraResponse(BaseModel):
    id: int
    nombre: str
    email: str
    especialidad: str
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class AsistenciaCreate(BaseModel):
    profesora_id: int
    fecha: datetime
    presente: bool
    observaciones: Optional[str] = None

class AsistenciaResponse(BaseModel):
    id: int
    profesora_id: int
    fecha: datetime
    presente: bool
    observaciones: Optional[str]
    profesora: ProfesoraResponse
    
    class Config:
        from_attributes = True

class ClaseCreate(BaseModel):
    profesora_id: int
    titulo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    ubicacion: str  # "Colegio" o "Centro TecnoAcademia"
    descripcion: Optional[str] = None

class ClaseResponse(BaseModel):
    id: int
    profesora_id: int
    titulo: str
    fecha_inicio: datetime
    fecha_fin: datetime
    ubicacion: str
    descripcion: Optional[str]
    profesora: ProfesoraResponse
    
    class Config:
        from_attributes = True

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Endpoints de autenticación
@app.post("/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    profesora = db.query(Profesora).filter(Profesora.email == login_data.email).first()
    
    if not profesora or not pwd_context.verify(login_data.password, profesora.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    access_token = create_access_token(data={"sub": profesora.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "profesora": ProfesoraResponse.model_validate(profesora)
    }

@app.post("/register", response_model=ProfesoraResponse)
async def register(profesora_data: ProfesoraCreate, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    existing_profesora = db.query(Profesora).filter(Profesora.email == profesora_data.email).first()
    if existing_profesora:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nueva profesora
    hashed_password = pwd_context.hash(profesora_data.password)
    profesora = Profesora(
        nombre=profesora_data.nombre,
        email=profesora_data.email,
        hashed_password=hashed_password,
        especialidad=profesora_data.especialidad
    )
    
    db.add(profesora)
    db.commit()
    db.refresh(profesora)
    
    return ProfesoraResponse.model_validate(profesora)

# Endpoints de profesoras
@app.get("/profesoras", response_model=List[ProfesoraResponse])
async def get_profesoras(
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profesoras = db.query(Profesora).all()
    return [ProfesoraResponse.model_validate(p) for p in profesoras]

@app.get("/me", response_model=ProfesoraResponse)
async def get_current_profesora(current_user: Profesora = Depends(get_current_user)):
    return ProfesoraResponse.model_validate(current_user)


# Endpoints de clases
@app.post("/clases", response_model=ClaseResponse)
async def crear_clase(
    clase_data: ClaseCreate,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clase = Clase(**clase_data.model_dump())
    db.add(clase)
    db.commit()
    db.refresh(clase)
    
    return ClaseResponse.model_validate(clase)

@app.get("/clases", response_model=List[ClaseResponse])
async def get_clases(
    profesora_id: Optional[int] = None,
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Clase)
    
    if profesora_id:
        query = query.filter(Clase.profesora_id == profesora_id)
    
    if fecha_inicio:
        query = query.filter(Clase.fecha_inicio >= fecha_inicio)
    
    if fecha_fin:
        query = query.filter(Clase.fecha_fin <= fecha_fin)
    
    clases = query.order_by(Clase.fecha_inicio).all()
    return [ClaseResponse.model_validate(c) for c in clases]

@app.get("/clases/calendario")
async def get_calendario_clases(
    mes: Optional[int] = None,
    año: Optional[int] = None,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not mes or not año:
        now = datetime.now()
        mes = mes or now.month
        año = año or now.year
    
    # Primer y último día del mes
    primer_dia = datetime(año, mes, 1)
    if mes == 12:
        ultimo_dia = datetime(año + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo_dia = datetime(año, mes + 1, 1) - timedelta(days=1)
    
    clases = db.query(Clase).filter(
        Clase.fecha_inicio >= primer_dia,
        Clase.fecha_inicio <= ultimo_dia
    ).all()
    
    return [ClaseResponse.model_validate(c) for c in clases]

if __name__ == "__main__":
    ensure_admin()
    uvicorn.run(app, host="0.0.0.0", port=8000)
