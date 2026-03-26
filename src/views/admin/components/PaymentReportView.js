// src/views/admin/componets/PaymentReport.js


import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiClient } from '../../../config/api';
import { 
    displayMatricula 
} from '../../../utils/helpers'
import { LoadingSpinner } from '../../../components/ui/Shared';

const ATTENDANCE_STORAGE_KEY = 'payment_report_attendance_v1';

export const PaymentReportView = ({ allUsers = [], showNotification, departamento }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [services, setServices] = useState([]);
    const [convoysForPeriod, setConvoysForPeriod] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTeams, setExpandedTeams] = useState({});
    const [attendanceStatus, setAttendanceStatus] = useState(() => {
        try {
            const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
            if (!saved) return {};
            const parsed = JSON.parse(saved);
            return parsed?.attendanceStatus || {};
        } catch {
            return {};
        }
    });
    const [substitutions, setSubstitutions] = useState(() => {
        try {
            const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
            if (!saved) return {};
            const parsed = JSON.parse(saved);
            return parsed?.substitutions || {};
        } catch {
            return {};
        }
    });
    const [substituteSelectorOpen, setSubstituteSelectorOpen] = useState({});
    const [substituteSearchTerms, setSubstituteSearchTerms] = useState({});

    const getUserName = (user) => {
        if (!user) return '';
        return String(
            user?.nome ||
            user?.usuario?.first_name ||
            user?.usuario?.username ||
            user?.name ||
            user?.full_name ||
            ''
        ).trim();
    };

    const getUserDisplayName = (user) => {
        const nome = getUserName(user);
        if (nome) return nome;

        const matricula = displayMatricula(user?.matricula || '');
        if (matricula) return `Sem nome - Mat. ${matricula}`;

        return `Usuário ${user?.id || ''}`.trim();
    };

    const getFilteredSubstituteUsers = (member, searchTerm) => {
        const termo = String(searchTerm || '').trim().toLowerCase();

        return allUsers.filter((u) => {
            if (String(u?.matricula || '') === String(member?.matricula || '')) {
                return false;
            }

            if (!termo) return true;

            const nomeExibicao = getUserDisplayName(u).toLowerCase();
            return nomeExibicao.includes(termo) || String(u?.matricula || '').includes(termo);
        });
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'presente') return 'bg-green-700 text-green-100';
        if (status === 'falta') return 'bg-red-700 text-red-100';
        if (status === 'substituto') return 'bg-purple-700 text-purple-100';
        return 'bg-gray-600 text-gray-100';
    };

    const getStatusLabel = (status) => {
        if (status === 'presente') return 'Presente';
        if (status === 'falta') return 'Falta';
        if (status === 'substituto') return 'Substituto';
        return 'Pendente';
    };

    const extractDepartamentoFromObservacoes = useCallback((observacoes) => {
        const text = String(observacoes || '');
        const re = /Departamento:\s*([^|\n]+)/i;
        const match = re.exec(text);
        return String(match?.[1] || '').trim();
    }, []);

    const resolveTeamName = useCallback((service) => {
        const departamentoObservacao = extractDepartamentoFromObservacoes(service?.observacoes);
        return (
            departamentoObservacao ||
            service?.departamento_sigla ||
            service?.departamento_nome ||
            service?.departamento ||
            service?.teamName ||
            service?.delegaciaPrincipal ||
            service?.vaga_info?.delegacia_nome ||
            `Equipe ${service?.id}`
        );
    }, [extractDepartamentoFromObservacoes]);

    useEffect(() => {
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify({ attendanceStatus, substitutions }));
    }, [attendanceStatus, substitutions]);

    const persistTeamAttendance = async (teamRow, nextAttendanceStatus, nextSubstitutions) => {
        const teamKeys = Object.keys(nextAttendanceStatus).filter((key) => key.startsWith(`${teamRow.id}-`));
        const attendancePayload = teamKeys.map((key) => ({
            key,
            status: nextAttendanceStatus[key],
            substitution: nextSubstitutions[key] || null,
        }));

        const observacoesAtuais = String(teamRow?.rawService?.observacoes || '');
        const semBlocoAnterior = observacoesAtuais.replace(/\n?ATTENDANCE::\{[\s\S]*\}$/m, '').trim();
        const attendanceText = `ATTENDANCE::${JSON.stringify({
            updatedAt: new Date().toISOString(),
            teamId: teamRow.id,
            date: teamRow.dateKey,
            attendance: attendancePayload,
        })}`;

        const observacoes = semBlocoAnterior
            ? `${semBlocoAnterior}\n${attendanceText}`
            : attendanceText;

        try {
            await apiClient.updateTeam(teamRow.id, { observacoes });
        } catch (error) {
            console.error('Falha ao persistir presença no backend:', error);
        }
    };

    const fetchServices = useCallback(async () => {
        if (!startDate || !endDate) {
            showNotification("Por favor, selecione as datas de início e fim.", "error");
            return;
        }
        setLoading(true);
        setServices([]);
        setConvoysForPeriod([]);
        try {
            const [teamsResponse, convoysResponse] = await Promise.all([
                apiClient.getTeams({
                    'vaga__data__gte': startDate,
                    'vaga__data__lte': endDate,
                }),
                apiClient.getConvoys(),
            ]);

            const fetchedServices = Array.isArray(teamsResponse)
                ? teamsResponse
                : (teamsResponse?.results || []);
            const allConvoys = Array.isArray(convoysResponse)
                ? convoysResponse
                : (convoysResponse?.results || []);

            const filteredConvoys = allConvoys.filter((convoy) => {
                const convoyDate = convoy?.data || convoy?.date;
                if (!convoyDate) return false;
                const isoDate = typeof convoyDate === 'string'
                    ? convoyDate.split('T')[0]
                    : new Date(convoyDate.seconds * 1000).toISOString().split('T')[0];
                return isoDate >= startDate && isoDate <= endDate;
            });

            setServices(fetchedServices);
            setConvoysForPeriod(filteredConvoys);

        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
            showNotification("Falha ao carregar relatório.", "error");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, showNotification]);

    useEffect(() => {
        if (startDate && endDate) {
            fetchServices();
        }
    }, [fetchServices, startDate, endDate]);

    const convoysByDate = useMemo(() => {
        const map = new Map();
        convoysForPeriod.forEach((convoy) => {
            const convoyDate = convoy?.data || convoy?.date;
            const dateObj = typeof convoyDate === 'string'
                ? new Date(convoyDate)
                : new Date(convoyDate?.seconds * 1000);
            if (!dateObj || Number.isNaN(dateObj.getTime())) return;
            const dateKey = dateObj.toISOString().split('T')[0];
            const existing = map.get(dateKey) || [];
            map.set(dateKey, [...existing, convoy]);
        });
        return map;
    }, [convoysForPeriod]);

    const frequencyRows = useMemo(() => {
        return services
            .map((service) => {
                const vagaDate = service?.vaga_info?.data || service?.vagaDate;
                const dateObj = typeof vagaDate === 'string'
                    ? new Date(vagaDate)
                    : new Date(vagaDate?.seconds * 1000);
                if (!dateObj || Number.isNaN(dateObj.getTime())) return null;

                const dateKey = dateObj.toISOString().split('T')[0];
                const convoysOnDate = convoysByDate.get(dateKey) || [];
                const firstConvoy = convoysOnDate[0];

                const turno = service?.vaga_info?.turno || service?.vagaShiftType;
                const startTime = service.horarioEntrada || (turno === 'night' ? '19:00' : '08:00');
                const endTime = service.horarioSaida || (turno === 'night' ? '01:00' : '20:00');

                const members = Array.isArray(service?.membros_detalhes) && service.membros_detalhes.length > 0
                    ? service.membros_detalhes
                    : (service?.registeringOfficer ? [service.registeringOfficer] : []);

                return {
                    id: service.id,
                    dateObj,
                    dateKey,
                    teamName: resolveTeamName(service),
                    comboio: convoysOnDate.length > 0
                        ? `Formado (${convoysOnDate.length})`
                        : 'Sem comboio',
                    area: firstConvoy
                        ? `AIS ${firstConvoy.ais || 'N/A'} - ${firstConvoy.bairros || 'N/A'}`
                        : 'N/A',
                    phone: service?.telefone_contato || service?.chefeEquipeTelefone || 'Não informado',
                    startTime,
                    endTime,
                    members,
                    rawService: service,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.dateObj - a.dateObj);
    }, [services, convoysByDate, resolveTeamName]);

    const toggleTeamExpand = (teamId) => {
        setExpandedTeams((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
    };

    const getMemberStatusKey = (teamId, member) => `${teamId}-${member?.id || member?.uid || member?.matricula || member?.nome}`;

    const setMemberStatus = async (teamRow, member, status) => {
        const key = getMemberStatusKey(teamRow.id, member);
        const nextAttendanceStatus = { ...attendanceStatus, [key]: status };
        setAttendanceStatus(nextAttendanceStatus);
        if (status !== 'substituto') {
            const nextSubstitutions = { ...substitutions };
            delete nextSubstitutions[key];
            setSubstitutions(nextSubstitutions);
            setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: false }));
            await persistTeamAttendance(teamRow, nextAttendanceStatus, nextSubstitutions);
            return;
        }

        await persistTeamAttendance(teamRow, nextAttendanceStatus, substitutions);
    };

    const handleOpenSubstituteSelector = (teamRow, member) => {
        const key = getMemberStatusKey(teamRow.id, member);
        setAttendanceStatus((prev) => ({ ...prev, [key]: 'substituto' }));
        setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: true }));
        setSubstituteSearchTerms((prev) => ({ ...prev, [key]: '' }));
    };

    const handleSelectSubstitute = async (teamRow, member, substituteId) => {
        const key = getMemberStatusKey(teamRow.id, member);
        const selected = allUsers.find((u) => String(u.id) === String(substituteId));
        if (!selected) return;

        const nextSubstitutions = {
            ...substitutions,
            [key]: {
                id: selected.id,
                nome: getUserDisplayName(selected),
                matricula: selected.matricula,
            },
        };

        const nextAttendanceStatus = { ...attendanceStatus, [key]: 'substituto' };

        setSubstitutions(nextSubstitutions);
        setAttendanceStatus(nextAttendanceStatus);
        setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: false }));
        setSubstituteSearchTerms((prev) => { const n = { ...prev }; delete n[key]; return n; });
        showNotification(`Substituição registrada: ${getUserDisplayName(selected)}`, 'success');
        await persistTeamAttendance(teamRow, nextAttendanceStatus, nextSubstitutions);
    };

    const getAttendanceWindow = (teamRow) => {
        const now = new Date();
        const [startHour, startMinute] = (teamRow.startTime || '08:00').split(':').map(Number);
        const [endHour, endMinute] = (teamRow.endTime || '20:00').split(':').map(Number);

        const start = new Date(teamRow.dateObj);
        start.setHours(startHour || 0, startMinute || 0, 0, 0);

        const end = new Date(teamRow.dateObj);
        end.setHours(endHour || 0, endMinute || 0, 0, 0);
        if (end <= start) {
            end.setDate(end.getDate() + 1);
        }

        const windowStart = new Date(start.getTime() - 60 * 60 * 1000);
        const windowEnd = new Date(end.getTime() + 60 * 60 * 1000);

        return {
            canMarkActions: now >= windowStart && now <= windowEnd,
            windowLabel: `${windowStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} até ${windowEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        };
    };

    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Frequência Operacional (Atualizada v2)</h3>
            <div className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div><label className="block text-sm font-bold mb-1">Data de Início</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <div><label className="block text-sm font-bold mb-1">Data de Fim</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <button onClick={fetchServices} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>
            </div>

            <div className="overflow-x-auto bg-gray-800 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase">
                        <tr>
                            <th className="px-4 py-2">Dia</th>
                            <th className="px-4 py-2">Equipe</th>
                            <th className="px-4 py-2">Comboio</th>
                            <th className="px-4 py-2">Área</th>
                            <th className="px-4 py-2">Telefone</th>
                            <th className="px-4 py-2">Integrantes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6"><LoadingSpinner /></td></tr>
                        ) : frequencyRows.length > 0 ? (
                            frequencyRows.map(teamRow => {
                                const isExpanded = Boolean(expandedTeams[teamRow.id]);
                                const { canMarkActions, windowLabel } = getAttendanceWindow(teamRow);

                                return (
                                    <React.Fragment key={teamRow.id}>
                                        <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="px-4 py-2">{teamRow.dateObj.toLocaleDateString('pt-BR')}</td>
                                            <td className="px-4 py-2">{teamRow.teamName}</td>
                                            <td className="px-4 py-2">{teamRow.comboio}</td>
                                            <td className="px-4 py-2">{teamRow.area}</td>
                                            <td className="px-4 py-2">{teamRow.phone}</td>
                                            <td className="px-4 py-2">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => toggleTeamExpand(teamRow.id)}
                                                        className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                                    >
                                                        {isExpanded ? 'Ocultar' : 'Ver equipe'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-gray-900/40 border-b border-gray-700">
                                                <td colSpan="6" className="px-4 py-3">
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                                                        <div className="text-xs text-gray-400">
                                                            Janela para registrar presença/falta/substituição: {windowLabel} {canMarkActions ? '✅ permitido' : '🔒 fora do horário - ações bloqueadas'}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {teamRow.members.length === 0 ? (
                                                            <div className="text-sm text-gray-400">Nenhum integrante encontrado nesta equipe.</div>
                                                        ) : (
                                                            teamRow.members.map((member, idx) => {
                                                                const key = getMemberStatusKey(teamRow.id, member);
                                                                const status = attendanceStatus[key] || 'pendente';
                                                                const substitute = substitutions[key];
                                                                const substituteCandidates = getFilteredSubstituteUsers(member, substituteSearchTerms[key]);
                                                                return (
                                                                    <div key={key || idx} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-800 p-2 rounded">
                                                                        <div>
                                                                            <div className="font-semibold text-white">{getUserDisplayName(member)}</div>
                                                                            <div className="text-xs text-gray-400">Mat.: {displayMatricula(member?.matricula || '')}</div>
                                                                            {substitute && (
                                                                                <div className="text-xs text-purple-300 mt-1">
                                                                                    Substituído por: {substitute.nome} ({displayMatricula(substitute.matricula)})
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusBadgeClass(status)}`}>
                                                                                {getStatusLabel(status)}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => setMemberStatus(teamRow, member, 'presente')}
                                                                                disabled={!canMarkActions}
                                                                                title={canMarkActions ? 'Confirmar presença' : `Fora da janela permitida: ${windowLabel}`}
                                                                                className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-xs"
                                                                            >
                                                                                Presença
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setMemberStatus(teamRow, member, 'falta')}
                                                                                disabled={!canMarkActions}
                                                                                title={canMarkActions ? 'Registrar falta' : `Fora da janela permitida: ${windowLabel}`}
                                                                                className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-xs"
                                                                            >
                                                                                Falta
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleOpenSubstituteSelector(teamRow, member)}
                                                                                disabled={!canMarkActions}
                                                                                title={canMarkActions ? 'Registrar substituição' : `Fora da janela permitida: ${windowLabel}`}
                                                                                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-xs"
                                                                            >
                                                                                Substituir
                                                                            </button>
                                                                        </div>
                                                                        {substituteSelectorOpen[key] && (
                                                                            <div className="md:col-span-2 mt-2">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Digite o nome do policial substituto..."
                                                                                    value={substituteSearchTerms[key] || ''}
                                                                                    onChange={(e) => setSubstituteSearchTerms((prev) => ({ ...prev, [key]: e.target.value }))}
                                                                                    className="w-full md:w-96 p-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-400 mb-1"
                                                                                    autoFocus
                                                                                />
                                                                                <div className="w-full md:w-96 max-h-40 overflow-y-auto bg-gray-700 border border-gray-600 rounded">
                                                                                    {substituteCandidates
                                                                                        .map((u) => (
                                                                                            <button
                                                                                                key={u.id}
                                                                                                type="button"
                                                                                                onClick={() => handleSelectSubstitute(teamRow, member, u.id)}
                                                                                                className="w-full text-left p-2 hover:bg-gray-600 cursor-pointer text-sm text-white border-b border-gray-600 last:border-0"
                                                                                            >
                                                                                                {getUserDisplayName(u)} ({displayMatricula(u.matricula)})
                                                                                            </button>
                                                                                        ))}
                                                                                    {substituteCandidates.length === 0 && (
                                                                                        <div className="p-2 text-sm text-gray-400 text-center">Nenhum policial encontrado</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <tr><td colSpan="6" className="text-center p-4 text-gray-500">Nenhuma equipe encontrada para o período selecionado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};