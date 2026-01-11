/**
 * Cliente de API Django com Autenticação JWT
 * Sistema EGIDE - Versão Django Backend
 */

const API_BASE_URL = process.env.REACT_APP_DJANGO_API_URL || 'http://localhost:8000/api';

// ============================================================================
// GERENCIAMENTO DE TOKENS JWT
// ============================================================================

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

// ============================================================================
// CONFIGURAÇÃO DE HEADERS
// ============================================================================

const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// ============================================================================
// REFRESH TOKEN AUTOMÁTICO
// ============================================================================

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    setTokens(data.access, refreshToken);
    return data.access;
  } catch (error) {
    clearTokens();
    window.location.href = '/login';
    throw error;
  }
};

// ============================================================================
// REQUEST HANDLER COM RETRY AUTOMÁTICO
// ============================================================================

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(options.auth !== false),
      ...options.headers,
    },
  };

  try {
    let response = await fetch(url, config);
    
    // Se 401 (não autorizado), tentar refresh do token
    if (response.status === 401 && !options.skipRefresh) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          onTokenRefreshed(newToken);
          
          // Retry da requisição original com novo token
          config.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, config);
        } catch (error) {
          isRefreshing = false;
          throw error;
        }
      } else {
        // Aguardar o refresh que já está em andamento
        await new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            config.headers['Authorization'] = `Bearer ${token}`;
            resolve();
          });
        });
        
        response = await fetch(url, config);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Erro: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error) {
    console.error(`Erro na requisição para ${endpoint}:`, error);
    throw error;
  }
};

// ============================================================================
// API DE AUTENTICAÇÃO
// ============================================================================

const authApi = {
  /**
   * Login de usuário
   * @param {string} username - Username do departamento (ex: "dpm")
   * @param {string} password - Senha
   */
  login: async (username, password) => {
    const data = await apiRequest('/auth/login/', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ username, password }),
    });
    
    setTokens(data.access, data.refresh);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    localStorage.setItem('perfil_departamento', JSON.stringify(data.perfil_departamento));
    
    return data;
  },

  /**
   * Logout do usuário
   */
  logout: async () => {
    try {
      const refresh = getRefreshToken();
      await apiRequest('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });
    } finally {
      clearTokens();
    }
  },

  /**
   * Obter dados do usuário atual
   */
  me: async () => {
    return await apiRequest('/auth/me/');
  },

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated: () => {
    return !!getAccessToken();
  },

  /**
   * Obter dados do usuário do localStorage
   */
  getUserData: () => {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  },

  /**
   * Obter perfil do departamento do localStorage
   */
  getPerfilDepartamento: () => {
    const data = localStorage.getItem('perfil_departamento');
    return data ? JSON.parse(data) : null;
  },
};

// ============================================================================
// API DE DEPARTAMENTOS
// ============================================================================

const departamentosApi = {
  getAll: () => apiRequest('/departamentos/'),
  get: (id) => apiRequest(`/departamentos/${id}/`),
  create: (data) => apiRequest('/departamentos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/departamentos/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/departamentos/${id}/`, { method: 'DELETE' }),
  
  // Perfis de departamento
  perfis: {
    getAll: () => apiRequest('/perfis-departamento/'),
    get: (id) => apiRequest(`/perfis-departamento/${id}/`),
  },
};

// ============================================================================
// API DE DEMANDAS DE OPERAÇÃO
// ============================================================================

const demandasApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/demandas/${queryString ? '?' + queryString : ''}`);
  },
  get: (id) => apiRequest(`/demandas/${id}/`),
  create: (data) => apiRequest('/demandas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/demandas/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/demandas/${id}/`, { method: 'DELETE' }),
  
  // Ações específicas
  enviar: (id) => apiRequest(`/demandas/${id}/enviar/`, { method: 'POST' }),
  aprovar: (id, data) => apiRequest(`/demandas/${id}/aprovar/`, { method: 'POST', body: JSON.stringify(data) }),
  rejeitar: (id, data) => apiRequest(`/demandas/${id}/rejeitar/`, { method: 'POST', body: JSON.stringify(data) }),
  solicitar_alteracao: (id, data) => apiRequest(`/demandas/${id}/solicitar_alteracao/`, { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================================================
// API DE NOTIFICAÇÕES
// ============================================================================

const notificacoesApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/notificacoes/${queryString ? '?' + queryString : ''}`);
  },
  get: (id) => apiRequest(`/notificacoes/${id}/`),
  marcarLida: (id) => apiRequest(`/notificacoes/${id}/marcar_lida/`, { method: 'POST' }),
  marcarTodasLidas: () => apiRequest('/notificacoes/marcar_todas_lidas/', { method: 'POST' }),
  naoLidas: () => apiRequest('/notificacoes/nao_lidas/'),
};

// ============================================================================
// API DE LOGS DE AUDITORIA
// ============================================================================

const auditoriaApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/auditoria/${queryString ? '?' + queryString : ''}`);
  },
  get: (id) => apiRequest(`/auditoria/${id}/`),
};

// ============================================================================
// API DE POLICIAIS
// ============================================================================

const policiaisApi = {
  getAll: () => apiRequest('/policiais/'),
  get: (id) => apiRequest(`/policiais/${id}/`),
  create: (data) => apiRequest('/policiais/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/policiais/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/policiais/${id}/`, { method: 'DELETE' }),
};

// ============================================================================
// API DE OPERAÇÕES
// ============================================================================

const operacoesApi = {
  getAll: () => apiRequest('/operacoes-policiais/'),
  get: (id) => apiRequest(`/operacoes-policiais/${id}/`),
  create: (data) => apiRequest('/operacoes-policiais/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/operacoes-policiais/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/operacoes-policiais/${id}/`, { method: 'DELETE' }),
};

// ============================================================================
// EXPORT PRINCIPAL
// ============================================================================

const djangoApi = {
  auth: authApi,
  departamentos: departamentosApi,
  demandas: demandasApi,
  notificacoes: notificacoesApi,
  auditoria: auditoriaApi,
  policiais: policiaisApi,
  operacoes: operacoesApi,
  
  // Utilitários
  getBaseUrl: () => API_BASE_URL,
};

export default djangoApi;
