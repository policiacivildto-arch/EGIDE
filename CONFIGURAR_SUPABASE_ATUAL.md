# 🔧 CONFIGURAR SEU PROJETO SUPABASE

## 📍 Seu Projeto:
```
ID: urjluzeuifwjpwfjvkva
URL: https://supabase.com/dashboard/project/urjluzeuifwjpwfjvkva
```

---

## 📋 PASSO 1: Obter DATABASE_URL

1. **Acesse seu projeto Supabase**
   - https://supabase.com/dashboard/project/urjluzeuifwjpwfjvkva

2. **Vá para Settings (⚙️)**
   - Menu esquerdo → **Settings**

3. **Clique em Database**
   - Você verá: `Connection pooling` e `Direct connection`

4. **Escolha: Connection pooling (Transaction mode)**
   - Modo: **Transaction**
   - Copy a URL que aparece

5. **Você verá DUAS URLs importantes:**

   **Connection pooling (porta 6543) - Para aplicação:**
   ```
   postgresql://postgres.urjluzeuifwjpwfjvkva:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

   **Direct connection (porta 5432) - Para migrações:**
   ```
   postgresql://postgres.urjluzeuifwjpwfjvkva:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```

   ⚠️ **Substitua `[YOUR-PASSWORD]` pela senha do seu banco!**

---

## 🔐 ENCONTRAR A SENHA

1. Na mesma página de **Settings > Database**
2. Procure por **Database Password**
3. Clique em **Reset password** se não souber
4. Copie a senha

---

## 📝 COPIAR ESSAS INFORMAÇÕES:

**Você precisará para o Render:**

```
# URL com pooling - para a aplicação rodar
DATABASE_URL=postgresql://postgres.urjluzeuifwjpwfjvkva:[SENHA]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# URL direta - para executar migrações
DIRECT_URL=postgresql://postgres.urjluzeuifwjpwfjvkva:[SENHA]@aws-0-us-west-2.pooler.supabase.com:5432/postgres

SECRET_KEY=[Gere em https://djecrety.ir/]

DEBUG=False

ALLOWED_HOSTS=.onrender.com
```

**📌 Importante:**
- `DATABASE_URL` usa porta **6543** com pooling (melhor performance)
- `DIRECT_URL` usa porta **5432** direta (necessária para `python manage.py migrate`)

---

## 🚀 PRÓXIMO: FAZER DEPLOY NO RENDER

1. **Crie repositório Git** (se não tiver)
   ```powershell
   git init
   git add .
   git commit -m "Pronto para deploy"
   git remote add origin https://github.com/SEU-USUARIO/egide-app.git
   git push -u origin main
   ```

2. **Vá para https://render.com**
   - Login com GitHub

3. **Create New +** → **Web Service**
   - Conecte seu repositório `egide-app`
   - Root Directory: `egide-backend`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn egide_backend.wsgi:application`

4. **Adicione Environment Variables:**
   ```
   DATABASE_URL = postgresql://postgres.urjluzeuifwjpwfjvkva:[SENHA]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL = postgresql://postgres.urjluzeuifwjpwfjvkva:[SENHA]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   SECRET_KEY = [Gere em https://djecrety.ir/]
   DEBUG = False
   ALLOWED_HOSTS = .onrender.com
   ```

5. **Deploy!**

---

## ✅ VERIFICAR SE FUNCIONOU

Após 5 minutos:

1. Acesse: `https://egide-backend.onrender.com/api/`
2. Você verá a API do Django funcionando
3. Admin em: `https://egide-backend.onrender.com/admin/`

---

## 🆘 PROBLEMAS?

### Erro: "relation does not exist"
```powershell
# No Shell do Render, execute:
python manage.py migrate
```

### Erro: "CORS policy"
```
Adicione em CORS_ALLOWED_ORIGINS no Render:
CORS_ALLOWED_ORIGINS=https://seu-frontend.com
```

### Tudo OK? Crie superusuário:
```bash
# No Shell do Render:
python manage.py createsuperuser
```

---

**Status**: 🎯 Pronto para conectar Supabase + Render
