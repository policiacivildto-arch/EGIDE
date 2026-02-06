import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase';
import { Modal, LoadingSpinner } from '../../../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { displayMatricula } from '../../../utils/helpers';
import { ORGANOGRAMA } from '../../../constants/data';

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
        departamento: user?.departamento || '',
        delegacia: user?.delegacia || '',
        procedimentoEscolta: '',
        homicidiosAIS: '',
        abordagensPessoas: '',
        abordagensVeiculos: '',
        prisoesTotal: '',
        procedimentosBoc: '',
        procedimentosTco: '',
        procedimentosApf: '',
        apreensoesCelulares: '',
        apreensoesVeiculos: '',
        apreensoesArmas: '',
        apreensoesMunicoes: '',
        apreensoesDrogas: '',
        apreensoesOutros: ''
    });

    const delegacias = form.departamento ? (ORGANOGRAMA[form.departamento] || []) : [];
    const toNumber = (value) => (value === '' || value === null || value === undefined ? 0 : Number(value));

    const handleSubmit = (e) => {
        e.preventDefault();
        const reportData = {
            convoyId: convoy.id,
            submittedAt: new Date(),
            cycleId: getCycleId(),
            departamento: form.departamento || user?.departamento || '',
            delegacia: form.delegacia || '',
            procedimentoEscolta: form.procedimentoEscolta || '',
            homicidiosAIS: form.homicidiosAIS === 'sim' ? true : form.homicidiosAIS === 'nao' ? false : null,
            abordagens: {
                pessoas: toNumber(form.abordagensPessoas),
                veiculos: toNumber(form.abordagensVeiculos)
            },
            prisoes: form.prisoesTotal ? [{ tipo: 'Prisões', quantidade: toNumber(form.prisoesTotal) }] : [],
            procedimentos: {
                boc: toNumber(form.procedimentosBoc),
                tco: toNumber(form.procedimentosTco),
                apf: toNumber(form.procedimentosApf)
            },
            apreensoes: {
                celulares: toNumber(form.apreensoesCelulares),
                veiculos: toNumber(form.apreensoesVeiculos),
                armas: form.apreensoesArmas ? [{ tipo: 'Armas', quantidade: toNumber(form.apreensoesArmas) }] : [],
                municoes: form.apreensoesMunicoes ? [{ tipo: 'Munições', quantidade: toNumber(form.apreensoesMunicoes) }] : [],
                drogas: form.apreensoesDrogas ? [{ tipo: 'Drogas', quantidade: toNumber(form.apreensoesDrogas) }] : [],
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
        <Modal onClose={onCancel} size="3xl">
            <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Preencher Relatório</h3>
                <p className="text-sm text-gray-400 mb-6">Comboio {convoy.numeroComboio || ''} - {new Date(convoy.date.seconds * 1000).toLocaleDateString('pt-BR')}</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Departamento</label>
                            <select
                                value={form.departamento}
                                onChange={(e) => setForm(prev => ({ ...prev, departamento: e.target.value, delegacia: '' }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                required
                            >
                                <option value="">Selecione o departamento</option>
                                {Object.keys(ORGANOGRAMA).map(dep => (
                                    <option key={dep} value={dep}>{dep}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Delegacia/Unidade</label>
                            <select
                                value={form.delegacia}
                                onChange={(e) => setForm(prev => ({ ...prev, delegacia: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                required
                                disabled={!form.departamento}
                            >
                                <option value="">Selecione a delegacia</option>
                                {delegacias.map(delegacia => (
                                    <option key={delegacia} value={delegacia}>{delegacia}</option>
                                ))}
                            </select>
                        </div>
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Abordagens - Pessoas</label>
                            <input
                                type="number"
                                value={form.abordagensPessoas}
                                onChange={(e) => setForm(prev => ({ ...prev, abordagensPessoas: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                min="0"
                                placeholder=""
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Abordagens - Veículos</label>
                            <input
                                type="number"
                                value={form.abordagensVeiculos}
                                onChange={(e) => setForm(prev => ({ ...prev, abordagensVeiculos: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                min="0"
                                placeholder=""
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-300 mb-2">Prisões (quantidade)</label>
                            <input
                                type="number"
                                value={form.prisoesTotal}
                                onChange={(e) => setForm(prev => ({ ...prev, prisoesTotal: e.target.value }))}
                                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-cyan-400 mb-3">Procedimentos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">BOC</label>
                                <input
                                    type="number"
                                    value={form.procedimentosBoc}
                                    onChange={(e) => setForm(prev => ({ ...prev, procedimentosBoc: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">TCO</label>
                                <input
                                    type="number"
                                    value={form.procedimentosTco}
                                    onChange={(e) => setForm(prev => ({ ...prev, procedimentosTco: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">APF</label>
                                <input
                                    type="number"
                                    value={form.procedimentosApf}
                                    onChange={(e) => setForm(prev => ({ ...prev, procedimentosApf: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-cyan-400 mb-3">Apreensões</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Celulares</label>
                                <input
                                    type="number"
                                    value={form.apreensoesCelulares}
                                    onChange={(e) => setForm(prev => ({ ...prev, apreensoesCelulares: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Veículos</label>
                                <input
                                    type="number"
                                    value={form.apreensoesVeiculos}
                                    onChange={(e) => setForm(prev => ({ ...prev, apreensoesVeiculos: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Armas</label>
                                <input
                                    type="number"
                                    value={form.apreensoesArmas}
                                    onChange={(e) => setForm(prev => ({ ...prev, apreensoesArmas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Munições</label>
                                <input
                                    type="number"
                                    value={form.apreensoesMunicoes}
                                    onChange={(e) => setForm(prev => ({ ...prev, apreensoesMunicoes: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Drogas</label>
                                <input
                                    type="number"
                                    value={form.apreensoesDrogas}
                                    onChange={(e) => setForm(prev => ({ ...prev, apreensoesDrogas: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-2">Outros</label>
                                <input
                                    type="text"
                                    value={form.apreensoesOutros}
                                    onChange={(e) => setForm(prev => ({ ...prev, apreensoesOutros: e.target.value }))}
                                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                                    placeholder="Descreva outras apreensões"
                                />
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
    <Modal onClose={onClose} size="3xl">
        <div className="p-6 text-white">
            <h3 className="text-2xl font-bold mb-4">Relatório Enviado</h3>
            <div className="space-y-2 text-sm text-gray-300">
                <p><strong>Departamento:</strong> {report.departamento || 'N/A'}</p>
                <p><strong>Delegacia:</strong> {report.delegacia || 'N/A'}</p>
                <p><strong>Procedimento (escolta):</strong> {report.procedimentoEscolta || 'N/A'}</p>
                <p><strong>Homicídios na AIS:</strong> {report.homicidiosAIS === true ? 'Sim' : report.homicidiosAIS === false ? 'Não' : 'N/A'}</p>
                <p><strong>Abordagens:</strong> {report.abordagens?.pessoas || 0} pessoas / {report.abordagens?.veiculos || 0} veículos</p>
                <p><strong>Prisões:</strong> {report.prisoes?.reduce((sum, p) => sum + (Number(p.quantidade) || 0), 0) || 0}</p>
                <p><strong>Procedimentos:</strong> BOC {report.procedimentos?.boc || 0} | TCO {report.procedimentos?.tco || 0} | APF {report.procedimentos?.apf || 0}</p>
                <p><strong>Apreensões:</strong> Celulares {report.apreensoes?.celulares || 0} | Veículos {report.apreensoes?.veiculos || 0} | Armas {report.apreensoes?.armas?.reduce((sum, a) => sum + (Number(a.quantidade) || 0), 0) || 0}</p>
                <p><strong>Outros:</strong> {report.apreensoes?.outros || 'N/A'}</p>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded bg-gray-600 text-white">Fechar</button>
            </div>
        </div>
    </Modal>
);

export const MinhasOperacoesView = ({ user, showNotification }) => {
    const [myConvoys, setMyConvoys] = useState([]);
    const [reports, setReports] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null);

    useEffect(() => {
        if (!user || !user.matricula) {
            setLoading(false);
            return;
        }

        const fetchMyData = async () => {
            setLoading(true);

            const teamsQuery = query(collection(db, `/artifacts/${appId}/public/data/teams`), where('memberMatriculas', 'array-contains', user.matricula));
            const teamsSnap = await getDocs(teamsQuery);
            const myTeamIds = teamsSnap.docs.map(doc => doc.id);

            if (myTeamIds.length === 0) {
                setLoading(false);
                return;
            }

            const convoysQuery = query(collection(db, `/artifacts/${appId}/public/data/convoys`), where('teamIds', 'array-contains-any', myTeamIds));
            const convoysSnap = await getDocs(convoysQuery);
            const convoyData = convoysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.date.seconds - a.date.seconds);
            setMyConvoys(convoyData);

            const convoyIds = convoyData.map(c => c.id);
            if (convoyIds.length > 0) {
                const reportsQuery = query(collection(db, `/artifacts/${appId}/public/data/convoyReports`), where('convoyId', 'in', convoyIds));
                const reportsSnap = await getDocs(reportsQuery);
                const reportsMap = new Map();
                reportsSnap.docs.forEach(doc => {
                    const report = { id: doc.id, ...doc.data() };
                    reportsMap.set(report.convoyId, report);
                });
                setReports(reportsMap);
            }
            setLoading(false);
        };

        fetchMyData();
    }, [user]);

    const handleOpenForm = (convoy) => setModalContent({ type: 'fillReport', convoy });
    const handleViewReport = (convoy) => setModalContent({ type: 'viewReport', report: reports.get(convoy.id) });
    const handleCloseModal = () => setModalContent(null);

    const handleSubmitReport = async (reportData) => {
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/convoyReports`), reportData);
            showNotification('Relatório enviado com sucesso!', 'success');
            const newReport = { ...reportData, id: 'temp' };
            setReports(prev => new Map(prev).set(reportData.convoyId, newReport));
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
                                    <p className="font-bold text-lg text-blue-400">{`Comboio ${convoy.numeroComboio || ''} - ${new Date(convoy.date.seconds * 1000).toLocaleDateString('pt-BR')}`}</p>
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
