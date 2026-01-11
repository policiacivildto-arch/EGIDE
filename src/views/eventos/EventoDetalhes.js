import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventosApi, departamentosEventoApi } from '../../../services/eventosApi';
import CadastrarDepartamento from './components/CadastrarDepartamento';
import DefinirEscalas from './components/DefinirEscalas';

const EventoDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('visao-geral');
  const [showModalDepartamento, setShowModalDepartamento] = useState(false);
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState(null);

  useEffect(() => {
    carregarDashboard();
  }, [id]);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const data = await eventosApi.dashboard(id);
      setDashboard(data);
    } catch (err) {
      setError('Erro ao carregar dashboard: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const adicionarDepartamento = () => {
    setDepartamentoSelecionado(null);
    setShowModalDepartamento(true);
  };

  const editarDepartamento = (dep) => {
    setDepartamentoSelecionado(dep);
    setShowModalDepartamento(true);
  };

  const abrirEscalas = (dep) => {
    setDepartamentoSelecionado(dep);
    setAbaAtiva('escalas');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button onClick={() => navigate('/eventos')} className="mt-4 text-blue-600">
          ← Voltar para eventos
        </button>
      </div>
    );
  }

  const { evento, estatisticas, departamentos } = dashboard;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/eventos')} className="text-blue-600 hover:text-blue-800 mb-2">
          ← Voltar para eventos
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{evento.nome}</h1>
            <div className="flex gap-4 mt-2 text-gray-600">
              <span>📍 {evento.local}</span>
              <span>📅 {new Date(evento.data_inicio).toLocaleDateString()} - {new Date(evento.data_fim).toLocaleDateString()}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                {evento.tipo_evento}
              </span>
            </div>
          </div>
          <button
            onClick={adicionarDepartamento}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            + Adicionar Departamento
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Departamentos</div>
          <div className="text-3xl font-bold text-blue-600">{estatisticas.total_departamentos}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Policiais Planejados</div>
          <div className="text-3xl font-bold text-purple-600">{estatisticas.total_policiais_planejado}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Escalas Cadastradas</div>
          <div className="text-3xl font-bold text-green-600">{estatisticas.total_escalas_cadastradas}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Total de Horas</div>
          <div className="text-2xl font-bold text-orange-600">{estatisticas.total_horas.toFixed(0)}h</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Custo Total</div>
          <div className="text-2xl font-bold text-red-600">R$ {estatisticas.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso de Cadastro de Escalas</span>
          <span className="text-sm font-bold text-blue-600">{estatisticas.progresso_escalas}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all"
            style={{ width: `${estatisticas.progresso_escalas}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setAbaAtiva('visao-geral')}
              className={`px-6 py-3 font-medium ${
                abaAtiva === 'visao-geral'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setAbaAtiva('departamentos')}
              className={`px-6 py-3 font-medium ${
                abaAtiva === 'departamentos'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Departamentos ({departamentos.length})
            </button>
            {departamentoSelecionado && (
              <button
                onClick={() => setAbaAtiva('escalas')}
                className={`px-6 py-3 font-medium ${
                  abaAtiva === 'escalas'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Escalas - {departamentoSelecionado.departamento}
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {abaAtiva === 'visao-geral' && <VisaoGeral dashboard={dashboard} />}
          {abaAtiva === 'departamentos' && (
            <ListaDepartamentos
              departamentos={departamentos}
              onEditar={editarDepartamento}
              onEscalas={abrirEscalas}
              onAtualizar={carregarDashboard}
            />
          )}
          {abaAtiva === 'escalas' && departamentoSelecionado && (
            <DefinirEscalas
              departamentoEvento={departamentoSelecionado}
              onVoltar={() => setAbaAtiva('departamentos')}
              onAtualizar={carregarDashboard}
            />
          )}
        </div>
      </div>

      {/* Modais */}
      {showModalDepartamento && (
        <CadastrarDepartamento
          eventoId={id}
          departamento={departamentoSelecionado}
          onClose={() => setShowModalDepartamento(false)}
          onSuccess={() => {
            setShowModalDepartamento(false);
            carregarDashboard();
          }}
        />
      )}
    </div>
  );
};

// Componente Visão Geral
const VisaoGeral = ({ dashboard }) => {
  const { evento, estatisticas, departamentos, servicos, tipos_policial } = dashboard;

  return (
    <div className="space-y-6">
      {/* Informações do Evento */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Informações do Evento</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Nome:</span>
              <span className="ml-2 font-medium">{evento.nome}</span>
            </div>
            <div>
              <span className="text-gray-600">Tipo:</span>
              <span className="ml-2 font-medium">{evento.tipo_evento}</span>
            </div>
            <div>
              <span className="text-gray-600">Local:</span>
              <span className="ml-2 font-medium">{evento.local}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium">{evento.status}</span>
            </div>
          </div>
          {evento.descricao && (
            <div className="mt-4">
              <span className="text-gray-600">Descrição:</span>
              <p className="mt-1 text-gray-800">{evento.descricao}</p>
            </div>
          )}
        </div>
      </div>

      {/* Distribuição por Tipo de Serviço */}
      {servicos && servicos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Distribuição por Tipo de Serviço</h3>
          <div className="grid grid-cols-2 gap-4">
            {servicos.map((s, idx) => (
              <div key={idx} className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">{s.tipo_servico}</div>
                <div className="text-2xl font-bold text-blue-600">{s.policiais} policiais</div>
                <div className="text-sm text-gray-500">{s.total} departamento(s)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo por Departamento */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Top 5 Departamentos</h3>
        <div className="space-y-2">
          {departamentos.slice(0, 5).map((dep) => (
            <div key={dep.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">{dep.departamento}</div>
                <div className="text-sm text-gray-600">
                  {dep.quantidade_planejada} policiais • {dep.escalas_cadastradas} escalas
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">R$ {dep.custo_total.toFixed(2)}</div>
                <div className="text-sm text-gray-600">{dep.total_horas.toFixed(1)}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente Lista de Departamentos
const ListaDepartamentos = ({ departamentos, onEditar, onEscalas, onAtualizar }) => {
  return (
    <div className="overflow-x-auto">
      {departamentos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum departamento cadastrado ainda</p>
          <p className="text-sm mt-2">Clique em "Adicionar Departamento" para começar</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Serviço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Policial</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd. Planejada</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escalas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aporte</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departamentos.map((dep) => (
              <tr key={dep.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{dep.departamento}</div>
                  {dep.delegacia && <div className="text-sm text-gray-500">{dep.delegacia}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{dep.tipo_servico}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{dep.tipo_policial}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{dep.quantidade_planejada}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${dep.escalas_cadastradas >= dep.quantidade_planejada ? 'text-green-600' : 'text-orange-600'}`}>
                    {dep.escalas_cadastradas} / {dep.quantidade_planejada}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded ${dep.com_aporte ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {dep.com_aporte ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{dep.total_horas.toFixed(1)}h</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">R$ {dep.custo_total.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onEscalas(dep)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Escalas
                  </button>
                  <button
                    onClick={() => onEditar(dep)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EventoDetalhes;
