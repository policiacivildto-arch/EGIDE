// EXEMPLO: Como migrar um componente legado para Django API
import React from 'react';
import { useVagasDjango, useCreateVaga } from '../hooks/useDjangoApi';

/**
 * Exemplo de componente migrando da camada antiga para Django
 * 
 * ANTES (camada antiga):
 * const snapshot = await legacyClient.list('vagas');
 * 
 * DEPOIS (Django):
 * import { useVagasDjango } from '../hooks/useDjangoApi';
 * const { vagas, loading } = useVagasDjango();
 */

export const ExemploVagasListagem = () => {
  // Hook customizado que busca vagas do Django
  const { vagas, loading, error, refresh } = useVagasDjango();
  const { createVaga, creating } = useCreateVaga();

  const handleCriarVaga = async () => {
    try {
      await createVaga({
        data: '2025-12-04',
        turno: 'diurno',
        status: 'disponivel',
        delegacia: 1, // ID da delegacia
      });
      refresh(); // Recarregar lista
    } catch (err) {
      console.error('Erro ao criar vaga:', err);
    }
  };

  if (loading) return <div>Carregando vagas...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h2>Vagas Disponíveis ({vagas.length})</h2>
      <button onClick={handleCriarVaga} disabled={creating}>
        {creating ? 'Criando...' : 'Nova Vaga'}
      </button>
      
      <ul>
        {vagas.map(vaga => (
          <li key={vaga.id}>
            {vaga.data} - {vaga.turno} - {vaga.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

// =====================================================
// EXEMPLO 2: Login com Django JWT
// =====================================================

export const ExemploLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { default: djangoApi } = await import('../services/djangoApi');
      const data = await djangoApi.auth.login(username, password);
      
      console.log('Login bem-sucedido! Token:', data.access);
      onLoginSuccess?.(data);
      
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login Django</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <input
        type="text"
        placeholder="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};

// =====================================================
// EXEMPLO 3: Criar Equipe
// =====================================================

export const ExemploCriarEquipe = () => {
  const { createEquipe, creating, error } = require('../hooks/useDjangoApi').useCreateEquipe();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const equipeData = {
      vaga: 5, // ID da vaga
      chefe: 2, // ID do policial chefe
      membros: [3, 4, 5], // IDs dos membros
      viatura: 1, // ID da viatura
      status: 'pendente',
    };

    try {
      const novaEquipe = await createEquipe(equipeData);
      console.log('Equipe criada:', novaEquipe);
      alert('Equipe criada com sucesso!');
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Criar Equipe</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {/* Seus campos do formulário aqui */}
      
      <button type="submit" disabled={creating}>
        {creating ? 'Criando...' : 'Criar Equipe'}
      </button>
    </form>
  );
};

export default ExemploVagasListagem;
