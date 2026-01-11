@echo off
REM Setup script para backend Django no Windows

echo ===================================
echo SETUP DO BACKEND EGIDE (Django)
echo ===================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python não encontrado. Instale Python 3.8+ e adicione ao PATH.
    exit /b 1
)

echo [OK] Python encontrado
echo.

REM Criar ambiente virtual
echo Criando ambiente virtual...
if not exist venv (
    python -m venv venv
    echo [OK] Ambiente virtual criado
) else (
    echo [OK] Ambiente virtual já existe
)

echo.
echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo.
echo Instalando dependências...
pip install -r requirements.txt

echo.
echo Criando arquivo .env...
if not exist .env (
    copy .env.example .env
    echo [OK] Arquivo .env criado. EDITE COM SUAS CREDENCIAIS ANTES DE RODAR!
) else (
    echo [OK] Arquivo .env já existe
)

echo.
echo ===================================
echo PRÓXIMOS PASSOS:
echo 1. Edite o arquivo .env com suas credenciais do PostgreSQL
echo 2. Crie o banco de dados:
echo    createdb -U postgres egide_db
echo 3. Execute as migrações:
echo    python manage.py migrate
echo 4. Crie um superuser:
echo    python manage.py createsuperuser
echo 5. Inicie o servidor:
echo    python manage.py runserver
echo ===================================
echo.
pause
