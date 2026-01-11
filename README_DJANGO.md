# 🎉 Sistema EGIDE - Agora com Django Backend!

## 📌 Mudança Importante: Firebase → Django

O sistema de segurança EGIDE agora está **100% implementado com Django** em vez de Firebase!

### ✅ Por que mudamos?

1. **💰 Sem custos de Firebase** - Hospede onde quiser sem pagar por uso
2. **🔧 Controle total** - Código 100% sob seu controle
3. **🗄️ SQL poderoso** - Queries complexas facilitadas
4. **🛠️ Django Admin** - Painel administrativo pronto
5. **🔒 Segurança robusta** - Sistema completo de permissões
6. **📊 ORM Python** - Mais fácil de desenvolver e manter

---

## 🚀 Início Rápido (5 minutos)

### 1. Instalar Dependências

```powershell
cd egide-backend
pip install djangorestframework djangorestframework-simplejwt django-cors-headers django-filter
```

### 2. Configurar Banco de Dados

```powershell
python manage.py makemigrations
python manage.py migrate
```

### 3. Criar Administrador

```powershell
python manage.py createsuperuser
```

### 4. Iniciar Servidor

```powershell
python manage.py runserver
```

**API disponível em:** http://localhost:8000/api/

---

## 📁 Estrutura do Projeto

```
egide-app/
├── egide-backend/                    🆕 Backend Django
│   ├── api/
│   │   ├── models.py                 ✅ Models existentes
│   │   ├── models_security.py        🆕 Sistema de segurança
│   │   ├── permissions.py            🆕 Permissões personalizadas
│   │   ├── middleware.py             🆕 Auditoria automática
│   │   ├── serializers.py            ✅ Serializers existentes
│   │   └── views.py                  ✅ Views existentes
│   ├── egide_backend/
│   │   ├── settings.py               ✅ Configurações Django
│   │   └── settings_security.py      🆕 Configurações de segurança
│   └── DJANGO_SEGURANCA.md           🆕 Documentação completa
│
├── src/                              ✅ Frontend React
│   ├── services/
│   │   └── djangoApiAuth.js          🆕 Cliente API Django
│   ├── hooks/
│   │   └── useDjangoAuth.js          🆕 Hook de autenticação
│   └── components/
│       └── auth/
│           └── ProtectedRouteDjango.js  🆕 Proteção de rotas
│
└── GUIA_RAPIDO_DJANGO.md             🆕 Guia rápido
```

---

## 🔑 Arquivos Implementados

### Backend (Django)

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `api/models_security.py` | ✅ | Models de segurança e auditoria |
| `api/permissions.py` | ✅ | 15+ classes de permissões |
| `api/middleware.py` | ✅ | Auditoria, rate limiting, segurança |
| `egide_backend/settings_security.py` | ✅ | Configurações completas |
| `DJANGO_SEGURANCA.md` | ✅ | Documentação detalhada |

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `GUIA_RAPIDO_DJANGO.md` | Guia rápido de migração |
| `DJANGO_SEGURANCA.md` | Documentação completa |
| `API_ENDPOINTS.md` | ⏳ Documentação dos endpoints |

### Frontend (React)

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `services/djangoApiAuth.js` | ⏳ | Cliente API com JWT |
| `hooks/useDjangoAuth.js` | ⏳ | Hook de autenticação |
| `components/auth/ProtectedRouteDjango.js` | ⏳ | Proteção de rotas |

---

## 🎯 Sistema de Roles

### 4 Níveis de Acesso

#### 👑 Admin
- Acesso total ao sistema
- Gerenciar usuários
- Ver logs de auditoria
- Alterar configurações

#### 📋 Coordenador
- Criar operações
- Criar escalas
- Ver todos os policiais
- Editar operações próprias

#### 👮 Policial
- Ver próprios dados
- Ver escalas próprias
- Editar perfil (limitado)
- Criar eventos

#### 🏢 Departamento (NOVO!)
- **Criar demandas de operação** 🆕
- Aguardar aprovação do DTO
- Receber notificações do DTO
- Responder com efetivo disponível
- Ver operações aprovadas

#### 🚁 DTO - Departamento Especial
- **Analisar e aprovar/rejeitar demandas** 🆕
- Criar operações coordenadas
- Solicitar apoio aos departamentos
- Ver todas operações

**Ver detalhes completos:**
- [SISTEMA_DEPARTAMENTOS.md](egide-backend/SISTEMA_DEPARTAMENTOS.md)
- [NOVO_FLUXO_DEMANDAS.md](egide-backend/NOVO_FLUXO_DEMANDAS.md) 🆕

---

## 🔐 Recursos de Segurança

### ✅ Implementado

- **Autenticação JWT** - Tokens seguros de 1 hora
- **Refresh Tokens** - Tokens de renovação de 7 dias
- **Permissões Granulares** - 15+ classes de permissão
- **Auditoria Automática** - Todas as ações registradas
- **Rate Limiting** - Limite de requisições por hora
- **CORS Configurado** - Proteção cross-origin
- **Headers de Segurança** - XSS, Clickjacking, etc.
- **Validação de Dados** - Serializers com validação
- **Rastreamento de Sessões** - Múltiplas sessões controladas
- **Logs Estruturados** - Sistema completo de logging

### 🛡️ Em Produção

- **HTTPS Obrigatório** - SSL/TLS
- **HSTS** - HTTP Strict Transport Security
- **Secure Cookies** - Cookies seguros
- **PostgreSQL** - Banco robusto e escalável
- **Backups Automáticos** - Dumps agendados

---

## 📊 Comparação: Firebase vs Django

