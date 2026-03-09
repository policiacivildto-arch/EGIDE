// Serviço de API para integração com Django Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_DJANGO_API_URL || 'http://127.0.0.1:8000/api';

// Helper para obter token JWT do localStorage
const getAuthToken = () => localStorage.getItem('django_token');

// Helper para configurar headers com autenticação
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper genérico para fazer requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Se não autorizado, limpar token
    if (response.status === 401) {
      localStorage.removeItem('django_token');
      throw new Error('Não autorizado. Faça login novamente.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Erro: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição para ${endpoint}:`, error);
    throw error;
  }
};

// ============================================
// AUTENTICAÇÃO
// ============================================

export const authService = {
  // Login e obter JWT token
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Credenciais inválidas');
    }

    const data = await response.json();
    localStorage.setItem('django_token', data.access);
    localStorage.setItem('django_refresh_token', data.refresh);
    localStorage.setItem('django_user', JSON.stringify(data.user));
    return data;
  },

  // Logout
  logout: async () => {
    try {
      const refresh = localStorage.getItem('django_refresh_token');
      if (refresh) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('django_token');
      localStorage.removeItem('django_refresh_token');
      localStorage.removeItem('django_user');
    }
  },

  // Refresh token
  refreshToken: async () => {
    const refresh = localStorage.getItem('django_refresh_token');
    if (!refresh) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      localStorage.removeItem('django_token');
      localStorage.removeItem('django_refresh_token');
      localStorage.removeItem('django_user');
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    localStorage.setItem('django_token', data.access);
    return data.access;
  },

  // Obter dados do usuário atual
  me: async () => {
    return await apiRequest('/auth/me/');
  },
};

// ============================================
// DEPARTAMENTOS
// ============================================

