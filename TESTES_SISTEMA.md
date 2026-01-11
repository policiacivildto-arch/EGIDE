# 🧪 Guia de Testes - Sistema EGIDE Django

## ⚡ Teste Rápido (5 minutos)

### 1. Testar Backend Django

```powershell
# Terminal 1 - Backend
cd egide-backend

# Instalar dependências
pip install djangorestframework djangorestframework-simplejwt django-cors-headers django-filter

# Criar banco de dados
python manage.py makemigrations
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser
# Email: admin@egide.com
# Senha: admin123

# Iniciar servidor
python manage.py runserver
```

✅ **Backend funcionando:** http://localhost:8000

---

### 2. Testar Admin Django

Abra no navegador: http://localhost:8000/admin

- Login: admin@egide.com
- Senha: admin123

**Deve ver:**
- Interface do Django Admin
- Models: Policiais, Operações, Escalas, etc.

---

### 3. Testar API REST

#### Opção A: Usando PowerShell

```powershell
# Testar endpoint público
Invoke-RestMethod -Uri "http://localhost:8000/api/" -Method Get

# Login
$body = @{
    username = "admin@egide.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/" -Method Post -Body $body -ContentType "application/json"

# Ver token
$response.access

# Usar token para acessar API
$headers = @{
    Authorization = "Bearer $($response.access)"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/policiais/" -Headers $headers
```

#### Opção B: Usando Navegador

Abra: http://localhost:8000/api/

**Deve ver:**
- Django REST Framework Browsable API
- Lista de endpoints disponíveis

---

### 4. Testar Frontend React

```powershell
# Terminal 2 - Frontend
npm start
```

✅ **Frontend funcionando:** http://localhost:3000

---

## 🧪 Testes Detalhados

### Teste 1: Verificar Models de Segurança

```powershell
cd egide-backend
python manage.py shell
```

No shell Python:

```python
# Importar models
from api.models import Policial
from api.models_security import PerfilPolicial, LogAuditoria

# Verificar se models existem
print("Policiais:", Policial.objects.count())
print("Perfis:", PerfilPolicial.objects.count())
print("Logs:", LogAuditoria.objects.count())

# Criar perfil de teste
policial = Policial.objects.first()
if policial:
    perfil = PerfilPolicial.objects.create(
        policial=policial,
        tipo='admin',
        ativo=True
    )
    print(f"Perfil criado: {perfil}")

# Sair
exit()
```

✅ **Esperado:** Models funcionando sem erros

---

### Teste 2: Verificar Permissões

```powershell
python manage.py shell
```

```python
from django.contrib.auth.models import User
from api.permissions import IsAdmin, IsCoordenador

# Criar usuário de teste
user = User.objects.first()
print(f"Usuário: {user.username}")

# Verificar se tem policial associado
try:
    policial = user.policial
    perfil = policial.perfil
    print(f"Tipo: {perfil.tipo}")
    print(f"É admin: {perfil.is_admin}")
    print(f"É coordenador: {perfil.is_coordenador}")
except:
    print("Usuário não tem policial associado")

exit()
```

---

### Teste 3: Verificar Auditoria

```powershell
python manage.py shell
```

```python
from api.models_security import LogAuditoria

# Criar log de teste
log = LogAuditoria.registrar(
    acao='login',
    descricao='Teste de auditoria',
    nivel='info'
)

print(f"Log criado: {log}")

# Ver últimos logs
logs = LogAuditoria.objects.all()[:5]
for log in logs:
    print(f"- {log}")

exit()
```

✅ **Esperado:** Logs sendo criados e listados

---

### Teste 4: Testar API com Postman/Insomnia

#### 1. Login

**POST** `http://localhost:8000/api/auth/login/`

```json
{
  "username": "admin@egide.com",
  "password": "admin123"
}
```

**Resposta esperada:**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin@egide.com",
    ...
  }
}
```

#### 2. Listar Policiais

**GET** `http://localhost:8000/api/policiais/`

**Headers:**
```
Authorization: Bearer {seu_token_access}
```

**Resposta esperada:**

```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "matricula": "12345678",
      "nome": "João Silva",
      ...
    }
  ]
}
```

---

### Teste 5: Verificar Middleware

```powershell
python manage.py shell
```

```python
from api.middleware import AuditoriaMiddleware, RateLimitMiddleware

# Verificar se middlewares existem
print("Auditoria:", AuditoriaMiddleware)
print("Rate Limit:", RateLimitMiddleware)

# Ver logs de auditoria criados automaticamente
from api.models_security import LogAuditoria
print("\nÚltimos 10 logs:")
for log in LogAuditoria.objects.all()[:10]:
    print(f"- [{log.nivel}] {log.acao}: {log.descricao}")

exit()
```

---

### Teste 6: Testar Rate Limiting

Faça várias requisições rápidas:

```powershell
# Fazer 10 requisições seguidas
1..10 | ForEach-Object {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/api/policiais/" -Method Get
        Write-Host "Requisição $_ : OK"
    } catch {
        Write-Host "Requisição $_ : BLOQUEADO" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 100
}
```

✅ **Esperado:** Algumas requisições serem bloqueadas após o limite

