import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// =====================================================
// EVENTOS
// =====================================================

export const eventosApi = {
  // Listar todos os eventos
  listar: async () => {
    const response = await axios.get(`${API_URL}/eventos/`);
    return response.data;
  },

  // Buscar evento por ID
  buscar: async (id) => {
    const response = await axios.get(`${API_URL}/eventos/${id}/`);
    return response.data;
  },

  // Criar novo evento
  criar: async (dados) => {
    const response = await axios.post(`${API_URL}/eventos/`, dados);
    return response.data;
  },

  // Atualizar evento
  atualizar: async (id, dados) => {
    const response = await axios.put(`${API_URL}/eventos/${id}/`, dados);
    return response.data;
  },

  // Deletar evento
  deletar: async (id) => {
    const response = await axios.delete(`${API_URL}/eventos/${id}/`);
    return response.data;
  },

  // Buscar dashboard do evento
  dashboard: async (id) => {
    const response = await axios.get(`${API_URL}/eventos/${id}/dashboard/`);
    return response.data;
  },

  // Mudar status do evento
  mudarStatus: async (id, status) => {
    const response = await axios.post(`${API_URL}/eventos/${id}/mudar_status/`, { status });
    return response.data;
  },
};

// =====================================================
// DEPARTAMENTOS EM EVENTOS
// =====================================================

export const departamentosEventoApi = {
  // Listar departamentos de um evento
  listar: async (eventoId = null) => {
    const url = eventoId 
      ? `${API_URL}/departamentos-evento/?evento=${eventoId}`
      : `${API_URL}/departamentos-evento/`;
    const response = await axios.get(url);
    return response.data;
  },

  // Buscar departamento em evento
  buscar: async (id) => {
    const response = await axios.get(`${API_URL}/departamentos-evento/${id}/`);
    return response.data;
  },

  // Criar participação de departamento
  criar: async (dados) => {
    const response = await axios.post(`${API_URL}/departamentos-evento/`, dados);
    return response.data;
  },

  // Atualizar participação
  atualizar: async (id, dados) => {
    const response = await axios.put(`${API_URL}/departamentos-evento/${id}/`, dados);
    return response.data;
  },

  // Deletar participação
  deletar: async (id) => {
    const response = await axios.delete(`${API_URL}/departamentos-evento/${id}/`);
    return response.data;
  },

  // Gerar escalas automaticamente
  gerarEscalas: async (id) => {
    const response = await axios.post(`${API_URL}/departamentos-evento/${id}/gerar_escalas/`);
    return response.data;
  },

  // Buscar resumo
  resumo: async (id) => {
    const response = await axios.get(`${API_URL}/departamentos-evento/${id}/resumo/`);
    return response.data;
  },
};

// =====================================================
// ESCALAS DE POLICIAIS
// =====================================================

export const escalasApi = {
  // Listar escalas
  listar: async (departamentoEventoId = null) => {
    const url = departamentoEventoId 
      ? `${API_URL}/escalas/?departamento_evento=${departamentoEventoId}`
      : `${API_URL}/escalas/`;
    const response = await axios.get(url);
    return response.data;
  },

  // Buscar escala
  buscar: async (id) => {
    const response = await axios.get(`${API_URL}/escalas/${id}/`);
    return response.data;
  },

  // Criar escala
  criar: async (dados) => {
    const response = await axios.post(`${API_URL}/escalas/`, dados);
    return response.data;
  },

  // Criar múltiplas escalas
  criarMultiplas: async (escalas) => {
    const response = await axios.post(`${API_URL}/escalas/criar_multiplas/`, { escalas });
    return response.data;
  },

  // Atualizar escala
  atualizar: async (id, dados) => {
    const response = await axios.put(`${API_URL}/escalas/${id}/`, dados);
    return response.data;
  },

  // Deletar escala
  deletar: async (id) => {
    const response = await axios.delete(`${API_URL}/escalas/${id}/`);
    return response.data;
  },
};

export default {
  eventos: eventosApi,
  departamentosEvento: departamentosEventoApi,
  escalas: escalasApi,
};
