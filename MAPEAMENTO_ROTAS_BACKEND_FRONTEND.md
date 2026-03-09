# Mapeamento de Rotas e Estrutura (Backend + Frontend)

## 1) Visão geral

Este documento mostra:
- Quais rotas existem no **backend Django**.
- Onde cada rota é implementada (ViewSet/View).
- Onde o **frontend React** consome essas rotas.
- Onde ficam as telas, serviços e módulos principais no projeto.

---

## 2) Backend (Django)

### 2.1 Arquivos centrais
- Configuração de rotas globais: `egide-backend/egide_backend/urls.py`
- ViewSets e regras da API: `egide-backend/api/views.py`
- Autenticação custom: `egide-backend/api/views_auth.py`
- Serializers: `egide-backend/api/serializers.py`
- Modelos: `egide-backend/api/models.py`
- Configuração de projeto: `egide-backend/egide_backend/settings.py`

### 2.2 Rotas base
- `GET /` → `api_root` (resumo da API)
- `GET/POST /api/...` → rotas do `DefaultRouter`
- `GET/POST /api/auth/...` → autenticação JWT custom
- `GET/POST /api-auth/...` → DRF auth (navegador)
- `GET /admin/` → Django Admin

### 2.3 Mapa de endpoints API (Router)

#### Núcleo EGIDE
- `/api/departamentos/` → `DepartamentoViewSet` (`api/views.py`)
- `/api/delegacias/` → `DelegaciaViewSet`
- `/api/policiais/` → `PolicialViewSet`
- `/api/viaturas/` → `ViaturaViewSet`
- `/api/vagas/` → `VagaViewSet`
- `/api/equipes/` → `EquipeViewSet`
- `/api/operacoes/` → `OperacaoViewSet`
- `/api/comboios/` → `ComboioViewSet`
- `/api/feriados/` → `FeriadoViewSet`

#### Sistema de Operações
- `/api/operacoes-policiais/` → `OperacaoPolicialViewSet`
- `/api/alvos/` → `AlvoViewSet`
- `/api/equipes-operacao/` → `EquipeOperacaoViewSet`
- `/api/resultados-operacao/` → `ResultadoOperacaoViewSet`
- `/api/aportes-financeiros/` → `AporteFinanceiroViewSet`

#### Sistema de Eventos
- `/api/eventos/` → `EventoOperacaoViewSet`
- `/api/departamentos-evento/` → `DepartamentoEventoViewSet`
- `/api/escalas/` → `EscalaPolicialViewSet`

### 2.4 Rotas de autenticação
- `POST /api/auth/login/` → `login_view` (`api/views_auth.py`)
- `POST /api/auth/logout/` → `logout_view`
- `POST /api/auth/refresh/` → `TokenRefreshView` (SimpleJWT)
- `GET /api/auth/me/` → `me_view`

---

## 3) Frontend (React)

### 3.1 Arquivos centrais
- Entrada principal da aplicação: `src/App.js`
- Cliente HTTP/API: `src/config/api.js`
- Serviços de domínio: `src/services/`
- Componentes compartilhados: `src/components/`
- Telas por domínio: `src/views/`

### 3.2 Rotas frontend (URL explícitas)

Navegação migrada para `react-router-dom` em `src/App.js` + `src/index.js`.

#### Rotas públicas
- `/login` → `LoginScreen`
- `/signup` → `SignUpScreen`
- `/forgot-password` → `ForgotPasswordScreen`

#### Rotas autenticadas
- `/home` → `HomePage` (seleção de sistema)
- `/egide` → redireciona por perfil:
   - admin → `/egide/admin`
   - departamento → `DashboardDepartamento`
   - policial → `OfficerDashboard`
- `/egide/admin` → `AdminDashboard` (somente admin)
- `/egide/officer` → `OfficerDashboard`
- `/operacoes` → `OperationsDashboard`
- `/teste-crud` → `ExemploCicloCompleto`

#### Deep-link por aba (`?view=`)

