import React, { useState, useEffect } from 'react';
import { escalasApi, departamentosEventoApi } from '../../../../services/eventosApi';

const DefinirEscalas = ({ departamentoEvento, onVoltar, onAtualizar }) => {
  const [escalas, setEscalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  useEffect(() => {
    carregarEscalas();
  }, [departamentoEvento.id]);

  const carregarEscalas = async () => {
    try {
      setLoading(true);
      const data = await escalasApi.listar(departamentoEvento.id);
      
      // Se não houver escalas, criar templates vazios
      if (data.length === 0) {
        const templates = [];
        for (let i = 1; i <= departamentoEvento.quantidade_planejada; i++) {
          templates.push({
            departamento_evento: departamentoEvento.id,
            identificacao: `Policial ${i}`,
            data_servico: '',
            horario_entrada: departamentoEvento.horario_inicio_delegacia || '08:00',
            horario_saida: departamentoEvento.horario_fim_delegacia || '18:00',
            valor_hora: '50.00',
            observacoes: '',
          });
        }
        setEscalas(templates);
      } else {
        setEscalas(data);
      }
    } catch (err) {
      setErro('Erro ao carregar escalas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalaChange = (index, field, value) => {
    const novasEscalas = [...escalas];
    novasEscalas[index] = {
      ...novasEscalas[index],
      [field]: value,
    };
    setEscalas(novasEscalas);
  };

  const adicionarEscala = () => {
    setEscalas([
      ...escalas,
      {
        departamento_evento: departamentoEvento.id,
        identificacao: `Policial ${escalas.length + 1}`,
        data_servico: '',
        horario_entrada: departamentoEvento.horario_inicio_delegacia || '08:00',
        horario_saida: departamentoEvento.horario_fim_delegacia || '18:00',
        valor_hora: '50.00',
        observacoes: '',
      },
    ]);
  };

  const removerEscala = (index) => {
    const novasEscalas = escalas.filter((_, i) => i !== index);
    setEscalas(novasEscalas);
  };

  const salvarEscalas = async () => {
    setSalvando(true);
    setErro(null);
    setSucesso(null);

    try {
      // Validar campos obrigatórios
      const escalasSemData = escalas.filter(e => !e.data_servico);
      if (escalasSemData.length > 0) {
        setErro('Todas as escalas devem ter uma data de serviço preenchida');
        setSalvando(false);
        return;
      }

      // Separar escalas novas (sem ID) e existentes (com ID)
      const escalasNovas = escalas.filter(e => !e.id);
      const escalasExistentes = escalas.filter(e => e.id);

      // Salvar escalas novas
      if (escalasNovas.length > 0) {
        await escalasApi.criarMultiplas(escalasNovas);
      }

      // Atualizar escalas existentes
      for (const escala of escalasExistentes) {
        await escalasApi.atualizar(escala.id, escala);
      }

      setSucesso(`${escalasNovas.length + escalasExistentes.length} escalas salvas com sucesso!`);
      
      // Recarregar
      await carregarEscalas();
      onAtualizar();
    } catch (err) {
      setErro('Erro ao salvar escalas: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSalvando(false);
    }
  };

  const aplicarHorariosPadraoTodos = () => {
    const novasEscalas = escalas.map(e => ({
      ...e,
      horario_entrada: departamentoEvento.horario_inicio_delegacia,
      horario_saida: departamentoEvento.horario_fim_delegacia,
    }));
    setEscalas(novasEscalas);
  };

  const duplicarDataTodos = (data) => {
    if (!data) return;
    const novasEscalas = escalas.map(e => ({
      ...e,
      data_servico: data,
    }));
    setEscalas(novasEscalas);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Carregando escalas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">
            Definir Escalas - {departamentoEvento.departamento}
          </h3>
          <p className="text-gray-600 mt-1">
            Fase 2: Preencher horários de entrada e saída de cada policial
          </p>
          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <span>📍 {departamentoEvento.delegacia || 'Sem delegacia específica'}</span>
            <span>👮 {departamentoEvento.tipo_policial} - {departamentoEvento.tipo_servico}</span>
            <span>📊 {departamentoEvento.quantidade_planejada} policiais planejados</span>
          </div>
        </div>
        <button
          onClick={onVoltar}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Voltar para Departamentos
        </button>
      </div>

      {/* Alertas */}
      {erro && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {sucesso}
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="font-semibold text-blue-900 mb-3">Ações Rápidas</div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={aplicarHorariosPadraoTodos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Aplicar Horários Padrão para Todos
          </button>
          <div className="flex items-center gap-2">
            <input
              type="date"
              id="data-padrao"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => {
                const data = document.getElementById('data-padrao').value;
                duplicarDataTodos(data);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Aplicar Data para Todos
            </button>
          </div>
          <button
            onClick={adicionarEscala}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            + Adicionar Policial
          </button>
        </div>
      </div>

      {/* Tabela de Escalas */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                Identificação
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
                Data Serviço *
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                Entrada *
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                Saída *
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                Valor/Hora (R$)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Observações
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {escalas.map((escala, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={escala.identificacao}
                    onChange={(e) => handleEscalaChange(index, 'identificacao', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Policial 1"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={escala.data_servico}
                    onChange={(e) => handleEscalaChange(index, 'data_servico', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={escala.horario_entrada}
                    onChange={(e) => handleEscalaChange(index, 'horario_entrada', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={escala.horario_saida}
                    onChange={(e) => handleEscalaChange(index, 'horario_saida', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={escala.valor_hora}
                    onChange={(e) => handleEscalaChange(index, 'valor_hora', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={escala.observacoes || ''}
                    onChange={(e) => handleEscalaChange(index, 'observacoes', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações..."
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => removerEscala(index)}
                    className="text-red-600 hover:text-red-900 text-sm"
                    title="Remover"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600">Total de Escalas</div>
            <div className="text-2xl font-bold text-blue-600">{escalas.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Planejado</div>
            <div className="text-2xl font-bold text-gray-600">{departamentoEvento.quantidade_planejada}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className={`text-2xl font-bold ${escalas.length >= departamentoEvento.quantidade_planejada ? 'text-green-600' : 'text-orange-600'}`}>
              {escalas.length >= departamentoEvento.quantidade_planejada ? '✓ Completo' : '⚠ Incompleto'}
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onVoltar}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={salvarEscalas}
          disabled={salvando}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-lg"
        >
          {salvando ? 'Salvando...' : `💾 Salvar Todas as Escalas (${escalas.length})`}
        </button>
      </div>
    </div>
  );
};

export default DefinirEscalas;
