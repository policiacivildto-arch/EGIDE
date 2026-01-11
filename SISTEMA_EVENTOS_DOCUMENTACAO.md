# Sistema de Operações de Evento - Documentação Completa

## 📋 Visão Geral

Sistema desenvolvido para gerenciar operações especiais de eventos (Carnaval, Réveillon, shows, eventos esportivos, etc.) com controle de escalas, custos e efetivo policial.

## 🎯 Funcionalidades Principais

### 1. Cadastro de Eventos
- Criação de eventos especiais com:
  - Nome, tipo (Carnaval, Réveillon, etc)
  - Local e período (data início/fim)
  - Status do evento
  - Descrição e observações

### 2. Participação de Departamentos
**Fase 1 - Cadastro Inicial:**
- Departamento informa:
  - Quantidade de policiais (SEM informar nomes no início)
  - Tipo de serviço: Ordinário ou Extraordinário
  - Tipo de policial: OIP (Oficiais de Plantão) ou DPC (Delegado)
  - Se terá ou não aporte financeiro
  - Horário de funcionamento da delegacia/departamento

**Fase 2 - Definição de Escalas:**
- Cadastro individual de cada policial com:
  - Identificação (Policial 1, Policial 2, etc ou nome real)
  - Data do serviço
  - Horário de entrada
  - Horário de saída
  - Valor/hora (para cálculo de custos)
  - Observações

### 3. Dashboard Completo
- Estatísticas gerais do evento
- Total de departamentos participantes
- Total de policiais planejados vs escalas cadastradas
- Total de horas trabalhadas
- Custo total do evento
- Progresso de cadastro
- Detalhamento por departamento

## 🔧 Tecnologias Utilizadas

### Backend (Django)
- **Models:**
  - `EventoOperacao`: Evento principal
  - `DepartamentoEvento`: Participação de departamento no evento
  - `EscalaPolicial`: Escala individual de cada policial

- **API REST:**
  - `/api/eventos/` - Gerenciar eventos
  - `/api/eventos/{id}/dashboard/` - Dashboard completo
  - `/api/departamentos-evento/` - Gerenciar participações
  - `/api/escalas/` - Gerenciar escalas individuais

### Frontend (React)
- **Componentes Principais:**
  - `EventosDashboard`: Lista de eventos
  - `EventoDetalhes`: Detalhes e dashboard do evento
  - `CadastrarDepartamento`: Cadastro Fase 1
  - `DefinirEscalas`: Cadastro Fase 2

## 📊 Fluxo de Trabalho

```
1. CRIAR EVENTO
   ↓
2. ADICIONAR DEPARTAMENTOS (Fase 1)
   - Informar quantidade
   - Configurar horários padrão
   - Definir tipo de serviço
   ↓
3. DEFINIR ESCALAS (Fase 2)
   - Preencher horários individuais
   - Calcular custos automaticamente
   ↓
4. VISUALIZAR DASHBOARD
   - Acompanhar progresso
   - Ver custos totais
   - Exportar relatórios
```

## 🚀 Como Usar

### 1. Acessar o Sistema
```
URL: http://localhost:3000/eventos
```

### 2. Criar Novo Evento
1. Clique em "Novo Evento"
2. Preencha:
   - Nome (ex: Carnaval 2026)
   - Tipo de evento
   - Local
   - Datas de início e fim
3. Salve

### 3. Adicionar Departamento
1. Dentro do evento, clique em "Adicionar Departamento"
2. Preencha:
   - Selecione o departamento
   - Delegacia (opcional)
   - Tipo de serviço (Ordinário/Extraordinário)
   - Tipo de policial (OIP/DPC)
   - **Quantidade de policiais** (importante!)
   - Se terá aporte financeiro
   - Horários de funcionamento
3. Salve

### 4. Definir Escalas
1. Na lista de departamentos, clique em "Escalas"
2. O sistema cria templates vazios baseado na quantidade informada
3. Preencha para cada policial:
   - Data do serviço
   - Horário de entrada
   - Horário de saída
   - Valor/hora (para custos)
