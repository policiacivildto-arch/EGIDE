import React, { useState, useEffect } from 'react';
import djangoApi from '../services/djangoApi';

/**
 * 🎯 EXEMPLO DE CICLO COMPLETO (CRUD) 
 * Cria → Salva no Django → Lista → Edita → Deleta
 * 
 * Este componente demonstra:
 * ✅ CREATE: Criar policial no frontend e salvar no banco Django
 * ✅ READ: Listar todos os policiais salvos no banco
 * ✅ UPDATE: Editar dados de um policial existente
 * ✅ DELETE: Deletar policial do banco
 */

const ExemploCicloCompleto = () => {
  // Estado para lista de policiais
  const [policiais, setPoliciais] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para formulário
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    classe: 'INV', // INV, DEL, ESC, AGT, PCL
    cargo: '',
    telefone: '',
    email: '',
    departamento: 1 // ID do departamento (ajustar conforme necessário)
  });
  
  // Estado para edição
  const [editandoId, setEditandoId] = useState(null);
  const [mensagem, setMensagem] = useState('');

  // 📖 READ: Carregar policiais do Django ao montar o componente
  useEffect(() => {
    carregarPoliciais();
  }, []);

  const carregarPoliciais = async () => {
    try {
      setLoading(true);
      const response = await djangoApi.policiais.getAll();
      setPoliciais(response.results || response);
      setMensagem('✅ Policiais carregados do banco Django!');
    } catch (error) {
      setMensagem('❌ Erro ao carregar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ➕ CREATE: Criar novo policial
  const handleCriar = async (e) => {
    e.preventDefault();
    try {
      const novoPolicialSalvo = await djangoApi.policiais.create(formData);
      
      setMensagem(`✅ Policial "${novoPolicialSalvo.nome}" criado com ID ${novoPolicialSalvo.id} e salvo no banco Django!`);
      
      // Recarregar lista
      carregarPoliciais();
      
      // Limpar formulário
      setFormData({
        nome: '',
        matricula: '',
        classe: 'INV',
        cargo: '',
        telefone: '',
        email: '',
        departamento: 1
      });
    } catch (error) {
      setMensagem('❌ Erro ao criar: ' + error.message);
    }
  };

  // ✏️ UPDATE: Atualizar policial existente
  const handleEditar = async (id) => {
    try {
      const policialAtualizado = await djangoApi.policiais.update(id, formData);
      
      setMensagem(`✅ Policial "${policialAtualizado.nome}" atualizado no banco Django!`);
      
      // Recarregar lista
      carregarPoliciais();
      
      // Sair do modo de edição
      setEditandoId(null);
      setFormData({
        nome: '',
        matricula: '',
        classe: 'INV',
        cargo: '',
        telefone: '',
        email: '',
        departamento: 1
      });
    } catch (error) {
      setMensagem('❌ Erro ao atualizar: ' + error.message);
    }
  };

  // 🗑️ DELETE: Deletar policial
  const handleDeletar = async (id, nome) => {
    if (!window.confirm(`Confirma deletar "${nome}" do banco Django?`)) {
      return;
    }
    
    try {
      await djangoApi.policiais.delete(id);
      
      setMensagem(`✅ Policial "${nome}" deletado do banco Django!`);
      
      // Recarregar lista
      carregarPoliciais();
    } catch (error) {
      setMensagem('❌ Erro ao deletar: ' + error.message);
    }
  };

  // Preparar edição
  const iniciarEdicao = (policial) => {
    setEditandoId(policial.id);
    setFormData({
      nome: policial.nome,
      matricula: policial.matricula,
      classe: policial.classe,
      cargo: policial.cargo || '',
      telefone: policial.telefone || '',
      email: policial.email || '',
      departamento: policial.departamento || 1
    });
    setMensagem(`✏️ Editando: ${policial.nome}`);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setFormData({
      nome: '',
      matricula: '',
      classe: 'INV',
      cargo: '',
      telefone: '',
      email: '',
      departamento: 1
    });
    setMensagem('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editandoId) {
      handleEditar(editandoId);
    } else {
      handleCriar(e);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎯 Exemplo: Ciclo Completo CRUD com Django</h1>
      
      {/* Mensagem de status */}
      {mensagem && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: mensagem.includes('❌') ? '#ffebee' : '#e8f5e9',
          border: `1px solid ${mensagem.includes('❌') ? '#f44336' : '#4caf50'}`,
          borderRadius: '4px'
        }}>
          {mensagem}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* FORMULÁRIO - CREATE/UPDATE */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h2>{editandoId ? '✏️ Editar Policial' : '➕ Criar Novo Policial'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nome:</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Matrícula:</label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Classe:</label>
              <select
                value={formData.classe}
                onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="INV">Investigador</option>
                <option value="DEL">Delegado</option>
                <option value="ESC">Escrivão</option>
                <option value="AGT">Agente</option>
                <option value="PCL">Papiloscopista</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Cargo:</label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Telefone:</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: editandoId ? '#ff9800' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editandoId ? '💾 Salvar Alterações' : '➕ Criar e Salvar no Django'}
              </button>
              
              {editandoId && (
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LISTAGEM - READ */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>📋 Policiais Salvos no Django</h2>
            <button
              onClick={carregarPoliciais}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Recarregar
            </button>
          </div>

          {loading ? (
            <p>⏳ Carregando do banco Django...</p>
          ) : policiais.length === 0 ? (
            <p>Nenhum policial cadastrado. Crie o primeiro!</p>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {policiais.map((policial) => (
                <div
                  key={policial.id}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: editandoId === policial.id ? '#fff3e0' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0' }}>{policial.nome}</h3>
                      <p style={{ margin: '3px 0', fontSize: '14px', color: '#666' }}>
                        <strong>ID:</strong> {policial.id} | 
                        <strong> Matrícula:</strong> {policial.matricula} | 
                        <strong> Classe:</strong> {policial.classe}
                      </p>
                      {policial.cargo && (
                        <p style={{ margin: '3px 0', fontSize: '14px', color: '#666' }}>
                          <strong>Cargo:</strong> {policial.cargo}
                        </p>
                      )}
                      {policial.telefone && (
                        <p style={{ margin: '3px 0', fontSize: '14px', color: '#666' }}>
                          <strong>Telefone:</strong> {policial.telefone}
                        </p>
                      )}
                      {policial.email && (
                        <p style={{ margin: '3px 0', fontSize: '14px', color: '#666' }}>
                          <strong>Email:</strong> {policial.email}
                        </p>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => iniciarEdicao(policial)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      
                      <button
                        onClick={() => handleDeletar(policial.id, policial.nome)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informações */}
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>📚 Como funciona o Ciclo Completo:</h3>
        <ol>
          <li><strong>CREATE:</strong> Preencha o formulário → Clique em "Criar" → Dados são salvos no banco Django PostgreSQL</li>
          <li><strong>READ:</strong> A lista carrega automaticamente do banco Django → Clique em "Recarregar" para atualizar</li>
          <li><strong>UPDATE:</strong> Clique em "Editar" → Modifique os dados → Clique em "Salvar Alterações" → Atualizado no banco</li>
          <li><strong>DELETE:</strong> Clique em "Deletar" → Confirme → Registro removido do banco Django</li>
        </ol>
        
        <p><strong>💾 Onde está salvo?</strong> Todos os dados estão no banco de dados PostgreSQL do Django.</p>
        <p><strong>🔍 Onde verificar?</strong> Acesse http://127.0.0.1:8000/admin/ → Login → Veja os policiais salvos</p>
      </div>
    </div>
  );
};

export default ExemploCicloCompleto;
