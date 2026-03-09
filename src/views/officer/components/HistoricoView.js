import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LoadingSpinner } from '../../../App';
import { displayMatricula } from '../../../utils/helpers';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';

export const HistoricoView = ({ user, showNotification }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState([]);

    const parseDate = (rawDate) => {
        if (!rawDate) return null;
        if (typeof rawDate === 'string') return new Date(rawDate);
        if (rawDate?.seconds) return new Date(rawDate.seconds * 1000);
        return null;
    };

    const resolveTeamDate = (team) => parseDate(team?.vaga_info?.data || team?.vagaDate);

    const resolveShift = (team) => team?.vaga_info?.turno || team?.vagaShiftType || 'day';

    const resolveLeaderName = (team) => team?.registeringOfficer?.nome || team?.chefe_nome || 'N/A';

    const resolveVehicle = (team) => team?.vehicle || team?.viatura_placa || 'N/A';

    const resolveMembers = (team) => {
        if (Array.isArray(team?.members) && team.members.length > 0) return team.members;
        if (Array.isArray(team?.membros_detalhes) && team.membros_detalhes.length > 0) {
            return team.membros_detalhes.map((member) => ({
                nome: member?.nome || 'Sem nome',
                matricula: member?.matricula || '',
                delegacia: member?.delegacia_nome || '',
            }));
        }
        return [];
    };

    const toggleRow = (id) => setExpandedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user || !user.matricula) { setLoading(false); return; }
            try {
                const teamsData = await apiClient.getTeams({ member_matricula: user.matricula });
                const teams = Array.isArray(teamsData)
                    ? teamsData
                    : (teamsData?.results || []);

                const sortedHistory = teams
                    .sort((a, b) => {
                        const dateA = resolveTeamDate(a);
                        const dateB = resolveTeamDate(b);
                        const timeA = dateA && !Number.isNaN(dateA.getTime()) ? dateA.getTime() : 0;
                        const timeB = dateB && !Number.isNaN(dateB.getTime()) ? dateB.getTime() : 0;
                        return timeB - timeA;
                    });
                setHistory(sortedHistory);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    const gerarRelatorioPessoalPDF = () => {
        if (!history.length) {
            showNotification('Nenhum histórico para gerar relatório.', 'warning');
            return;
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        let totalHoras = 0;

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RELATÓRIO DE SERVIÇOS EXTRAS', pageWidth / 2, 15, { align: 'center' });

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Policial: ${user.nome}`, 14, 25);
        pdf.text(`Matrícula: ${displayMatricula(user.matricula)}`, 14, 30);

        const tableBody = history.map(team => {
            const shift = resolveShift(team);
            const horas = shift === 'day' ? 12 : 6;
            totalHoras += horas;
            const teamDate = resolveTeamDate(team);
            return [
                teamDate && !Number.isNaN(teamDate.getTime()) ? teamDate.toLocaleDateString('pt-BR') : 'N/A',
                shift === 'day' ? 'DIURNO (12h)' : 'NOTURNO (6h)',
                resolveLeaderName(team),
                resolveVehicle(team),
            ];
        });

        autoTable(pdf, {
            head: [['DATA', 'TURNO', 'CHEFE DA EQUIPE', 'VIATURA']],
            body: tableBody,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        });

        const finalY = pdf.lastAutoTable.finalY;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Total de Serviços: ${history.length}`, 14, finalY + 10);
        pdf.text(`Total de Horas Extras: ${totalHoras}h`, 14, finalY + 15);

        pdf.save(`Relatorio_Servicos_${user.nome.split(' ')[0]}_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="text-white">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-blue-400">Meu Histórico de Serviços</h2>
                <button onClick={gerarRelatorioPessoalPDF} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                    <Download size={18} /><span>Baixar Relatório</span>
                </button>
            </div>
            {history.length > 0 ? (
                <div className="overflow-x-auto max-h-[60vh] bg-gray-800 rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase sticky top-0 bg-gray-900">
                            <tr>
                                <th className="px-4 py-2 w-12"></th>
                                <th className="px-4 py-2">Data</th>
                                <th className="px-4 py-2">Horário</th>
                                <th className="px-4 py-2">Chefe da Equipe</th>
                                <th className="px-4 py-2">Viatura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(team => (
                                <React.Fragment key={team.id}>
                                    <tr className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer" onClick={() => toggleRow(team.id)}>
                                        <td className="px-4 py-2 text-center">{expandedRows.includes(team.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                                        <td className="px-4 py-2">{(() => {
                                            const date = resolveTeamDate(team);
                                            return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : 'N/A';
                                        })()}</td>
                                        <td className="px-4 py-2">{resolveShift(team) === 'day' ? '08h-20h' : '19h-01h'}</td>
                                        <td className="px-4 py-2">{resolveLeaderName(team)}</td>
                                        <td className="px-4 py-2">{resolveVehicle(team)}</td>
                                    </tr>
                                    {expandedRows.includes(team.id) && (
                                        <tr className="bg-gray-900/50">
                                            <td colSpan="5" className="p-3">
                                                <div className="p-2 bg-gray-800 rounded">
                                                    <h5 className="font-bold mb-1 text-xs">Componentes da Equipe:</h5>
                                                    <ul className="list-disc list-inside text-xs">
                                                        {resolveMembers(team).map((member, index) => (
                                                            <li key={member.matricula || index}>
                                                                {member.nome} {member.matricula ? `(${displayMatricula(member.matricula)})` : ''} {member.delegacia ? `- ${member.delegacia}` : ''}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-400 pt-4">Nenhum serviço encontrado em seu histórico.</p>
            )}
        </div>
    );
};
export default HistoricoView;
