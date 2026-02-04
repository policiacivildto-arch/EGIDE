# Apresentação Plano Operacional Carnaval 2026

## 📋 Descrição

Sistema completo de apresentação e análise do Plano Operacional da Polícia Civil do Ceará para o Carnaval de 2026. O sistema inclui visualização de dados, mapas interativos e dashboards analíticos.

## 🎯 Funcionalidades

### 1. **Apresentação Geral**
- Lista completa de todas as delegacias envolvidas
- Filtros por departamento e tipo de plantão
- Estatísticas consolidadas
- Resumo por departamento
- Modal com detalhes de cada delegacia

### 2. **Mapa Interativo**
- Visualização geográfica das delegacias no estado do Ceará
- Marcadores coloridos por departamento
- Animação pulsante para plantões extraordinários
- Legenda completa com todos os departamentos
- Tooltip com informações ao passar o mouse

### 3. **Dashboard Analítico**
- Análise de custos por departamento
- Distribuição de efetivo por tipo de plantão
- Top 5 delegacias com maior custo
- Top 5 departamentos por efetivo
- Gráficos de barras interativos
- Resumo executivo consolidado

## 📊 Dados Incluídos

O sistema processa informações de **57 delegacias** distribuídas em:

### Departamentos:
- **DPI NORTE** - Departamento de Polícia do Interior Norte
- **DPI SUL** - Departamento de Polícia do Interior Sul
- **DPM** - Departamento de Polícia Metropolitana
- **DHPP** - Departamento de Homicídios e Proteção à Pessoa
- **DPE** - Departamento de Polícia Especializada
- **COPLAN** - Coordenadoria de Plantão
- **DPGV** - Departamento de Proteção aos Grupos Vulneráveis
- **DRCO** - Delegacia de Repressão aos Crimes Organizados
- **DTO** - Divisão de Trânsito e Operações
- **CORE** - Coordenadoria de Recursos Especiais

### Informações por Delegacia:
- Nome e localização
- Departamento responsável
- Tipo de plantão (Ordinário ou Extraordinário)
- Horário de funcionamento
- Custos operacionais
- Necessidade de aporte financeiro
- Efetivo planejado (DPC e OIP)
- Observações especiais

## 🚀 Como Usar

### Importação no seu projeto React:

```javascript
import { PlanoOperacionalCarnaval } from './views/carnaval';

// No seu App.js ou router
<Route path="/carnaval2026" element={<PlanoOperacionalCarnaval />} />
```

### Navegação:

A apresentação possui 3 abas principais:

1. **📊 Apresentação** - Visão geral com tabelas e filtros
2. **🗺️ Mapa Interativo** - Visualização geográfica
3. **📈 Dashboard** - Análises e gráficos

## 💰 Resumo Financeiro

### Categorias de Aporte:
- **Aporte Necessário**: Delegacias que dependem de recursos confirmados
- **Aporte a Definir**: Delegacias aguardando definição de recursos
- **Sem Aporte**: Delegacias com recursos já disponíveis

### Custos Totais:
- Total estimado calculado automaticamente
- Distribuição por departamento
- Análise por tipo de plantão

## 👮 Efetivo Planejado

### Categorias:
- **DPC** - Delegado de Polícia Civil
- **OIP** - Oficial de Investigação Policial
- **OIP UR** - Oficial de Investigação Policial Unidade de Reforço

### Distribuição:
- Plantões ordinários 24h
- Plantões extraordinários com horários especiais
- Reforço condicional ao aporte

## 📝 Observações Importantes

### Alertas Críticos:
- Delegacias marcadas com "SO ABRE SE TIVER APORTE" dependem de recursos
- Algumas delegacias têm efetivo de reforço condicionado
- Horários especiais para eventos específicos

## 🎨 Recursos Visuais

### Cores por Departamento:
- DPI NORTE: Azul
- DPI SUL: Verde
- DPM: Amarelo
- DHPP: Vermelho
- DPE: Roxo
- COPLAN: Rosa
- DPGV: Teal
- DRCO: Laranja
- DTO: Índigo
- CORE: Lima

### Indicadores:
- 🟢 Verde: Sem necessidade de aporte
- 🟠 Laranja: Aporte a definir
- 🔴 Vermelho: Aporte necessário

## 📱 Responsividade

A apresentação é totalmente responsiva, adaptando-se a:
- Desktop (telas grandes)
- Tablet (telas médias)
- Mobile (telas pequenas)

## 🔍 Filtros Disponíveis

### Por Departamento:
- Filtra delegacias por departamento específico
- Opção "Todos" para visão completa

### Por Tipo de Plantão:
- Ordinário
- Extraordinário
- Todos

## 📈 Métricas e KPIs

### Principais Indicadores:
1. Total de delegacias operacionais
2. Efetivo total planejado
3. Custo total estimado
4. Quantidade de aportes necessários
5. Distribuição ordinário vs extraordinário
6. Plantões 24h vs horário especial

## 🗓️ Data da Operação

**14 de fevereiro de 2026** (Carnaval)

## 💡 Dicas de Uso

1. Use os filtros para análises específicas por departamento
2. Consulte o mapa para visão geográfica da cobertura
3. Analise o dashboard para insights sobre custos e efetivo
4. Clique em "Ver Detalhes" para informações completas de cada delegacia
5. Observe as observações especiais para restrições operacionais

## 🔐 Acesso aos Dados

Os dados estão armazenados em:
```
src/data/planoCarnaval2026.json
```

Estrutura facilmente atualizável para novos eventos ou modificações no plano.

## 📞 Suporte

Para dúvidas ou sugestões sobre a apresentação, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido para a Polícia Civil do Estado do Ceará**
**Sistema EGIDE - Gestão Integrada de Delegacias**