| Contexto | Rota base | `view` aceitos | `view` padrão |
|---|---|---|---|
| EGIDE Admin | `/egide/admin` | `dashboard`, `ranking`, `schedule`, `convoys`, `paymentReport`, `operationCost`, `operationReports`, `alerts`, `holidays` | `dashboard` |
| EGIDE Departamento | `/egide` | `dashboard`, `ranking`, `schedule`, `convoys`, `paymentReport`, `operationCost`, `operationReports`, `alerts`, `holidays` | `dashboard` |
| EGIDE Policial | `/egide/officer` | `calendario`, `operacoes`, `historico` | `calendario` |
| Operações (admin/DTO) | `/operacoes` | `dashboard`, `nova-demanda`, `planejamento`, `aprovacao`, `equipes`, `vincular-alvos`, `estatisticas`, `relatorio` | `dashboard` |
| Operações (departamento) | `/operacoes` | `dashboard`, `nova-demanda`, `planejamento`, `equipes`, `vincular-alvos`, `estatisticas`, `relatorio` | `dashboard` |
| Operações (policial operacional) | `/operacoes` | `relatorio`, `meus-alvos` | `relatorio` |

Exemplos:
- `/egide/admin?view=schedule`
- `/egide?view=operationCost`
- `/egide/officer?view=historico`
- `/operacoes?view=aprovacao`

Regras:
- Se `view` não existir ou for inválido para o perfil atual, o dashboard abre no `view` padrão.
- Em `/egide`, usuários admin são redirecionados para `/egide/admin`; portanto, para admin, o deep-link deve ser feito em `/egide/admin?view=...`.

#### Redirecionamentos
- `/` e `*` redirecionam para:
   - `/home` se autenticado
   - `/login` se não autenticado

### 3.3 Módulos de telas e localização

#### Auth
- `src/views/auth/LoginScreen.js`
- `src/views/auth/SignUpScreen.js`
- `src/views/auth/ForgotPasswordScreen.js`

#### Home / Seleção
- `src/views/HomePage.js`

#### Admin (EGIDE)
- Dashboard: `src/views/admin/AdminDashboard.js`
- Componentes: `src/views/admin/components/`
  - Escalas: `ScheduleManagementView.js`
  - Comboios: `ConvoyManagementView.js`
  - Feriados: `HolidayManagementView.js`
  - Ranking: `RankingView.js`
  - Relatório de pagamento: `OperationCostView.js`
  - Relatórios de operação: `OperationReportsView.js`
  - Frequência operacional: `PaymentReportView.js`
  - Usuários: `UserManagementView.js`
  - Alertas: `AlertsView.js`

#### Departamento
- `src/views/departamentos/DashboardDepartamento.js`

#### Policial
- Dashboard: `src/views/officer/OfficerDashboard.js`
- Componentes: `src/views/officer/components/`
  - Vagas calendário: `VagasCalendarView.js`
  - Minhas operações: `MinhasOperacoesView.js`
  - Histórico: `HistoricoView.js`

#### Operações (módulo separado)
- `src/views/operations/OperationsDashboard.js`
- `src/views/operations/components/`

---

## 4) Mapa Frontend → Backend (consumo via apiClient)

Arquivo base: `src/config/api.js`

### 4.1 Auth
- `apiClient.login()` → `POST /api/auth/login/`
- `apiClient.logout()` → `POST /api/auth/logout/`
- `apiClient.refreshToken()` → `POST /api/auth/refresh/`
- `apiClient.getCurrentUser()` → `GET /api/auth/me/`

### 4.2 Recursos principais
- Policiais: `/api/policiais/`
- Delegacias: `/api/delegacias/`
- Departamentos: `/api/departamentos/`
- Vagas: `/api/vagas/`
- Equipes (`teams`): `/api/equipes/`
- Comboios (`convoys`): `/api/comboios/`
- Operações: `/api/operacoes/`
- Eventos: `/api/eventos/`
- Feriados (`holidays`): `/api/feriados/`
- Escalas: `/api/escalas/`

### 4.3 Endpoints auxiliares no frontend
- Ranking: `apiClient.getRanking()` → `/api/ranking/` (depende de endpoint disponível no backend)
- Convoy Reports: `/api/convoy-reports/` (se não existir no backend, frontend aplica fallback local via localStorage)

---

## 5) Serviços frontend (camada intermediária)

Pasta: `src/services/`
- `adminService.js`: operações administrativas (equipes, vagas, comboios)
- `djangoApi.js`: integrações auxiliares legadas/compatibilidade
- `djangoApiAuth.js`: autenticação específica
- `eventosApi.js`: APIs focadas em eventos

---

