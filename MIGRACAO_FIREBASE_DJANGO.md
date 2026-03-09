# 🔄 Migração Firebase → Django

## ✅ Concluído

- ✅ Criação do arquivo `src/config/api.js` com classe `DjangoApiClient`
- ✅ Criação do arquivo `src/config/api.js` com classe `DjangoApiClient`
- ✅ **AUTENTICAÇÃO FUNCIONANDO**: Admin login testado com sucesso (admin/admin123)
   - Problema resolvido: Senha do superuser foi resetada via Django shell
   - Endpoint `/api/auth/login/` retorna JWT tokens corretamente
- ✅ Remoção do Firebase do `package.json`
- ✅ Atualização do `src/App.js` para usar Django
- ✅ Atualização do `src/views/auth/LoginScreen.js` para usar Django
- ✅ Atualização do `src/services/adminService.js` para usar Django
- ✅ Atualização do `.env` - Removido Firebase, adicionado `REACT_APP_API_URL`
- ✅ **MIGRADO**: `src/views/admin/useAdminData.js` - Hook de dados admin
- ✅ **MIGRADO**: `src/views/admin/AdminDashboard.js` - Dashboard admin
- ✅ **MIGRADO**: `src/views/admin/components/UserManagementView.js`
- ✅ **MIGRADO**: `src/views/admin/components/ScheduleManagementView.js`
- ✅ **MIGRADO**: `src/views/admin/components/HolidayManagementView.js`
- ✅ **MIGRADO**: `src/views/admin/components/ConvoyManagementView.js`
- ✅ **MIGRADO**: `src/views/officer/OfficerDashboard.js`
- ✅ **MIGRADO**: `src/views/officer/components/VagasCalendarView.js`
- ✅ **MIGRADO**: `src/views/officer/components/MinhasOperacoesView.js`
- ✅ **MIGRADO**: `src/views/officer/components/HistoricoView.js`
- ✅ Adicionados métodos na API para: vagas, teams, convoys, holidays, convoy-reports

---

## 📦 Armazenamento de Dados - NOVO

Todos os dados agora serão armazenados em **Django Database**:

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│                                                       │
│  - Autenticação via JWT tokens                      │
│  - Chamadas à API Django via apiClient              │
└────────────────┬────────────────────────────────────┘
                 │ API REST (JSON)
                 ↓
┌─────────────────────────────────────────────────────┐
│              BACKEND (Django)                        │
│                                                       │
│  - Autenticação: JWT Tokens                         │
│  - Database: SQLite (desenvolvimento)               │
│           ou PostgreSQL (produção)                   │
└────────────────┬────────────────────────────────────┘
                 │ SQL
                 ↓
         ┌───────────────┐
         │   Database    │
         │ (SQLite/Psql) │
         └───────────────┘
