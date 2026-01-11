// Fonte primária: `src/data/policiais.json` gerado a partir da sua planilha.
// Se o arquivo estiver vazio, usamos um fallback de exemplo.
import policiaisJson from '../data/policiais.json';

const FALLBACK = {
  // Chave: matrícula em formato apenas dígitos
  "123456": { nome: 'KLEVER MARTINS FARIAS', cargo: 'DPC' },
  "654321": { nome: 'JOÃO PEDRO SANTOS', cargo: 'OIP' }
};

// Normaliza o JSON importado: aceita tanto mapa {mat: {...}} quanto array [{matricula,nome,cargo_atual}, ...]
function buildMapFromImported(json) {
  if (!json) return {};
  if (!Array.isArray(json) && typeof json === 'object') {
    // já é um mapa
    return json;
  }
  // é um array vindo da planilha
  const map = {};
  json.forEach(item => {
    const rawMat = item.matricula || item.MATRICULA || item.Matricula || item.mat || '';
    const digits = rawMat.toString().replace(/\D/g, '');
    if (!digits) return;
    const nome = (item.nome || item.NOME || item.Nome || item['nome_completo'] || item['Nome Completo'] || '').toString().trim();
    const cargo = (item.cargo || item.CARGO || item['cargo_atual'] || item.cargo_atual || '').toString().trim();
    map[digits] = { nome: nome.toUpperCase(), cargo: cargo.toUpperCase() };
  });
  return map;
}

const importedMap = buildMapFromImported(policiaisJson);
export const POLICIAIS_BY_MATRICULA = (importedMap && Object.keys(importedMap).length > 0) ? importedMap : FALLBACK;

export function findPolicialByMatricula(matricula) {
    if (!matricula) return null;
    const digits = matricula.toString().replace(/\D/g, '');
    return POLICIAIS_BY_MATRICULA[digits] || null;
}

// Para usar Firestore, substitua a lógica acima por uma função async que carregue
// os dados e armazene em contexto/estado para uso em formulários.
