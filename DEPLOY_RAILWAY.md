# 🚀 DEPLOY: Supabase (PostgreSQL) + Railway (Django)

## 📋 VISÃO GERAL

Este guia mostra como fazer deploy do **backend Django** no **Railway** usando **Supabase** como banco de dados PostgreSQL.

### Por que Railway?

- ✅ **Plano Free**: $5/mês de crédito (suficiente para 800 policiais/mês)
- ✅ **Nunca hiberna**: Aplicação sempre online
- ✅ **Deploy fácil**: 1 clique no GitHub
- ✅ **Supabase**: PostgreSQL gratuito já configurado
- ✅ **Custo**: R$ 0/mês (usando os $5 de crédito)

---

## 🎯 PARTE 1: PREPARAR O CÓDIGO PARA DEPLOY

### 1.1 Garantir que o código está no GitHub

```powershell
# No diretório raiz do projeto
git init
git add .
git commit -m "Preparando deploy para Railway + Supabase"

# Criar repositório no GitHub (se ainda não tiver)
# 1. Acesse https://github.com/new
# 2. Crie um repositório chamado "egide-app"
# 3. Copie a URL (https://github.com/SEU-USUARIO/egide-app.git)

git remote add origin https://github.com/SEU-USUARIO/egide-app.git
git branch -M main
git push -u origin main
```

### 1.2 Verificar `requirements.txt`

Certifique-se que o arquivo `egide-backend/requirements.txt` contém:

```txt
Django==4.2.0
djangorestframework==3.14.0
django-cors-headers==4.0.0
psycopg2-binary==2.9.6
whitenoise==6.6.0
dj-database-url==2.1.0
django-filter==23.5
python-decouple==3.8
gunicorn==21.2.0
```

Se falta algo, atualize:
```powershell
cd egide-backend
pip freeze > requirements.txt
```

### 1.3 Garantir que `build.sh` existe

O arquivo `egide-backend/build.sh` deve existir com:

```bash
#!/bin/bash
python manage.py collectstatic --noinput
python manage.py migrate
```

Se não existir, crie-o.

---

## 🎯 PARTE 2: CONFIGURAR SUPABASE

### 2.1 Obter DATABASE_URL do Supabase

1. Acesse seu projeto em: https://app.supabase.com
2. Vá em **Settings** (⚙️) > **Database**
3. Role até **Connection string**
4. Clique em **Connection pooling** (importante!)
5. Certifique-se que está em **Transaction** mode
6. Copie a string:

```
postgresql://postgres.urjluzeuifwjpwfjvkva:qKjTzwiCam7U5su@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

**Guarde bem essa string!** ⚠️

---

## 🎯 PARTE 3: FAZER DEPLOY NO RAILWAY

### 3.1 Criar conta no Railway

1. Acesse: https://railway.app
2. Clique em **Get Started**
3. Faça login com **GitHub**
4. Autorize o Railway a acessar seus repositórios

### 3.2 Criar novo projeto

1. No dashboard Railway, clique em **New Project**
2. Selecione **Deploy from GitHub repo**
3. Busque e selecione seu repositório `egide-app`

### 3.3 Configurar variáveis de ambiente

Depois que o projeto for criado, vá em:

```
Settings > Environment > Add Variable
```

Adicione estas 4 variáveis:

#### **Variável 1: SECRET_KEY**
- **Key**: `SECRET_KEY`
- **Value**: Copie de https://djecrety.ir/ ou use:
```
django-insecure-abc123xyz789!@#$%^&*()_+-=[]{}|;:,.<>?
```

#### **Variável 2: DEBUG**
- **Key**: `DEBUG`
- **Value**: `False`

#### **Variável 3: DATABASE_URL**
- **Key**: `DATABASE_URL`
- **Value**: Cole a string do Supabase:
```
postgresql://postgres.urjluzeuifwjpwfjvkva:qKjTzwiCam7U5su@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

#### **Variável 4: ALLOWED_HOSTS**
- **Key**: `ALLOWED_HOSTS`
- **Value**: `.railway.app,localhost`

### 3.4 Configurar o serviço

1. No Railway, clique no seu projeto
2. Vá em **Services** > selecione seu app Django
3. Clique em **Settings**
4. Procure por **Start Command** e configure:

```
gunicorn egide_backend.wsgi:application
```

Se houver um campo **Root Directory**, deixe em branco ou use `egide-backend/` se ele não detectar automaticamente.

### 3.5 Acompanhar o deploy

