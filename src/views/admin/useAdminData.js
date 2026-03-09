import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../../config/api';

export const useAdminData = () => {
  const [vagas, setVagas] = useState([]);
  const [teams, setTeams] = useState([]);
  const [convoys, setConvoys] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para carregar todos os dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vagasData, teamsData, convoysData, usersData, holidaysData] = await Promise.all([
        apiClient.getVagas(),
        apiClient.getTeams(),
        apiClient.getConvoys(),
        apiClient.getPoliciais(),
        apiClient.getHolidays(),
      ]);

      setVagas(Array.isArray(vagasData) ? vagasData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setConvoys(Array.isArray(convoysData) ? convoysData : []);
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      setHolidays(Array.isArray(holidaysData) ? holidaysData : []);
    } catch (error) {
      console.error('Erro ao carregar dados do admin:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega dados na inicialização
  useEffect(() => {
    loadData();
    
    // Opcional: polling para atualizar dados a cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return { vagas, teams, convoys, allUsers, holidays, loading, refresh };
};
