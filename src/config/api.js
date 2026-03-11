/**
 * Configuração da API Django
 * Dados armazenados em Database Django (SQLite ou PostgreSQL via Supabase)
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_DJANGO_API_URL || 'http://127.0.0.1:8000/api';
const API_TIMEOUT = 30000; // 30 segundos
const CONVOY_REPORTS_STORAGE_KEY = 'egide_convoy_reports_local';

/**
 * Classe para gerenciar requisições à API Django
 */
class DjangoApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
    this.rankingEndpointAvailable = null;
  }

  /**
   * Define o token JWT para autenticação
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Faz uma requisição HTTP à API Django
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const isAuthLoginEndpoint = endpoint.startsWith('/auth/login/');
    const isAuthRefreshEndpoint = endpoint.startsWith('/auth/refresh/');
    const isAuthRegisterEndpoint = endpoint.startsWith('/auth/register/');
    const hasRefreshToken = Boolean(localStorage.getItem('refresh_token'));
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Adiciona token JWT se disponível
    if (this.token && !isAuthLoginEndpoint && !isAuthRefreshEndpoint && !isAuthRegisterEndpoint) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      method,
      headers,
      ...options,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await Promise.race([
        fetch(url, config),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), API_TIMEOUT)
        ),
      ]);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`Erro completo (${response.status}):`, error);

        // Se o token expirou, tenta refresh uma vez e repete a requisição
        if (response.status === 401 && !options._retry && !isAuthLoginEndpoint && !isAuthRefreshEndpoint && hasRefreshToken) {
          try {
            await this.refreshToken();
            return await this.request(method, endpoint, data, { ...options, _retry: true });
          } catch (refreshError) {
            console.error('Falha ao renovar token:', refreshError);
          }
        }

        if (response.status === 401) {
          this.setToken(null);
          localStorage.removeItem('refresh_token');
        }

        // Trata erros de validação que vêm em formato de objeto
        let errorMsg = error.detail || `Erro HTTP ${response.status}`;
        if (error.non_field_errors && Array.isArray(error.non_field_errors)) {
          errorMsg = error.non_field_errors[0] || errorMsg;
        } else if (typeof error === 'object' && Object.keys(error).length > 0) {
          // Se tem campos específicos, mostra o primeiro
          const firstKey = Object.keys(error)[0];
          const firstValue = error[firstKey];
          if (Array.isArray(firstValue)) {
            errorMsg = `${firstKey}: ${firstValue[0]}`;
          } else {
            errorMsg = `${firstKey}: ${firstValue}`;
          }
        }
        const requestError = new Error(errorMsg);
        requestError.status = response.status;
        throw requestError;
      }

      // Alguns endpoints não retornam JSON (ex: DELETE)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { success: true };
    } catch (error) {
      console.error(`Erro na requisição ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Métodos de Autenticação
   */
  async login(email, password) {
    return this.request('POST', '/auth/login/', { username: email, password });
  }

  async register(userData) {
    return this.request('POST', '/auth/register/', userData);
  }

  async logout() {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await this.request('POST', '/auth/logout/', refresh ? { refresh } : null);
    } finally {
      this.setToken(null);
      localStorage.removeItem('refresh_token');
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('Nenhum refresh token disponível');
    try {
      const response = await this.request('POST', '/auth/refresh/', { refresh: refreshToken });
      if (response.access) {
        this.setToken(response.access);
        if (response.refresh) {
          localStorage.setItem('refresh_token', response.refresh);
        }
        return response;
      }
      throw new Error('Token não retornado');
    } catch (error) {
      // Se refresh falhar, limpa os tokens
      this.setToken(null);
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  /**
   * Métodos de Usuário
   */
  async getCurrentUser() {
    return this.request('GET', '/auth/me/');
  }

  async updateUser(userData) {
    return this.request('PUT', '/auth/me/', userData);
  }

  async updatePhone(phoneNumber) {
    return this.request('PATCH', '/auth/me/', { phone_number: phoneNumber });
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('POST', '/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  }

  async requestPasswordReset(email) {
    return this.request('POST', '/auth/password-reset/', { email });
  }

  async confirmPasswordReset(token, newPassword) {
    return this.request('POST', '/auth/password-reset-confirm/', {
      token,
      new_password: newPassword,
    });
  }

  /**
   * Métodos Genéricos para CRUD
   */
  async getList(resource, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/${resource}/${queryString ? '?' + queryString : ''}`;
    return this.request('GET', endpoint);
  }

  async getDetail(resource, id) {
    return this.request('GET', `/${resource}/${id}/`);
  }

  async create(resource, data) {
    return this.request('POST', `/${resource}/`, data);
  }

  async update(resource, id, data) {
    return this.request('PUT', `/${resource}/${id}/`, data);
  }

  async partialUpdate(resource, id, data) {
    return this.request('PATCH', `/${resource}/${id}/`, data);
  }

  async delete(resource, id) {
    return this.request('DELETE', `/${resource}/${id}/`);
  }

  /**
   * Métodos de Policiais (Usuários)
   */
  async getPoliciais(params = {}) {
    return this.getList('policiais', params);
  }

  async getPolicial(id) {
    return this.getDetail('policiais', id);
  }

  async createPolicial(data) {
    return this.create('policiais', data);
  }

  async updatePolicial(id, data) {
    return this.update('policiais', id, data);
  }

  async deletePolicial(id) {
    return this.delete('policiais', id);
  }

  /**
   * Métodos de Escalas (Schedules)
   */
  async getEscalas(weekId = null) {
    const params = weekId ? { week_id: weekId } : {};
    return this.getList('escalas', params);
  }

  async getEscala(id) {
    return this.getDetail('escalas', id);
  }

  async createEscala(data) {
    return this.create('escalas', data);
  }

  async updateEscala(id, data) {
    return this.update('escalas', id, data);
  }

  async deleteEscala(id) {
    return this.delete('escalas', id);
  }

  /**
   * Métodos de Operações
   */
  async getOperacoes(params = {}) {
    return this.getList('operacoes', params);
  }

  async getOperacao(id) {
    return this.getDetail('operacoes', id);
  }

  async createOperacao(data) {
    return this.create('operacoes', data);
  }

  async updateOperacao(id, data) {
    return this.update('operacoes', id, data);
  }

  async deleteOperacao(id) {
    return this.delete('operacoes', id);
  }

  /**
   * Métodos de Departamentos
   */
  async getDepartamentos(params = {}) {
    return this.getList('departamentos', params);
  }

  async getDepartamento(id) {
    return this.getDetail('departamentos', id);
  }

  /**
   * Métodos de Delegacias
   */
  async getDelegacias(params = {}) {
    return this.getList('delegacias', params);
  }

  async getDelegacia(id) {
    return this.getDetail('delegacias', id);
  }

  /**
   * Métodos de Eventos/Carnaval
   */
  async getEventos(params = {}) {
    return this.getList('eventos', params);
  }

  async getEvento(id) {
    return this.getDetail('eventos', id);
  }

  async createEvento(data) {
    return this.create('eventos', data);
  }

  async updateEvento(id, data) {
    return this.update('eventos', id, data);
  }

  async deleteEvento(id) {
    return this.delete('eventos', id);
  }

  /**
   * Métodos de Vagas
   */
  async getVagas(params = {}) {
    return this.getList('vagas', params);
  }

  async getVaga(id) {
    return this.getDetail('vagas', id);
  }

  async createVaga(data) {
    return this.create('vagas', data);
  }

  async updateVaga(id, data) {
    return this.partialUpdate('vagas', id, data);
  }

  async deleteVaga(id) {
    return this.delete('vagas', id);
  }

  /**
   * Métodos de Times/Equipes
   */
  async getTeams(params = {}) {
    return this.getList('equipes', params);
  }

  async getTeam(id) {
    return this.getDetail('equipes', id);
  }

  async createTeam(data) {
    return this.create('equipes', data);
  }

  async updateTeam(id, data) {
    return this.partialUpdate('equipes', id, data);
  }

  async deleteTeam(id) {
    return this.delete('equipes', id);
  }

  /**
   * Métodos de Comboios
   */
  async getConvoys(params = {}) {
    return this.getList('comboios', params);
  }

  async getConvoy(id) {
    return this.getDetail('comboios', id);
  }

  async createConvoy(data) {
    return this.create('comboios', data);
  }

  async updateConvoy(id, data) {
    return this.update('comboios', id, data);
  }

  async deleteConvoy(id) {
    return this.delete('comboios', id);
  }

  /**
   * Métodos de Feriados
   */
  async getHolidays(params = {}) {
    return this.getList('feriados', params);
  }

  async getHoliday(id) {
    return this.getDetail('feriados', id);
  }

  async createHoliday(data) {
    return this.create('feriados', data);
  }

  async updateHoliday(id, data) {
    return this.update('feriados', id, data);
  }

  async deleteHoliday(id) {
    return this.delete('feriados', id);
  }

  _isNotFoundError(error) {
    if (error?.status === 404) return true;
    const message = String(error?.message || '').toLowerCase();
    return message.includes('404') || message.includes('not found') || message.includes('não encontrado');
  }

  _getLocalConvoyReports() {
    try {
      const raw = localStorage.getItem(CONVOY_REPORTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  _saveLocalConvoyReports(reports) {
    localStorage.setItem(CONVOY_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  }

  _filterLocalConvoyReports(reports, params = {}) {
    let filtered = [...reports];
    if (params.convoy_ids) {
      const ids = String(params.convoy_ids).split(',').map((id) => Number(id)).filter((id) => !Number.isNaN(id));
      filtered = filtered.filter((report) => ids.includes(Number(report.convoyId)));
    }
    return filtered;
  }

  /**
   * Métodos de Relatórios de Comboio
   */
  async getConvoyReports(params = {}) {
    try {
      return await this.getList('convoy-reports', params);
    } catch (error) {
      return this._filterLocalConvoyReports(this._getLocalConvoyReports(), params);
    }
  }

  async getConvoyReport(id) {
    try {
      return await this.getDetail('convoy-reports', id);
    } catch (error) {
      if (this._isNotFoundError(error)) {
        const reports = this._getLocalConvoyReports();
        const report = reports.find((item) => String(item.id) === String(id));
        if (report) return report;
        throw new Error('Relatório não encontrado');
      }
      throw error;
    }
  }

  async createConvoyReport(data) {
    try {
      return await this.create('convoy-reports', data);
    } catch (error) {
      if (this._isNotFoundError(error)) {
        const reports = this._getLocalConvoyReports();
        const newReport = {
          ...data,
          id: Date.now(),
          createdAt: new Date().toISOString(),
        };
        reports.push(newReport);
        this._saveLocalConvoyReports(reports);
        return newReport;
      }
      throw error;
    }
  }

  async updateConvoyReport(id, data) {
    try {
      return await this.update('convoy-reports', id, data);
    } catch (error) {
      if (this._isNotFoundError(error)) {
        const reports = this._getLocalConvoyReports();
        const index = reports.findIndex((item) => String(item.id) === String(id));
        if (index === -1) throw new Error('Relatório não encontrado');
        const updated = { ...reports[index], ...data, id: reports[index].id };
        reports[index] = updated;
        this._saveLocalConvoyReports(reports);
        return updated;
      }
      throw error;
    }
  }

  async deleteConvoyReport(id) {
    try {
      return await this.delete('convoy-reports', id);
    } catch (error) {
      if (this._isNotFoundError(error)) {
        const reports = this._getLocalConvoyReports().filter((item) => String(item.id) !== String(id));
        this._saveLocalConvoyReports(reports);
        return { success: true };
      }
      throw error;
    }
  }

  /**
   * Métodos de Rankings
   */
  async getRanking(params = {}) {
    if (this.rankingEndpointAvailable === false) {
      return [];
    }

    try {
      const data = await this.getList('ranking', params);
      this.rankingEndpointAvailable = true;
      return data;
    } catch (error) {
      if (error?.status === 404) {
        // O backend atual não expõe /api/ranking/.
        // Mantemos fallback local sem repetir erro a cada render.
        this.rankingEndpointAvailable = false;
        return [];
      }
      throw error;
    }
  }

  async getRankings(rankingType, filterType, dateRange, departamento) {
    const params = {
      ranking_type: rankingType,
      filter_type: filterType,
      departamento: departamento || '',
    };

    if (filterType === 'mes' && dateRange.month) {
      params.month = dateRange.month;
    } else if (filterType === 'periodo' && dateRange.startDate && dateRange.endDate) {
      params.start_date = dateRange.startDate;
      params.end_date = dateRange.endDate;
    }

    return this.getRanking(params);
  }
}

// Instância global da API
export const apiClient = new DjangoApiClient();

// Exportações
export { DjangoApiClient, API_BASE_URL, API_TIMEOUT };
