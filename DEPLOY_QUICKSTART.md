# 🚀 QUICK START: Deploy Supabase + Render

## ⚡ RESUMO RÁPIDO (15 minutos)

### 1️⃣ SUPABASE (5 min)

1. Acesse https://supabase.com → **Start your project**
2. Crie projeto: Nome `egide-backend`, Senha forte, Region `South America`
3. Copie **DATABASE_URL**: Settings > Database > Connection string (Transaction mode)

```
postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### 2️⃣ RENDER (10 min)

1. Acesse https://render.com → Login com GitHub
2. **New +** > **Web Service** > Conectar repositório
3. Configure:
   - Name: `egide-backend`
   - Root Directory: `egide-backend`
   - Build: `./build.sh`
   - Start: `gunicorn egide_backend.wsgi:application`

4. **Environment Variables**:
   ```
   SECRET_KEY = [Gerar em https://djecrety.ir/]
   DEBUG = False
   DATABASE_URL = [Cole a URL do Supabase]
   ALLOWED_HOSTS = .onrender.com
   ```

5. **Create Web Service** → Aguarde 3-5 min

### 3️⃣ TESTAR

```bash
# Sua API estará em:
https://egide-backend.onrender.com/api/

# Criar superusuário (via Shell no Render):
python manage.py createsuperuser
```

---

## 📝 CHECKLIST

- [ ] Supabase: Projeto criado + DATABASE_URL copiada
- [ ] Render: Web Service criado + Variáveis configuradas
- [ ] Deploy: Logs mostram "Deploy successful"
- [ ] API: Teste em `/api/departamentos/`
- [ ] Admin: Superusuário criado

---

## ❓ PROBLEMAS?

Veja o guia completo: [DEPLOY_SUPABASE_RENDER.md](DEPLOY_SUPABASE_RENDER.md)
