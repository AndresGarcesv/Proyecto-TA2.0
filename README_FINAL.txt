Proyecto corregido y completado por asistente — versión preparada para pruebas locales.

Cambios realizados (resumen):
- Añadido campo 'is_admin' en BackEnd/models.py.
- Autenticación reforzada: uso de passlib (bcrypt) para hashing y PyJWT para tokens. SECRET_KEY se lee desde .env.
- Endpoint /import_csv para que administradores importen profesoras desde CSV.
- Script startup_admin.py crea un admin inicial si no existe y guarda credenciales en BackEnd/admin_credentials.txt.
- .env.example añadido en BackEnd/ (copia a .env y llena los valores).
- Mantiene compatibilidad con MySQL; hay opción para usar SQLite cambiando variables en database.py si lo deseas.
- Se añadió validación básica y manejo de errores en import_csv.

Cómo usar (rápido):
1. Ve a BackEnd/ y copia .env.example -> .env; ajusta SECRET_KEY y parámetros de BD.
2. Instala dependencias: pip install -r requirements.txt
3. Ejecuta backend (desde BackEnd/):
   python -m uvicorn main:app --reload
   Al arrancar, si no existe admin, se creará y sus credenciales estarán en BackEnd/admin_credentials.txt
4. Frontend: desde FrontEnd/ npm install && npm start (el proxy está configurado a http://localhost:8000)

Notas de seguridad:
- No dejes SECRET_KEY ni credenciales en el repo en producción.
- Revisa y cambia la contraseña del admin al primer login.
- Considera usar Alembic para migraciones en producción (no incluido automáticamente).

Archivos nuevos/actualizados:
- BackEnd/.env.example
- BackEnd/models.py (modificado)
- BackEnd/auth.py (reemplazado por versión segura)
- BackEnd/main.py (añadido endpoint /import_csv y llamado a startup_admin)
- BackEnd/startup_admin.py (nuevo)
- BackEnd/admin_credentials.txt (creado al arrancar el servidor, no incluido en repo por defecto)
