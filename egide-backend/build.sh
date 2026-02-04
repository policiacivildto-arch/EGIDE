#!/usr/bin/env bash
# Script de build para o Render

set -o errexit

echo "🚀 Instalando dependências..."
pip install -r requirements.txt

echo "📊 Coletando arquivos estáticos..."
python manage.py collectstatic --no-input

echo "🔄 Executando migrações do banco de dados..."
python manage.py migrate

echo "✅ Build concluído com sucesso!"
