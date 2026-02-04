import React, { useState, useMemo } from 'react';
import planoCarnavalData from '../../data/planoCarnaval2026.json';

const ApresentacaoCarnaval2026 = () => {
  const [departamentoFiltro, setDepartamentoFiltro] = useState('TODOS');
  const [tipoPlantaoFiltro, setTipoPlantaoFiltro] = useState('TODOS');
  const [delegaciaSelecionada, setDelegaciaSelecionada] = useState(null);

  // Estatísticas calculadas
  const estatisticas = useMemo(() => {
    const delegacias = planoCarnavalData.delegacias;
    
    const totalDelegacias = delegacias.length;
    const totalCustos = delegacias.reduce((sum, d) => sum + d.custos, 0);
    const totalEfetivo = delegacias.reduce((sum, d) => sum + d.efetivoPolicial + d.efetivoExtra, 0);
    
    const ordinarias = delegacias.filter(d => d.tipoPlantao === 'ORDINÁRIO').length;
    const extraordinarias = delegacias.filter(d => d.tipoPlantao === 'EXTRAORDINÁRIO').length;
    
    const comAporte = delegacias.filter(d => d.aporte && d.aporte !== '').length;
    const aporteNecessario = delegacias.filter(d => d.aporte === 'NECESSARIO').length;
    const aporteADefinir = delegacias.filter(d => d.aporte === 'A DEFINIR').length;
    
    const porDepartamento = delegacias.reduce((acc, d) => {
      if (!acc[d.departamento]) {
        acc[d.departamento] = { count: 0, custos: 0, efetivo: 0 };
      }
      acc[d.departamento].count++;
      acc[d.departamento].custos += d.custos;
      acc[d.departamento].efetivo += d.efetivoPolicial + d.efetivoExtra;
      return acc;
    }, {});

    return {
      totalDelegacias,
      totalCustos,
      totalEfetivo,
      ordinarias,
      extraordinarias,
      comAporte,
      aporteNecessario,
      aporteADefinir,
      porDepartamento
    };
  }, []);

  // Filtrar delegacias
  const delegaciasFiltradas = useMemo(() => {
    let filtradas = planoCarnavalData.delegacias;
    
    if (departamentoFiltro !== 'TODOS') {
      filtradas = filtradas.filter(d => d.departamento === departamentoFiltro);
    }
    
    if (tipoPlantaoFiltro !== 'TODOS') {
      filtradas = filtradas.filter(d => d.tipoPlantao === tipoPlantaoFiltro);
    }
    
    return filtradas;
  }, [departamentoFiltro, tipoPlantaoFiltro]);

  // Obter departamentos únicos
  const departamentos = useMemo(() => {
    const deps = [...new Set(planoCarnavalData.delegacias.map(d => d.departamento))];
    return deps.sort();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Plano Operacional - Carnaval 2026</h1>
          <p className="text-blue-200 text-lg">Polícia Civil do Estado do Ceará</p>
          <p className="text-blue-300 mt-2">Data: {planoCarnavalData.meta.data}</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
            <div className="text-sm text-gray-600 mb-1">Total de Delegacias</div>
            <div className="text-3xl font-bold text-blue-900">{estatisticas.totalDelegacias}</div>
            <div className="text-xs text-gray-500 mt-2">
              {estatisticas.ordinarias} ordinárias | {estatisticas.extraordinarias} extraordinárias
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <div className="text-sm text-gray-600 mb-1">Efetivo Total</div>
            <div className="text-3xl font-bold text-green-900">{estatisticas.totalEfetivo}</div>
            <div className="text-xs text-gray-500 mt-2">Policiais planejados</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-600">
            <div className="text-sm text-gray-600 mb-1">Custos Totais</div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatCurrency(estatisticas.totalCustos)}
            </div>
            <div className="text-xs text-gray-500 mt-2">Custo operacional estimado</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600">
            <div className="text-sm text-gray-600 mb-1">Aportes Necessários</div>
            <div className="text-3xl font-bold text-red-900">{estatisticas.aporteNecessario}</div>
            <div className="text-xs text-gray-500 mt-2">
              {estatisticas.aporteADefinir} a definir
            </div>
          </div>
        </div>

        {/* Resumo por Departamento */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumo por Departamento</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Departamento
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Delegacias
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Efetivo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Custos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(estatisticas.porDepartamento)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([dept, data]) => (
                    <tr key={dept} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{dept}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{data.count}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700">{data.efetivo}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {formatCurrency(data.custos)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <select
                value={departamentoFiltro}
                onChange={(e) => setDepartamentoFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos os Departamentos</option>
                {departamentos.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Plantão
              </label>
              <select
                value={tipoPlantaoFiltro}
                onChange={(e) => setTipoPlantaoFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="ORDINÁRIO">Ordinário</option>
                <option value="EXTRAORDINÁRIO">Extraordinário</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Delegacias */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Delegacias ({delegaciasFiltradas.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Delegacia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Departamento
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Horário
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Efetivo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Custos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Aporte
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {delegaciasFiltradas.map((delegacia) => (
                  <tr 
                    key={delegacia.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {delegacia.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                        {delegacia.departamento}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        delegacia.tipoPlantao === 'ORDINÁRIO' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {delegacia.tipoPlantao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {delegacia.horario}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {delegacia.efetivoPlanejado || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      {delegacia.custos > 0 ? formatCurrency(delegacia.custos) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {delegacia.aporte && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          delegacia.aporte === 'NECESSARIO' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {delegacia.aporte}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setDelegaciaSelecionada(delegacia)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {delegaciaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-900 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-bold">{delegaciaSelecionada.nome}</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Departamento
                  </label>
                  <div className="text-lg text-gray-900">{delegaciaSelecionada.departamento}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tipo de Plantão
                  </label>
                  <div className="text-lg text-gray-900">{delegaciaSelecionada.tipoPlantao}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Horário
                  </label>
                  <div className="text-lg text-gray-900">{delegaciaSelecionada.horario}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Custos
                  </label>
                  <div className="text-lg text-gray-900">
                    {delegaciaSelecionada.custos > 0 
                      ? formatCurrency(delegaciaSelecionada.custos) 
                      : 'Não informado'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Aporte
                  </label>
                  <div className="text-lg text-gray-900">
                    {delegaciaSelecionada.aporte || 'Não necessário'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Efetivo Planejado
                  </label>
                  <div className="text-lg text-gray-900">
                    {delegaciaSelecionada.efetivoPlanejado || 'Não informado'}
                  </div>
                </div>
              </div>
              
              {delegaciaSelecionada.observacao && (
                <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <label className="block text-sm font-medium text-yellow-800 mb-1">
                    Observações
                  </label>
                  <div className="text-sm text-yellow-900">
                    {delegaciaSelecionada.observacao}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setDelegaciaSelecionada(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApresentacaoCarnaval2026;
