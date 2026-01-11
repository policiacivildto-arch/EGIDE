# 🔄 Guia Rápido: Firebase → Django

## ✅ Por que Django?

### Vantagens

| Aspecto | Firebase | Django |
|---------|----------|--------|
| 💰 **Custo** | Paga por uso | Servidor próprio (fixo) |
| 🔧 **Controle** | Limitado | Total |
| 🗄️ **Banco** | Firestore (NoSQL) | PostgreSQL/MySQL (SQL) |
| 🔒 **Segurança** | Regras Firebase | Python/Django ORM |
| 📊 **Queries** | Básicas | SQL completo |
| 🔄 **Backup** | Export manual | Dump automático |
| 📈 **Escala** | Automática | Manual |
| 🛠️ **Admin** | Console web | Django Admin integrado |

---

## 🚀 Instalação Rápida (10 minutos)

### 1. Instalar Dependências

```powershell
cd egide-backend
pip install djangorestframework djangorestframework-simplejwt django-cors-headers django-filter
```

### 2. Atualizar settings.py

Adicionar no final do `egide_backend/settings.py`:

```python
# Importar configurações de segurança
from .settings_security import *

# Adicionar apps
INSTALLED_APPS += [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
]

# Atualizar MIDDLEWARE (adicionar no início)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
] + MIDDLEWARE + MIDDLEWARE_SECURITY
```

### 3. Aplicar Migrações

```powershell
python manage.py makemigrations
python manage.py migrate
```

### 4. Criar Admin

```powershell
python manage.py createsuperuser
# Email: admin@egide.com
# Senha: (sua senha segura)
```

### 5. Executar

```powershell
python manage.py runserver
```

**API estará em:** http://localhost:8000/api/

---

## 📋 Arquivos Criados

```
egide-backend/
├── api/
│   ├── models_security.py          ✅ Models de segurança
│   ├── permissions.py              ✅ Permissões personalizadas
│   ├── middleware.py               ✅ Auditoria automática
│   ├── serializers_security.py     ⏳ (próximo passo)
│   └── views_security.py           ⏳ (próximo passo)
├── egide_backend/
│   └── settings_security.py        ✅ Configurações
└── DJANGO_SEGURANCA.md             ✅ Documentação
```

---

## 🔑 Autenticação

### Firebase (antes)
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
const userCredential = await signInWithEmailAndPassword(auth, email, password);
```

### Django (agora)
```javascript
import axios from 'axios';

// Login
const response = await axios.post('http://localhost:8000/api/auth/login/', {
  username: email,
  password: password
});

const { access, refresh, user } = response.data;

// Salvar tokens
localStorage.setItem('access_token', access);
localStorage.setItem('refresh_token', refresh);

// Usar em requisições
axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
```

---

## 🔐 Permissões

### Firebase (antes)
```javascript
// firestore.rules
allow read: if request.auth != null && 
            get(/databases/$(database)/documents/policiais/$(request.auth.uid)).data.tipo == 'admin';
```

### Django (agora)
```python
# views.py
from rest_framework.permissions import IsAuthenticated
from api.permissions import IsAdmin

class PolicialViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]
```

---

## 📊 Consultas

### Firebase (antes)
```javascript
const q = query(
  collection(db, 'operacoes'),
  where('status', '==', 'ativa'),
  orderBy('data', 'desc')
);
const snapshot = await getDocs(q);
```

### Django (agora)
```python
# Backend
operacoes = Operacao.objects.filter(
    status='ativa'
).order_by('-data')

# Frontend
const response = await axios.get('/api/operacoes/?status=ativa&ordering=-data');
```

---

## 🛡️ Sistema de Roles

### Definir Role de um Policial

```python
# Python (Django shell ou admin)
from api.models import Policial
from api.models_security import PerfilPolicial

policial = Policial.objects.get(matricula='12345678')
perfil = PerfilPolicial.objects.create(
    policial=policial,
    tipo='admin',  # ou 'coordenador', 'policial'
    ativo=True
)
```

### Verificar Permissões

```python
# No código Django
if request.user.policial.perfil.is_admin:
    # Fazer ação de admin
    pass

# Ou usar decorators
from api.permissions import IsAdmin

