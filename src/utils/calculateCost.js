/**
 * Utilitário para cálculo de custos operacionais
 * Corrige o problema de arredondamento de horas
 */

/**
 * Converte horário para minutos
 */
function converterParaMinutos(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    return valor.getHours() * 60 + valor.getMinutes();
  } else if (typeof valor === "string") {
    valor = valor.trim().replace('.', ':');
    const partes = valor.split(":");
    if (partes.length >= 2) {
      const horas = parseInt(partes[0], 10);
      const minutos = parseInt(partes[1], 10);
      if (!isNaN(horas) && !isNaN(minutos)) {
        return horas * 60 + minutos;
      }
    }
  }
  console.warn(`Erro: Horário inválido detectado - ${valor}`);
  return NaN;
}

/**
 * Obtém dia da semana
 */
function obterDiaSemana(data) {
  const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  if (Object.prototype.toString.call(data) === '[object Date]' && !isNaN(data.getTime())) {
    return dias[data.getDay()];
  }
  if (typeof data === "number") {
    const dataFormatada = new Date((data - 25569) * 86400000);
    return dias[dataFormatada.getDay()];
  }
  if (typeof data === "string") {
    const partes = data.split("/");
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const ano = parseInt(partes[2], 10);
      const dataFormatada = new Date(ano, mes, dia);
      if (!isNaN(dataFormatada.getTime())) {
        return dias[dataFormatada.getDay()];
      }
    }
  }
  console.warn(`Erro: Data inválida detectada - ${data}`);
  return null;
}

/**
 * Verifica se é feriado
 */
function verificarFeriado(data, listaFeriados = []) {
  // Lista padrão de feriados se não for fornecida
  const feriados = listaFeriados.length > 0 ? listaFeriados : [
    "18/04/2025", "21/04/2025",
    "01/01/2026", "19/04/2026", // Exemplo de feriados 2026
  ];
  
  if (typeof data === "string") {
    return feriados.includes(data);
  } else if (Object.prototype.toString.call(data) === '[object Date]' && !isNaN(data.getTime())) {
    const dataFormatada = data.getDate().toString().padStart(2, '0') + "/" +
                        (data.getMonth() + 1).toString().padStart(2, '0') + "/" +
                        data.getFullYear();
    return feriados.includes(dataFormatada);
  }
  return false;
}

/**
 * Calcula horas trabalhadas em minutos
 */
function calcularHorasTrabalhadas(horaInicio, horaFim) {
  return horaFim < horaInicio ? (1440 - horaInicio) + horaFim : horaFim - horaInicio;
}

/**
 * 🔧 FUNÇÃO CORRIGIDA
 * Calcula o valor do trabalho de forma PROPORCIONAL aos minutos trabalhados
 */
function calcularValorTrabalho(horasTrabalhadas, horaInicio, cargo, classe, diaDaSemana, feriado) {
  const valores = {
    "OIP": {
      "A": { dia: 34.42, noite: 44.75 },
      "B": { dia: 34.42, noite: 44.75 },
      "C": { dia: 34.42, noite: 44.75 },
      "D": { dia: 34.42, noite: 44.75 }
    },
    "DPC": {
      "Especial": { dia: 48.18, noite: 62.63 },
      "A": { dia: 48.18, noite: 62.63 },
      "B": { dia: 48.18, noite: 62.63 },
      "C": { dia: 48.18, noite: 62.63 },
      "D": { dia: 48.18, noite: 62.63 }
    },
    "INV": {
      "A": { dia: 34.42, noite: 44.75 },
      "B": { dia: 34.42, noite: 44.75 },
      "C": { dia: 34.42, noite: 44.75 },
      "D": { dia: 34.42, noite: 44.75 }
    },
    "DEL": {
      "Especial": { dia: 48.18, noite: 62.63 }
    },
    "ESC": {
      "A": { dia: 34.42, noite: 44.75 },
      "B": { dia: 34.42, noite: 44.75 },
      "C": { dia: 34.42, noite: 44.75 },
      "D": { dia: 34.42, noite: 44.75 }
    }
  };

  if (!valores[cargo] || !valores[cargo][classe]) {
    console.warn(`Cargo/Classe inválido: ${cargo} ${classe}`);
    return 0;
  }

  const valorHora = valores[cargo][classe];
  let totalPago = 0;

  // 🔧 CORREÇÃO: Calcula de forma proporcional, não arredondando
  const horasCompletas = Math.floor(horasTrabalhadas / 60);
  const minutosRestantes = horasTrabalhadas % 60;

  // Processa horas completas
  for (let i = 0; i < horasCompletas; i++) {
    const horaAtual = Math.floor((horaInicio / 60 + i) % 24);

    if (diaDaSemana === "sábado" || diaDaSemana === "domingo" || feriado) {
      totalPago += valorHora.noite;
    } else {
      totalPago += (horaAtual >= 6 && horaAtual < 24) ? valorHora.dia : valorHora.noite;
    }
  }

  // 🔧 CORREÇÃO: Adiciona os minutos restantes de forma proporcional
  if (minutosRestantes > 0) {
    const horaAtual = Math.floor((horaInicio / 60 + horasCompletas) % 24);
    const valorHoraAtual = (diaDaSemana === "sábado" || diaDaSemana === "domingo" || feriado)
      ? valorHora.noite
      : (horaAtual >= 6 && horaAtual < 24) ? valorHora.dia : valorHora.noite;
    
    // Adiciona proporcionalmente os minutos restantes
    totalPago += (minutosRestantes / 60) * valorHoraAtual;
  }

  return totalPago;
}

