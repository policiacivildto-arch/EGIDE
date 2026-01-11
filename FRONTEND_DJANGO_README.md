# 🎨 Frontend React - Sistema EGIDE Django

## ✅ Arquivos Criados

### 🔐 Autenticação e API

| Arquivo | Descrição |
|---------|-----------|
| `src/services/djangoApiAuth.js` | ✅ Cliente completo de API com JWT |
| `src/hooks/useDjangoAuth.js` | ✅ Hooks de autenticação e dados |
| `src/components/auth/ProtectedRoute.js` | ✅ Proteção de rotas |
| `src/views/auth/LoginPage.js` | ✅ Página de login completa |

### 📊 Views e Dashboards

| Arquivo | Descrição |
|---------|-----------|
| `src/AppDjango.js` | ✅ App principal integrado com Django |
| `src/views/departamentos/DepartamentosDashboard.js` | ✅ Dashboard completo |

---

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install react-router-dom
```

### 2. Configurar Variável de Ambiente

Crie ou edite `.env` na raiz do projeto:

```env
REACT_APP_DJANGO_API_URL=http://localhost:8000/api
```

### 3. Atualizar index.js

Edite `src/index.js`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppDjango from './AppDjango';  // <-- Usar AppDjango
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppDjango />
  </React.StrictMode>
);

reportWebVitals();
```

### 4. Iniciar Frontend

```powershell
npm start
```

**Frontend estará em:** http://localhost:3000

---

## 📁 Estrutura Frontend

```
src/
├── services/
│   └── djangoApiAuth.js         # Cliente API com JWT
│
├── hooks/
│   └── useDjangoAuth.js         # Hooks de autenticação
│
├── components/
│   └── auth/
│       └── ProtectedRoute.js    # Proteção de rotas
│
├── views/
│   ├── auth/
│   │   └── LoginPage.js         # Página de login
│   └── departamentos/
│       └── DepartamentosDashboard.js  # Dashboard principal
│
├── AppDjango.js                 # App principal
└── index.js                     # Entry point
```

---

## 🔑 Recursos Implementados

### ✅ Cliente de API (`djangoApiAuth.js`)

```javascript
import djangoApi from './services/djangoApiAuth';

// Login
const data = await djangoApi.auth.login('dpm', 'senha123');

// Buscar demandas
const demandas = await djangoApi.demandas.getAll();

// Criar demanda
const novaDemanda = await djangoApi.demandas.create({
  titulo: 'Nova Operação',
  descricao: 'Descrição...'
});

// Aprovar demanda
await djangoApi.demandas.aprovar(demandaId, { observacoes: 'OK' });
```

### ✅ Hooks de React

```javascript
import { useAuth, useDemandas, useNotificacoes } from './hooks/useDjangoAuth';

function MeuComponente() {
  // Autenticação
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // Demandas
  const { demandas, loading, criarDemanda } = useDemandas();
  
  // Notificações
  const { notificacoes, naoLidas, marcarLida } = useNotificacoes();
  
  return <div>...</div>;
}
```

### ✅ Proteção de Rotas

```javascript
import ProtectedRoute from './components/auth/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Com verificação de role
<ProtectedRoute requiredRole="staff">
  <AdminPage />
</ProtectedRoute>
```

---

## 🔐 Autenticação

### Login

1. Usuário acessa `/login`
2. Digita username (ex: `dpm`) e senha
3. Sistema chama `djangoApi.auth.login()`
4. Tokens JWT são salvos no localStorage
5. Usuário é redirecionado para `/dashboard`

### Tokens JWT

```javascript
// Tokens são gerenciados automaticamente
localStorage.getItem('access_token')   // Token de acesso (1h)
localStorage.getItem('refresh_token')  // Token de refresh (7 dias)

// Refresh automático quando access_token expira
// O cliente faz isso automaticamente!
```

### Logout

```javascript
const { logout } = useAuth();
await logout();
// Limpa tokens e redireciona para login
```

---

## 📊 Dashboard de Departamentos

### Funcionalidades

