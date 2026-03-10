FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar pasta para arquivos estáticos
RUN mkdir -p /app/staticfiles

# Coletar arquivos estáticos
RUN python manage.py collectstatic --noinput || true

# Executar migrações
RUN python manage.py migrate --noinput || true

# Expor porta (Railway injeta PORT automaticamente)
EXPOSE 8000

# Iniciar Gunicorn (porta dinâmica do Railway)
CMD ["sh", "-c", "gunicorn egide_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 4"]