function normalizarTextoBase(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function normalizeCargo(cargoRaw) {
  const cargo = normalizarTextoBase(cargoRaw);

  const map = {
    OIP: 'OIP',
    OFICIAL: 'OIP',
    'OFICIAL DE INVESTIGACAO': 'OIP',
    'OFICIAL DE INVESTIGACOES': 'OIP',
    INSPETOR: 'INV',
    INSPETORA: 'INV',
    INVESTIGADOR: 'INV',
    INVESTIGADORA: 'INV',
    'POLICIAL CIVIL': 'INV',
    POLICIAL: 'INV',
    ESCRIVAO: 'ESC',
    ESCRIVA: 'ESC',
    ESC: 'ESC',
    DPC: 'DPC',
    DEL: 'DEL',
    DELEGADO: 'DPC',
    DELEGADA: 'DPC',
    'DELEGADO DE POLICIA CIVIL': 'DPC',
  };

  return map[cargo] || cargo;
}

function normalizeClasse(classeRaw, cargoNormalizado) {
  const classe = normalizarTextoBase(classeRaw);

  if (!classe) {
    return cargoNormalizado === 'DPC' || cargoNormalizado === 'DEL' ? 'Especial' : 'A';
  }

  if (classe === 'ESPECIAL') return 'Especial';
  if (classe === 'PRACA') return 'A';

  const match = classe.match(/[ABCD]/);
  if (match) return match[0];

  const map = {
    PRIMEIRA: 'A',
    SEGUNDA: 'B',
    TERCEIRA: 'C',
    QUARTA: 'D',
    'CLASSE A': 'A',
    'CLASSE B': 'B',
    'CLASSE C': 'C',
    'CLASSE D': 'D',
  };

  if (map[classe]) return map[classe];

  return cargoNormalizado === 'DPC' || cargoNormalizado === 'DEL' ? 'Especial' : 'A';
}

/**
 * Função principal para calcular custo de um turno
 * @param {Object} usuario - Dados do usuário (cargo, classe)
 * @param {Date} data - Data do turno
 * @param {string} horaEntrada - Horário de entrada (formato "HH:MM")
 * @param {string} horaSaida - Horário de saída (formato "HH:MM")
 * @param {Array} feriados - Lista de feriados
 * @returns {number} - Valor calculado
 */
export function calculateShiftCost(usuario, data, horaEntrada, horaSaida, feriados = []) {
  if (!usuario || !usuario.cargo || !usuario.classe) {
    console.warn('Usuário sem cargo ou classe definidos');
    return 0;
  }

  const horaInicio = converterParaMinutos(horaEntrada);
  const horaFim = converterParaMinutos(horaSaida);

  if (isNaN(horaInicio) || isNaN(horaFim)) {
    console.warn(`Horário inválido. Entrada: '${horaEntrada}' | Saída: '${horaSaida}'`);
    return 0;
  }

  const diaDaSemana = obterDiaSemana(data);
  if (!diaDaSemana) {
    console.warn('Erro ao obter dia da semana');
    return 0;
  }

  const feriado = verificarFeriado(data, feriados);
  let horasTrabalhadas = calcularHorasTrabalhadas(horaInicio, horaFim);

  // Se entrada = saída, considera 24h (dia completo)
  if (horasTrabalhadas === 0 && horaInicio === horaFim) {
    horasTrabalhadas = 1440;
  }

  const cargo = normalizeCargo(usuario.cargo);
  const classe = normalizeClasse(usuario.classe, cargo);

  return calcularValorTrabalho(horasTrabalhadas, horaInicio, cargo, classe, diaDaSemana, feriado);
}

/**
 * Função auxiliar para exibir matrícula formatada
 */
export function displayMatricula(matricula) {
  if (!matricula) return 'N/A';
  return matricula.toString().padStart(6, '0');
}

// Exportações adicionais caso necessário
export {
  converterParaMinutos,
  obterDiaSemana,
  verificarFeriado,
  calcularHorasTrabalhadas,
  calcularValorTrabalho
};
