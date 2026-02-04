# 🚀 DEPLOY: Supabase (PostgreSQL) + Render (Django)

## 📋 VISÃO GERAL

Este guia mostra como fazer deploy do **backend Django** no **Render** usando **Supabase** como banco de dados PostgreSQL.

### Por que essa stack?

- ✅ **Supabase**: PostgreSQL gratuito, backups automáticos, 500MB de dados
- ✅ **Render**: Hospedagem gratuita Django, deploy automático via Git
- ✅ **Custo**: R$ 0/mês para começar
- ✅ **Escalável**: Pode crescer conforme necessário

---

## 🎯 PARTE 1: CONFIGURAR SUPABASE (PostgreSQL)

### 1.1 Criar conta no Supabase

1. Acesse: https://supabase.com
2. Clique em **Start your project**
3. Faça login com GitHub/Google
4. Crie um novo projeto:
   - **Nome**: `egide-backend`
   - **Database Password**: Crie uma senha forte (ANOTE!)
   - **Region**: `South America (São Paulo)` ou mais próximo
   - Clique em **Create new project**

### 1.2 Obter credenciais do banco

1. No painel do Supabase, vá em **Settings** (⚙️) > **Database**
2. Role até **Connection string** e copie a **Connection pooling** (modo **Transaction**)
3. A URL será algo como:

```
postgresql://postgres.xxxxxxxxxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

4. **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você criou

### 1.3 Teste a conexão (opcional)

```powershell
# Se tiver psql instalado
psql "postgresql://postgres.xxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
```

---

## 🎯 PARTE 2: PREPARAR O CÓDIGO PARA DEPLOY

### 2.1 Arquivos já criados

Já criei os seguintes arquivos na pasta `egide-backend/`:

- ✅ `build.sh` - Script de build para o Render
- ✅ `render.yaml` - Configuração do Render
- ✅ `runtime.txt` - Versão do Python
- ✅ `.env.production.example` - Exemplo de variáveis de ambiente
- ✅ `requirements.txt` - Atualizado com dependências necessárias

### 2.2 Atualizar requirements.txt

As seguintes dependências foram adicionadas:

```txt
whitenoise==6.6.0          # Servir arquivos estáticos
dj-database-url==2.1.0     # Parser de DATABASE_URL
django-filter==23.5        # Já estava sendo usado
python-decouple==3.8       # Versão fixa
```

### 2.3 Configurações do settings.py

O `settings.py` foi atualizado para:

- ✅ Suportar `DATABASE_URL` (Supabase)
- ✅ WhiteNoise para arquivos estáticos
- ✅ CORS configurável via variável de ambiente
- ✅ ALLOWED_HOSTS dinâmico
- ✅ Fallback para SQLite em desenvolvimento

---

## 🎯 PARTE 3: FAZER DEPLOY NO RENDER

### 3.1 Criar conta no Render

1. Acesse: https://render.com
2. Clique em **Get Started**
3. Faça login com GitHub
4. Autorize o Render a acessar seus repositórios

### 3.2 Preparar repositório Git

```powershell
# No diretório raiz do projeto
git init
git add .
git commit -m "Preparando deploy para Render + Supabase"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/SEU-USUARIO/egide-app.git
git branch -M main
git push -u origin main
```

### 3.3 Criar Web Service no Render

1. No dashboard do Render, clique em **New +** > **Web Service**
2. Conecte seu repositório GitHub `egide-app`
3. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `egide-backend` |
| **Region** | `Oregon (US West)` ou mais próximo |
| **Branch** | `main` |
| **Root Directory** | `egide-backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `./build.sh` |
| **Start Command** | `gunicorn egide_backend.wsgi:application` |
| **Instance Type** | `Free` |

4. Clique em **Advanced** e adicione as **Environment Variables**:

### 3.4 Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no Render:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | Gere uma chave: [Gerador](https://djecrety.ir/) |
| `DEBUG` | `False` |
| `DATABASE_URL` | Cole a URL do Supabase (passo 1.2) |
| `ALLOWED_HOSTS` | `.onrender.com` |
| `PYTHON_VERSION` | `3.11.0` |

**Exemplo de DATABASE_URL:**
```
postgresql://postgres.abcdefgh:SuaSenhaAqui@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

5. Clique em **Create Web Service**

### 3.5 Acompanhar o Deploy

1. O Render vai:
   - ✅ Clonar o repositório
   - ✅ Instalar dependências (`pip install -r requirements.txt`)
   - ✅ Executar `build.sh` (collectstatic + migrate)
   - ✅ Iniciar o servidor Gunicorn

2. Acompanhe os logs em tempo real
3. Após 2-5 minutos, você verá: **Deploy successful** ✅

4. Sua API estará disponível em:
```
https://egide-backend.onrender.com/api/
```

---

## 🎯 PARTE 4: VERIFICAR SE FUNCIONOU

### 4.1 Testar a API

```bash
# Testar endpoint raiz
curl https://egide-backend.onrender.com/api/

