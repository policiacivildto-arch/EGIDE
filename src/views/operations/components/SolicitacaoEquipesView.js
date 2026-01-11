import React, { useState } from 'react';
import { Users, Send, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ORGANOGRAMA, ORGAOS_EXTERNOS } from '../../../constants/data';

/**
 * SolicitacaoEquipesView - Componente para DTO solicitar equipes de outros departamentos
 * e para departamentos responderem às solicitações
 */
export function SolicitacaoEquipesView({ 
    isDTO, 
    userDept, 
    operations, 
    solicitacoes = [], 
    onEnviarSolicitacao, 
    onResponderSolicitacao,
    showNotification 
}) {
    const [showNovaForm, setShowNovaForm] = useState(false);
    const [formSolicitacao, setFormSolicitacao] = useState({
        operacao_id: '',
        departamento_destino: '',
        data_necessaria: '',
        horario_inicio: '',
        horario_fim: '',
        quantidade_dpc: 0,
        quantidade_oip: 0,
        descricao: '',
        local_apresentacao: ''
    });

    const [respostaForm, setRespostaForm] = useState({});

    // Filtrar operações aprovadas para vincular solicitações
    const operacoesAprovadas = operations.filter(op => 
        op.status === 'Aprovada' || op.status === 'Aprovada pelo DTO'
    );

    // Filtrar solicitações relevantes
    const minhasSolicitacoes = isDTO 
        ? solicitacoes.filter(s => s.enviado_por === 'DTO')
        : solicitacoes.filter(s => s.departamento_destino === userDept);

    const handleEnviarSolicitacao = (e) => {
        e.preventDefault();
        
        if (!formSolicitacao.operacao_id || !formSolicitacao.departamento_destino) {
            showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const novaSolicitacao = {
            id: Date.now(),
            ...formSolicitacao,
            enviado_por: 'DTO',
            status: 'Pendente',
            data_envio: new Date().toISOString(),
            operacao_nome: operations.find(op => op.id === parseInt(formSolicitacao.operacao_id))?.nome || ''
        };

        onEnviarSolicitacao(novaSolicitacao);
        showNotification('Solicitação enviada com sucesso!', 'success');
        
        // Resetar formulário
        setFormSolicitacao({
            operacao_id: '',
            departamento_destino: '',
            data_necessaria: '',
            horario_inicio: '',
            horario_fim: '',
            quantidade_dpc: 0,
            quantidade_oip: 0,
            descricao: '',
            local_apresentacao: ''
        });
        setShowNovaForm(false);
    };

    const handleResponderSolicitacao = (solicitacaoId, status, equipes = []) => {
        onResponderSolicitacao(solicitacaoId, {
            status,
            equipes,
            respondido_em: new Date().toISOString(),
            respondido_por: userDept
        });
        
        showNotification(
            status === 'Aceita' ? 'Solicitação aceita e equipes enviadas!' : 'Solicitação recusada',
            status === 'Aceita' ? 'success' : 'warning'
        );
    };

    const departamentosDisponiveis = Object.keys(ORGANOGRAMA).filter(dept => 
        dept !== 'DTO' && dept !== 'COGEP' && dept !== 'COTIC' && 
        dept !== 'COLOG' && dept !== 'CODIP' && dept !== 'GAB' && dept !== 'CORE'
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Users size={32} className="text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {isDTO ? 'Solicitar Equipes de Apoio' : 'Solicitações Recebidas'}
                            </h2>
                            <p className="text-blue-100">
                                {isDTO 
                                    ? 'Envie solicitações de equipes para outros departamentos'
                                    : 'Responda às solicitações de apoio do DTO'}
                            </p>
                        </div>
                    </div>
                    {isDTO && (
                        <button
                            onClick={() => setShowNovaForm(!showNovaForm)}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
                        >
                            <Send size={20} />
                            <span>Nova Solicitação</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Formulário de Nova Solicitação (DTO) */}
            {isDTO && showNovaForm && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">📝 Nova Solicitação de Equipes</h3>
                    <form onSubmit={handleEnviarSolicitacao} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-gray-300 mb-2">Operação *</label>
                                <select
                                    required
                                    value={formSolicitacao.operacao_id}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, operacao_id: e.target.value})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                >
                                    <option value="">Selecione a operação</option>
                                    {operacoesAprovadas.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.nome} - {new Date(op.data_hora_inicio).toLocaleDateString('pt-BR')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Departamento Destino *</label>
                                <select
                                    required
                                    value={formSolicitacao.departamento_destino}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, departamento_destino: e.target.value})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                >
                                    <option value="">Selecione o departamento</option>
                                    {departamentosDisponiveis.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Data Necessária *</label>
                                <input
                                    type="date"
                                    required
                                    value={formSolicitacao.data_necessaria}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, data_necessaria: e.target.value})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Horário Início *</label>
                                <input
                                    type="time"
                                    required
                                    value={formSolicitacao.horario_inicio}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, horario_inicio: e.target.value})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Horário Fim *</label>
                                <input
                                    type="time"
                                    required
                                    value={formSolicitacao.horario_fim}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, horario_fim: e.target.value})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Quantidade DPC</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formSolicitacao.quantidade_dpc}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, quantidade_dpc: parseInt(e.target.value) || 0})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Quantidade OIP</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formSolicitacao.quantidade_oip}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, quantidade_oip: parseInt(e.target.value) || 0})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-gray-300 mb-2">Local de Apresentação</label>
                                <input
                                    type="text"
                                    value={formSolicitacao.local_apresentacao}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, local_apresentacao: e.target.value})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    placeholder="Ex: CISP - Polícia Civil"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-gray-300 mb-2">Descrição/Observações</label>
                                <textarea
                                    rows="3"
                                    value={formSolicitacao.descricao}
                                    onChange={(e) => setFormSolicitacao({...formSolicitacao, descricao: e.target.value})}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    placeholder="Detalhes da solicitação..."
                                />
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowNovaForm(false)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded text-white font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold"
                            >
                                Enviar Solicitação
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de Solicitações */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-700 border-b border-gray-600">
                    <h3 className="text-lg font-bold text-white">
                        {isDTO ? 'Solicitações Enviadas' : 'Solicitações Recebidas'}
                        <span className="ml-2 text-sm text-gray-400">
                            ({minhasSolicitacoes.length})
                        </span>
                    </h3>
                </div>

                {minhasSolicitacoes.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhuma solicitação encontrada</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-700">
                        {minhasSolicitacoes.map(sol => (
                            <div key={sol.id} className="p-4 hover:bg-gray-750 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h4 className="text-lg font-semibold text-white">
                                                {sol.operacao_nome}
                                            </h4>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                sol.status === 'Pendente' ? 'bg-yellow-500/20 text-yellow-300' :
                                                sol.status === 'Aceita' ? 'bg-green-500/20 text-green-300' :
                                                'bg-red-500/20 text-red-300'
                                            }`}>
                                                {sol.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-300 mb-3">
                                            <div className="flex items-center space-x-2">
                                                <Calendar size={16} className="text-blue-400" />
                                                <span>{new Date(sol.data_necessaria).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Clock size={16} className="text-blue-400" />
                                                <span>{sol.horario_inicio} - {sol.horario_fim}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Users size={16} className="text-blue-400" />
                                                <span>DPC: {sol.quantidade_dpc} | OIP: {sol.quantidade_oip}</span>
                                            </div>
                                        </div>

                                        {sol.local_apresentacao && (
                                            <p className="text-sm text-gray-400 mb-2">
                                                📍 {sol.local_apresentacao}
                                            </p>
                                        )}

                                        {sol.descricao && (
                                            <p className="text-sm text-gray-400 mb-2">
                                                💬 {sol.descricao}
                                            </p>
                                        )}

                                        <div className="text-xs text-gray-500">
                                            {isDTO ? (
                                                <>Enviada para: <span className="text-blue-400">{sol.departamento_destino}</span></>
                                            ) : (
                                                <>Enviada por: <span className="text-blue-400">DTO</span></>
                                            )}
                                            {' • '}
                                            {new Date(sol.data_envio).toLocaleString('pt-BR')}
                                        </div>
                                    </div>

                                    {/* Ações para Departamentos */}
                                    {!isDTO && sol.status === 'Pendente' && (
                                        <div className="flex space-x-2 ml-4">
                                            <button
                                                onClick={() => handleResponderSolicitacao(sol.id, 'Aceita', [])}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center space-x-2"
                                            >
                                                <CheckCircle size={18} />
                                                <span>Aceitar</span>
                                            </button>
                                            <button
                                                onClick={() => handleResponderSolicitacao(sol.id, 'Recusada', [])}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center space-x-2"
                                            >
                                                <XCircle size={18} />
                                                <span>Recusar</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