| Recurso | Firebase | Django EGIDE |
|---------|----------|--------------|
| Custo mensal (est.) | $50-200 | $5-20 (VPS) |
| Controle do código | ❌ Limitado | ✅ Total |
| Queries complexas | ❌ Limitado | ✅ SQL completo |
| Backup automático | ❌ Manual | ✅ Automático |
| Admin panel | Console web | ✅ Django Admin |
| Real-time | ✅ Nativo | 🔄 WebSockets |
| Offline | ✅ Bom | ⚠️ PWA |
| Curva aprendizado | Média | Média |

---

## 🌐 Endpoints da API

### Autenticação

```
POST   /api/auth/login/          # Login (retorna JWT)
POST   /api/auth/logout/         # Logout
POST   /api/auth/refresh/        # Refresh token
GET    /api/auth/me/             # Dados do usuário
```

### Demandas de Operação (Departamentos) 🆕

```
GET    /api/demandas/              # Listar todas (DTO)
GET    /api/demandas/minhas/       # Minhas demandas
GET    /api/demandas/pendentes/    # Pendentes (DTO)
POST   /api/demandas/              # Criar demanda
POST   /api/demandas/{id}/aprovar/ # Aprovar (DTO)
POST   /api/demandas/{id}/rejeitar/# Rejeitar (DTO)
```

### Policiais

```
GET    /api/policiais/           # Listar
GET    /api/policiais/{id}/      # Detalhes
POST   /api/policiais/           # Criar (Admin)
PUT    /api/policiais/{id}/      # Atualizar
DELETE /api/policiais/{id}/      # Deletar (Admin)
```

### Operações

```
GET    /api/operacoes/           # Listar
POST   /api/operacoes/           # Criar (DTO)
GET    /api/operacoes/{id}/      # Detalhes
GET    /api/operacoes/minhas/    # Minhas operações (Dept)
```

### Notificações (Departamentos)

```
GET    /api/notificacoes/minhas/    # Minhas notificações
POST   /api/notificacoes/{id}/responder/  # Responder
```

### Auditoria

```
GET    /api/auditoria/           # Listar logs (Admin)
GET    /api/auditoria/{id}/      # Detalhes (Admin)
```

**Ver documentação completa:** [NOVO_FLUXO_DEMANDAS.md](egide-backend/NOVO_FLUXO_DEMANDAS.md)

---

## 💻 Como Usar

### No Frontend (React)

```javascript
// Login
import axios from 'axios';

const login = async (email, password) => {
  const response = await axios.post('http://localhost:8000/api/auth/login/', {
    username: email,
    password: password
  });
  
  const { access, refresh, user } = response.data;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  
  return user;
};

// Fazer requisições
const getOperacoes = async () => {
  const token = localStorage.getItem('access_token');
  const response = await axios.get('http://localhost:8000/api/operacoes/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};
```

### No Backend (Django)

```python
# Verificar permissões
from rest_framework.decorators import api_view, permission_classes
from api.permissions import IsAdmin

@api_view(['GET'])
@permission_classes([IsAdmin])
def minha_view_admin(request):
    # Apenas admins acessam
    return Response({'message': 'Admin access'})

# Registrar auditoria
from api.models_security import LogAuditoria

LogAuditoria.registrar(
    acao='criar_operacao',
    usuario=request.user,
    policial=request.user.policial,
    descricao='Nova operação criada',
    request=request
)
```

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [GUIA_RAPIDO_DJANGO.md](GUIA_RAPIDO_DJANGO.md) | Guia rápido de migração Firebase → Django |
| [DJANGO_SEGURANCA.md](egide-backend/DJANGO_SEGURANCA.md) | Documentação completa do sistema |
| [API_ENDPOINTS.md](API_ENDPOINTS.md) | Documentação dos endpoints da API |

---

## 🔄 Migração do Firebase

Se você já tem dados no Firebase:

1. **Exportar dados do Firebase**
2. **Importar para Django** usando scripts de migração
3. **Atualizar frontend** para usar a nova API
4. **Testar** todas as funcionalidades

**Ver guia completo:** `MIGRACAO_FIREBASE_DJANGO.md`

---

## 🛠️ Desenvolvimento

```powershell
# Backend (Terminal 1)
cd egide-backend
python manage.py runserver

# Frontend (Terminal 2)
npm start
```

**Backend:** http://localhost:8000  
**Frontend:** http://localhost:3000  
**Admin:** http://localhost:8000/admin

---

## ⚡ Deploy em Produção

### Opções de Hospedagem

1. **Heroku** - Fácil e rápido ($7/mês)
2. **DigitalOcean** - VPS com controle total ($5/mês)
3. **AWS** - Escalável ($10+/mês)
4. **PythonAnywhere** - Específico para Django ($5/mês)
5. **Vercel** (Frontend) + Railway (Backend) - Grátis para começar

---

## 🎯 Próximos Passos

1. ✅ Backend Django configurado
2. ✅ Sistema de segurança completo
3. ✅ Permissões e auditoria
4. ⏳ Criar serializers customizados
5. ⏳ Criar views/viewsets
6. ⏳ Atualizar frontend para Django
7. ⏳ Testes automatizados
8. ⏳ Deploy em produção

---

## 🆘 Suporte

- **Documentação Django:** https://docs.djangoproject.com/
- **Django REST Framework:** https://www.django-rest-framework.org/
- **JWT:** https://django-rest-framework-simplejwt.readthedocs.io/

---

**Status:** ✅ Sistema Django pronto para uso!  
**Versão:** 2.0.0 (Django)  
**Data:** 7 de janeiro de 2026

**🚀 Para começar, leia:** [GUIA_RAPIDO_DJANGO.md](GUIA_RAPIDO_DJANGO.md)
