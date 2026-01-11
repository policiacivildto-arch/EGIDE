import React, { useState } from 'react';
import { 
  departamentoService, 
  delegaciaService, 
  policialService, 
  viaturaService, 
  vagaService 
} from '../../../services/djangoApi';

/**
 * Componente para cadastro rápido de dados via Django API
 */
export const CadastroRapidoView = ({ showNotification }) => {
  const [activeTab, setActiveTab] = useState('departamento');
  const [loading, setLoading] = useState(false);

  // Forms
  const [deptForm, setDeptForm] = useState({ sigla: '', nome: '', descricao: '' });
  const [delegaciaForm, setDelegaciaForm] = useState({ nome: '', endereco: '', telefone: '', departamento: 1 });
  const [policialForm, setPolicialForm] = useState({ matricula: '', nome: '', email: '', cargo: 'AGENTE', delegacia: 1 });
  const [viaturaForm, setViaturaForm] = useState({ placa: '', modelo: '', delegacia: 1 });
  const [vagaForm, setVagaForm] = useState({ data: '', turno: 'DIA', weekId: '' });

  // Handlers
  const handleCreateDepartamento = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await departamentoService.create(deptForm);
      showNotification('✅ Departamento criado!', 'success');
      setDeptForm({ sigla: '', nome: '', descricao: '' });
    } catch (error) {
      showNotification(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelegacia = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await delegaciaService.create(delegaciaForm);
      showNotification('✅ Delegacia criada!', 'success');
      setDelegaciaForm({ nome: '', endereco: '', telefone: '', departamento: 1 });
    } catch (error) {
      showNotification(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicial = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await policialService.create(policialForm);
      showNotification('✅ Policial criado!', 'success');
      setPolicialForm({ matricula: '', nome: '', email: '', cargo: 'AGENTE', delegacia: 1 });
    } catch (error) {
      showNotification(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateViatura = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await viaturaService.create(viaturaForm);
      showNotification('✅ Viatura criada!', 'success');
      setViaturaForm({ placa: '', modelo: '', delegacia: 1 });
    } catch (error) {
      showNotification(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVaga = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await vagaService.create(vagaForm);
      showNotification('✅ Vaga criada!', 'success');
      setVagaForm({ data: '', turno: 'DIA', weekId: '' });
    } catch (error) {
      showNotification(`❌ Erro: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'departamento', label: '🏢 Departamento' },
    { id: 'delegacia', label: '🏛️ Delegacia' },
    { id: 'policial', label: '👮 Policial' },
    { id: 'viatura', label: '🚗 Viatura' },
    { id: 'vaga', label: '📅 Vaga' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Cadastro Rápido</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Forms */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {activeTab === 'departamento' && (
          <form onSubmit={handleCreateDepartamento} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sigla *</label>
              <input
                type="text"
                required
                value={deptForm.sigla}
                onChange={(e) => setDeptForm({ ...deptForm, sigla: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: DPC, DHPP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                required
                value={deptForm.nome}
                onChange={(e) => setDeptForm({ ...deptForm, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Departamento de Polícia Civil"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={deptForm.descricao}
                onChange={(e) => setDeptForm({ ...deptForm, descricao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Departamento'}
            </button>
          </form>
        )}

        {activeTab === 'delegacia' && (
          <form onSubmit={handleCreateDelegacia} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                required
                value={delegaciaForm.nome}
                onChange={(e) => setDelegaciaForm({ ...delegaciaForm, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 1ª Delegacia - Centro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input
                type="text"
                value={delegaciaForm.endereco}
                onChange={(e) => setDelegaciaForm({ ...delegaciaForm, endereco: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Centro, Fortaleza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="text"
                value={delegaciaForm.telefone}
                onChange={(e) => setDelegaciaForm({ ...delegaciaForm, telefone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="(85) 3101-0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento ID *</label>
              <input
                type="number"
                required
                value={delegaciaForm.departamento}
                onChange={(e) => setDelegaciaForm({ ...delegaciaForm, departamento: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Delegacia'}
            </button>
          </form>
        )}

        {activeTab === 'policial' && (
          <form onSubmit={handleCreatePolicial} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula * (8 dígitos)</label>
              <input
                type="text"
                required
                pattern="\d{8}"
                value={policialForm.matricula}
                onChange={(e) => setPolicialForm({ ...policialForm, matricula: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="12345678"
                maxLength="8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                required
                value={policialForm.nome}
                onChange={(e) => setPolicialForm({ ...policialForm, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={policialForm.email}
                onChange={(e) => setPolicialForm({ ...policialForm, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="joao@pcce.ce.gov.br"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
              <select
                value={policialForm.cargo}
                onChange={(e) => setPolicialForm({ ...policialForm, cargo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="AGENTE">AGENTE</option>
                <option value="DELEGADO">DELEGADO</option>
                <option value="ESCRIVAO">ESCRIVÃO</option>
                <option value="INVESTIGADOR">INVESTIGADOR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delegacia ID *</label>
              <input
                type="number"
                required
                value={policialForm.delegacia}
                onChange={(e) => setPolicialForm({ ...policialForm, delegacia: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Policial'}
            </button>
          </form>
        )}

        {activeTab === 'viatura' && (
          <form onSubmit={handleCreateViatura} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa * (ABC-1234)</label>
              <input
                type="text"
                required
                pattern="[A-Z]{3}-\d{4}"
                value={viaturaForm.placa}
                onChange={(e) => setViaturaForm({ ...viaturaForm, placa: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ABC-1234"
                maxLength="8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input
                type="text"
                required
                value={viaturaForm.modelo}
                onChange={(e) => setViaturaForm({ ...viaturaForm, modelo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Toyota Hilux"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delegacia ID *</label>
              <input
                type="number"
                required
                value={viaturaForm.delegacia}
                onChange={(e) => setViaturaForm({ ...viaturaForm, delegacia: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Viatura'}
            </button>
          </form>
        )}

        {activeTab === 'vaga' && (
          <form onSubmit={handleCreateVaga} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={vagaForm.data}
                onChange={(e) => setVagaForm({ ...vagaForm, data: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turno *</label>
              <select
                value={vagaForm.turno}
                onChange={(e) => setVagaForm({ ...vagaForm, turno: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="DIA">DIA</option>
                <option value="NOITE">NOITE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week ID *</label>
              <input
                type="text"
                required
                value={vagaForm.weekId}
                onChange={(e) => setVagaForm({ ...vagaForm, weekId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="W49-2025"
              />
              <p className="text-xs text-gray-500 mt-1">Formato: W[semana]-[ano]</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Vaga'}
            </button>
          </form>
        )}
      </div>

      {/* Helper */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 Dica</h3>
        <p className="text-sm text-yellow-800">
          Crie os dados nesta ordem: Departamento → Delegacia → Policial/Viatura → Vaga
        </p>
      </div>
    </div>
  );
};
