import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../config/api';
import { Modal, LoadingSpinner } from '../../../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { displayMatricula } from '../../../utils/helpers';

const MOCK_PROFILE_EMAIL = 'kleverdpc@gmail.com';

const createMockConvoyForProfile = () => ({
    id: 'mock-convoy-kleverdpc',
    numeroComboio: 'MOCK-01',
    date: '2026-02-20',
    ais: 'AIS 5',
    bairros: ['Centro', 'Aldeota'],
});

const createMockConvoyToFillForProfile = () => ({
    id: 'mock-convoy-kleverdpc-fill',
    numeroComboio: 'MOCK-02',
    date: '2026-02-21',
    ais: 'AIS 6',
    bairros: ['Parangaba', 'Maraponga'],
});

const createMockReportForProfile = (user) => ({
    id: 'mock-report-kleverdpc',
    convoyId: 'mock-convoy-kleverdpc',
    submittedAt: new Date().toISOString(),
    cycleId: getCycleId(),
    departamento: user?.departamento || 'DPO',
    delegacia: user?.delegacia || 'DTO',
    procedimentoEscolta: '2026/000001',
    homicidiosAIS: false,
    abordagens: { pessoas: 12, veiculos: 4 },
    prisoes: [{ tipo: 'Prisões', quantidade: 1 }],
    procedimentos: { boc: 2, tco: 1, apf: 1 },
    apreensoes: {
        celulares: 3,
        veiculos: 1,
        armas: [{ tipo: 'Armas', quantidade: 1 }],
        municoes: [{ tipo: 'Munições', quantidade: 18 }],
        drogas: [{ tipo: 'Drogas', quantidade: 2 }],
        outros: 'Mock de visualização para perfil sem operações reais.',
    },
});

const getCycleId = (date = new Date()) => {
    const day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    if (day > 20) {
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }
    return `${year}-${String(month).padStart(2, '0')}`;
};

