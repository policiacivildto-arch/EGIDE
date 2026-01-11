// src/views/admin/componets/PaymentReport.js


import React, { useState, useMemo } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase';   
import { Modal } from '../../../components/ui/Shared';
import EditServiceModal from './EditServiceModal';  
import { 
    normalizeName, 
    calculateHours, 
    displayMatricula 
} from '../../../utils/helpers'
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Edit } from 'lucide-react';
import { LoadingSpinner } from '../../../components/ui/Shared';
export const PaymentReportView = ({ allUsers, showNotification }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [services, setServices] = useState([]);
    const [convoysForPeriod, setConvoysForPeriod] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingService, setEditingService] = useState(null);

    const userMatriculaMap = useMemo(() => {
        const map = new Map();
        if (allUsers) {
            allUsers.forEach(user => {
                map.set(normalizeName(user.nome), user.matricula);
            });
        }
        return map;
    }, [allUsers]);

    const fetchServices = async () => {
        if (!startDate || !endDate) {
            showNotification("Por favor, selecione as datas de início e fim.", "error");
            return;
        }
        setLoading(true);
        setServices([]);
        setConvoysForPeriod([]);
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const teamsQuery = query(
                collection(db, `/artifacts/${appId}/public/data/teams`),
                where("vagaDate", ">=", start),
                where("vagaDate", "<=", end)
            );
            const teamsSnap = await getDocs(teamsQuery);
            const fetchedServices = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (fetchedServices.length > 0) {
                const convoysQuery = query(
                    collection(db, `/artifacts/${appId}/public/data/convoys`),
                    where("date", ">=", start),
                    where("date", "<=", end)
                );
                const convoysSnap = await getDocs(convoysQuery);
                const fetchedConvoys = convoysSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setConvoysForPeriod(fetchedConvoys);
            }
            
            setServices(fetchedServices);

        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
            showNotification("Falha ao carregar relatório.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ALTERAÇÃO CENTRAL: Lógica reescrita para garantir supervisores únicos por dia
    const allWorkEntries = useMemo(() => {
        if (services.length === 0 && convoysForPeriod.length === 0) return [];

        const teamEntries = [];
        const serviceMap = new Map(services.map(s => [s.id, s]));

        // 1. Adiciona os membros das equipes operacionais (sem alteração aqui)
        services.forEach(service => {
            const data = new Date(service.vagaDate.seconds * 1000);
            const inicio = service.horarioEntrada || (service.vagaShiftType === 'day' ? '08:00' : '19:00');
            const fim = service.horarioSaida || (service.vagaShiftType === 'day' ? '20:00' : '01:00');
            const horas = calculateHours(inicio, fim);
            const lotacao = service.teamName || service.delegaciaPrincipal;

            service.members.forEach(member => {
                if (member && member.nome) {
                    teamEntries.push({
                        id: `${service.id}-${member.matricula}`,
                        isService: true,
                        serviceObject: service,
                        date: data,
                        station: lotacao,
                        officerName: member.nome,
                        matricula: member.matricula,
                        startTime: inicio,
                        endTime: fim,
                        totalHours: horas,
                        paymentStatus: service.paymentStatus || 'pending'
                    });
                }
            });
        });

        // 2. Cria uma lista de supervisores únicos por dia
        const supervisorEntriesMap = new Map(); // Usado para garantir a unicidade
        convoysForPeriod.forEach(convoy => {
            const representativeTeamId = convoy.teamIds?.[0];
            const representativeTeam = serviceMap.get(representativeTeamId);
            if (!representativeTeam) return;

            const data = new Date(convoy.date.seconds * 1000);
            const dateKey = data.toISOString().split('T')[0];
            const inicio = representativeTeam.horarioEntrada || (representativeTeam.vagaShiftType === 'day' ? '08:00' : '19:00');
            const fim = representativeTeam.horarioSaida || (representativeTeam.vagaShiftType === 'day' ? '20:00' : '01:00');
            const horas = calculateHours(inicio, fim);

            // Adiciona DPC se não existir para esse dia
            if (convoy.dpc) {
                const entryKey = `${dateKey}-${convoy.dpc}`;
                if (!supervisorEntriesMap.has(entryKey)) {
                    supervisorEntriesMap.set(entryKey, {
                        id: `${convoy.id}-dpc`,
                        isService: false,
                        date: data,
                        station: 'SUPERVISÃO DPC',
                        officerName: convoy.dpc,
                        matricula: userMatriculaMap.get(normalizeName(convoy.dpc)) || 'N/A',
                        startTime: inicio,
                        endTime: fim,
                        totalHours: horas,
                        paymentStatus: 'confirmed'
                    });
                }
            }
            // Adiciona OIP se não existir para esse dia
            if (convoy.oip) {
                const entryKey = `${dateKey}-${convoy.oip}`;
                if (!supervisorEntriesMap.has(entryKey)) {
                    supervisorEntriesMap.set(entryKey, {
                        id: `${convoy.id}-oip`,
                        isService: false,
                        date: data,
                        station: 'SUPERVISÃO OIP',
                        officerName: convoy.oip,
                        matricula: userMatriculaMap.get(normalizeName(convoy.oip)) || 'N/A',
                        startTime: inicio,
                        endTime: fim,
                        totalHours: horas,
                        paymentStatus: 'confirmed'
                    });
                }
            }
        });
        
        const supervisorEntries = Array.from(supervisorEntriesMap.values());
        
        // 3. Combina as duas listas e ordena por data
        return [...teamEntries, ...supervisorEntries].sort((a, b) => a.date - b.date);

    }, [services, convoysForPeriod, userMatriculaMap]);

    const handleSaveService = async (updatedServiceData) => {
        try {
            const serviceRef = doc(db, `/artifacts/${appId}/public/data/teams`, updatedServiceData.id);
            await updateDoc(serviceRef, updatedServiceData);
            showNotification("Serviço atualizado com sucesso!", "success");
            setEditingService(null);
            fetchServices();
        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            showNotification("Falha ao salvar as alterações.", "error");
        }
    };

    const exportToXLSX = () => {
        if (allWorkEntries.length === 0) {
            showNotification("Não há dados para exportar.", "warning"); return;
        }
        const reportData = allWorkEntries.map(entry => ({
            "Data": entry.date.toLocaleDateString('pt-BR'),
            "Lotação/Função": entry.station,
            "Policial/Supervisor": entry.officerName,
            "Matrícula": displayMatricula(entry.matricula),
            "Horário de Início": entry.startTime,
            "Horário de Fim": entry.endTime,
            "Total de Horas": entry.totalHours
        }));
        const worksheet = XLSX.utils.json_to_sheet(reportData);
        worksheet["!cols"] = [ { wch: 12 }, { wch: 30 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pagamentos");
        XLSX.writeFile(workbook, `Relatorio_Pagamento_${startDate}_a_${endDate}.xlsx`);
    };
    
    const exportToPDF = () => {
        if (allWorkEntries.length === 0) {
            showNotification("Não há dados para exportar.", "warning"); return;
        }
        const doc = new jsPDF('l', 'mm', 'a4');
        const tableHead = [["Data", "Lotação/Função", "Policial/Supervisor", "Matrícula", "Início", "Fim", "Total Horas"]];
        const tableBody = allWorkEntries.map(entry => [
            entry.date.toLocaleDateString('pt-BR'),
            entry.station,
            entry.officerName,
            displayMatricula(entry.matricula),
            entry.startTime,
            entry.endTime,
            entry.totalHours
        ]);
        doc.setFontSize(16);
        doc.text("Relatório de Pagamento de Horas Extras", 14, 15);
        const dataInicioFmt = new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR');
        const dataFimFmt = new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR');
        doc.text(`Período: ${dataInicioFmt} a ${dataFimFmt}`, 14, 22);
        autoTable(doc, {
            head: tableHead, body: tableBody, startY: 25, theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { textColor: [0, 0, 0], fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        doc.save(`Relatorio_Pagamento_${startDate}_a_${endDate}.pdf`);
    };

    return (
        <div>
            {editingService && (
                <Modal size="5xl" onClose={() => setEditingService(null)}>
                    <EditServiceModal
                        service={editingService} allUsers={allUsers}
                        onSave={handleSaveService} onCancel={() => setEditingService(null)}
                        showNotification={showNotification}
                    />
                </Modal>
            )}
            <h3 className="text-2xl font-bold mb-4">Relatório de Pagamento de Horas Extras</h3>
            <div className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div><label className="block text-sm font-bold mb-1">Data de Início</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <div><label className="block text-sm font-bold mb-1">Data de Fim</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <button onClick={fetchServices} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>
            </div>

            {allWorkEntries.length > 0 && (
                <div className="flex justify-end space-x-4 mb-4">
                    <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><Download size={18} /><span>Exportar PDF</span></button>
                    <button onClick={exportToXLSX} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><Download size={18} /><span>Exportar Planilha</span></button>
                </div>
            )}
            
            <div className="overflow-x-auto bg-gray-800 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase">
                        <tr>
                            <th className="px-4 py-2">Data</th>
                            <th className="px-4 py-2">Lotação/Função</th>
                            <th className="px-4 py-2">Policial/Supervisor</th>
                            <th className="px-4 py-2">Matrícula</th>
                            <th className="px-4 py-2">Horários</th>
                            <th className="px-4 py-2">Status Pag.</th>
                            <th className="px-4 py-2">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7"><LoadingSpinner /></td></tr>
                        ) : allWorkEntries.length > 0 ? (
                            allWorkEntries.map(entry => (
                                <tr key={entry.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-2">{entry.date.toLocaleDateString('pt-BR')}</td>
                                    <td className="px-4 py-2">{entry.station}</td>
                                    <td className="px-4 py-2">{entry.officerName}</td>
                                    <td className="px-4 py-2">{displayMatricula(entry.matricula)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{`${entry.startTime} - ${entry.endTime} (${entry.totalHours}h)`}</td>
                                    <td className="px-4 py-2">
                                    <span
                                       className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                     entry.paymentStatus === 'paid'
                                      ? 'bg-green-600 text-green-100'
                                      : entry.paymentStatus === 'confirmed'
                                      ? 'bg-blue-600 text-blue-100'
                                      : 'bg-yellow-600 text-yellow-100' }`} >
                                       {entry.paymentStatus === 'paid'
                                         ? 'Pago'
                                         : entry.paymentStatus === 'confirmed'
                                         ? 'Confirmado'
                                         : 'Pendente'}
                                          </span>
                                           </td>
                                    <td className="px-4 py-2">
                                        {entry.isService && (
                                            <button onClick={() => setEditingService(entry.serviceObject)} className="text-blue-400 hover:text-blue-200"><Edit size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center p-4 text-gray-500">Nenhum serviço encontrado para o período selecionado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};