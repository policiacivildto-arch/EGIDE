// Hook customizado para usar a API Django
import { useState, useEffect } from 'react';
import djangoApi from '../services/djangoApi';

/**
 * Hook para buscar vagas do Django
 * Substitui a camada de dados antiga
 * 
 * Exemplo de uso:
 * const { vagas, loading, error, refresh } = useVagasDjango();
 */
export const useVagasDjango = (filtros = {}) => {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVagas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar vagas da API Django
      const data = await djangoApi.vagas.getAll();
      
      // Aplicar filtros localmente (ou enviar como query params)
      let vagasFiltradas = data.results || data;
      
      if (filtros.data) {
        vagasFiltradas = vagasFiltradas.filter(v => v.data === filtros.data);
      }
      
      if (filtros.turno) {
        vagasFiltradas = vagasFiltradas.filter(v => v.turno === filtros.turno);
      }
      
      setVagas(vagasFiltradas);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar vagas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVagas();
  }, [filtros.data, filtros.turno]);

  return { vagas, loading, error, refresh: fetchVagas };
};

/**
 * Hook para buscar equipes do Django
 */
export const useEquipesDjango = () => {
  const [equipes, setEquipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEquipes = async () => {
    try {
      setLoading(true);
      const data = await djangoApi.equipes.getAll();
      setEquipes(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipes();
  }, []);

  return { equipes, loading, error, refresh: fetchEquipes };
};

/**
 * Hook para buscar comboios do Django
 */
export const useComboiosDjango = () => {
  const [comboios, setComboios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComboios = async () => {
    try {
      setLoading(true);
      const data = await djangoApi.comboios.getAll();
      setComboios(data.results || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComboios();
  }, []);

  return { comboios, loading, error, refresh: fetchComboios };
};

/**
 * Hook para criar uma vaga
 */
export const useCreateVaga = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const createVaga = async (vagaData) => {
    try {
      setCreating(true);
      setError(null);
      const novaVaga = await djangoApi.vagas.create(vagaData);
      return novaVaga;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { createVaga, creating, error };
};

/**
 * Hook para criar uma equipe
 */
export const useCreateEquipe = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const createEquipe = async (equipeData) => {
    try {
      setCreating(true);
      setError(null);
      const novaEquipe = await djangoApi.equipes.create(equipeData);
      return novaEquipe;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return { createEquipe, creating, error };
};
