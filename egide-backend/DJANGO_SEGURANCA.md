# 🔐 Sistema de Segurança Django - EGIDE

**Data:** 7 de janeiro de 2026  
**Backend:** Django REST Framework  
**Status:** ✅ Implementação Completa

---

## 📋 Visão Geral

Este sistema implementa segurança completa usando Django em vez de Firebase:

- ✅ **Sistema de Roles** - Admin, Coordenador, Policial
- ✅ **Autenticação JWT** - Tokens seguros para API
- ✅ **Permissões Personalizadas** - Controle granular por modelo
- ✅ **Auditoria Completa** - Logs de todas as ações
- ✅ **Middleware de Segurança** - Proteção em todas as requests
- ✅ **API REST Protegida** - Endpoints com validação de permissões

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    DJANGO BACKEND                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   MODELS     │  │ PERMISSIONS  │  │  MIDDLEWARE  │     │
│  │              │  │              │  │              │     │
│  │ • Policial   │  │ • IsAdmin    │  │ • Auditoria  │     │
│  │ • Operacao   │  │ • IsCoordenador│ • Rate Limit│     │
│  │ • Escala     │  │ • IsOwner    │  │ • Security   │     │
│  │ • Auditoria  │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  SERIALIZERS │  │    VIEWS     │  │     URLS     │     │
│  │              │  │              │  │              │     │
│  │ • Validação  │  │ • ViewSets   │  │ • Rotas API  │     │
│  │ • Transformar│  │ • Protegidas │  │ • Versionamento │
│  │              │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↕
                   JWT Authentication
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                            │
│                                                              │
│  • Axios Client com JWT                                     │
│  • Hooks para autenticação                                  │
│  • Componentes protegidos                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalação Rápida

### 1. Instalar Dependências

```powershell
cd egide-backend
pip install djangorestframework djangorestframework-simplejwt django-cors-headers django-filter
```

### 2. Aplicar Migrações

```powershell
python manage.py makemigrations
python manage.py migrate
```

### 3. Criar Superusuário

```powershell
python manage.py createsuperuser
```

### 4. Executar Script de Configuração

```powershell
python setup_security.py
```

### 5. Iniciar Servidor

```powershell
python manage.py runserver
```

---

## 📁 Arquivos Criados

### Backend (egide-backend/)

1. **api/models_security.py** - Models de segurança e auditoria
2. **api/permissions.py** - Permissões personalizadas
3. **api/middleware.py** - Middlewares de segurança e auditoria
4. **api/serializers_security.py** - Serializers para segurança
5. **api/views_security.py** - Views protegidas
6. **api/utils/auditoria.py** - Sistema de auditoria
7. **api/management/commands/setup_security.py** - Setup inicial
8. **setup_security.py** - Script de configuração

### Configuração

9. **egide_backend/settings_security.py** - Configurações de segurança
10. **egide_backend/urls_api.py** - URLs da API

### Frontend (src/)

11. **services/djangoApiAuth.js** - Cliente API com autenticação
12. **hooks/useDjangoAuth.js** - Hook de autenticação Django
13. **components/auth/ProtectedRouteDjango.js** - Proteção de rotas
14. **utils/auditoriaDjango.js** - Cliente de auditoria

### Documentação

15. **DJANGO_SEGURANCA.md** - Este arquivo
16. **MIGRACAO_FIREBASE_DJANGO.md** - Guia de migração
17. **API_ENDPOINTS.md** - Documentação da API

---

## 🔑 Sistema de Roles Django

### Models Estendidos

```python
class PerfilPolicial(models.Model):
    TIPO_CHOICES = [
        ('admin', 'Administrador'),
        ('coordenador', 'Coordenador'),
        ('policial', 'Policial'),
    ]
    
    policial = models.OneToOneField(Policial, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='policial')
    ativo = models.BooleanField(default=True)
    ultimo_acesso = models.DateTimeField(null=True, blank=True)
```

### Permissões Django

```python
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.policial.perfil.tipo == 'admin'

class IsCoordenador(permissions.BasePermission):
    def has_permission(self, request, view):
        tipo = request.user.policial.perfil.tipo
        return tipo in ['admin', 'coordenador']
```

---

## 🌐 Endpoints da API

### Autenticação

```
POST   /api/auth/login/          # Login (retorna JWT)
POST   /api/auth/logout/         # Logout
POST   /api/auth/refresh/        # Refresh token
GET    /api/auth/me/             # Dados do usuário atual
```

### Policiais

```
GET    /api/policiais/           # Listar (Admin/Coordenador)
GET    /api/policiais/{id}/      # Detalhes (Admin/Coordenador/Próprio)
POST   /api/policiais/           # Criar (Admin)
PUT    /api/policiais/{id}/      # Atualizar (Admin/Próprio)
DELETE /api/policiais/{id}/      # Deletar (Admin)
```

