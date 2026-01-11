import React, { useState, useEffect } from 'react';
import { eventosApi } from '../../../services/eventosApi';

const EventosDashboard = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState(null);

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    try {
      setLoading(true);
      const data = await eventosApi.listar();
      setEventos(data);
    } catch (err) {
      setError('Erro ao carregar eventos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirEvento = (evento) => {
    window.location.href = `/eventos/${evento.id}`;
  };

  const novoEvento = () => {
    setEventoSelecionado(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Carregando eventos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Operações de Evento</h1>
          <p className="text-gray-600 mt-1">Gestão de eventos especiais (Carnaval, Réveillon, etc)</p>
        </div>
        <button
          onClick={novoEvento}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
        >
          + Novo Evento
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Total de Eventos</div>
          <div className="text-3xl font-bold text-blue-600">{eventos.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Em Planejamento</div>
          <div className="text-3xl font-bold text-yellow-600">
            {eventos.filter(e => e.status === 'PLANEJAMENTO' || e.status === 'CADASTRO_INICIAL').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Em Andamento</div>
          <div className="text-3xl font-bold text-green-600">
            {eventos.filter(e => e.status === 'EM_ANDAMENTO').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Concluídos</div>
          <div className="text-3xl font-bold text-gray-600">
            {eventos.filter(e => e.status === 'CONCLUIDO').length}
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Eventos</h2>
        </div>
        <div className="overflow-x-auto">
          {eventos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">Nenhum evento cadastrado</p>
              <p className="text-sm mt-2">Clique em "Novo Evento" para começar</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamentos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policiais</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventos.map((evento) => (
                  <tr key={evento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{evento.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{evento.tipo_evento}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {evento.local}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(evento.data_inicio).toLocaleDateString()} - {new Date(evento.data_fim).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={evento.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {evento.total_departamentos || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {evento.total_policiais_planejado || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => abrirEvento(evento)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Abrir →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Novo Evento */}
      {showModal && <ModalNovoEvento onClose={() => setShowModal(false)} onSuccess={carregarEventos} />}
    </div>
  );
};

// Componente Badge de Status
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'PLANEJAMENTO': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Planejamento' },
    'CADASTRO_INICIAL': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Cadastro Inicial' },
    'DEFININDO_ESCALAS': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Definindo Escalas' },
    'APROVADO': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Aprovado' },
    'EM_ANDAMENTO': { bg: 'bg-green-100', text: 'text-green-800', label: 'Em Andamento' },
    'CONCLUIDO': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Concluído' },
    'CANCELADO': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
  };

  const config = statusConfig[status] || statusConfig['PLANEJAMENTO'];

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Modal de Novo Evento
const ModalNovoEvento = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo_evento: 'CARNAVAL',
    descricao: '',
    local: '',
    data_inicio: '',
    data_fim: '',
    status: 'PLANEJAMENTO',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      await eventosApi.criar(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setErro('Erro ao criar evento: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Novo Evento</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {erro && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Carnaval 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento *</label>
              <select
                name="tipo_evento"
                value={formData.tipo_evento}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="CARNAVAL">Carnaval</option>
                <option value="REVEILLON">Réveillon</option>
                <option value="FESTA_PADROEIRO">Festa do Padroeiro</option>
                <option value="SHOW">Show/Evento Musical</option>
                <option value="ESPORTIVO">Evento Esportivo</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local *</label>
              <input
                type="text"
                name="local"
                value={formData.local}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Centro da Cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início *</label>
              <input
                type="date"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim *</label>
              <input
                type="date"
                name="data_fim"
                value={formData.data_fim}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Detalhes sobre o evento..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventosDashboard;
