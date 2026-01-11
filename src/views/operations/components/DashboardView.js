import React from 'react';
import { Calendar, ChevronRight, TrendingUp, Clock, CheckCircle, Activity, Target } from 'lucide-react';

const StatCard = ({ icon, title, value, color, textColor }) => (
    <div className={`${color} rounded-lg p-6 border border-gray-600`}>
        <div className="flex items-center justify-between mb-2">
            {icon}
            <TrendingUp size={20} className="text-gray-400" />
        </div>
        <h3 className="text-gray-300 text-sm mb-1">{title}</h3>
        <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
    </div>
);

const getStatusColor = (status) => {
    const colors = {
        'Rascunho': 'bg-gray-500 text-white',
        'Aguardando Aprovação': 'bg-yellow-500 text-black',
        'Aprovada pelo DTO': 'bg-green-500 text-white',
        'Reprovada pelo DTO': 'bg-red-500 text-white',
        'Em Execução': 'bg-blue-500 text-white',
        'Concluída': 'bg-gray-600 text-white',
    };
    return colors[status] || 'bg-gray-500 text-white';
};

export function DashboardView({ stats, operations, setSelectedOperation, setActiveView }) {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white mb-6">Dashboard de Operações</h2>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Clock size={32} className="text-yellow-400" />}
                    title="Aguardando Aprovação"
                    value={stats.aguardandoAprovacao}
                    color="bg-yellow-500/20"
                    textColor="text-yellow-400"
                />
                <StatCard
                    icon={<CheckCircle size={32} className="text-green-400" />}
                    title="Operações Aprovadas"
                    value={stats.aprovadas}
                    color="bg-green-500/20"
                    textColor="text-green-400"
                />
                <StatCard
                    icon={<Activity size={32} className="text-blue-400" />}
                    title="Em Execução"
                    value={stats.emExecucao}
                    color="bg-blue-500/20"
                    textColor="text-blue-400"
                />
                <StatCard
                    icon={<Target size={32} className="text-purple-400" />}
                    title="Concluídas"
                    value={stats.concluidas}
                    color="bg-purple-500/20"
                    textColor="text-purple-400"
                />
            </div>

            {/* Tabela de Operações da Semana */}
            <div className="bg-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                        <Calendar size={24} />
                        <span>Operações da Semana</span>
                    </h3>
                    <button className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1">
                        <span>Ver todas</span>
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-600 text-left text-gray-400 text-sm">
                                <th className="pb-3">Operação</th>
                                <th className="pb-3">Departamento</th>
                                <th className="pb-3">Data/Hora</th>
                                <th className="pb-3">Equipes</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operations.map((op) => (
                                <tr key={op.id} className="border-b border-gray-600 hover:bg-gray-600 transition-colors">
                                    <td className="py-4 text-white font-semibold">{op.nome}</td>
                                    <td className="py-4 text-gray-300">{op.departamento_solicitante_sigla}</td>
                                    <td className="py-4 text-gray-300 text-sm">
                                        {new Date(op.data_hora_inicio).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="py-4 text-gray-300">{op.total_equipes}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(op.status)}`}>
                                            {op.status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <button
                                            onClick={() => {
                                                setSelectedOperation(op);
                                                setActiveView('detail');
                                            }}
                                            className="text-cyan-400 hover:text-cyan-300 text-sm"
                                        >
                                            Ver detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