## 6) Banco e domínio backend

Modelos principais em `egide-backend/api/models.py`:
- `Departamento`
- `Delegacia`
- `Policial`
- `Viatura`
- `Vaga`
- `Equipe`
- `Operacao`
- `Comboio`
- `OperacaoPolicial`
- `Alvo`
- `EquipeOperacao`
- `ResultadoOperacao`
- `AporteFinanceiro`
- `EventoOperacao`
- `DepartamentoEvento`
- `EscalaPolicial`
- `Feriado`

---

## 7) Tipos de recurso (por categoria)

### 7.1 Recursos de domínio (negócio)
- **Estrutura organizacional**: `Departamento`, `Delegacia`
- **Pessoal**: `Policial`, `Equipe`, `EscalaPolicial`
- **Logística**: `Viatura`, `Vaga`
- **Operação tática**: `Operacao`, `Comboio`, `OperacaoPolicial`, `Alvo`, `EquipeOperacao`, `ResultadoOperacao`
- **Financeiro**: `AporteFinanceiro`
- **Eventos**: `EventoOperacao`, `DepartamentoEvento`, `Feriado`

### 7.2 Recursos de API (REST)
- **Coleções**: endpoints como `/api/policiais/`, `/api/vagas/`, `/api/equipes/`
- **Item único**: endpoints como `/api/policiais/{id}/`, `/api/vagas/{id}/`
- **Autenticação**: `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/refresh/`, `/api/auth/me/`
- **Recursos auxiliares/fallback no front**: `convoy-reports`, `ranking`

### 7.3 Recursos de frontend (UI)
- **Páginas/Telas**: dashboards e views em `src/views/`
- **Componentes reutilizáveis**: layout, formulários e UI em `src/components/`
- **Serviços de dados**: integrações HTTP em `src/config/api.js` e `src/services/`
- **Estados de sessão**: token JWT e refresh token no `localStorage`

---

## 8) Ferramentas e stack técnica

### 8.1 Backend
- **Framework**: Django
- **API**: Django REST Framework
- **Auth JWT**: SimpleJWT
- **Banco**: SQLite (local), com possibilidade de PostgreSQL em deploy
- **Admin**: Django Admin

### 8.2 Frontend
- **Framework UI**: React
- **Build**: `react-scripts` (CRA)
- **UI/Ícones**: Tailwind CSS (configurado no projeto) + `lucide-react`
- **Gráficos**: `chart.js` + `react-chartjs-2`
- **Relatórios**: `jspdf`, `jspdf-autotable`, `xlsx`
- **Calendário**: `react-calendar`

### 8.3 Ferramentas de desenvolvimento
- **Gerenciador JS**: npm
- **Gerenciador Python**: pip + venv
- **Controle de versão**: Git
- **Editor recomendado**: VS Code

---

## 9) Linguagens de programação

- **Python**: backend (Django, DRF, regras de negócio, autenticação)
- **JavaScript**: frontend React e serviços de integração
- **SQL**: camada de persistência via ORM do Django (consultas geradas para SQLite/PostgreSQL)
- **HTML/CSS**: renderização da interface (JSX + classes utilitárias)
- **Markdown**: documentação técnica e operacional

---

## 10) Observações importantes

1. **Nomenclatura frontend x backend**
   - Front usa `teams/convoys/holidays`, mas no backend os recursos são `equipes/comboios/feriados`.
   - Esse mapeamento está abstraído no `apiClient`.

2. **Navegação principal**
   - A navegação está em rotas explícitas com `react-router-dom`.
   - O `Header` usa navegação por rota para alternar entre `/egide/admin` e `/egide/officer`.
   - Dashboards internos sincronizam aba ativa com `?view=` para suportar bookmark e refresh sem perder contexto.

3. **Endpoints opcionais/fallback**
   - `convoy-reports` e `ranking` podem depender de implementação backend específica.

---

## 11) Checklist rápido de manutenção

Quando criar um novo recurso:
1. Adicionar `Model` em `api/models.py`
2. Adicionar `Serializer` em `api/serializers.py`
3. Adicionar `ViewSet` em `api/views.py`
4. Registrar rota em `egide_backend/urls.py`
5. Expor método no `src/config/api.js`
6. Consumir na view correspondente em `src/views/...`

---

Atualizado em: 25/02/2026