export const departamentoService = {
  getAll: () => apiRequest('/departamentos/'),
  getById: (id) => apiRequest(`/departamentos/${id}/`),
  create: (data) => apiRequest('/departamentos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/departamentos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/departamentos/${id}/`, { method: 'DELETE' }),
};

// ============================================
// DELEGACIAS
// ============================================

export const delegaciaService = {
  getAll: () => apiRequest('/delegacias/'),
  getById: (id) => apiRequest(`/delegacias/${id}/`),
  create: (data) => apiRequest('/delegacias/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/delegacias/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/delegacias/${id}/`, { method: 'DELETE' }),
  getByDepartamento: (departamentoId) => apiRequest(`/delegacias/?departamento=${departamentoId}`),
};

// ============================================
// POLICIAIS
// ============================================

export const policialService = {
  getAll: () => apiRequest('/policiais/'),
  getById: (id) => apiRequest(`/policiais/${id}/`),
  create: (data) => apiRequest('/policiais/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/policiais/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/policiais/${id}/`, { method: 'DELETE' }),
  ativarDesativar: (id) => apiRequest(`/policiais/${id}/ativar_desativar/`, { method: 'POST' }),
  getByMatricula: (matricula) => apiRequest(`/policiais/?matricula=${matricula}`),
};

// ============================================
// VIATURAS
// ============================================

export const viaturaService = {
  getAll: () => apiRequest('/viaturas/'),
  getById: (id) => apiRequest(`/viaturas/${id}/`),
  create: (data) => apiRequest('/viaturas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/viaturas/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/viaturas/${id}/`, { method: 'DELETE' }),
  getByPlaca: (placa) => apiRequest(`/viaturas/?placa=${placa}`),
};

// ============================================
// VAGAS
// ============================================

export const vagaService = {
  getAll: () => apiRequest('/vagas/'),
  getById: (id) => apiRequest(`/vagas/${id}/`),
  create: (data) => apiRequest('/vagas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/vagas/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/vagas/${id}/`, { method: 'DELETE' }),
  getDisponiveis: () => apiRequest('/vagas/vagas_disponiveis/'),
  getByData: (data) => apiRequest(`/vagas/?data=${data}`),
  getByTurno: (turno) => apiRequest(`/vagas/?turno=${turno}`),
};

// ============================================
// EQUIPES
// ============================================

export const equipeService = {
  getAll: () => apiRequest('/equipes/'),
  getById: (id) => apiRequest(`/equipes/${id}/`),
  create: (data) => apiRequest('/equipes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/equipes/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/equipes/${id}/`, { method: 'DELETE' }),
  aprovar: (id) => apiRequest(`/equipes/${id}/aprovar/`, { method: 'POST' }),
  rejeitar: (id) => apiRequest(`/equipes/${id}/rejeitar/`, { method: 'POST' }),
  minhasEquipes: (policialId) => apiRequest(`/equipes/minhas_equipes/?policial_id=${policialId}`),
};

// ============================================
// OPERAÇÕES
// ============================================

export const operacaoService = {
  getAll: () => apiRequest('/operacoes/'),
  getById: (id) => apiRequest(`/operacoes/${id}/`),
  create: (data) => apiRequest('/operacoes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/operacoes/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/operacoes/${id}/`, { method: 'DELETE' }),
  finalizar: (id) => apiRequest(`/operacoes/${id}/finalizar/`, { method: 'POST' }),
  getByData: (dataInicio, dataFim) => apiRequest(`/operacoes/?data_inicio=${dataInicio}&data_fim=${dataFim}`),
};

// ============================================
// COMBOIOS
// ============================================

export const comboioService = {
  getAll: () => apiRequest('/comboios/'),
  getById: (id) => apiRequest(`/comboios/${id}/`),
  create: (data) => apiRequest('/comboios/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/comboios/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/comboios/${id}/`, { method: 'DELETE' }),
  adicionarOperacao: (id, operacaoId) => 
    apiRequest(`/comboios/${id}/adicionar_operacao/`, { 
      method: 'POST', 
      body: JSON.stringify({ operacao_id: operacaoId }) 
    }),
  getByData: (data) => apiRequest(`/comboios/?data=${data}`),
};

// ============================================
// DEMANDAS DE OPERAÇÃO (Sistema de Departamentos)
// ============================================

export const demandasService = {
  // Listar todas (DTO vê tudo, departamentos veem apenas suas)
  getAll: () => apiRequest('/demandas/'),
  
  // Minhas demandas (departamento que criou)
  getMinhas: () => apiRequest('/demandas/minhas/'),
  
  // Demandas pendentes (DTO)
  getPendentes: () => apiRequest('/demandas/pendentes/'),
  
  // Buscar por ID
  getById: (id) => apiRequest(`/demandas/${id}/`),
  
  // Criar demanda
  criar: (data) => apiRequest('/demandas/', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  
  // Aprovar demanda (DTO)
  aprovar: (id, parecer) => apiRequest(`/demandas/${id}/aprovar/`, {
    method: 'POST',
    body: JSON.stringify({ parecer_dto: parecer })
  }),
  
  // Rejeitar demanda (DTO)
  rejeitar: (id, motivo) => apiRequest(`/demandas/${id}/rejeitar/`, {
    method: 'POST',
    body: JSON.stringify({ motivo_rejeicao: motivo })
  }),
  
  // Atualizar demanda
  update: (id, data) => apiRequest(`/demandas/${id}/`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  
  // Deletar demanda
  delete: (id) => apiRequest(`/demandas/${id}/`, { method: 'DELETE' }),
};

// ============================================
// NOTIFICAÇÕES (Sistema de Departamentos)
// ============================================

export const notificacoesService = {
  // Minhas notificações
  getMinhas: () => apiRequest('/notificacoes/minhas/'),
  
  // Notificações pendentes
  getPendentes: () => apiRequest('/notificacoes/pendentes/'),
  
  // Buscar por ID
  getById: (id) => apiRequest(`/notificacoes/${id}/`),
  
  // Criar notificação (DTO)
  criar: (data) => apiRequest('/notificacoes/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Marcar como lida
  marcarLida: (id) => apiRequest(`/notificacoes/${id}/marcar-lida/`, {
    method: 'POST'
  }),
  
  // Responder notificação
  responder: (id, resposta, efetivoDisponivel = null) => apiRequest(`/notificacoes/${id}/responder/`, {
    method: 'POST',
    body: JSON.stringify({ 
      resposta,
      efetivo_disponivel: efetivoDisponivel 
    })
  }),
};

// ============================================
// PERFIS DE DEPARTAMENTOS
// ============================================

export const perfisDepartamentosService = {
  getAll: () => apiRequest('/perfis-departamentos/'),
  getById: (id) => apiRequest(`/perfis-departamentos/${id}/`),
  getMeuPerfil: () => apiRequest('/perfis-departamentos/meu-perfil/'),
};

// ============================================
// LOGS DE AUDITORIA (Admin)
// ============================================

export const logsAuditoriaService = {
  getAll: () => apiRequest('/logs-auditoria/'),
  getById: (id) => apiRequest(`/logs-auditoria/${id}/`),
};

// ============================================
// EXPORT DEFAULT (todos os serviços)
// ============================================

const djangoApi = {
  auth: authService,
  departamentos: departamentoService,
  delegacias: delegaciaService,
  policiais: policialService,
  viaturas: viaturaService,
  vagas: vagaService,
  equipes: equipeService,
  operacoes: operacaoService,
  comboios: comboioService,
  demandas: demandasService,
  notificacoes: notificacoesService,
  perfisDepartamentos: perfisDepartamentosService,
  logsAuditoria: logsAuditoriaService,
};

export default djangoApi;
