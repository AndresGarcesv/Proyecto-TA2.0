from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models import Aprendiz, Profesora
from auth import get_current_user

router = APIRouter(prefix="/aprendices", tags=["aprendices"])

# Esquemas Pydantic para Aprendices
class AprendizCreate(BaseModel):
    nombre: str
    documento: Optional[str] = None
    profesora_id: Optional[int] = None  # Si no se especifica, usa el usuario actual

class AprendizUpdate(BaseModel):
    nombre: Optional[str] = None
    documento: Optional[str] = None
    profesora_id: Optional[int] = None

class AprendizResponse(BaseModel):
    id: int
    nombre: str
    documento: Optional[str]
    profesora_id: int
    profesora: Optional[dict] = None  # Información básica de la profesora
    
    class Config:
        from_attributes = True

# CRUD Endpoints para Aprendices
@router.post("", response_model=AprendizResponse)
async def crear_aprendiz(
    aprendiz_data: AprendizCreate,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Si no se especifica profesora_id, usar el usuario actual
    profesora_id = aprendiz_data.profesora_id or current_user.id
    
    # Verificar que la profesora existe (si no es el usuario actual)
    if profesora_id != current_user.id:
        profesora = db.query(Profesora).filter(Profesora.id == profesora_id).first()
        if not profesora:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profesora no encontrada"
            )
    
    aprendiz = Aprendiz(
        nombre=aprendiz_data.nombre,
        documento=aprendiz_data.documento,
        profesora_id=profesora_id
    )
    
    db.add(aprendiz)
    db.commit()
    db.refresh(aprendiz)
    
    return AprendizResponse.model_validate(aprendiz)

@router.get("", response_model=List[AprendizResponse])
async def get_aprendices(
    profesora_id: Optional[int] = None,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Aprendiz)
    
    # Si no es admin, solo mostrar sus propios aprendices
    if not current_user.is_admin:
        query = query.filter(Aprendiz.profesora_id == current_user.id)
    elif profesora_id:
        query = query.filter(Aprendiz.profesora_id == profesora_id)
    
    aprendices = query.all()
    return [AprendizResponse.model_validate(a) for a in aprendices]

@router.get("/{aprendiz_id}", response_model=AprendizResponse)
async def get_aprendiz(
    aprendiz_id: int,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    aprendiz = db.query(Aprendiz).filter(Aprendiz.id == aprendiz_id).first()
    
    if not aprendiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aprendiz no encontrado"
        )
    
    # Verificar permisos (solo admin o la profesora del aprendiz)
    if not current_user.is_admin and aprendiz.profesora_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este aprendiz"
        )
    
    return AprendizResponse.model_validate(aprendiz)

@router.put("/{aprendiz_id}", response_model=AprendizResponse)
async def actualizar_aprendiz(
    aprendiz_id: int,
    aprendiz_data: AprendizUpdate,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    aprendiz = db.query(Aprendiz).filter(Aprendiz.id == aprendiz_id).first()
    
    if not aprendiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aprendiz no encontrado"
        )
    
    # Verificar permisos
    if not current_user.is_admin and aprendiz.profesora_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar este aprendiz"
        )
    
    # Actualizar campos
    update_data = aprendiz_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(aprendiz, field, value)
    
    db.commit()
    db.refresh(aprendiz)
    
    return AprendizResponse.model_validate(aprendiz)

@router.delete("/{aprendiz_id}")
async def eliminar_aprendiz(
    aprendiz_id: int,
    current_user: Profesora = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    aprendiz = db.query(Aprendiz).filter(Aprendiz.id == aprendiz_id).first()
    
    if not aprendiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aprendiz no encontrado"
        )
    
    # Verificar permisos
    if not current_user.is_admin and aprendiz.profesora_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar este aprendiz"
        )
    
    db.delete(aprendiz)
    db.commit()
    
    return {"message": "Aprendiz eliminado exitosamente"}
