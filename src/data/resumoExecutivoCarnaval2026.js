/**
 * RESUMO EXECUTIVO - Plano Operacional Carnaval 2026
 * Polícia Civil do Estado do Ceará
 * 
 * Este arquivo contém um resumo executivo dos dados do plano operacional
 */

const resumoExecutivo = {
  meta: {
    titulo: "Plano Operacional - Carnaval 2026",
    data: "14/02/2026",
    orgao: "Polícia Civil do Estado do Ceará",
    versao: "1.0"
  },

  numerosGerais: {
    totalDelegacias: 57,
    totalDepartamentos: 10,
    efetivoTotal: "Estimado em centenas de policiais",
    custosEstimados: "R$ 264.000+ (delegacias com custo informado)"
  },

  distribuicao: {
    porTipoPlantao: {
      ordinarios: 30,
      extraordinarios: 27
    },
    porHorario: {
      plantao24h: 42,
      horarioEspecial: 15
    }
  },

  departamentos: [
    {
      sigla: "DPI NORTE",
      nome: "Departamento de Polícia do Interior - Região Norte",
      totalDelegacias: 15,
      principais: ["Sobral", "Camocim", "Tianguá", "Itapipoca", "Crateús"],
      observacao: "Maior concentração no interior norte do estado"
    },
    {
      sigla: "DPI SUL",
      nome: "Departamento de Polícia do Interior - Região Sul",
      totalDelegacias: 17,
      principais: ["Juazeiro do Norte", "Crato", "Iguatu", "Aracati", "Quixadá"],
      observacao: "Cobertura do interior sul e região do Cariri"
    },
    {
      sigla: "DPM",
      nome: "Departamento de Polícia Metropolitana",
      totalDelegacias: 6,
      principais: ["Aquiraz", "Maracanaú", "Horizonte", "Paracuru", "Cascavel"],
      observacao: "Região metropolitana de Fortaleza"
    },
    {
      sigla: "DHPP",
      nome: "Departamento de Homicídios e Proteção à Pessoa",
      totalDelegacias: 2,
      principais: ["Plantão DHPP", "DHPP Caucaia"],
      observacao: "Investigação de crimes contra a vida"
    },
    {
      sigla: "DPE",
      nome: "Departamento de Polícia Especializada",
      totalDelegacias: 2,
      principais: ["DECAP", "DAER"],
      observacao: "Delegacias especializadas"
    },
    {
      sigla: "COPLAN",
      nome: "Coordenadoria de Plantão",
      totalDelegacias: 10,
      principais: ["2ªDP", "7ªDP", "10ªDP", "CEPROD", "Caucaia"],
      observacao: "Delegacias de plantão na capital"
    },
    {
      sigla: "DPGV",
      nome: "Departamento de Proteção aos Grupos Vulneráveis",
      totalDelegacias: 3,
      principais: ["DCA", "DDM", "DDM Juazeiro"],
      observacao: "Proteção de crianças, mulheres e grupos vulneráveis"
    },
    {
      sigla: "DRCO",
      nome: "Delegacia de Repressão aos Crimes Organizados",
      totalDelegacias: 1,
      principais: ["DRACO"],
      observacao: "Combate ao crime organizado"
    },
    {
      sigla: "DTO",
      nome: "Departamento de tecnico Operaçional",
      totalDelegacias: 1,
      principais: ["ÉGIDE"],
      observacao: "Operações de trânsito e segurança"
    },
    {
      sigla: "CORE",
      nome: "Coordenadoria de Recursos Especiais",
      totalDelegacias: 1,
      principais: ["CORE"],
      observacao: "Recursos especiais e apoio"
    }
  ],

  aportesFinanceiros: {
    necessario: {
      quantidade: 12,
      descricao: "Delegacias que necessitam obrigatoriamente de aporte financeiro",
      impacto: "Sem aporte, não há abertura da delegacia"
    },
    aDefinir: {
      quantidade: 14,
      descricao: "Delegacias com aporte ainda a ser definido",
      impacto: "Funcionamento condicionado à disponibilidade de recursos"
    },
    semAporte: {
      quantidade: 31,
      descricao: "Delegacias com recursos já disponíveis",
      impacto: "Funcionamento garantido"
    }
  },

  custosDestaque: [
    {
      delegacia: "DHPP Caucaia",
      custo: 35677.47,
      motivo: "Plantão extraordinário com 4 OIP"
    },
    {
      delegacia: "CEPROD",
      custo: 21029.36,
      motivo: "Grande efetivo (76 policiais)"
    },
    {
      delegacia: "Aracati/Beberibe",
      custo: 20657.00,
      motivo: "Reforço de unidade (3 OIP UR)"
    },
    {
      delegacia: "Quixeramobim",
      custo: 13019.20,
      motivo: "Plantão extraordinário 24h"
    }
  ],

  observacoesImportantes: [
    "Delegacias extraordinárias só abrem com aporte confirmado",
    "Reforço de efetivo condicionado à disponibilidade de recursos",
    "Algumas delegacias operam apenas em dias específicos (sabado/domingo)",
    "Horários especiais para eventos em locais turísticos",
    "Prioridade para áreas com histórico de ocorrências no carnaval"
  ],

  regioesCriticas: [
    {
      regiao: "Guaramiranga",
      motivo: "Tradicional polo carnavalesco de montanha",
      medidas: "Plantão extraordinário 20h às 08h"
    },
    {
      regiao: "Aracati/Beberibe",
      motivo: "Praia e festas populares",
      medidas: "Reforço especial com unidade adicional"
    },
    {
      regiao: "Fortaleza (Capital)",
      motivo: "Concentração de eventos e população",
      medidas: "10 delegacias de plantão, CEPROD com 76 policiais"
    }
  ],

  efetivoPlanejado: {
    categorias: {
      DPC: "Delegado de Polícia Civil",
      OIP: "Oficial de Investigação Policial",
      "OIP UR": "Oficial de Investigação Policial - Unidade de Reforço"
    },
    distribuicao: "Variável conforme o porte e necessidade de cada delegacia",
    observacao: "Algumas delegacias possuem reforço condicionado a aporte"
  },

  cronograma: {
    data: "14/02/2026",
    dia: "Sábado",
    evento: "Carnaval 2026",
    duracaoOperacao: "Variável - 24h ou horários especiais conforme delegacia"
  },

  pontosAtencao: [
    "⚠️ 26 delegacias dependem de aporte para funcionamento",
    "⚠️ Custo total pode ultrapassar R$ 300.000,00",
    "⚠️ Efetivo total pode chegar a 300+ policiais",
    "⚠️ Necessidade de coordenação entre 10 departamentos diferentes",
    "⚠️ Horários variados exigem gestão de escala complexa"
  ],

  recomendacoes: [
    "Confirmar aportes financeiros com antecedência mínima de 30 dias",
    "Estabelecer canal de comunicação integrado entre departamentos",
    "Realizar simulação operacional antes do evento",
    "Preparar contingência para delegacias condicionais",
    "Monitorar indicadores em tempo real durante a operação"
  ]
};