---

## 🔍 Checklist de Testes

### Backend

```
[ ] Servidor Django inicia sem erros
[ ] Admin Django acessível
[ ] Models de segurança criados
[ ] Policiais podem ser criados
[ ] Perfis de usuário funcionam
[ ] Logs de auditoria são criados
[ ] API REST responde
[ ] Autenticação JWT funciona
[ ] Permissões bloqueiam acesso correto
[ ] Middleware de auditoria registra ações
[ ] Rate limiting funciona
```

### Frontend

```
[ ] npm start funciona sem erros
[ ] Páginas carregam
[ ] Pode fazer requisições ao backend
[ ] Autenticação funciona
[ ] Rotas protegidas bloqueiam acesso
```

---

## 🐛 Problemas Comuns

### Erro: "No module named 'rest_framework'"

```powershell
pip install djangorestframework djangorestframework-simplejwt
```

### Erro: "table does not exist"

```powershell
python manage.py makemigrations
python manage.py migrate
```

### Erro: "CORS policy blocking"

Verificar em `egide_backend/settings.py`:

```python
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]
```

### Erro: "User has no policial"

```powershell
python manage.py shell
```

```python
from django.contrib.auth.models import User
from api.models import Policial
from api.models_security import PerfilPolicial

# Criar policial para o superuser
user = User.objects.first()
policial = Policial.objects.create(
    usuario=user,
    matricula='00000001',
    nome=user.username,
    classe='Oficial',
    cargo='Delegado',
    email=user.email,
    ativo=True
)

# Criar perfil
PerfilPolicial.objects.create(
    policial=policial,
    tipo='admin',
    ativo=True
)

print("Policial e perfil criados!")
exit()
```

---

## 📊 Testar Casos de Uso

### Caso 1: Criar uma Operação

```python
python manage.py shell
```

```python
from api.models import OperacaoPolicial, Policial
from datetime import datetime, timedelta

# Buscar coordenador
coordenador = Policial.objects.first()

# Criar operação
operacao = OperacaoPolicial.objects.create(
    nome="Operação Teste",
    data_inicio=datetime.now(),
    data_fim=datetime.now() + timedelta(days=1),
    local="Centro da cidade",
    coordenador=coordenador,
    status="Planejamento"
)

print(f"Operação criada: {operacao}")
exit()
```

### Caso 2: Verificar Log de Auditoria

```python
python manage.py shell
```

```python
from api.models_security import LogAuditoria

# Ver logs de operações
logs = LogAuditoria.objects.filter(acao__contains='operacao')
for log in logs:
    print(f"{log.timestamp}: {log.acao} - {log.descricao}")

exit()
```

---

## 🎯 Teste Completo Automatizado

Crie um arquivo `egide-backend/test_sistema.py`:

```python
from django.test import TestCase
from django.contrib.auth.models import User
from api.models import Policial
from api.models_security import PerfilPolicial, LogAuditoria

class SistemaSegurancaTestCase(TestCase):
    def setUp(self):
        # Criar usuário de teste
        self.user = User.objects.create_user(
            username='test@test.com',
            password='test123'
        )
        
        # Criar policial
        self.policial = Policial.objects.create(
            usuario=self.user,
            matricula='99999999',
            nome='Teste',
            classe='Praça',
            cargo='Policial Civil',
            email='test@test.com'
        )
        
        # Criar perfil
        self.perfil = PerfilPolicial.objects.create(
            policial=self.policial,
            tipo='admin',
            ativo=True
        )
    
    def test_perfil_criado(self):
        """Testa se o perfil foi criado"""
        self.assertTrue(self.perfil.is_admin)
        self.assertTrue(self.perfil.ativo)
    
    def test_log_auditoria(self):
        """Testa criação de log"""
        log = LogAuditoria.registrar(
            acao='login',
            usuario=self.user,
            policial=self.policial,
            descricao='Teste de login'
        )
        self.assertIsNotNone(log)
        self.assertEqual(log.acao, 'login')
    
    def test_permissoes(self):
        """Testa permissões do usuário"""
        self.assertTrue(self.perfil.pode_deletar(self.policial))
        self.assertTrue(self.perfil.pode_editar(self.policial))
```

Executar testes:

```powershell
cd egide-backend
python manage.py test
```

✅ **Esperado:** Todos os testes passarem

---

## 📱 Testar no Navegador

### 1. Abrir Django Admin
http://localhost:8000/admin

### 2. Abrir API Browsable
http://localhost:8000/api/

### 3. Testar Endpoints

- http://localhost:8000/api/policiais/
- http://localhost:8000/api/operacoes/
- http://localhost:8000/api/escalas/
- http://localhost:8000/api/auditoria/

---

## ✅ Tudo Funcionando?

Se todos os testes passaram:

1. ✅ Backend Django está funcionando
2. ✅ Sistema de segurança implementado
3. ✅ API REST acessível
4. ✅ Autenticação JWT funciona
5. ✅ Permissões estão corretas
6. ✅ Auditoria registrando ações

**Próximo passo:** Integrar o frontend React com a API Django!

Ver: `INTEGRACAO_FRONTEND_BACKEND.md`
