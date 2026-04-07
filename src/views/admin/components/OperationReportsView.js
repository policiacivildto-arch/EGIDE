
import React, { useState } from 'react';
import { apiClient } from '../../../config/api';
import { Modal, LoadingSpinner } from '../../../components/ui/Shared';
import ViewReport from './ViewReport';
import OperationReportForm from './OperationReportForm';
      



export const OperationReportsView = ({ showNotification, departamento }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    
    // --- NOVO: Estado para controlar o modal de EDIÇÃO ---
    const [editingReport, setEditingReport] = useState(null);

    const toArray = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.results)) return payload.results;
        return [];
    };

    const parseDateValue = (raw) => {
        if (!raw) return null;
        if (typeof raw === 'string') return new Date(raw);
        if (typeof raw === 'number') return new Date(raw);
        if (raw?.seconds) return new Date(raw.seconds * 1000);
        return null;
    };

    const getIsoDate = (raw) => {
        const date = parseDateValue(raw);
        if (!date || Number.isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    };

    const getSupervisorName = (value) => {
        if (!value) return 'N/A';
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        return value?.nome || value?.name || value?.username || 'N/A';
    };

    const fetchReports = async () => {
        if (!startDate || !endDate) {
            showNotification("Por favor, selecione as datas de início e fim.", "error");
            return;
        }
        setLoading(true);
        setReports([]);
        try {
            const [reportsResult, convoysResult] = await Promise.allSettled([
                apiClient.getConvoyReports({
                    data_operacao__gte: startDate,
                    data_operacao__lte: endDate,
                    departamento,
                }),
                apiClient.getConvoys({
                    data__gte: startDate,
                    data__lte: endDate,
                    page_size: 500,
                }),
            ]);

            const reportsResponse = reportsResult.status === 'fulfilled' ? reportsResult.value : [];
            const convoysResponse = convoysResult.status === 'fulfilled' ? convoysResult.value : [];

            if (reportsResult.status === 'rejected') {
                console.warn('Falha ao carregar convoy-reports, usando fallback local:', reportsResult.reason);
            }
            if (convoysResult.status === 'rejected') {
                console.warn('Falha ao carregar comboios:', convoysResult.reason);
            }

            const allReports = toArray(reportsResponse);
            const allConvoys = toArray(convoysResponse);

            const fetchedReports = allReports.filter((report) => {
                const reportDate = report?.data_operacao || report?.submittedAt || report?.submitted_at || report?.createdAt || report?.criado_em;
                if (!reportDate) return false;
                const isoDate = getIsoDate(reportDate);
                if (!isoDate) return false;

                const inRange = isoDate >= startDate && isoDate <= endDate;
                const deptOk = !departamento || report?.departamento === departamento;
                return inRange && deptOk;
            });

            if (fetchedReports.length === 0) {
                showNotification("Nenhum relatório encontrado para o período.", "info");
                setLoading(false);
                return;
            }

            const convoyMap = new Map(allConvoys.map((convoy) => [convoy.id, convoy]));

            let combinedData = fetchedReports.map(report => {
                const reportConvoyId = report.convoyId || report.convoy_id || report.comboio;
                const convoyInfo = convoyMap.get(reportConvoyId) || {};
                const dpcName = getSupervisorName(convoyInfo?.dpc_nome || convoyInfo?.dpc);
                const oipName = getSupervisorName(convoyInfo?.oip_nome || convoyInfo?.oip);
                const convoyTitle = `DPC ${dpcName} | OIP ${oipName}`;
                
                return {
                    ...report,
                    convoyId: reportConvoyId,
                    convoyInfo,
                    convoyTitle,
                };
            });
            
            combinedData.sort((a, b) => {
                const dateA = a?.convoyInfo?.data || a?.convoyInfo?.date;
                const dateB = b?.convoyInfo?.data || b?.convoyInfo?.date;
                const parsedA = parseDateValue(dateA);
                const parsedB = parseDateValue(dateB);
                const timeA = parsedA && !Number.isNaN(parsedA.getTime()) ? parsedA.getTime() : 0;
                const timeB = parsedB && !Number.isNaN(parsedB.getTime()) ? parsedB.getTime() : 0;
                return timeB - timeA;
            });

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
            const dataToSave = {
                ...updatedData,
                lastEditedAt: new Date().toISOString(),
            };

            await apiClient.updateConvoyReport(reportId, dataToSave);
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
                                         <p className="text-xs text-gray-400">{(() => {
                                            const convoyDate = report?.convoyInfo?.data || report?.convoyInfo?.date;
                                                          const parsed = parseDateValue(convoyDate);
                                                          if (!parsed || Number.isNaN(parsed.getTime())) return 'N/A';
                                                          return parsed.toLocaleDateString('pt-BR');
                                         })()}</p>
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