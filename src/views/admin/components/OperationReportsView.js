
import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase';   
import { Modal, LoadingSpinner } from '../../../components/ui/Shared';
import ViewReport from './ViewReport';
import OperationReportForm from './OperationReportForm';
import { Download } from 'lucide-react';        



export const OperationReportsView = ({ showNotification }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    
    // --- NOVO: Estado para controlar o modal de EDIÇÃO ---
    const [editingReport, setEditingReport] = useState(null);

    const fetchReports = async () => {
        if (!startDate || !endDate) {
            showNotification("Por favor, selecione as datas de início e fim.", "error");
            return;
        }
        setLoading(true);
        setReports([]);
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const reportsQuery = query(
                collection(db, `/artifacts/${appId}/public/data/convoyReports`),
                where("submittedAt", ">=", start),
                where("submittedAt", "<=", end)
            );
            const reportsSnap = await getDocs(reportsQuery);
            const fetchedReports = reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (fetchedReports.length === 0) {
                showNotification("Nenhum relatório encontrado para o período.", "info");
                setLoading(false);
                return;
            }

            const convoyIds = [...new Set(fetchedReports.map(r => r.convoyId))];
            const convoysQuery = query(collection(db, `/artifacts/${appId}/public/data/convoys`), where("id", "in", convoyIds));
            const convoysSnap = await getDocs(convoysQuery);
            const convoyMap = new Map(convoysSnap.docs.map(doc => [doc.id, doc.data()]));

            let combinedData = fetchedReports.map(report => {
                const convoyInfo = convoyMap.get(report.convoyId) || {};
                const convoyTitle = `DPC ${convoyInfo.dpc || 'N/A'} | OIP ${convoyInfo.oip || 'N/A'}`;
                
                return {
                    ...report,
                    convoyInfo,
                    convoyTitle,
                };
            });
            
            combinedData.sort((a, b) => (b.convoyInfo.date?.seconds || 0) - (a.convoyInfo.date?.seconds || 0));

            setReports(combinedData);

        } catch (error) {
            console.error("Erro ao buscar relatórios:", error);
            showNotification("Falha ao carregar relatórios.", "error");
        } finally {
            setLoading(false);
        }
    };
    
    // --- NOVO: Função para salvar o relatório editado ---
    const handleUpdateReport = async (reportId, updatedData) => {
        setLoading(true);
        try {
            const reportRef = doc(db, `/artifacts/${appId}/public/data/convoyReports`, reportId);
            
            const dataToSave = {
                ...updatedData,
                lastEditedAt: new Date(), // Campo opcional para auditoria
            };

            await updateDoc(reportRef, dataToSave);
            showNotification("Relatório atualizado com sucesso!", "success");
            setEditingReport(null); // Fecha o modal
            await fetchReports(); // Recarrega a lista para mostrar os dados atualizados
        } catch (error) {
            console.error("Erro ao atualizar relatório:", error);
            showNotification("Falha ao salvar as alterações.", "error");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            {/* Modal de Visualização */}
            {selectedReport && (
                <Modal size="5xl" onClose={() => setSelectedReport(null)}>
                    <ViewReport report={selectedReport} onCancel={() => setSelectedReport(null)} />
                </Modal>
            )}

            {/* --- NOVO: Modal de Edição --- */}
            {editingReport && (
                <Modal size="5xl" onClose={() => setEditingReport(null)}>
                    <OperationReportForm
                        initialData={editingReport}
                        showNotification={showNotification}
                        onCancel={() => setEditingReport(null)}
                        onSubmit={(updatedFormData) => handleUpdateReport(editingReport.id, updatedFormData)}
                    />
                </Modal>
            )}

            <h3 className="text-2xl font-bold mb-4">Relatórios de Operação</h3>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div><label className="block text-sm font-bold mb-1">Data de Início</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <div><label className="block text-sm font-bold mb-1">Data de Fim</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <button onClick={fetchReports} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Buscando...' : 'Buscar Relatórios'}
                </button>
            </div>
            
            <div className="overflow-x-auto bg-gray-800 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase">
                        <tr>
                            <th className="px-4 py-2">Comboio (Supervisão e Data)</th>
                            <th className="px-4 py-2">Área (AIS)</th>
                            <th className="px-4 py-2">Abordagens (P/V)</th>
                            <th className="px-4 py-2">Prisões</th>
                            <th className="px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5"><LoadingSpinner /></td></tr>
                        ) : reports.length > 0 ? (
                            reports.map(report => (
                                <tr key={report.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-2">
                                         <p className="font-semibold">{report.convoyTitle}</p>
                                         <p className="text-xs text-gray-400">{new Date(report.convoyInfo.date?.seconds * 1000).toLocaleDateString('pt-BR')}</p>
                                    </td>
                                    <td className="px-4 py-2">{`AIS ${report.convoyInfo.ais || 'N/A'}`}</td>
                                    <td className="px-4 py-2">{`${report.abordagens?.pessoas || 0} / ${report.abordagens?.veiculos || 0}`}</td>
                                    <td className="px-4 py-2">{report.prisoes?.reduce((sum, p) => sum + (p.quantidade ? Number(p.quantidade) : 1), 0) || 0}</td>
                                    <td className="px-4 py-2">
                                        {/* --- ALTERADO: Adicionado botão de editar --- */}
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => setSelectedReport(report)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-xs">
                                                Ver
                                            </button>
                                            <button onClick={() => setEditingReport(report)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded-lg text-xs">
                                                Editar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center p-4 text-gray-500">Nenhum relatório encontrado para o período selecionado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};