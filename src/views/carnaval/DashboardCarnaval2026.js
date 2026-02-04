import React, { useMemo } from 'react';
import planoCarnavalData from '../../data/planoCarnaval2026.json';

const DashboardCarnaval2026 = () => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Análises e estatísticas
  const analises = useMemo(() => {
    const delegacias = planoCarnavalData.delegacias;

    // Custos por departamento
    const custosPorDepartamento = delegacias.reduce((acc, d) => {
      if (!acc[d.departamento]) acc[d.departamento] = 0;
      acc[d.departamento] += d.custos;
      return acc;
    }, {});

    // Efetivo por tipo de plantão
    const efetivoPorTipo = delegacias.reduce((acc, d) => {
      const tipo = d.tipoPlantao;
      if (!acc[tipo]) acc[tipo] = { total: 0, count: 0 };
      acc[tipo].total += d.efetivoPolicial + d.efetivoExtra;
      acc[tipo].count++;
      return acc;
    }, {});

    // Delegacias que necessitam aporte
    const comAporteNecessario = delegacias.filter(d => d.aporte === 'NECESSARIO');
    const comAporteADefinir = delegacias.filter(d => d.aporte === 'A DEFINIR');
    const semAporte = delegacias.filter(d => !d.aporte || d.aporte === '');

    // Distribuição por horário
    const por24h = delegacias.filter(d => d.horario === '24h').length;
    const porHorarioEspecial = delegacias.filter(d => d.horario !== '24h').length;

    // Top 5 delegacias com maior custo
    const top5Custos = [...delegacias]
      .sort((a, b) => b.custos - a.custos)
      .slice(0, 5);

    // Top 5 departamentos com maior efetivo
    const efetivoPorDepartamento = delegacias.reduce((acc, d) => {
      if (!acc[d.departamento]) acc[d.departamento] = 0;
      acc[d.departamento] += d.efetivoPolicial + d.efetivoExtra;
      return acc;
    }, {});

    const top5Efetivo = Object.entries(efetivoPorDepartamento)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Custos totais por tipo de aporte
    const custosAporteNecessario = comAporteNecessario.reduce((sum, d) => sum + d.custos, 0);
    const custosAporteADefinir = comAporteADefinir.reduce((sum, d) => sum + d.custos, 0);
    const custosSemAporte = semAporte.reduce((sum, d) => sum + d.custos, 0);

    return {
      custosPorDepartamento,
      efetivoPorTipo,
      comAporteNecessario,
      comAporteADefinir,
      semAporte,
      por24h,
      porHorarioEspecial,
      top5Custos,
      top5Efetivo,
      custosAporteNecessario,
      custosAporteADefinir,
      custosSemAporte
    };
  }, []);

  // Gráfico de barras simples (SVG)
  const BarChart = ({ data, label, color = '#3b82f6' }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-700 truncate" title={item.name}>
                {item.name}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: color,
                      minWidth: item.value > 0 ? '30px' : '0'
                    }}
                  >
                    {percentage > 15 && label(item.value)}
                  </div>
                </div>
                <div className="w-24 text-sm font-medium text-gray-700 text-right">
                  {label(item.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Dashboard Analítico - Carnaval 2026
        </h2>
        <p className="text-gray-600 mt-2">
          Análise detalhada do plano operacional
        </p>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aporte Necessário</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {analises.comAporteNecessario.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(analises.custosAporteNecessario)}
              </p>
            </div>
            <div className="text-4xl">🔴</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aporte a Definir</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {analises.comAporteADefinir.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(analises.custosAporteADefinir)}
              </p>
            </div>
            <div className="text-4xl">🟠</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sem Aporte</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {analises.semAporte.length}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(analises.custosSemAporte)}
              </p>
            </div>
            <div className="text-4xl">🟢</div>
          </div>
        </div>
      </div>

      {/* Distribuição de Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Distribuição por Horário
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Plantões 24h</span>
                <span className="text-sm font-semibold text-gray-800">{analises.por24h}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ 
                    width: `${(analises.por24h / planoCarnavalData.delegacias.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Horário Especial</span>
                <span className="text-sm font-semibold text-gray-800">
                  {analises.porHorarioEspecial}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={{ 
                    width: `${(analises.porHorarioEspecial / planoCarnavalData.delegacias.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Efetivo por Tipo de Plantão
          </h3>
          <div className="space-y-4">
            {Object.entries(analises.efetivoPorTipo).map(([tipo, data]) => (
              <div key={tipo}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">{tipo}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-800">
                      {data.total} policiais
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({data.count} delegacias)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      tipo === 'ORDINÁRIO' ? 'bg-green-600' : 'bg-yellow-600'
                    }`}
                    style={{ 
                      width: `${(data.total / (Object.values(analises.efetivoPorTipo).reduce((sum, d) => sum + d.total, 0))) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Delegacias com Maior Custo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top 5 Delegacias com Maior Custo
        </h3>
        <BarChart
          data={analises.top5Custos.map(d => ({
            name: d.nome,
            value: d.custos
          }))}
          label={formatCurrency}
          color="#ef4444"
        />
      </div>

      {/* Top 5 Departamentos por Efetivo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top 5 Departamentos por Efetivo
        </h3>
        <BarChart
          data={analises.top5Efetivo.map(([dept, efetivo]) => ({
            name: dept,
            value: efetivo
          }))}
          label={(value) => `${value} policiais`}
          color="#10b981"
        />
      </div>

      {/* Custos por Departamento */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Custos por Departamento
        </h3>
        <BarChart
          data={Object.entries(analises.custosPorDepartamento)
            .sort((a, b) => b[1] - a[1])
            .map(([dept, custo]) => ({
              name: dept,
              value: custo
            }))}
          label={formatCurrency}
          color="#8b5cf6"
        />
      </div>

      {/* Delegacias que Necessitam Aporte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">
            Delegacias - Aporte Necessário ({analises.comAporteNecessario.length})
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {analises.comAporteNecessario.map(d => (
              <div key={d.id} className="p-3 bg-red-50 rounded border-l-4 border-red-500">
                <div className="font-semibold text-gray-800 text-sm">{d.nome}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {d.departamento} | {d.efetivoPlanejado}
                </div>
                <div className="text-sm text-red-700 font-medium mt-1">
                  {formatCurrency(d.custos)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">
            Delegacias - Aporte a Definir ({analises.comAporteADefinir.length})
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {analises.comAporteADefinir.map(d => (
              <div key={d.id} className="p-3 bg-orange-50 rounded border-l-4 border-orange-500">
                <div className="font-semibold text-gray-800 text-sm">{d.nome}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {d.departamento} | {d.efetivoPlanejado}
                </div>
                <div className="text-sm text-orange-700 font-medium mt-1">
                  {formatCurrency(d.custos)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo Executivo */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-bold mb-4">Resumo Executivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-200 text-sm">Total de Delegacias</p>
            <p className="text-3xl font-bold mt-1">{planoCarnavalData.delegacias.length}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Custo Total Estimado</p>
            <p className="text-3xl font-bold mt-1">
              {formatCurrency(
                planoCarnavalData.delegacias.reduce((sum, d) => sum + d.custos, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-sm">Efetivo Total Planejado</p>
            <p className="text-3xl font-bold mt-1">
              {planoCarnavalData.delegacias.reduce(
                (sum, d) => sum + d.efetivoPolicial + d.efetivoExtra, 
                0
              )}
            </p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-800 bg-opacity-50 rounded">
          <p className="text-sm">
            ⚠️ <strong>Atenção:</strong> {analises.comAporteNecessario.length + analises.comAporteADefinir.length} delegacias 
            dependem de aporte financeiro para operação durante o Carnaval 2026.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardCarnaval2026;
