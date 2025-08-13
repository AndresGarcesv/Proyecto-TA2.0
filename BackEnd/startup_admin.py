# startup_admin.py - crea admin inicial si no existe y escribe credenciales en admin_credentials.txt
import os, random, string
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Profesora, Base
from auth import get_password_hash

def ensure_admin():
    # create tables if not exist
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        admin = db.query(Profesora).filter(Profesora.email == 'admin@local').first()
        if admin:
            return None
        # generar contraseña aleatoria
        pwd = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(12))
        hashed = get_password_hash(pwd)
        admin = Profesora(nombre='Admin', email='admin@local', hashed_password=hashed, especialidad='Admin', is_admin=True)
        db.add(admin)
        db.commit()
        # escribir credenciales en archivo local (no subir a repo en producción)
        with open(os.path.join(os.path.dirname(__file__), 'admin_credentials.txt'), 'w', encoding='utf-8') as f:
            f.write(f'email=admin@local\npassword={pwd}\n')
        return pwd
    except Exception as e:
        db.rollback()
        return None