- **Tab Demandas**: Lista todas as demandas do departamento
- **Tab Notificações**: Mostra notificações não lidas
- **Criar Demanda**: Botão para criar nova demanda (exceto DTO)
- **Status Visual**: Cores diferentes para cada status
- **Notificações Real-time**: Atualiza a cada 30 segundos

### Diferenças por Tipo

#### Departamento Solicitante (DPM, DHPP, etc.)
- Pode criar demandas
- Vê suas próprias demandas
- Pode editar rascunhos

#### DTO (Departamento Receptor)
- Recebe demandas de todos os departamentos
- Pode aprovar/rejeitar demandas
- Não pode criar demandas

---

## 🎨 Personalização

### Cores por Status

```javascript
const cores = {
  rascunho: 'bg-gray-100 text-gray-800',
  enviada: 'bg-blue-100 text-blue-800',
  em_analise: 'bg-yellow-100 text-yellow-800',
  aprovada: 'bg-green-100 text-green-800',
  rejeitada: 'bg-red-100 text-red-800',
};
```

### Notificações Toast

```javascript
const showNotification = (message, type = 'success') => {
  setNotification({ message, type });
  setTimeout(() => setNotification(null), 4000);
};
```

---

## 🔄 Fluxo de Dados

```
1. Usuario faz login
   ↓
2. Tokens JWT salvos no localStorage
   ↓
3. AuthProvider verifica autenticação
   ↓
4. Hooks useDemandas/useNotificacoes fazem requests
   ↓
5. Cliente API adiciona token Bearer nos headers
   ↓
6. Se 401, faz refresh automático do token
   ↓
7. Dados chegam nos componentes React
```

---

## 🧪 Testar Frontend

### 1. Backend Rodando

```powershell
cd egide-backend
python manage.py runserver
# http://localhost:8000
```

### 2. Criar Departamentos

```powershell
python criar_departamentos.py
```

### 3. Frontend Rodando

```powershell
npm start
# http://localhost:3000
```

### 4. Login

**URL:** http://localhost:3000/login

**Contas de teste:**
- **Admin:** `adm` / `adm`
- **DPM:** `dpm` / `senha123`
- **DTO:** `dto` / `senha123`

### 5. Verificar

- ✅ Login funciona
- ✅ Dashboard carrega
- ✅ Demandas aparecem
- ✅ Notificações funcionam
- ✅ Logout funciona

---

## 🐛 Debug

### Ver Tokens no Console

```javascript
// No DevTools Console
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
localStorage.getItem('user_data')
```

### Ver Requests

```javascript
// Network tab do DevTools
// Filtrar por "api"
// Ver headers Authorization: Bearer ...
```

### Limpar Cache

```javascript
localStorage.clear()
// Ou
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
```

---

## 📱 Próximos Passos

### Componentes Adicionais

1. **FormularioDemanda.js** - Criar/editar demandas
2. **DetalhesDemanda.js** - Ver detalhes completos
3. **ModalAprovacao.js** - Aprovar/rejeitar com observações
4. **ListaPoliciais.js** - Selecionar policiais para operação
5. **CalendarioOperacoes.js** - Visualizar operações no calendário

### Páginas Adicionais

1. `/operacoes` - Lista de operações policiais
2. `/policiais` - Gerenciar policiais
3. `/relatorios` - Relatórios e estatísticas
4. `/configuracoes` - Configurações do departamento

---

## ✅ Checklist

```
[x] Cliente API com JWT
[x] Hooks de autenticação
[x] Página de login
[x] Dashboard de departamentos
[x] Lista de demandas
[x] Lista de notificações
[x] Proteção de rotas
[x] Refresh automático de token
[x] Logout
[x] Notificações toast

[ ] Formulário criar demanda
[ ] Modal de aprovação
[ ] Detalhes da demanda
[ ] Lista de operações
[ ] Gerenciar policiais
[ ] Relatórios
```

---

**Status:** ✅ Frontend pronto para desenvolvimento!  
**Integração:** ✅ 100% integrado com Django Backend  
**Próximo:** Criar formulários e modals adicionais

🚀 **Para testar:** `npm start` + acesse http://localhost:3000