const OperationReportForm = ({ convoy, user, onSubmit, onCancel }) => {
    const [form, setForm] = useState({
        procedimentoEscolta: '',
        homicidiosAIS: '',
        abordagensPessoas: '',
        abordagensVeiculos: '',
        abordagensMotocicletas: '',
        abordagensBicicletas: '',
        mandadosDiligenciados: '',
        conducoesAveriguacao: '',
        procedimentoBocNumero: '',
        procedimentoTcoNumero: '',
        procedimentoApfNumero: '',
        procedimentosBocList: [],
        procedimentosTcoList: [],
        procedimentosApfList: [],
        apreensoesCelulares: '',
        apreensoesValores: '',
        apreensoesVeiculos: '',
        apreensoesMotocicletas: '',
        apreensoesOutros: '',
        armaTipo: '',
        armaQuantidade: '1',
        armasList: [],
        municaoTipo: '',
        municaoQuantidade: '1',
        municoesList: [],
        drogaTipo: '',
        drogaQuantidade: '1',
        drogasList: [],
        prisaoTipo: '',
        prisaoQuantidade: '1',
        prisoesList: [],
        escoltaDescricao: '',
        escoltaQuantidade: '1',
        escoltasList: []
    });

    const toNumber = (value) => (value === '' || value === null || value === undefined ? 0 : Number(value));

    const addListItem = (listField, item) => {
        if (!item || !item.tipo) return false;
        setForm((prev) => ({
            ...prev,
            [listField]: [...(prev[listField] || []), item],
        }));
        return true;
    };

    const removeListItem = (listField, indexToRemove) => {
        setForm((prev) => ({
            ...prev,
            [listField]: (prev[listField] || []).filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const reportData = {
            convoyId: convoy.id,
            submittedAt: new Date(),
            cycleId: getCycleId(),
            departamento: user?.departamento || user?.departamento_nome || '',
            delegacia: user?.delegacia || user?.delegacia_nome || '',
            procedimentoEscolta: form.procedimentoEscolta || '',
            homicidiosAIS: form.homicidiosAIS === 'sim' ? true : form.homicidiosAIS === 'nao' ? false : null,
            abordagens: {
                pessoas: toNumber(form.abordagensPessoas),
                veiculos: toNumber(form.abordagensVeiculos),
                motocicletas: toNumber(form.abordagensMotocicletas),
                bicicletas: toNumber(form.abordagensBicicletas)
            },
            mandadosPrisaoDiligenciados: toNumber(form.mandadosDiligenciados),
            prisoes: form.prisoesList || [],
            conducoesAveriguacao: toNumber(form.conducoesAveriguacao),
            escoltas: form.escoltasList || [],
            procedimentos: {
                boc: form.procedimentosBocList || [],
                tco: form.procedimentosTcoList || [],
                apf: form.procedimentosApfList || [],
                bocTotal: (form.procedimentosBocList || []).length,
                tcoTotal: (form.procedimentosTcoList || []).length,
                apfTotal: (form.procedimentosApfList || []).length,
            },
            apreensoes: {
                celulares: toNumber(form.apreensoesCelulares),
                valores: toNumber(form.apreensoesValores),
                veiculos: toNumber(form.apreensoesVeiculos),
                motocicletas: toNumber(form.apreensoesMotocicletas),
                armas: form.armasList || [],
                municoes: form.municoesList || [],
                drogas: form.drogasList || [],
                outros: form.apreensoesOutros || ''
            },
            ais: convoy.ais || '',
            bairros: Array.isArray(convoy.bairros) ? convoy.bairros : [],
            submittedBy: {
                nome: user?.nome || '',
                matricula: user?.matricula || '',
                email: user?.email || ''
            }
        };
        onSubmit(reportData);
    };

    return (
        <Modal onClose={onCancel} size="5xl" contentClassName="bg-gray-900 border border-gray-700 p-0">
            <div className="p-6 text-white bg-gray-900 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-4">Preencher Relatório</h3>
                <p className="text-sm text-gray-400 mb-6">Comboio {convoy.numeroComboio || ''} - {(typeof convoy.date === 'string' ? new Date(convoy.date) : new Date(convoy.date.seconds * 1000)).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-cyan-300 mb-6">Relatório de Resultado da Operação | Data: {(typeof convoy.date === 'string' ? new Date(convoy.date) : new Date(convoy.date.seconds * 1000)).toLocaleDateString('pt-BR')} | AIS: {convoy.ais || 'N/A'}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Número do procedimento (escolta de preso)</label>
                            <input
                                type="text"
                                value={form.procedimentoEscolta}
                                onChange={(e) => setForm(prev => ({ ...prev, procedimentoEscolta: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                placeholder="Ex: 2026/000123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Homicídios na AIS de atuação</label>
                            <select
                                value={form.homicidiosAIS}
                                onChange={(e) => setForm(prev => ({ ...prev, homicidiosAIS: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                            >
                                <option value="">Selecione</option>
                                <option value="sim">Sim</option>
                                <option value="nao">Não</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">1. Abordagens</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Pessoas</label>
                                <input
                                    type="number"
                                    value={form.abordagensPessoas}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensPessoas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Veículos</label>
                                <input
                                    type="number"
                                    value={form.abordagensVeiculos}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensVeiculos: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Motocicletas</label>
                                <input
                                    type="number"
                                    value={form.abordagensMotocicletas}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensMotocicletas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Bicicletas</label>
                                <input
                                    type="number"
                                    value={form.abordagensBicicletas}
                                    onChange={(e) => setForm(prev => ({ ...prev, abordagensBicicletas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
                        <h4 className="text-lg font-semibold text-cyan-300">2. Apreensões</h4>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Armas de Fogo</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select
                                    value={form.armaTipo}
                                    onChange={(e) => setForm(prev => ({ ...prev, armaTipo: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                >
                                    <option value="">Selecione o Tipo</option>
                                    <option value="Pistola">Pistola</option>
                                    <option value="Revolver">Revólver</option>
                                    <option value="Espingarda">Espingarda</option>
                                    <option value="Fuzil">Fuzil</option>
                                </select>
                                <input
                                    type="number"
                                    value={form.armaQuantidade}
                                    onChange={(e) => setForm(prev => ({ ...prev, armaQuantidade: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        addListItem('armasList', { tipo: form.armaTipo, quantidade: toNumber(form.armaQuantidade || 1) });
                                        setForm(prev => ({ ...prev, armaTipo: '', armaQuantidade: '1' }));
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                >
                                    Adicionar Arma
                                </button>
                            </div>
                            {form.armasList.length > 0 && (
                                <div className="mt-2 space-y-1 text-sm text-gray-200">
                                    {form.armasList.map((item, index) => (
                                        <div key={`arma-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                            <span>{item.tipo} - {item.quantidade}</span>
                                            <button type="button" onClick={() => removeListItem('armasList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Munições</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select
                                    value={form.municaoTipo}
                                    onChange={(e) => setForm(prev => ({ ...prev, municaoTipo: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                >
                                    <option value="">Selecione o Calibre</option>
                                    <option value="9mm">9mm</option>
                                    <option value=".40">.40</option>
                                    <option value="380">380</option>
                                    <option value="12">12</option>
                                    <option value="5.56">5.56</option>
                                    <option value="7.62">7.62</option>
                                    <option value="38">38</option>
                                    <option value="32">32</option>
                                    <option value="22">22</option>
                                    <option value=".50">.50</option>
                                    <option value=".30">.30</option>
                                </select>
                                <input
                                    type="number"
                                    value={form.municaoQuantidade}
                                    onChange={(e) => setForm(prev => ({ ...prev, municaoQuantidade: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const added = addListItem('municoesList', { tipo: form.municaoTipo, quantidade: toNumber(form.municaoQuantidade || 1) });
                                        if (added) {
                                            setForm(prev => ({ ...prev, municaoTipo: '', municaoQuantidade: '1' }));
                                        }
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                >
                                    Adicionar Munição
                                </button>
                            </div>
                            {form.municoesList.length > 0 && (
                                <div className="mt-2 space-y-1 text-sm text-gray-200">
                                    {form.municoesList.map((item, index) => (
                                        <div key={`municao-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                            <span>{item.tipo} - {item.quantidade}</span>
                                            <button type="button" onClick={() => removeListItem('municoesList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Drogas</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <select
                                    value={form.drogaTipo}
                                    onChange={(e) => setForm(prev => ({ ...prev, drogaTipo: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                >
                                    <option value="">Selecione o Tipo de Droga</option>
                                    <option value="MACONHA">MACONHA</option>
                                    <option value="HAXIXE">HAXIXE</option>
                                    <option value="SKANK">SKANK</option>
                                    <option value="COCAINA">COCAINA</option>
                                    <option value="HEROINA">HEROINA</option>
                                    <option value="CRACK">CRACK</option>
                                    <option value="LSD">LSD</option>
                                    <option value="ECSTASY">ECSTASY</option>
                                    <option value="ANFETAMINA">ANFETAMINA</option>
                                    <option value="ANABOLIZANTE">ANABOLIZANTE</option>
                                    <option value="MEDICAMENTOS">MEDICAMENTOS</option>
                                </select>
                                <input
                                    type="number"
                                    value={form.drogaQuantidade}
                                    onChange={(e) => setForm(prev => ({ ...prev, drogaQuantidade: e.target.value }))}
                                    className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const added = addListItem('drogasList', { tipo: form.drogaTipo, quantidade: toNumber(form.drogaQuantidade || 1) });
                                        if (added) {
                                            setForm(prev => ({ ...prev, drogaTipo: '', drogaQuantidade: '1' }));
                                        }
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                >
                                    Adicionar Droga
                                </button>
                            </div>
                            {form.drogasList.length > 0 && (
                                <div className="mt-2 space-y-1 text-sm text-gray-200">
                                    {form.drogasList.map((item, index) => (
                                        <div key={`droga-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                            <span>{item.tipo} - {item.quantidade}</span>
                                            <button type="button" onClick={() => removeListItem('drogasList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Celulares</label>
                                <input type="number" value={form.apreensoesCelulares} onChange={(e) => setForm(prev => ({ ...prev, apreensoesCelulares: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Valores (R$)</label>
                                <input type="number" value={form.apreensoesValores} onChange={(e) => setForm(prev => ({ ...prev, apreensoesValores: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Veículos</label>
                                <input type="number" value={form.apreensoesVeiculos} onChange={(e) => setForm(prev => ({ ...prev, apreensoesVeiculos: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Motocicletas</label>
                                <input type="number" value={form.apreensoesMotocicletas} onChange={(e) => setForm(prev => ({ ...prev, apreensoesMotocicletas: e.target.value }))} className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">3. Mandados de Prisão diligênciados</h4>
                        <label className="block text-sm text-gray-300 mb-2">Quantidade</label>
                        <input type="number" value={form.mandadosDiligenciados} onChange={(e) => setForm(prev => ({ ...prev, mandadosDiligenciados: e.target.value }))} className="w-full md:w-52 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">4. Prisões</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <select
                                value={form.prisaoTipo}
                                onChange={(e) => setForm(prev => ({ ...prev, prisaoTipo: e.target.value }))}
                                className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                            >
                                <option value="">Selecione o tipo</option>
                                <option value="FLAGRANTE">FLAGRANTE</option>
                                <option value="PRISÃO PREVENTIVA">PRISÃO PREVENTIVA</option>
                                <option value="PRISÃO TEMPORÁRIA">PRISÃO TEMPORÁRIA</option>
                                <option value="ATO INFRACIONAL">ATO INFRACIONAL</option>
                                <option value="MBA ADOLESCENTE">MBA ADOLESCENTE</option>
                                <option value="PRISÃO DEFINITIVA">PRISÃO DEFINITIVA</option>
                            </select>
                            <input type="number" value={form.prisaoQuantidade} onChange={(e) => setForm(prev => ({ ...prev, prisaoQuantidade: e.target.value }))} className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="1" />
                            <button
                                type="button"
                                onClick={() => {
                                    const added = addListItem('prisoesList', { tipo: form.prisaoTipo, quantidade: toNumber(form.prisaoQuantidade || 1) });
                                    if (added) {
                                        setForm(prev => ({ ...prev, prisaoTipo: '', prisaoQuantidade: '1' }));
                                    }
                                }}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                            >
                                Adicionar Prisão
                            </button>
                        </div>
                        {form.prisoesList.length > 0 && (
                            <div className="mt-2 space-y-1 text-sm text-gray-200">
                                {form.prisoesList.map((item, index) => (
                                    <div key={`prisao-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                        <span>{item.tipo} - {item.quantidade}</span>
                                        <button type="button" onClick={() => removeListItem('prisoesList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">5. Conduções para Averiguação</h4>
                        <label className="block text-sm text-gray-300 mb-2">Quantidade</label>
                        <input type="number" value={form.conducoesAveriguacao} onChange={(e) => setForm(prev => ({ ...prev, conducoesAveriguacao: e.target.value }))} className="w-full md:w-52 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="0" />
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">6. Escolta de Presos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input type="text" value={form.escoltaDescricao} onChange={(e) => setForm(prev => ({ ...prev, escoltaDescricao: e.target.value }))} className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" placeholder="Descrição da escolta" />
                            <input type="number" value={form.escoltaQuantidade} onChange={(e) => setForm(prev => ({ ...prev, escoltaQuantidade: e.target.value }))} className="bg-gray-700 text-white rounded px-3 py-2 border border-gray-600" min="1" />
                            <button
                                type="button"
                                onClick={() => {
                                    const added = addListItem('escoltasList', { tipo: form.escoltaDescricao || 'Escolta', quantidade: toNumber(form.escoltaQuantidade || 1) });
                                    if (added) {
                                        setForm(prev => ({ ...prev, escoltaDescricao: '', escoltaQuantidade: '1' }));
                                    }
                                }}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                            >
                                Adicionar Escolta
                            </button>
                        </div>
                        {form.escoltasList.length > 0 && (
                            <div className="mt-2 space-y-1 text-sm text-gray-200">
                                {form.escoltasList.map((item, index) => (
                                    <div key={`escolta-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                        <span>{item.tipo} - {item.quantidade}</span>
                                        <button type="button" onClick={() => removeListItem('escoltasList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">7. Homicídio na AIS de Atuação</h4>
                        <select
                            value={form.homicidiosAIS}
                            onChange={(e) => setForm(prev => ({ ...prev, homicidiosAIS: e.target.value }))}
                            className="w-full md:w-52 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                        >
                            <option value="">Selecione</option>
                            <option value="sim">Sim</option>
                            <option value="nao">Não</option>
                        </select>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-cyan-300 mb-3">Procedimentos (número)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">BOC</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.procedimentoBocNumero}
                                        onChange={(e) => setForm(prev => ({ ...prev, procedimentoBocNumero: e.target.value }))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                        placeholder="Número do BOC"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const value = String(form.procedimentoBocNumero || '').trim();
                                            if (!value) return;
                                            setForm((prev) => ({
                                                ...prev,
                                                procedimentosBocList: [...(prev.procedimentosBocList || []), value],
                                                procedimentoBocNumero: '',
                                            }));
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                    >
                                        +
                                    </button>
                                </div>
                                {form.procedimentosBocList.length > 0 && (
                                    <div className="mt-2 space-y-1 text-sm text-gray-200">
                                        {form.procedimentosBocList.map((item, index) => (
                                            <div key={`boc-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                                <span>{item}</span>
                                                <button type="button" onClick={() => removeListItem('procedimentosBocList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">TCO</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.procedimentoTcoNumero}
                                        onChange={(e) => setForm(prev => ({ ...prev, procedimentoTcoNumero: e.target.value }))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                        placeholder="Número do TCO"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const value = String(form.procedimentoTcoNumero || '').trim();
                                            if (!value) return;
                                            setForm((prev) => ({
                                                ...prev,
                                                procedimentosTcoList: [...(prev.procedimentosTcoList || []), value],
                                                procedimentoTcoNumero: '',
                                            }));
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                    >
                                        +
                                    </button>
                                </div>
                                {form.procedimentosTcoList.length > 0 && (
                                    <div className="mt-2 space-y-1 text-sm text-gray-200">
                                        {form.procedimentosTcoList.map((item, index) => (
                                            <div key={`tco-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                                <span>{item}</span>
                                                <button type="button" onClick={() => removeListItem('procedimentosTcoList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">APF</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.procedimentoApfNumero}
                                        onChange={(e) => setForm(prev => ({ ...prev, procedimentoApfNumero: e.target.value }))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                        placeholder="Número do APF"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const value = String(form.procedimentoApfNumero || '').trim();
                                            if (!value) return;
                                            setForm((prev) => ({
                                                ...prev,
                                                procedimentosApfList: [...(prev.procedimentosApfList || []), value],
                                                procedimentoApfNumero: '',
                                            }));
                                        }}
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded px-3 py-2"
                                    >
                                        +
                                    </button>
                                </div>
                                {form.procedimentosApfList.length > 0 && (
                                    <div className="mt-2 space-y-1 text-sm text-gray-200">
                                        {form.procedimentosApfList.map((item, index) => (
                                            <div key={`apf-${index}`} className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
                                                <span>{item}</span>
                                                <button type="button" onClick={() => removeListItem('procedimentosApfList', index)} className="text-red-300 hover:text-red-200">Remover</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-600 text-white">Cancelar</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Enviar Relatório</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

const ViewReport = ({ report, onClose }) => (
    <Modal onClose={onClose} size="3xl" contentClassName="bg-gray-900 border border-gray-700 p-0">
        <div className="p-6 text-white bg-gray-900 rounded-xl border border-gray-700">
            <h3 className="text-2xl font-bold mb-4 text-blue-300">Relatório Enviado</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Departamento</p>
                    <p className="text-white font-semibold">{report.departamento || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Delegacia</p>
                    <p className="text-white font-semibold">{report.delegacia || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Procedimento (escolta)</p>
                    <p className="text-white font-semibold">{report.procedimentoEscolta || 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Homicídios na AIS</p>
                    <p className="text-white font-semibold">{report.homicidiosAIS === true ? 'Sim' : report.homicidiosAIS === false ? 'Não' : 'N/A'}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Prisões</p>
                    <p className="text-white font-semibold">{report.prisoes?.reduce((sum, p) => sum + (Number(p.quantidade) || 0), 0) || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Abordagens</p>
                    <p className="text-white font-semibold">
                        {report.abordagens?.pessoas || 0} pessoas / {report.abordagens?.veiculos || 0} veículos / {report.abordagens?.motocicletas || 0} motos / {report.abordagens?.bicicletas || 0} bicicletas
                    </p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Procedimentos</p>
                    <p className="text-white font-semibold">
                        BOC {Array.isArray(report.procedimentos?.boc) ? report.procedimentos?.boc.length : (report.procedimentos?.bocTotal || Number(report.procedimentos?.boc) || 0)} |
                        {' '}TCO {Array.isArray(report.procedimentos?.tco) ? report.procedimentos?.tco.length : (report.procedimentos?.tcoTotal || Number(report.procedimentos?.tco) || 0)} |
                        {' '}APF {Array.isArray(report.procedimentos?.apf) ? report.procedimentos?.apf.length : (report.procedimentos?.apfTotal || Number(report.procedimentos?.apf) || 0)}
                    </p>
                    {Array.isArray(report.procedimentos?.boc) && report.procedimentos.boc.length > 0 && (
                        <p className="text-xs text-gray-300 mt-1">BOC: {report.procedimentos.boc.join(', ')}</p>
                    )}
                    {Array.isArray(report.procedimentos?.tco) && report.procedimentos.tco.length > 0 && (
                        <p className="text-xs text-gray-300 mt-1">TCO: {report.procedimentos.tco.join(', ')}</p>
                    )}
                    {Array.isArray(report.procedimentos?.apf) && report.procedimentos.apf.length > 0 && (
                        <p className="text-xs text-gray-300 mt-1">APF: {report.procedimentos.apf.join(', ')}</p>
                    )}
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Apreensões</p>
                    <p className="text-white font-semibold">Celulares {report.apreensoes?.celulares || 0} | Valores R$ {report.apreensoes?.valores || 0} | Veículos {report.apreensoes?.veiculos || 0} | Motocicletas {report.apreensoes?.motocicletas || 0} | Armas {report.apreensoes?.armas?.reduce((sum, a) => sum + (Number(a.quantidade) || 0), 0) || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Mandados de Prisão diligênciados</p>
                    <p className="text-white font-semibold">{report.mandadosPrisaoDiligenciados || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <p className="text-gray-400">Conduções para Averiguação</p>
                    <p className="text-white font-semibold">{report.conducoesAveriguacao || 0}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Escoltas de Presos</p>
                    <p className="text-white font-semibold">{Array.isArray(report.escoltas) ? report.escoltas.length : 0} registro(s)</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 md:col-span-2">
                    <p className="text-gray-400">Outros</p>
                    <p className="text-white font-semibold">{report.apreensoes?.outros || 'N/A'}</p>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold">Fechar</button>
            </div>
        </div>
    </Modal>
);

export const MinhasOperacoesView = ({ user, showNotification }) => {
    const [myConvoys, setMyConvoys] = useState([]);
    const [reports, setReports] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null);

    const shouldUseMockProfile = String(user?.email || '').toLowerCase() === MOCK_PROFILE_EMAIL;

    useEffect(() => {
        if (!user || !user.matricula) {
            setLoading(false);
            return;
        }

        const fetchMyData = async () => {
            setLoading(true);

            try {
                // Busca teams onde o usuário é membro
                const teamsData = await apiClient.getTeams({ member_matricula: user.matricula });
                const myTeamIds = (Array.isArray(teamsData) ? teamsData : []).map(team => team.id);

                if (myTeamIds.length === 0) {
                    if (shouldUseMockProfile) {
                        const mockConvoy = createMockConvoyForProfile();
                        const mockConvoyToFill = createMockConvoyToFillForProfile();
                        const mockReport = createMockReportForProfile(user);
                        setMyConvoys([mockConvoyToFill, mockConvoy]);
                        setReports(new Map([[mockConvoy.id, mockReport]]));
                    }
                    setLoading(false);
                    return;
                }

                // Busca convoys onde o usuário participa
                const convoysData = await apiClient.getConvoys({ team_ids: myTeamIds.join(',') });
                const convoyData = (Array.isArray(convoysData) ? convoysData : [])
                    .sort((a, b) => {
                        const dateA = typeof a.date === 'string' ? new Date(a.date) : new Date(a.date.seconds * 1000);
                        const dateB = typeof b.date === 'string' ? new Date(b.date) : new Date(b.date.seconds * 1000);
                        return dateB - dateA;
                    });
                if (convoyData.length === 0 && shouldUseMockProfile) {
                    const mockConvoy = createMockConvoyForProfile();
                    const mockConvoyToFill = createMockConvoyToFillForProfile();
                    const mockReport = createMockReportForProfile(user);
                    setMyConvoys([mockConvoyToFill, mockConvoy]);
                    setReports(new Map([[mockConvoy.id, mockReport]]));
                    setLoading(false);
                    return;
                }
                setMyConvoys(convoyData);

                // Busca relatórios dos convoys
                const convoyIds = convoyData.map(c => c.id);
                if (convoyIds.length > 0) {
                    const reportsData = await apiClient.getConvoyReports({ convoy_ids: convoyIds.join(',') });
                    const reportsMap = new Map();
                    (Array.isArray(reportsData) ? reportsData : []).forEach(report => {
                        reportsMap.set(report.convoyId, report);
                    });
                    setReports(reportsMap);
                }
            } catch (error) {
                console.error('Erro ao carregar dados das operações:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyData();
    }, [user, shouldUseMockProfile]);

    const handleOpenForm = (convoy) => setModalContent({ type: 'fillReport', convoy });
    const handleViewReport = (convoy) => setModalContent({ type: 'viewReport', report: reports.get(convoy.id) });
    const handleCloseModal = () => setModalContent(null);

    const handleSubmitReport = async (reportData) => {
        try {
            const createdReport = await apiClient.createConvoyReport(reportData);
            showNotification('Relatório enviado com sucesso!', 'success');
            setReports(prev => new Map(prev).set(reportData.convoyId, createdReport));
            handleCloseModal();
        } catch (error) {
            console.error('Erro ao enviar relatório:', error);
            showNotification('Falha ao enviar o relatório.', 'error');
        }
    };

    const renderModal = () => {
        if (!modalContent) return null;
        const { type, convoy, report } = modalContent;
        if (type === 'fillReport') return (
            <OperationReportForm
                convoy={convoy}
                user={user}
                onSubmit={handleSubmitReport}
                onCancel={handleCloseModal}
            />
        );
        if (type === 'viewReport') return <ViewReport report={report} onClose={handleCloseModal} />;
        return null;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            {renderModal()}
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Minhas Operações</h2>
            {myConvoys.length === 0 ? (
                <p className="text-center text-gray-400">Você não participou de nenhuma operação registrada.</p>
            ) : (
                <div className="space-y-4">
                    {myConvoys.map(convoy => {
                        const hasReport = reports.has(convoy.id);
                        return (
                            <div key={convoy.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-blue-400">{`Comboio ${convoy.numeroComboio || ''} - ${(typeof convoy.date === 'string' ? new Date(convoy.date) : new Date(convoy.date.seconds * 1000)).toLocaleDateString('pt-BR')}`}</p>
                                    <p className="text-sm text-gray-400">AIS: {convoy.ais} - Bairros: {Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : 'N/A'}</p>
                                </div>
                                {hasReport ? (
                                    <button onClick={() => handleViewReport(convoy)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-2 rounded-lg">Ver Relatório</button>
                                ) : (
                                    <button onClick={() => handleOpenForm(convoy)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Preencher Relatório</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
export default MinhasOperacoesView;
