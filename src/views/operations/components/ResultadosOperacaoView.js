import React, { useState } from 'react';
import { FileText, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

export function ResultadosOperacaoView({
    operations,
    isPolicialOperacional,
    equipesDoPolicialAtual,
    resultadosOperacao,
    setResultadosOperacao,
    showNotification
}) {
    const [selectedOperationResultado, setSelectedOperationResultado] = useState(null);

    let operacoesParaRelatorio = operations.filter(op =>
        op.status === 'Aprovada pelo DTO' || op.status === 'Em Execução'
    );

    if (isPolicialOperacional) {
        operacoesParaRelatorio = operacoesParaRelatorio.filter(op =>
            equipesDoPolicialAtual.some(eq => eq.operacaoId === op.id)
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
                    <FileText className="text-cyan-400" size={28} />
                    <span>Relatório</span>
                </h2>
                <p className="text-gray-400 mb-6">Confirmação dos resultados da operação</p>

                {operacoesParaRelatorio.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhuma operação disponível para relatório</p>
                    </div>
                ) : !selectedOperationResultado ? (
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white mb-4">Selecione uma Operação:</h3>
                        {operacoesParaRelatorio.map(operacao => {
                            const temResultados = resultadosOperacao[operacao.id];

                            return (
                                <div
                                    key={operacao.id}
                                    onClick={() => setSelectedOperationResultado(operacao.id)}
                                    className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg p-5 cursor-pointer hover:from-cyan-900 hover:to-cyan-800 transition-all border-l-4 border-cyan-500"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-1">
                                                Operação: {operacao.titulo || operacao.nome}
                                            </h3>
                                            <p className="text-sm text-gray-300">
                                                {operacao.departamento_solicitante_sigla || operacao.departamento} | {new Date(operacao.data_hora_inicio).toLocaleDateString('pt-BR')}
                                            </p>
                                            <div className="flex items-center space-x-3 mt-3">
                                                <span className={`px-3 py-1 rounded text-xs font-semibold ${
                                                    operacao.status === 'Em Execução'
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-blue-600 text-white'
                                                }`}>
                                                    {operacao.status}
                                                </span>
                                                {temResultados && (
                                                    <span className="bg-green-600 px-2 py-1 rounded text-xs flex items-center space-x-1">
                                                        <CheckCircle size={14} />
                                                        <span>Resultados Registrados</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-cyan-400">
                                            <ArrowRight size={32} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div>
                        <button
                            onClick={() => setSelectedOperationResultado(null)}
                            className="mb-4 text-cyan-300 hover:text-white flex items-center space-x-2"
                        >
                            <ArrowLeft size={20} />
                            <span>Voltar para lista de operações</span>
                        </button>

                        <div className="bg-gray-900/60 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                                <CheckCircle size={24} className="text-green-400" />
                                <span>Registrar Resultados da Operação</span>
                            </h3>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);

                                const resultados = {
                                    operacaoId: selectedOperationResultado,
                                    mpCumpridos: Number.parseInt(formData.get('mpCumpridos') || 0, 10),
                                    mpDiligenciados: Number.parseInt(formData.get('mpDiligenciados') || 0, 10),
                                    flagrante: Number.parseInt(formData.get('flagrante') || 0, 10),
                                    buscaCumpridos: Number.parseInt(formData.get('buscaCumpridos') || 0, 10),
                                    mbaDiligenciados: Number.parseInt(formData.get('mbaDiligenciados') || 0, 10),
                                    qtdCelular: Number.parseInt(formData.get('qtdCelular') || 0, 10),
                                    qtdVeiculo: Number.parseInt(formData.get('qtdVeiculo') || 0, 10),
                                    qtdMunicoes: Number.parseInt(formData.get('qtdMunicoes') || 0, 10),
                                    qtdArma: Number.parseInt(formData.get('qtdArma') || 0, 10),
                                    dinheiro: Number.parseFloat(formData.get('dinheiro') || 0),
                                    medidasCautelares: Number.parseInt(formData.get('medidasCautelares') || 0, 10),
                                    droga: formData.get('droga') || '',
                                    observacoes: formData.get('observacoes') || '',
                                    timestamp: new Date().toISOString()
                                };

                                setResultadosOperacao({
                                    ...resultadosOperacao,
                                    [selectedOperationResultado]: resultados
                                });

                                showNotification('Resultados salvos com sucesso!', 'success');
                            }}>
                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-cyan-400 mb-4">Mandados e Prisões</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">MP Cumpridos</label><input type="number" name="mpCumpridos" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.mpCumpridos || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">MP Diligenciados</label><input type="number" name="mpDiligenciados" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.mpDiligenciados || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Flagrante</label><input type="number" name="flagrante" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.flagrante || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Busca Cumpridos</label><input type="number" name="buscaCumpridos" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.buscaCumpridos || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">MBA Diligenciados</label><input type="number" name="mbaDiligenciados" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.mbaDiligenciados || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Medidas Cautelares</label><input type="number" name="medidasCautelares" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.medidasCautelares || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-lg font-semibold text-cyan-400 mb-4">Apreensões</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Quantidade de Celulares</label><input type="number" name="qtdCelular" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.qtdCelular || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Quantidade de Veículos</label><input type="number" name="qtdVeiculo" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.qtdVeiculo || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Quantidade de Munições</label><input type="number" name="qtdMunicoes" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.qtdMunicoes || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Quantidade de Armas</label><input type="number" name="qtdArma" min="0" defaultValue={resultadosOperacao[selectedOperationResultado]?.qtdArma || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Dinheiro (R$)</label><input type="number" name="dinheiro" min="0" step="0.01" defaultValue={resultadosOperacao[selectedOperationResultado]?.dinheiro || 0} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                        <div><label className="block text-sm font-medium text-gray-300 mb-2">Droga</label><input type="text" name="droga" placeholder="Ex: 5kg cocaína, 2kg maconha" defaultValue={resultadosOperacao[selectedOperationResultado]?.droga || ''} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" /></div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                                    <textarea name="observacoes" rows="4" placeholder="Descreva os detalhes da diligência..." defaultValue={resultadosOperacao[selectedOperationResultado]?.observacoes || ''} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                                </div>

                                <button type="submit" className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white font-semibold">
                                    Salvar Resultados
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