1. Railway automaticamente vai:
   - ✅ Clonar o repositório do GitHub
   - ✅ Instalar dependências (`pip install -r requirements.txt`)
   - ✅ Executar `build.sh` (collectstatic + migrate)
   - ✅ Iniciar o servidor Gunicorn

2. Vá em **Deployments** para acompanhar os logs
3. Após 2-3 minutos, você verá um link como:
```
https://seu-app-prod.up.railway.app
```

---

## 🎯 PARTE 4: VERIFICAR SE FUNCIONOU

### 4.1 Testar a API

```bash
# Substitua pela URL do Railway que você recebeu
curl https://seu-app-prod.up.railway.app/api/

# Testar departamentos
curl https://seu-app-prod.up.railway.app/api/departamentos/

# Testar admin
https://seu-app-prod.up.railway.app/admin/
```

### 4.2 Criar superusuário (admin)

No Railway, vá em seu projeto > **Shell** e execute:

```bash
python manage.py createsuperuser
```

Preencha:
- **Username**: `admin`
- **Email**: `seu@email.com`
- **Password**: (senha segura)

### 4.3 Acessar o painel admin

```
https://seu-app-prod.up.railway.app/admin/
```

Login com as credenciais que criou.

---

## 🎯 PARTE 5: CONECTAR FRONTEND

### 5.1 Atualizar `.env` do frontend React

Crie/atualize `src/.env`:

```env
REACT_APP_DJANGO_API_URL=https://seu-app-prod.up.railway.app/api
```

### 5.2 Deploy do Frontend

**Opção A: Vercel (Recomendado)**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
cd .. # sair de egide-backend
vercel
```

**Opção B: GitHub Pages**

```bash
# Crie um repositório separado para o frontend
# ou use branch "gh-pages"
npm run build
```

---

## 🚀 ATUALIZAR CÓDIGO NO DEPLOY

Sempre que você fizer mudanças:

```powershell
git add .
git commit -m "Sua mensagem aqui"
git push origin main
```

Railway automaticamente detectará a mudança no GitHub e fará novo deploy!

---

## ❌ PROBLEMAS COMUNS

### "502 Bad Gateway"

**Causa**: Erro na execução do Django

**Solução**:
1. Vá em **Deployments** no Railway
2. Clique nos logs
3. Procure pela mensagem de erro
4. Geralmente é falta de variável de ambiente ou erro na migração

### "ModuleNotFoundError"

**Solução**: Atualize `requirements.txt`:

```powershell
cd egide-backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Atualizar dependências"
git push
```

### "relation does not exist"

**Solução**: Migrações não foram executadas

No Railway Shell:
```bash
python manage.py migrate
```

### "CORS policy error"

**Solução**: Adicione a URL do frontend na variável `ALLOWED_HOSTS`:

```
.railway.app,seu-frontend.vercel.app,localhost
```

---

## 📊 MONITORAR CRÉDITOS

1. No Railway, vá em **Account** > **Billing**
2. Você tem $5/mês de crédito grátis
3. Para 800 policiais/mês, você gasta aprox. **$0-$1/mês**
4. Nunca vai receber cobranças!

---

## 🎉 CHECKLIST DE DEPLOY

- [ ] Código no GitHub (repositório `egide-app`)
- [ ] `requirements.txt` atualizado
- [ ] `build.sh` existe em `egide-backend/`
- [ ] Conta Railway criada
- [ ] Projeto Railway criado
- [ ] 4 variáveis de ambiente configuradas
- [ ] `DATABASE_URL` do Supabase configurada
- [ ] Start Command configurado
- [ ] Deploy realizado e logs OK
- [ ] API testando corretamente
- [ ] Superusuário criado
- [ ] Frontend conectado à API

---

## 📞 RECURSOS ÚTEIS

- **Railway Docs**: https://docs.railway.app
- **Railway Django**: https://docs.railway.app/guides/django
- **Supabase**: https://supabase.com/docs
- **Gerador SECRET_KEY**: https://djecrety.ir/

---

## 🎯 PRÓXIMOS PASSOS (DEPOIS DO DEPLOY)

### Performance
- [ ] Configurar cache (Redis)
- [ ] Otimizar queries Django
- [ ] Implementar CDN para arquivos estáticos

### Segurança
- [ ] Adicionar autenticação JWT
- [ ] Rate limiting
- [ ] Logs de auditoria

### Monitoramento
- [ ] Configurar Sentry (rastreamento de erros)
- [ ] Google Analytics
- [ ] Alertas de uptime

---

**Última atualização**: 4 de fevereiro de 2026  
**Status**: Pronto para deploy  
**Custo mensal**: R$ 0 (plano free)  
**Suporta**: 800+ usuários simultâneos