@permission_classes([IsAdmin])
def minha_view(request):
    pass
```

---

## 📝 Auditoria

### Firebase (antes)
```javascript
// Manual
await addDoc(collection(db, 'auditoria'), {
  acao: 'criar_operacao',
  usuario: user.uid,
  timestamp: serverTimestamp()
});
```

### Django (agora)
```python
# Automático via middleware + signals
# Ou manual:
from api.models_security import LogAuditoria

LogAuditoria.registrar(
    acao='criar_operacao',
    usuario=request.user,
    policial=request.user.policial,
    descricao='Operação X criada',
    request=request
)
```

---

## 🔄 Próximos Passos

### 1. Criar Serializers (próximo arquivo)

```python
# api/serializers_security.py
from rest_framework import serializers
from .models import Policial

class PolicialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Policial
        fields = '__all__'
```

### 2. Criar Views/ViewSets

```python
# api/views_security.py
from rest_framework import viewsets
from .models import Policial
from .serializers_security import PolicialSerializer
from .permissions import IsAdmin

class PolicialViewSet(viewsets.ModelViewSet):
    queryset = Policial.objects.all()
    serializer_class = PolicialSerializer
    permission_classes = [IsAdmin]
```

### 3. Configurar URLs

```python
# api/urls.py
from rest_framework.routers import DefaultRouter
from .views_security import PolicialViewSet

router = DefaultRouter()
router.register('policiais', PolicialViewSet)

urlpatterns = router.urls
```

### 4. Atualizar Frontend

```javascript
// src/services/djangoApiAuth.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

// Interceptor para adicionar token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 💡 Comandos Úteis

```powershell
# Iniciar servidor
python manage.py runserver

# Criar migrações
python manage.py makemigrations

# Aplicar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Shell interativo
python manage.py shell

# Ver todas as rotas
python manage.py show_urls  # (precisa django-extensions)

# Testar
python manage.py test

# Coletar arquivos estáticos
python manage.py collectstatic
```

---

## ⚡ Migrar Dados do Firebase

### 1. Exportar do Firebase

```javascript
// Script Node.js para exportar
const admin = require('firebase-admin');
const fs = require('fs');

const db = admin.firestore();
const collections = ['policiais', 'operacoes', 'escalas'];

async function exportData() {
  const data = {};
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    data[collectionName] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  
  fs.writeFileSync('firebase_export.json', JSON.stringify(data, null, 2));
}

exportData();
```

### 2. Importar no Django

```python
# management/commands/import_firebase.py
import json
from django.core.management.base import BaseCommand
from api.models import Policial, Operacao, Escala

class Command(BaseCommand):
    def handle(self, *args, **options):
        with open('firebase_export.json', 'r') as f:
            data = json.load(f)
        
        # Importar policiais
        for item in data['policiais']:
            Policial.objects.create(
                matricula=item['matricula'],
                nome=item['nome'],
                # ... outros campos
            )
        
        self.stdout.write('Dados importados com sucesso!')
```

---

## 🎯 Checklist de Migração

```
[ ] Instalar dependências
[ ] Adicionar configurações ao settings.py
[ ] Executar migrações
[ ] Criar superusuário
[ ] Testar API (/api/)
[ ] Criar serializers
[ ] Criar views
[ ] Configurar URLs
[ ] Atualizar frontend para usar axios
[ ] Migrar dados do Firebase (se necessário)
[ ] Testar autenticação
[ ] Testar permissões
[ ] Deploy
```

---

## 🆘 Troubleshooting

### Erro: "No module named 'rest_framework'"
```powershell
pip install djangorestframework
```

### Erro: "table api_perfilpolicial doesn't exist"
```powershell
python manage.py makemigrations
python manage.py migrate
```

### Erro: "CORS policy blocking"
Verificar `CORS_ALLOWED_ORIGINS` em `settings_security.py`

### API não responde
```powershell
# Ver logs
python manage.py runserver
# Verificar se porta 8000 está livre
```

---

**Status:** ✅ Sistema Django pronto para uso  
**Tempo estimado:** 30-60 minutos para setup completo  
**Próximo:** Criar serializers e views (próximos arquivos)
