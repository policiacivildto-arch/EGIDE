/**
 * Admin Service 
 * Todas as operações agora usam Django API em vez de Firestore
 * Dados armazenados em Django Database
 */

import { apiClient } from '../config/api';

const releaseTeamSlot = async (team) => {
  const vagaId = team?.vagaId || team?.vaga || team?.vaga_info?.id;
  await apiClient.deleteTeam(team.id);
  if (!vagaId) return { success: true };
  return apiClient.updateVaga(vagaId, {
    status: 'Disponível',
    team_id: null,
  });
};

/**
 * OPERAÇÕES COM TIMES (Teams)
 */
export const confirmTeam = async (teamId) => {
  return apiClient.updateTeam(teamId, { status: 'Aprovada' });
};

export const rejectTeam = async (team) => {
  return releaseTeamSlot(team);
};

export const updateTeam = async (teamId, updates) => {
  return apiClient.updateTeam(teamId, updates);
};

export const deleteTeam = async (team) => {
  return releaseTeamSlot(team);
};

/**
 * OPERAÇÕES COM VAGAS (Slots/Vacancies)
 */
export const generateWeeklyVagas = async (vagasConfig, currentWeek) => {
  // vagasConfig: objeto { index: { day: N, night: M }, ... }
  // currentWeek.weekDays: array de datas
  
  const vagasToCreate = [];
  
  for (const [idx, cfg] of Object.entries(vagasConfig)) {
    const date = currentWeek.weekDays[Number(idx)];
    
    // Criar vagas diurnas
    for (let i = 0; i < (cfg.day || 0); i++) {
      vagasToCreate.push({
        date: date,
        shift_type: 'day',
        status: 'Disponível'
      });
    }
    
    // Criar vagas noturnas
    for (let i = 0; i < (cfg.night || 0); i++) {
      vagasToCreate.push({
        date: date,
        shift_type: 'night',
        status: 'Disponível'
      });
    }
  }
  
  // Cria todas as vagas em paralelo
  return Promise.all(vagasToCreate.map(vaga => apiClient.create('vagas', vaga)));
};

/**
 * OPERAÇÕES COM COMBOIOS (Convoys)
 */
export const createConvoy = async (convoyData) => {
  const response = await apiClient.createConvoy(convoyData);
  return response.id;
};

export const updateConvoy = async (convoyId, updates) => {
  return apiClient.updateConvoy(convoyId, updates);
};

export const deleteConvoy = async (convoyId) => {
  return apiClient.deleteConvoy(convoyId);
};

export const getConvoys = async (params = {}) => {
  return apiClient.getConvoys(params);
};

export const getConvoy = async (convoyId) => {
  return apiClient.getConvoy(convoyId);
};

/**
 * OPERAÇÕES COM TIMES (Teams) - CREATE
 */
export const createTeam = async (teamPayload, vagaId) => {
  // Cria o time
  const newTeam = await apiClient.createTeam({
    ...teamPayload,
    vaga_id: vagaId
  });
  
  // Atualiza a vaga para ocupada
  await apiClient.updateVaga(vagaId, {
    status: 'Ocupada', 
    team_id: newTeam.id 
  });
  
  return newTeam.id;
};

export const getTeams = async (params = {}) => {
  return apiClient.getTeams(params);
};

export const getTeam = async (teamId) => {
  return apiClient.getTeam(teamId);
};

/**
 * OPERAÇÕES COM VAGAS (Slots) - GETS
 */
export const getVagas = async (params = {}) => {
  return apiClient.getList('vagas', params);
};

export const getVaga = async (vagaId) => {
  return apiClient.getDetail('vagas', vagaId);
};

export const updateVaga = async (vagaId, updates) => {
  return apiClient.partialUpdate('vagas', vagaId, updates);
};

export const deleteVaga = async (vagaId) => {
  return apiClient.delete('vagas', vagaId);
};

/**
 * OPERAÇÕES COM SEMANAS/WEEKS
 */
export const getWeeks = async (params = {}) => {
  return apiClient.getList('weeks', params);
};

export const getWeek = async (weekId) => {
  return apiClient.getDetail('weeks', weekId);
};

export const createWeek = async (weekData) => {
  return apiClient.create('weeks', weekData);
};

export const updateWeek = async (weekId, updates) => {
  return apiClient.update('weeks', weekId, updates);
};

export const deleteWeek = async (weekId) => {
  return apiClient.delete('weeks', weekId);
};