# Testar departamentos
curl https://egide-backend.onrender.com/api/departamentos/

# Testar admin (adicione /admin/ no navegador)
https://egide-backend.onrender.com/admin/
```

### 4.2 Criar superusuário (admin)

No Render, vá em **Shell** e execute:

```bash
python manage.py createsuperuser
```

Preencha:
- Username: `admin`
- Email: `seu@email.com`
- Password: (senha segura)

### 4.3 Verificar dados no Supabase

1. Acesse o painel do Supabase
2. Vá em **Table Editor**
3. Você verá as tabelas Django criadas:
   - `api_departamento`
   - `api_policial`
   - `api_escala`
   - etc.

---

## 🎯 PARTE 5: CONECTAR FRONTEND

### 5.1 Atualizar variáveis de ambiente do frontend

Crie/atualize `.env` no frontend React:

```env
REACT_APP_DJANGO_API_URL=https://egide-backend.onrender.com/api
```

### 5.2 Testar conexão

```javascript
// src/App.js ou qualquer componente
useEffect(() => {
  fetch('https://egide-backend.onrender.com/api/departamentos/')
    .then(res => res.json())
    .then(data => console.log('Departamentos:', data))
    .catch(err => console.error('Erro:', err));
}, []);
```

### 5.3 Deploy do Frontend (Vercel - Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Ou conecte o repositório diretamente no painel do Vercel.

---

## 🔧 TROUBLESHOOTING

### ❌ Erro: "ModuleNotFoundError"

**Solução**: Verifique se todas as dependências estão em `requirements.txt`

```powershell
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Atualizar dependências"
git push
```

### ❌ Erro: "relation does not exist"

**Solução**: Migrações não foram executadas

No Render Shell:
```bash
python manage.py migrate
```

### ❌ Erro: "CORS policy error"

**Solução**: Adicione a URL do frontend nas variáveis de ambiente do Render

```
CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app,https://outro-dominio.com
```

### ❌ Erro: "502 Bad Gateway"

**Causas comuns**:
1. Erro no `build.sh` (verifique logs)
2. Porta incorreta (Render usa a variável `$PORT` automaticamente)
3. Gunicorn não iniciou

**Solução**: Verifique os logs no Render

### ❌ Site muito lento

**Causa**: Plano Free do Render hiberna após 15min de inatividade

**Soluções**:
1. Fazer upgrade para plano pago ($7/mês)
2. Usar serviço de "keep alive" (ex: UptimeRobot)
3. Aceitar o delay inicial (30-60s na primeira requisição)

---

## 💾 BACKUPS E MANUTENÇÃO

### Backup do Supabase

1. Supabase faz backups automáticos diários
2. Para backup manual:
   - Painel Supabase > Database > Backups
   - Ou via `pg_dump`:

```bash
pg_dump "postgresql://postgres.xxx..." > backup.sql
```

### Restaurar backup

```bash
psql "postgresql://postgres.xxx..." < backup.sql
```

### Monitorar uso

- **Supabase**: Dashboard > Usage (500MB grátis)
- **Render**: Dashboard > Metrics (750h/mês grátis)

---

## 📊 PRÓXIMOS PASSOS

### Segurança

- [ ] Adicionar HTTPS no frontend
- [ ] Configurar rate limiting
- [ ] Implementar autenticação JWT completa
- [ ] Adicionar logs de auditoria

### Performance

- [ ] Configurar cache (Redis)
- [ ] Otimizar queries (select_related, prefetch_related)
- [ ] Implementar CDN para arquivos estáticos

### Monitoramento

- [ ] Configurar Sentry para rastreamento de erros
- [ ] Adicionar Google Analytics
- [ ] Configurar alertas de uptime

---

## 🎉 CHECKLIST DE DEPLOY

- [ ] Conta Supabase criada
- [ ] Banco PostgreSQL configurado
- [ ] DATABASE_URL obtida
- [ ] Código atualizado e comitado no Git
- [ ] Repositório no GitHub
- [ ] Conta Render criada
- [ ] Web Service criado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Superusuário criado
- [ ] API testada e funcionando
- [ ] Frontend conectado à API
- [ ] CORS configurado corretamente

---

## 📞 RECURSOS ÚTEIS

- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Render**: https://render.com/docs
- **Django + Render**: https://render.com/docs/deploy-django
- **Gerador de SECRET_KEY**: https://djecrety.ir/

---

**Última atualização**: 3 de fevereiro de 2026  
**Status**: Configuração completa e pronta para deploy  
**Custo mensal**: R$ 0 (planos gratuitos)