### Operações

```
GET    /api/operacoes/           # Listar (Todos autenticados)
GET    /api/operacoes/{id}/      # Detalhes (Todos autenticados)
POST   /api/operacoes/           # Criar (Admin/Coordenador)
PUT    /api/operacoes/{id}/      # Atualizar (Admin/Coordenador)
DELETE /api/operacoes/{id}/      # Deletar (Admin)
```

### Auditoria

```
GET    /api/auditoria/           # Listar logs (Admin)
GET    /api/auditoria/{id}/      # Detalhes (Admin)
GET    /api/auditoria/usuario/{id}/  # Logs por usuário (Admin)
```

---

## 💻 Como Usar no Frontend

### 1. Configurar Cliente API

```javascript
import { djangoApiClient } from './services/djangoApiAuth';

// Fazer login
const { token, user } = await djangoApiClient.login(email, password);

// Fazer requisições autenticadas
const operacoes = await djangoApiClient.get('/operacoes/');
```

### 2. Hook de Autenticação

```javascript
import { useDjangoAuth } from './hooks/useDjangoAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useDjangoAuth();
  
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }
  
  return <Dashboard user={user} />;
}
```

### 3. Proteger Rotas

```javascript
import ProtectedRouteDjango from './components/auth/ProtectedRouteDjango';

<Route path="/admin" element={
  <ProtectedRouteDjango requiredRole="admin">
    <AdminPage />
  </ProtectedRouteDjango>
} />
```

---

## 🔄 Migração do Firebase

### Passo 1: Exportar Dados do Firebase

```javascript
// Ver arquivo: MIGRACAO_FIREBASE_DJANGO.md
```

### Passo 2: Importar para Django

```powershell
python manage.py import_from_firebase dados_firebase.json
```

### Passo 3: Atualizar Frontend

- Substituir `firebase` por `djangoApiClient`
- Atualizar hooks de autenticação
- Ajustar endpoints da API

---

## 📊 Comparação Firebase vs Django

| Recurso | Firebase | Django |
|---------|----------|--------|
| Autenticação | Firebase Auth | JWT Tokens |
| Banco de Dados | Firestore | PostgreSQL/SQLite |
| Regras | firestore.rules | Permissions Classes |
| Real-time | onSnapshot | WebSockets/Polling |
| Auditoria | Coleção separada | Model + Signals |
| Custos | Por uso | Servidor próprio |
| Controle | Limitado | Total |
| Backup | Export manual | Dump SQL |

---

## ⚡ Vantagens do Django

1. **Controle Total** - Código 100% sob seu controle
2. **Sem Custos de Firebase** - Sem cobrança por uso
3. **ORM Poderoso** - Queries complexas facilitadas
4. **Admin Integrado** - Painel administrativo pronto
5. **Escalabilidade** - Hospede onde quiser
6. **Migrações** - Versionamento do schema
7. **Testes** - Framework de testes integrado
8. **Comunidade** - Vasta documentação e suporte

---

## 🛡️ Segurança Implementada

### 1. Autenticação JWT

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

### 2. CORS Configurado

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5000",
]
```

### 3. Rate Limiting

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
    }
}
```

### 4. Validação de Dados

- Serializers com validação automática
- Validators personalizados
- Sanitização de inputs

### 5. Logs de Auditoria

- Todas as ações registradas automaticamente
- Middleware captura requests
- Signals capturam mudanças no banco

---

## 📝 Próximos Passos

### 1. Configurar o Backend

```powershell
cd egide-backend
pip install -r requirements.txt
python manage.py migrate
python setup_security.py
```

### 2. Testar a API

```powershell
python manage.py runserver
# Acessar: http://localhost:8000/api/
```

### 3. Atualizar o Frontend

- Instalar axios: `npm install axios`
- Copiar arquivos de integração Django
- Atualizar componentes

### 4. Migrar Dados (se necessário)

```powershell
python manage.py export_firebase
python manage.py import_to_django
```

---

## 🆘 Comandos Úteis

```powershell
# Criar migrações
python manage.py makemigrations

# Aplicar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Rodar servidor
python manage.py runserver

# Rodar testes
python manage.py test

# Criar dados de teste
python manage.py create_test_data

# Shell interativo
python manage.py shell

# Ver logs de auditoria
python manage.py show_audit_logs

# Backup do banco
python manage.py dumpdata > backup.json

# Restaurar backup
python manage.py loaddata backup.json
```

---

## 📞 Suporte

- **Documentação Django:** https://docs.djangoproject.com/
- **Django REST Framework:** https://www.django-rest-framework.org/
- **JWT:** https://django-rest-framework-simplejwt.readthedocs.io/

---

**Status:** ✅ Pronto para implementação  
**Próximo arquivo:** Ver `api/models_security.py` para começar
