import React from 'react';
import { Target } from 'lucide-react';

export function AlvoForm({ 
    alvoForm, 
    setAlvoForm, 
    alvos, 
    setAlvos, 
    selectedOperationId,
    showNotification,
    setShowAlvoForm 
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const novoAlvo = {
            id: Date.now(),
            operacaoId: selectedOperationId,
            nome: alvoForm.nome,
            vulgo: alvoForm.vulgo || '',
            cpf: alvoForm.cpf || '',
            foto: alvoForm.foto || null,
            envolvimento: alvoForm.envolvimento || '',
            mandado: alvoForm.mandado || false,
            numeroInquerito: alvoForm.numeroInquerito || '',
            dataFatos: alvoForm.dataFatos || '',
            artigo: alvoForm.artigo || '',
            endereco: alvoForm.endereco || '',
            bairro: alvoForm.bairro || '',
            cidade: alvoForm.cidade || '',
            referencia: alvoForm.referencia || '',
            informacoesAdicionais: alvoForm.informacoesAdicionais || '',
            status: 'pendente'
        };
        
        setAlvos([...alvos, novoAlvo]);
        showNotification('Alvo adicionado com sucesso!', 'success');
        setShowAlvoForm(false);
        setAlvoForm({ nome: '', vulgo: '', cpf: '', foto: null, envolvimento: '', mandado: false });
    };

    return (
        <div className="bg-gray-700 p-6 rounded-lg">
            <h4 className="text-lg font-bold text-white mb-4">🎯 Cadastrar Novo Alvo</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Identificação */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">Identificação do Alvo</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Nome Completo *</label>
                            <input
                                type="text"
                                required
                                value={alvoForm.nome}
                                onChange={(e) => setAlvoForm({ ...alvoForm, nome: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Nome completo do alvo"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Vulgo/Alcunha</label>
                            <input
                                type="text"
                                value={alvoForm.vulgo}
                                onChange={(e) => setAlvoForm({ ...alvoForm, vulgo: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: Zé Pequeno"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">CPF</label>
                            <input
                                type="text"
                                value={alvoForm.cpf}
                                onChange={(e) => setAlvoForm({ ...alvoForm, cpf: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="000.000.000-00"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Foto do Alvo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setAlvoForm({ ...alvoForm, foto: e.target.files[0] })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Envolvimento Criminal */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">Envolvimento Criminal</h5>
                    <div>
                        <label className="block text-gray-300 mb-2">Tipo de Envolvimento</label>
                        <select
                            value={alvoForm.envolvimento}
                            onChange={(e) => setAlvoForm({ ...alvoForm, envolvimento: e.target.value })}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                        >
                            <option value="">Selecione o tipo</option>
                            <option value="Tráfico de Drogas">Tráfico de Drogas</option>
                            <option value="Roubo">Roubo</option>
                            <option value="Furto">Furto</option>
                            <option value="Homicídio">Homicídio</option>
                            <option value="Latrocínio">Latrocínio</option>
                            <option value="Extorsão">Extorsão</option>
                            <option value="Associação Criminosa">Associação Criminosa</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={alvoForm.mandado}
                            onChange={(e) => setAlvoForm({ ...alvoForm, mandado: e.target.checked })}
                            className="w-5 h-5"
                        />
                        <label className="text-gray-300">Possui Mandado de Prisão</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Nº Inquérito Policial</label>
                            <input
                                type="text"
                                value={alvoForm.numeroInquerito}
                                onChange={(e) => setAlvoForm({ ...alvoForm, numeroInquerito: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: 001/2024"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Data dos Fatos</label>
                            <input
                                type="date"
                                value={alvoForm.dataFatos}
                                onChange={(e) => setAlvoForm({ ...alvoForm, dataFatos: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Artigo Penal</label>
                            <input
                                type="text"
                                value={alvoForm.artigo}
                                onChange={(e) => setAlvoForm({ ...alvoForm, artigo: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: Art. 157 CP"
                            />
                        </div>
                    </div>
                </div>

                {/* Localização */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">📍 Localização</h5>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Endereço</label>
                            <input
                                type="text"
                                value={alvoForm.endereco}
                                onChange={(e) => setAlvoForm({ ...alvoForm, endereco: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Rua, Número, Complemento"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2">Bairro</label>
                                <input
                                    type="text"
                                    value={alvoForm.bairro}
                                    onChange={(e) => setAlvoForm({ ...alvoForm, bairro: e.target.value })}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Cidade</label>
                                <input
                                    type="text"
                                    value={alvoForm.cidade}
                                    onChange={(e) => setAlvoForm({ ...alvoForm, cidade: e.target.value })}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Ponto de Referência</label>
                            <input
                                type="text"
                                value={alvoForm.referencia}
                                onChange={(e) => setAlvoForm({ ...alvoForm, referencia: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: Próximo ao mercado X"
                            />
                        </div>
                    </div>
                </div>

                {/* Informações Adicionais */}
                <div className="bg-gray-600 p-4 rounded-lg space-y-4">
                    <h5 className="font-semibold text-white">Informações Adicionais</h5>
                    <textarea
                        value={alvoForm.informacoesAdicionais}
                        onChange={(e) => setAlvoForm({ ...alvoForm, informacoesAdicionais: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 h-24"
                        placeholder="Características físicas, veículos, contatos, etc."
                    />
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => setShowAlvoForm(false)}
                        className="bg-gray-500 hover:bg-gray-600 px-6 py-2 rounded text-white"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-semibold"
                    >
                        ✓ Adicionar Alvo
                    </button>
                </div>
            </form>
        </div>
    );
}
