import React from 'react';
import { BarChart, Shield, Users, Target, Activity, TrendingUp } from 'lucide-react';

export function EstatisticasView({ operations, equipes, alvos, stats }) {
    const totalOperacoes = operations.length;
    const totalEquipes = equipes.length;
    const totalAlvos = alvos.length;
    const totalPoliciais = equipes.reduce((acc, eq) => {
        let count = eq.chefe ? 1 : 0;
        count += eq.membros ? eq.membros.length : 0;
        return acc + count;
    }, 0);
    
    const operacoesPorStatus = {
        rascunho: operations.filter(op => op.status === 'Rascunho').length,
        aguardando: operations.filter(op => op.status === 'Aguardando Aprovação').length,
        aprovadas: operations.filter(op => op.status === 'Aprovada pelo DTO').length,
        emExecucao: operations.filter(op => op.status === 'Em Execução').length,
        concluidas: operations.filter(op => op.status === 'Concluída').length,
        reprovadas: operations.filter(op => op.status === 'Reprovada pelo DTO').length
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center space-x-2">
                    <BarChart size={32} />
                    <span>Estatísticas do Sistema</span>
                </h2>
                <p className="text-purple-200">Painel administrativo com métricas e indicadores</p>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Shield size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{totalOperacoes}</span>
                    </div>
                    <h3 className="text-lg font-semibold">Total de Operações</h3>
                    <p className="text-blue-200 text-sm mt-1">Todas as operações cadastradas</p>
                </div>

                <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Users size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{totalEquipes}</span>
                    </div>
                    <h3 className="text-lg font-semibold">Equipes Cadastradas</h3>
                    <p className="text-green-200 text-sm mt-1">{totalPoliciais} policiais no total</p>
                </div>

                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Target size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{totalAlvos}</span>
                    </div>
                    <h3 className="text-lg font-semibold">Alvos Cadastrados</h3>
                    <p className="text-red-200 text-sm mt-1">Fichados no sistema</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Activity size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{operacoesPorStatus.emExecucao}</span>
                    </div>
                    <h3 className="text-lg font-semibold">Em Execução</h3>
                    <p className="text-yellow-200 text-sm mt-1">Operações ativas</p>
                </div>
            </div>

            {/* Operações por Status */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <TrendingUp size={24} className="text-cyan-400" />
                    <span>Operações por Status</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-400">{operacoesPorStatus.rascunho}</div>
                        <div className="text-sm text-gray-400 mt-1">Rascunho</div>
                    </div>
                    <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-600">
                        <div className="text-2xl font-bold text-yellow-400">{operacoesPorStatus.aguardando}</div>
                        <div className="text-sm text-yellow-400 mt-1">Aguardando</div>
                    </div>
                    <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
                        <div className="text-2xl font-bold text-green-400">{operacoesPorStatus.aprovadas}</div>
                        <div className="text-sm text-green-400 mt-1">Aprovadas</div>
                    </div>
                    <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-600">
                        <div className="text-2xl font-bold text-blue-400">{operacoesPorStatus.emExecucao}</div>
                        <div className="text-sm text-blue-400 mt-1">Em Execução</div>
                    </div>
                    <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-600">
                        <div className="text-2xl font-bold text-purple-400">{operacoesPorStatus.concluidas}</div>
                        <div className="text-sm text-purple-400 mt-1">Concluídas</div>
                    </div>
                    <div className="bg-red-900/30 p-4 rounded-lg border border-red-600">
                        <div className="text-2xl font-bold text-red-400">{operacoesPorStatus.reprovadas}</div>
                        <div className="text-sm text-red-400 mt-1">Reprovadas</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