```

### Banco de Dados Django

- **Desenvolvimento**: `egide-backend/db.sqlite3`
- **Produção**: PostgreSQL no Supabase ou Render
- **ORM**: Django Models (ver `egide-backend/api/models.py`)

---

## 📋 Arquivos Ainda Precisando Migração

Os seguintes arquivos ainda usam Firebase e precisam ser atualizados:
### Status de Autenticação ✅
- ✅ Superuser 'admin' criado
- ✅ Senha resetada e validada
- ✅ Login endpoint testado com sucesso (Status 200)
- ✅ JWT tokens sendo gerados corretamente

### Próximas migrações após autenticação:

### Views / Dashboards

- [x] ~~`src/views/admin/useAdminData.js`~~ ✅ MIGRADO
- [x] ~~`src/views/admin/AdminDashboard.js`~~ ✅ MIGRADO
- [x] ~~`src/views/admin/components/UserManagementView.js`~~ ✅ MIGRADO
- [x] ~~`src/views/admin/components/ScheduleManagementView.js`~~ ✅ MIGRADO
- [ ] `src/views/admin/components/RankingView.js`
- [ ] `src/views/admin/components/ReportsDashboardView.js`
- [ ] `src/views/admin/components/OperationReportsView.js`
- [ ] `src/views/admin/components/OperationCostView.js`
- [ ] `src/views/admin/components/PaymentReportView.js`
- [x] ~~`src/views/admin/components/HolidayManagementView.js`~~ ✅ MIGRADO
- [x] ~~`src/views/admin/components/ConvoyManagementView.js`~~ ✅ MIGRADO
- [ ] `src/views/admin/components/AlertsView.js`

### Officer Views

- [x] ~~`src/views/officer/OfficerDashboard.js`~~ ✅ MIGRADO (não usa Firebase)
- [x] ~~`src/views/officer/components/MinhasOperacoesView.js`~~ ✅ MIGRADO
- [x] ~~`src/views/officer/components/VagasCalendarView.js`~~ ✅ MIGRADO
- [x] ~~`src/views/officer/components/HistoricoView.js`~~ ✅ MIGRADO

### Departamentos

- [ ] `src/views/departamentos/DashboardDepartamento.js`

### Autenticação

- [ ] `src/views/auth/ForgotPasswordScreen.js`
- [ ] `src/views/auth/SignUpScreen.js` (se ainda usar Firebase)

### Operations

- [ ] `src/views/operations/OperationsDashboard.js` (se usar Firebase)

---

## 🔧 Como Migrar Cada Arquivo

### Template de Migração

**ANTES (Firebase):**
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';

const loadUsers = async () => {
  const q = query(
    collection(db, `/artifacts/${appId}/users`),
    where('role', '==', 'admin')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

**DEPOIS (Django):**
```javascript
import { apiClient } from '../../config/api';

const loadUsers = async () => {
  return apiClient.getList('policiais', { role: 'admin' });
};
```

### Mapeamento de Funcionalidades

| Firebase | Django |
|----------|--------|
| `collection().add()` | `apiClient.create('resource', data)` |
| `doc().get()` | `apiClient.getDetail('resource', id)` |
| `query().getDocs()` | `apiClient.getList('resource', params)` |
| `doc().set()` | `apiClient.update('resource', id, data)` |
| `doc().update()` | `apiClient.partialUpdate('resource', id, data)` |
| `doc().delete()` | `apiClient.delete('resource', id)` |
| `onSnapshot()` | Polling com `setInterval` ou WebSocket |
| `writeBatch()` | Múltiplas chamadas paralelas com `Promise.all()` |

---

## 🚀 Próximos Passos

1. **Instalar dependências**:
   ```bash
   cd c:\Users\Gigabyte G5 Ke\egide-app
   npm install
   ```

2. **Garantir Django rodando**:
   ```bash
   cd egide-backend
   python manage.py runserver
   ```

3. **Testar autenticação**:
   - Acesse `http://localhost:3000`
   - Faça login com credenciais Django
   - Verifique console para erros de API

4. **Migrar arquivos restantes** - Use o template acima como referência

5. **Testar cada feature**:
   - [ ] Login e autenticação
   - [ ] Carregar lista de policiais
   - [ ] Criar/editar/deletar escalas
   - [ ] Gerenciar comboios
   - [ ] Gerar relatórios

---

## 📝 Nota Importante

- **Não há mais dependência do Firebase**
- JWT tokens armazenados em `localStorage` automaticamente
- Todas as requisições incluem header `Authorization: Bearer <token>`
- CORS deve estar configurado no Django

---

## 🐛 Troubleshooting

### Erro: "CORS error"
→ Verifique `ALLOWED_HOSTS` e `CORS_ALLOWED_ORIGINS` no `egide-backend/egide_backend/settings.py`

### Erro: "401 Unauthorized"
→ Token expirado ou não enviado. Verifique `localStorage.getItem('auth_token')`

### Erro: "404 Not Found"
→ Endpoint não existe no Django. Verifique `egide-backend/egide_backend/urls.py`

### Dados não carregam
→ Verifique se o Django está rodando: `python manage.py runserver`
