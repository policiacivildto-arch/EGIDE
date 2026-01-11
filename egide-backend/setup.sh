#!/bin/bash

# Setup script para backend Django no Linux/macOS

echo "==================================="
echo "SETUP DO BACKEND EGIDE (Django)"
echo "==================================="
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "ERRO: Python 3 não encontrado. Instale Python 3.8+ primeiro."
    exit 1
fi

echo "[OK] Python encontrado: $(python3 --version)"
echo ""

# Criar ambiente virtual
echo "Criando ambiente virtual..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "[OK] Ambiente virtual criado"
else
    echo "[OK] Ambiente virtual já existe"
fi

echo ""
echo "Ativando ambiente virtual..."
source venv/bin/activate

echo ""
echo "Instalando dependências..."
pip install -r requirements.txt

echo ""
echo "Criando arquivo .env..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "[OK] Arquivo .env criado. EDITE COM SUAS CREDENCIAIS ANTES DE RODAR!"
else
    echo "[OK] Arquivo .env já existe"
fi

echo ""
echo "==================================="
echo "PRÓXIMOS PASSOS:"
echo "1. Edite o arquivo .env com suas credenciais do PostgreSQL"
echo "2. Crie o banco de dados:"
echo "   createdb -U postgres egide_db"
echo "3. Execute as migrações:"
echo "   python manage.py migrate"
echo "4. Crie um superuser:"
echo "   python manage.py createsuperuser"
echo "5. Inicie o servidor:"
echo "   python manage.py runserver"
echo "==================================="
echo ""
