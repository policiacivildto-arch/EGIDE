# ÉGIDE — Guia Rápido de Execução (Dev)

Este README explica como rodar o Frontend (React) e o Backend (Django) quando o backend está dentro de `egide-app/egide-backend`.

## Estrutura do Projeto

```
C:\Users\Gigabyte G5 Ke\egide-app\
├── src/                  # Frontend React
├── public/
├── package.json
├── README_DEV.md         # Este arquivo
└── egide-backend/        # Backend Django
    ├── egide_backend/
    ├── api/
    ├── manage.py
    ├── requirements.txt
    ├── db.sqlite3        # BD de desenvolvimento
    └── README.md         # Documentação da API
```

## Pré-requisitos
- Node.js + npm
- Python 3.10+ (ou compatível)
- PowerShell (Windows)

---

## Como rodar (2 terminais)

### Terminal A — Backend (Django)
```powershell
cd "C:\Users\Gigabyte G5 Ke\egide-app\egide-backend"
# Ativar virtualenv (se existir)
if (Test-Path .\venv\Scripts\activate) { .\venv\Scripts\activate }
else { python -m venv venv; .\venv\Scripts\activate }

# Dependências (se necessário)
venv\Scripts\python -m pip install -r requirements.txt

# Migrar e criar superuser (primeira vez)
venv\Scripts\python manage.py migrate
venv\Scripts\python manage.py createsuperuser

# Iniciar servidor
venv\Scripts\python manage.py runserver
```

Acesse: `http://localhost:8000` e `http://localhost:8000/admin`

### Terminal B — Frontend (React)
```powershell
cd "C:\Users\Gigabyte G5 Ke\egide-app"
npm install
npm start
```

Acesse: `http://localhost:3000`

---

## Variáveis de Ambiente

### Backend (Django)
- Arquivo: `egide-backend/.env` (crie a partir de `.env.example`).
- Em dev, o `settings.py` já está configurado para **SQLite**. Para PostgreSQL, ajuste as variáveis e a seção `DATABASES`.

### Frontend (React)
- Firebase envs via `.env` (opcional). Se não definidos, o projeto usa defaults do `src/config/firebase.js`.

---

## Dicas
- Se o PowerShell bloquear `Activate.ps1`, rode:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
- Se preferir outra organização, você pode mover `egide-backend/` para fora. Este guia cobre o caso atual (backend dentro do app).

---

## Problemas comuns
- Porta 5432 recusada: use SQLite (já configurado) ou inicie PostgreSQL.
- Erro de `django_filters`: instale com `pip install django-filter`.
- Erro de `decouple`: instale com `pip install python-decouple`.

---

## Próximos passos
- Integrar frontend com backend (veja `INTEGRACAO_FRONTEND_BACKEND.md`).
- Rodar testes no backend (adicionar pytest-django).
- Planejar deploy separado para frontend e backend.
