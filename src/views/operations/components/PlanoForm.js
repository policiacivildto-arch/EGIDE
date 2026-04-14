import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { DEPARTMENTS } from '../../../constants/data';

export function PlanoForm({ 
    planoForm, 
    setPlanoForm, 
    selectedOperationId,
    showNotification,
    setShowPlanoForm,
    setOperacoes,
    operacaoAtual
}) {
    const [isSaving, setIsSaving] = useState(false);

    // Preencher formulário automaticamente com dados da operação
    useEffect(() => {
        if (!operacaoAtual) return;

        const dataHoje = new Date().toISOString().split('T')[0];
        const planoSalvo = operacaoAtual.plano_operacional || operacaoAtual.planoOperacional || {};

        setPlanoForm((prev) => ({
            ...prev,
            ...planoSalvo,
            dataOperacao: planoSalvo.dataOperacao || operacaoAtual.data_inicio || dataHoje,
            horarioApresentacao: planoSalvo.horarioApresentacao || operacaoAtual.hora_inicio || '',
            ondeOcorrera: planoSalvo.ondeOcorrera || operacaoAtual.objetivo || '',
            delegacia: planoSalvo.delegacia || operacaoAtual.delegacia_responsavel || '',
            departamentoDemandante:
                planoSalvo.departamentoDemandante
                || operacaoAtual.departamento_solicitante
                || operacaoAtual.orgao_solicitante
                || '',
            localApresentacao: planoSalvo.localApresentacao || 'DTO - Departamento Técnico Operacional',
            dataEmissao: planoSalvo.dataEmissao || dataHoje,
        }));
    }, [operacaoAtual, selectedOperationId, setPlanoForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSaving(true);

        try {
            const djangoApi = (await import('../../../services/djangoApiAuth')).default;

            const planoPayload = {
                ...planoForm,
                dataHoraCriacao: planoForm.dataHoraCriacao || new Date().toISOString(),
                ultimaAtualizacao: new Date().toISOString(),
            };

            const operacaoAtualizada = await djangoApi.operacoes.update(selectedOperationId, {
                plano_operacional: planoPayload,
            });

            setOperacoes((prev) => prev.map((op) => {
                if (op.id !== selectedOperationId) return op;

                return {
                    ...op,
                    ...operacaoAtualizada,
                    plano_operacional: operacaoAtualizada.plano_operacional || planoPayload,
                    planoOperacional: operacaoAtualizada.plano_operacional || planoPayload,
                };
            }));

            showNotification('Plano Operacional salvo no backend com sucesso!', 'success');
            setShowPlanoForm(false);
        } catch (error) {
            showNotification(`Erro ao salvar plano operacional: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
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
                            <label className="block text-gray-300 mb-2">Nº do Plano *</label>
                            <input
                                type="text"
                                required
                                value={planoForm.numeroPlano || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, numeroPlano: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: 001/2026"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">NUP/OFÍCIO/EMAIL *</label>
                            <input
                                type="text"
                                required
                                value={planoForm.nupOficioEmail || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, nupOficioEmail: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: NUP 00000.000000/2026-00"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Tipo de Mandado</label>
                            <select
                                value={planoForm.tipoMandado || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, tipoMandado: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            >
                                <option value="">Selecione</option>
                                <option value="Busca e Apreensão">Busca e Apreensão</option>
                                <option value="Prisão Preventiva">Prisão Preventiva</option>
                                <option value="Prisão Temporária">Prisão Temporária</option>
                                <option value="Sequestro de Bens">Sequestro de Bens</option>
                                <option value="Sem Mandado">Sem Mandado</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
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
                            <label className="block text-gray-300 mb-2">Horário de Apresentação *</label>
                            <input
                                type="time"
                                required
                                value={planoForm.horarioApresentacao || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, horarioApresentacao: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Onde Ocorrerá *</label>
                            <input
                                type="text"
                                required
                                value={planoForm.ondeOcorrera || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, ondeOcorrera: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Local da operação"
                            />
                        </div>
                    </div>
                </div>

                {/* Informações Institucionais */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">🏛️ Informações Institucionais</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Delegacia *</label>
                            <select
                                required
                                value={planoForm.delegacia || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, delegacia: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            >
                                <option value="">Selecione a delegacia</option>
                                {planoForm.departamentoDemandante && DEPARTMENTS[planoForm.departamentoDemandante] ? (
                                    DEPARTMENTS[planoForm.departamentoDemandante].map((delegacia) => (
                                        <option key={delegacia} value={delegacia}>{delegacia}</option>
                                    ))
                                ) : (
                                    Object.keys(DEPARTMENTS).map((dept) => (
                                        <optgroup key={dept} label={dept}>
                                            {DEPARTMENTS[dept].map((delegacia) => (
                                                <option key={delegacia} value={delegacia}>{delegacia}</option>
                                            ))}
                                        </optgroup>
                                    ))
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Departamento Demandante *</label>
                            <select
                                required
                                value={planoForm.departamentoDemandante || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, departamentoDemandante: e.target.value, delegacia: '' })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            >
                                <option value="">Selecione o departamento</option>
                                {Object.keys(DEPARTMENTS).map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Diretor Demandante</label>
                            <input
                                type="text"
                                value={planoForm.diretorDemandante || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, diretorDemandante: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Nome do diretor demandante"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Local de Apresentação *</label>
                            <input
                                type="text"
                                required
                                value={planoForm.localApresentacao || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, localApresentacao: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: DTO - Departamento Técnico Operacional"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2">Departamentos Envolvidos</label>
                        <textarea
                            value={planoForm.departamentosEnvolvidos || ''}
                            onChange={(e) => setPlanoForm({ ...planoForm, departamentosEnvolvidos: e.target.value })}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 h-20"
                            placeholder="Liste todos os departamentos envolvidos separados por vírgula"
                        />
                    </div>
                </div>

                {/* Diretor e Data de Emissão */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">📝 Aprovação</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Diretor Responsável</label>
                            <input
                                type="text"
                                value={planoForm.diretor || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, diretor: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Nome do diretor responsável"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Data de Emissão *</label>
                            <input
                                type="date"
                                required
                                value={planoForm.dataEmissao || ''}
                                onChange={(e) => setPlanoForm({ ...planoForm, dataEmissao: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                    </div>
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
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold flex items-center space-x-2"
                    >
                        <FileText size={18} />
                        <span>{isSaving ? 'Salvando...' : '✓ Salvar e Gerar Documento'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
