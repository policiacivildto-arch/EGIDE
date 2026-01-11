import { useEffect, useState, useCallback } from 'react';
import { 
  vagaService, 
  equipeService, 
  comboioService, 
  policialService,
  departamentoService 
} from '../services/djangoApi';

/**
 * Hook customizado para buscar todos os dados necessários no Admin Dashboard
 * 
 * Substitui: src/views/admin/useAdminData.js (versão Firebase)
 * 
 * @returns {Object} Dados do admin dashboard
 */
export const useAdminDataDjango = () => {
  const [vagas, setVagas] = useState([]);
  const [teams, setTeams] = useState([]);
  const [convoys, setConvoys] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [holidays, setHolidays] = useState([]); // Nota: holidays não está no backend Django ainda
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar todos os dados
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar dados em paralelo para melhor performance
      const [vagasData, teamsData, convoysData, policiais, departamentos] = await Promise.all([
        vagaService.getAll(),
        equipeService.getAll(),
        comboioService.getAll(),
        policialService.getAll(),
        departamentoService.getAll()
      ]);

      setVagas(vagasData);
      setTeams(teamsData);
      setConvoys(convoysData);
      
      // No Django, usuários = policiais
      setAllUsers(policiais);
      
      // TODO: Implementar holidays quando necessário
      // Por enquanto, deixar vazio
      setHolidays([]);

    } catch (err) {
      console.error('Erro ao buscar dados admin:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar dados na montagem do componente
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Polling: atualizar dados a cada 30 segundos
  // (substitui onSnapshot do Firebase)
  useEffect(() => {
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Função refresh manual
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { 
    vagas, 
    teams, 
    convoys, 
    allUsers, 
    holidays, 
    loading, 
    error,
    refresh 
  };
};
