/**
 * Hook de Autenticação Django com JWT
 * Sistema EGIDE - Versão Django Backend
 */

import { useState, useEffect, createContext, useContext } from 'react';
import djangoApi from '../services/djangoApiAuth';

// ============================================================================
// CONTEXT DE AUTENTICAÇÃO
// ============================================================================

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// ============================================================================
// AUTH PROVIDER
// ============================================================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [perfilDepartamento, setPerfilDepartamento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      if (!djangoApi.auth.isAuthenticated()) {
        setUser(null);
        setPerfilDepartamento(null);
        setLoading(false);
        return;
      }

      // Tentar buscar dados do usuário
      const userData = await djangoApi.auth.me();
      setUser(userData.user);
      setPerfilDepartamento(userData.perfil_departamento);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
      setPerfilDepartamento(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await djangoApi.auth.login(username, password);
      setUser(data.user);
      setPerfilDepartamento(data.perfil_departamento);
      
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await djangoApi.auth.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      setPerfilDepartamento(null);
    }
  };

  const value = {
    user,
    perfilDepartamento,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// HOOK DE DEMANDAS
// ============================================================================

export const useDemandas = (filtros = {}) => {
  const [demandas, setDemandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDemandas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await djangoApi.demandas.getAll(filtros);
      setDemandas(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar demandas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandas();
  }, [JSON.stringify(filtros)]);

  const criarDemanda = async (dadosDemanda) => {
    try {
      const novaDemanda = await djangoApi.demandas.create(dadosDemanda);
      setDemandas([novaDemanda, ...demandas]);
      return novaDemanda;
    } catch (err) {
      console.error('Erro ao criar demanda:', err);
      throw err;
    }
  };

  const atualizarDemanda = async (id, dados) => {
    try {
      const demandaAtualizada = await djangoApi.demandas.update(id, dados);
      setDemandas(demandas.map(d => d.id === id ? demandaAtualizada : d));
      return demandaAtualizada;
    } catch (err) {
      console.error('Erro ao atualizar demanda:', err);
      throw err;
    }
  };

  const enviarDemanda = async (id) => {
    try {
      const demandaAtualizada = await djangoApi.demandas.enviar(id);
      setDemandas(demandas.map(d => d.id === id ? demandaAtualizada : d));
      return demandaAtualizada;
    } catch (err) {
      console.error('Erro ao enviar demanda:', err);
      throw err;
    }
  };

  const aprovarDemanda = async (id, dados) => {
    try {
      const demandaAtualizada = await djangoApi.demandas.aprovar(id, dados);
      setDemandas(demandas.map(d => d.id === id ? demandaAtualizada : d));
      return demandaAtualizada;
    } catch (err) {
      console.error('Erro ao aprovar demanda:', err);
      throw err;
    }
  };

  const rejeitarDemanda = async (id, dados) => {
    try {
      const demandaAtualizada = await djangoApi.demandas.rejeitar(id, dados);
      setDemandas(demandas.map(d => d.id === id ? demandaAtualizada : d));
      return demandaAtualizada;
    } catch (err) {
      console.error('Erro ao rejeitar demanda:', err);
      throw err;
    }
  };

  return {
    demandas,
    loading,
    error,
    refresh: fetchDemandas,
    criarDemanda,
    atualizarDemanda,
    enviarDemanda,
    aprovarDemanda,
    rejeitarDemanda,
  };
};

// ============================================================================
// HOOK DE NOTIFICAÇÕES
// ============================================================================

export const useNotificacoes = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await djangoApi.notificacoes.getAll();
      setNotificacoes(data.results || data);
      
      const naoLidasData = await djangoApi.notificacoes.naoLidas();
      setNaoLidas(naoLidasData.count || naoLidasData.length || 0);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotificacoes, 30000);
    return () => clearInterval(interval);
  }, []);

  const marcarLida = async (id) => {
    try {
      await djangoApi.notificacoes.marcarLida(id);
      setNotificacoes(notificacoes.map(n => 
        n.id === id ? { ...n, lida: true } : n
      ));
      setNaoLidas(Math.max(0, naoLidas - 1));
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      throw err;
    }
  };

  const marcarTodasLidas = async () => {
    try {
      await djangoApi.notificacoes.marcarTodasLidas();
      setNotificacoes(notificacoes.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
      throw err;
    }
  };

  return {
    notificacoes,
    naoLidas,
    loading,
    error,
    refresh: fetchNotificacoes,
    marcarLida,
    marcarTodasLidas,
  };
};

// ============================================================================
// HOOK DE DEPARTAMENTOS
// ============================================================================

export const useDepartamentos = () => {
  const [departamentos, setDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartamentos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await djangoApi.departamentos.getAll();
      setDepartamentos(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar departamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  return { departamentos, loading, error, refresh: fetchDepartamentos };
};

// ============================================================================
// HOOK DE OPERAÇÕES
// ============================================================================

export const useOperacoes = () => {
  const [operacoes, setOperacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOperacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await djangoApi.operacoes.getAll();
      setOperacoes(data.results || data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar operações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperacoes();
  }, []);

  return { operacoes, loading, error, refresh: fetchOperacoes };
};