// Função auxiliar para gerar relatório textual
export const gerarRelatorioTexto = () => {
  const r = resumoExecutivo;
  
  return `
════════════════════════════════════════════════════════════════
  RESUMO EXECUTIVO - PLANO OPERACIONAL CARNAVAL 2026
  POLÍCIA CIVIL DO ESTADO DO CEARÁ
════════════════════════════════════════════════════════════════

📅 DATA: ${r.meta.data}
📋 VERSÃO: ${r.meta.versao}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 NÚMEROS GERAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Total de Delegacias: ${r.numerosGerais.totalDelegacias}
• Total de Departamentos: ${r.numerosGerais.totalDepartamentos}
• Efetivo Total: ${r.numerosGerais.efetivoTotal}
• Custos Estimados: ${r.numerosGerais.custosEstimados}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 DISTRIBUIÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por Tipo de Plantão:
  • Ordinários: ${r.distribuicao.porTipoPlantao.ordinarios}
  • Extraordinários: ${r.distribuicao.porTipoPlantao.extraordinarios}

Por Horário:
  • Plantão 24h: ${r.distribuicao.porHorario.plantao24h}
  • Horário Especial: ${r.distribuicao.porHorario.horarioEspecial}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 APORTES FINANCEIROS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 APORTE NECESSÁRIO: ${r.aportesFinanceiros.necessario.quantidade} delegacias
   ${r.aportesFinanceiros.necessario.impacto}

🟠 APORTE A DEFINIR: ${r.aportesFinanceiros.aDefinir.quantidade} delegacias
   ${r.aportesFinanceiros.aDefinir.impacto}

🟢 SEM APORTE: ${r.aportesFinanceiros.semAporte.quantidade} delegacias
   ${r.aportesFinanceiros.semAporte.impacto}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  PONTOS DE ATENÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${r.pontosAtencao.map(p => p).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RECOMENDAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${r.recomendacoes.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

════════════════════════════════════════════════════════════════
  FIM DO RELATÓRIO
════════════════════════════════════════════════════════════════
`;
};

export default resumoExecutivo;
