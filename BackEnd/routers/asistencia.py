from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Aprendiz, Asistencia, Profesora
from auth import get_current_user
from datetime import datetime, date
import pandas as pd
from fastapi.responses import StreamingResponse
import io
from typing import Optional

router = APIRouter(prefix="/asistencia", tags=["Asistencia"])

def _parse_date_col(col):
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(col), fmt).date()
        except Exception:
            continue
    return None

# Endpoint faltante para obtener asistencias
@router.get("/")
def obtener_asistencias(
    profesora_id: Optional[int] = Query(None),
    fecha_inicio: Optional[str] = Query(None),
    fecha_fin: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Obtener asistencias con filtros opcionales"""
    query = db.query(Asistencia).join(Profesora)
    
    # Si no es admin, solo sus propias asistencias
    if not getattr(user, 'is_admin', False):
        query = query.filter(Asistencia.profesora_id == user.id)
    elif profesora_id:
        query = query.filter(Asistencia.profesora_id == profesora_id)
    
    if fecha_inicio:
        try:
            fecha_ini = datetime.strptime(fecha_inicio, "%Y-%m-%d").date()
            query = query.filter(Asistencia.fecha >= fecha_ini)
        except ValueError:
            pass
    
    if fecha_fin:
        try:
            fecha_fin_date = datetime.strptime(fecha_fin, "%Y-%m-%d").date()
            query = query.filter(Asistencia.fecha <= fecha_fin_date)
        except ValueError:
            pass
    
    asistencias = query.all()
    
    # Formatear respuesta similar a como espera el frontend
    result = []
    for asist in asistencias:
        result.append({
            "id": asist.id,
            "fecha": asist.fecha.isoformat(),
            "presente": asist.presente,
            "profesora": {
                "id": asist.profesora.id,
                "nombre": asist.profesora.nombre,
                "especialidad": asist.profesora.especialidad
            },
            "aprendiz": {
                "id": asist.aprendiz.id,
                "nombre": asist.aprendiz.nombre,
                "documento": asist.aprendiz.documento
            },
            "observaciones": None  # Agregar si tienes este campo
        })
    
    return result

@router.post("/importar/")
async def importar_asistencia(
    archivo: UploadFile = File(...), 
    nombre_lista: str = "Importada", 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    """Importar asistencia desde Excel - solo requiere login, no admin"""
    # lee excel
    try:
        df = pd.read_excel(archivo.file, engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo Excel: {e}")

    # detectar columna de nombre
    nombre_col = None
    for cand in ["NOMBRES", "NOMBRE", "Nombres", "Nombre"]:
        if cand in df.columns:
            nombre_col = cand
            break
    if nombre_col is None:
        nombre_col = df.columns[0]

    # detectar columnas fecha
    fecha_cols = []
    for col in df.columns:
        if _parse_date_col(col):
            fecha_cols.append((col, _parse_date_col(col)))

    # crear aprendices y asistencias
    created = 0
    for _, row in df.iterrows():
        nombre = str(row.get(nombre_col, "")).strip()
        if not nombre:
            continue
        documento = str(row.get("DOCUMENTO", "")).strip() if "DOCUMENTO" in df.columns else None
        aprendiz = db.query(Aprendiz).filter(Aprendiz.documento == documento, Aprendiz.profesora_id == user.id).first() if documento else None
        if not aprendiz:
            aprendiz = Aprendiz(nombre=nombre, documento=documento or None, profesora_id=user.id)
            db.add(aprendiz)
            db.commit()
            db.refresh(aprendiz)
        # insertar asistencias
        for colname, fecha in fecha_cols:
            val = row.get(colname)
            presente = False
            if pd.notna(val):
                s = str(val).strip().lower()
                if s in ("x","1","true","si","sí","y"):
                    presente = True
                else:
                    try:
                        if float(val) != 0:
                            presente = True
                    except Exception:
                        presente = True
            # upsert asistencia
            a = db.query(Asistencia).filter(Asistencia.aprendiz_id==aprendiz.id, Asistencia.fecha==fecha).first()
            if a:
                a.presente = presente
            else:
                a = Asistencia(aprendiz_id=aprendiz.id, fecha=fecha, presente=presente, profesora_id=user.id)
                db.add(a)
        created += 1
    db.commit()
    return {"ok": True, "creados": created}

@router.get("/listas/")
def obtener_listas(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # devolver aprendices de la profesora y resumen
    aprendices = db.query(Aprendiz).filter(Aprendiz.profesora_id == user.id).all()
    result = []
    for ap in aprendices:
        total = sum(1 for a in ap.asistencias if a.presente)
        result.append({"id": ap.id, "nombre": ap.nombre, "documento": ap.documento, "total": total})
    return result

@router.get("/detalle/{aprendiz_id}")
def detalle_aprendiz(aprendiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ap = db.query(Aprendiz).filter(Aprendiz.id==aprendiz_id, Aprendiz.profesora_id==user.id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Aprendiz no encontrado o no autorizado")
    fechas = sorted([a.fecha for a in ap.asistencias])
    asist_map = {a.fecha.isoformat(): a.presente for a in ap.asistencias}
    return {"id": ap.id, "nombre": ap.nombre, "documento": ap.documento, "fechas": [f.isoformat() for f in fechas], "asistencias": asist_map}

from pydantic import BaseModel
class ToggleAttendance(BaseModel):
    aprendiz_id: int
    fecha: str
    presente: bool

@router.patch("/toggle/")
def toggle_attendance(item: ToggleAttendance, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ap = db.query(Aprendiz).filter(Aprendiz.id==item.aprendiz_id, Aprendiz.profesora_id==user.id).first()
    if not ap:
        raise HTTPException(status_code=404, detail="Aprendiz no encontrado o no autorizado")
    fecha = datetime.fromisoformat(item.fecha).date()
    a = db.query(Asistencia).filter(Asistencia.aprendiz_id==item.aprendiz_id, Asistencia.fecha==fecha).first()
    if a:
        a.presente = item.presente
    else:
        a = Asistencia(aprendiz_id=item.aprendiz_id, fecha=fecha, presente=item.presente, profesora_id=user.id)
        db.add(a)
    db.commit()
    return {"ok": True}

@router.get("/exportar/")
def exportar_csv(db: Session = Depends(get_db), user=Depends(get_current_user)):
    aprendices = db.query(Aprendiz).filter(Aprendiz.profesora_id==user.id).all()
    rows = []
    fechas_set = set()
    for ap in aprendices:
        for a in ap.asistencias:
            fechas_set.add(a.fecha)
    fechas = sorted(list(fechas_set))
    for ap in aprendices:
        row = {"NOMBRES": ap.nombre, "DOCUMENTO": ap.documento}
        total = 0
        for f in fechas:
            a = next((x for x in ap.asistencias if x.fecha==f), None)
            presente = bool(a.presente) if a else False
            row[f.strftime("%d/%m/%Y")] = "X" if presente else ""
            if presente:
                total += 1
        row["TOTAL"] = total
        rows.append(row)
    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(stream, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=asistencia.csv"})

# Endpoint para crear asistencia individual (si lo necesitas)
@router.post("/")
def crear_asistencia(
    aprendiz_id: int,
    fecha: str,
    presente: bool = True,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Crear una asistencia individual"""
    # Verificar que el aprendiz pertenece a la profesora
    aprendiz = db.query(Aprendiz).filter(
        Aprendiz.id == aprendiz_id,
        Aprendiz.profesora_id == user.id
    ).first()
    
    if not aprendiz:
        raise HTTPException(status_code=404, detail="Aprendiz no encontrado")
    
    try:
        fecha_obj = datetime.fromisoformat(fecha).date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")
    
    # Verificar si ya existe
    existing = db.query(Asistencia).filter(
        Asistencia.aprendiz_id == aprendiz_id,
        Asistencia.fecha == fecha_obj
    ).first()
    
    if existing:
        existing.presente = presente
        asistencia = existing
    else:
        asistencia = Asistencia(
            aprendiz_id=aprendiz_id,
            fecha=fecha_obj,
            presente=presente,
            profesora_id=user.id
        )
        db.add(asistencia)
    
    db.commit()
    db.refresh(asistencia)
    
    return {
        "id": asistencia.id,
        "aprendiz_id": asistencia.aprendiz_id,
        "fecha": asistencia.fecha.isoformat(),
        "presente": asistencia.presente
    }