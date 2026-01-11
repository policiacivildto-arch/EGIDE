import React from 'react';
import { FileText } from 'lucide-react';

export function PlanoForm({ 
    planoForm, 
    setPlanoForm, 
    selectedOperationId,
    showNotification,
    setShowPlanoForm,
    equipes,
    alvos,
    setOperacoes,
    operacoes
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Atualizar operação com o plano
        setOperacoes(operacoes.map(op => {
            if (op.id === selectedOperationId) {
                return {
                    ...op,
                    planoOperacional: {
                        ...planoForm,
                        dataHoraCriacao: new Date().toISOString()
                    }
                };
            }
            return op;
        }));
        
        showNotification('Plano Operacional salvo com sucesso!', 'success');
        setShowPlanoForm(false);
    };

    return (
        <div className="bg-gray-700 p-6 rounded-lg">
            <h4 className="text-lg font-bold text-white mb-4">📋 Plano Operacional</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Básicos */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">Informações Gerais</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Data da Operação *</label>
                            <input
                                type="date"
                                required
                                value={planoForm.dataOperacao || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, dataOperacao: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Horário Previsto *</label>
                            <input
                                type="time"
                                required
                                value={planoForm.horarioPrevisto || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, horarioPrevisto: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Objetivo */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">🎯 Objetivo da Operação</h5>
                    <textarea
                        required
                        value={planoForm.objetivo || ''}
                        onChange={(e) => setPlanoForm({ ...planoForm, objetivo: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 h-24"
                        placeholder="Descreva o objetivo principal da operação..."
                    />
                </div>

                {/* Estratégia */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">⚔️ Estratégia Operacional</h5>
                    <div>
                        <label className="block text-gray-300 mb-2">Tipo de Abordagem</label>
                        <select
                            value={planoForm.tipoAbordagem || ''}
                            onChange={(e) => setPlanoForm({ ...planoForm, tipoAbordagem: e.target.value })}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                        >
                            <option value="">Selecione</option>
                            <option value="Cerco e Busca">Cerco e Busca</option>
                            <option value="Abordagem Direta">Abordagem Direta</option>
                            <option value="Vigilância e Captura">Vigilância e Captura</option>
                            <option value="Mandado de Busca">Mandado de Busca e Apreensão</option>
                            <option value="Patrulhamento">Patrulhamento Ostensivo</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2">Descrição da Estratégia</label>
                        <textarea
                            value={planoForm.estrategia || ''}
                            onChange={(e) => setPlanoForm({ ...planoForm, estrategia: e.target.value })}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 h-32"
                            placeholder="Detalhe a estratégia: rotas, pontos de apoio, táticas específicas..."
                        />
                    </div>
                </div>

                {/* Equipes Designadas */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">👥 Equipes Designadas</h5>
                    <div className="space-y-2">
                        {equipes.filter(e => e.operacaoId === selectedOperationId).length > 0 ? (
                            equipes.filter(e => e.operacaoId === selectedOperationId).map(equipe => (
                                <div key={equipe.id} className="flex items-center space-x-3 bg-gray-700 p-3 rounded">
                                    <input
                                        type="checkbox"
                                        checked={planoForm.equipesDesignadas?.includes(equipe.id) || false}
                                        onChange={(e) => {
                                            const equipesDesignadas = planoForm.equipesDesignadas || [];
                                            if (e.target.checked) {
                                                setPlanoForm({ 
                                                    ...planoForm, 
                                                    equipesDesignadas: [...equipesDesignadas, equipe.id] 
                                                });
                                            } else {
                                                setPlanoForm({ 
                                                    ...planoForm, 
                                                    equipesDesignadas: equipesDesignadas.filter(id => id !== equipe.id) 
                                                });
                                            }
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white">
                                        {equipe.departamento} {equipe.delegacia && `- ${equipe.delegacia}`} 
                                        {' '}(Líder: {equipe.chefe})
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic">Nenhuma equipe cadastrada para esta operação</p>
                        )}
                    </div>
                </div>

                {/* Alvos Prioritários */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">🎯 Alvos Prioritários</h5>
                    <div className="space-y-2">
                        {alvos.filter(a => a.operacaoId === selectedOperationId).length > 0 ? (
                            alvos.filter(a => a.operacaoId === selectedOperationId).map(alvo => (
                                <div key={alvo.id} className="flex items-center space-x-3 bg-gray-700 p-3 rounded">
                                    <input
                                        type="checkbox"
                                        checked={planoForm.alvosPrioritarios?.includes(alvo.id) || false}
                                        onChange={(e) => {
                                            const alvosPrioritarios = planoForm.alvosPrioritarios || [];
                                            if (e.target.checked) {
                                                setPlanoForm({ 
                                                    ...planoForm, 
                                                    alvosPrioritarios: [...alvosPrioritarios, alvo.id] 
                                                });
                                            } else {
                                                setPlanoForm({ 
                                                    ...planoForm, 
                                                    alvosPrioritarios: alvosPrioritarios.filter(id => id !== alvo.id) 
                                                });
                                            }
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white">
                                        {alvo.nome} {alvo.vulgo && `"${alvo.vulgo}"`}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 italic">Nenhum alvo cadastrado para esta operação</p>
                        )}
                    </div>
                </div>

                {/* Recursos Necessários */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">🛠️ Recursos Necessários</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={planoForm.recursos?.apoioTatico || false}
                                    onChange={(e) => setPlanoForm({ 
                                        ...planoForm, 
                                        recursos: { ...planoForm.recursos, apoioTatico: e.target.checked }
                                    })}
                                    className="w-4 h-4"
                                />
                                <span className="text-gray-300">Apoio Tático (GOE/BOPE)</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={planoForm.recursos?.caoFarejador || false}
                                    onChange={(e) => setPlanoForm({ 
                                        ...planoForm, 
                                        recursos: { ...planoForm.recursos, caoFarejador: e.target.checked }
                                    })}
                                    className="w-4 h-4"
                                />
                                <span className="text-gray-300">Cão Farejador</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={planoForm.recursos?.drones || false}
                                    onChange={(e) => setPlanoForm({ 
                                        ...planoForm, 
                                        recursos: { ...planoForm.recursos, drones: e.target.checked }
                                    })}
                                    className="w-4 h-4"
                                />
                                <span className="text-gray-300">Drones</span>
                            </label>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={planoForm.recursos?.ambulancia || false}
                                    onChange={(e) => setPlanoForm({ 
                                        ...planoForm, 
                                        recursos: { ...planoForm.recursos, ambulancia: e.target.checked }
                                    })}
                                    className="w-4 h-4"
                                />
                                <span className="text-gray-300">Ambulância</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Riscos e Medidas de Segurança */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">⚠️ Riscos e Medidas de Segurança</h5>
                    <div>
                        <label className="block text-gray-300 mb-2">Riscos Identificados</label>
                        <textarea
                            value={planoForm.riscos || ''}
                            onChange={(e) => setPlanoForm({ ...planoForm, riscos: e.target.value })}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 h-20"
                            placeholder="Descreva os riscos envolvidos..."
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2">Medidas de Segurança</label>
                        <textarea
                            value={planoForm.medidasSeguranca || ''}
                            onChange={(e) => setPlanoForm({ ...planoForm, medidasSeguranca: e.target.value })}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 h-20"
                            placeholder="Detalhe as medidas de segurança..."
                        />
                    </div>
                </div>

                {/* Observações */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">📝 Observações</h5>
                    <textarea
                        value={planoForm.observacoes || ''}
                        onChange={(e) => setPlanoForm({ ...planoForm, observacoes: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 h-24"
                        placeholder="Informações adicionais relevantes..."
                    />
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => setShowPlanoForm(false)}
                        className="bg-gray-500 hover:bg-gray-600 px-6 py-2 rounded text-white"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold"
                    >
                        ✓ Salvar Plano Operacional
                    </button>
                </div>
            </form>
        </div>
    );
}