4. Use "Ações Rápidas" para:
   - Aplicar horários padrão para todos
   - Duplicar data para todos
5. Salve todas as escalas

## 📈 Cálculos Automáticos

### Horas Trabalhadas
```python
entrada = 08:00
saida = 18:00
horas = 10 horas

# Se passar da meia-noite:
entrada = 22:00
saida = 06:00
horas = 8 horas
```

### Custo
```python
custo_total = horas_trabalhadas × valor_hora

Exemplo:
10 horas × R$ 50,00 = R$ 500,00
```

## 🎨 Recursos Visuais

### Badges de Status
- 🟡 Planejamento
- 🟡 Cadastro Inicial
- 🔵 Definindo Escalas
- 🟣 Aprovado
- 🟢 Em Andamento
- ⚪ Concluído
- 🔴 Cancelado

### Indicadores
- ✓ Verde: Escalas completas
- ⚠ Laranja: Escalas incompletas
- Progresso em %

## 🔐 Permissões

- **Admin**: Acesso total
- **Departamento**: Pode cadastrar e editar suas participações
- **Visualização**: Pode ver dashboards e relatórios

## 📱 API Endpoints

### Eventos
```
GET    /api/eventos/                    # Listar eventos
POST   /api/eventos/                    # Criar evento
GET    /api/eventos/{id}/               # Detalhe evento
PUT    /api/eventos/{id}/               # Atualizar evento
DELETE /api/eventos/{id}/               # Deletar evento
GET    /api/eventos/{id}/dashboard/    # Dashboard completo
POST   /api/eventos/{id}/mudar_status/ # Mudar status
```

### Departamentos no Evento
```
GET    /api/departamentos-evento/?evento={id}     # Listar por evento
POST   /api/departamentos-evento/                 # Criar participação
PUT    /api/departamentos-evento/{id}/            # Atualizar
DELETE /api/departamentos-evento/{id}/            # Deletar
POST   /api/departamentos-evento/{id}/gerar_escalas/ # Gerar templates
GET    /api/departamentos-evento/{id}/resumo/    # Resumo do depto
```

### Escalas
```
GET    /api/escalas/?departamento_evento={id}  # Listar escalas
POST   /api/escalas/                            # Criar escala
POST   /api/escalas/criar_multiplas/            # Criar várias
PUT    /api/escalas/{id}/                       # Atualizar
DELETE /api/escalas/{id}/                       # Deletar
```

## 💾 Estrutura do Banco de Dados

### EventoOperacao
- nome, tipo_evento, descricao
- local, data_inicio, data_fim
- status, criado_por
- Timestamps

### DepartamentoEvento
- evento (FK), departamento (FK), delegacia (FK)
- tipo_servico, tipo_policial
- quantidade_policiais
- com_aporte_financeiro
- horario_inicio_delegacia, horario_fim_delegacia
- escalas_definidas, observacoes
- Timestamps

### EscalaPolicial
- departamento_evento (FK)
- policial (FK opcional), identificacao
- data_servico, horario_entrada, horario_saida
- horas_trabalhadas (calculado), valor_hora, custo_total (calculado)
- observacoes
- Timestamps

## 🐛 Troubleshooting

### Erro: "Nenhuma escala fornecida"
**Solução:** Verifique se preencheu ao menos uma escala antes de salvar

### Erro: "Data de serviço obrigatória"
**Solução:** Todas as escalas devem ter uma data preenchida

### Cálculo de horas incorreto
**Solução:** Verifique se os horários estão no formato correto (HH:MM)

### Dashboard não atualiza
**Solução:** Recarregue a página ou clique em "Atualizar"

## 📞 Suporte

Para dúvidas ou problemas, contacte a equipe de desenvolvimento.

## 🔄 Atualizações Futuras

- [ ] Exportação para PDF/Excel
- [ ] Notificações automáticas
- [ ] Integração com folha de pagamento
- [ ] App mobile
- [ ] Relatórios avançados
- [ ] Integração com sistema de ponto

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Sistema:** EGIDE - Módulo de Eventos
