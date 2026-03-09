// src/views/admin/componets/PaymentReport.js


import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../../config/api';
import { 
    normalizeName, 
    calculateHours, 
    displayMatricula 
} from '../../../utils/helpers'
import { LoadingSpinner } from '../../../components/ui/Shared';
export const PaymentReportView = ({ allUsers = [], showNotification, departamento }) => {
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [services, setServices] = useState([]);
    const [convoysForPeriod, setConvoysForPeriod] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTeams, setExpandedTeams] = useState({});
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [substitutions, setSubstitutions] = useState({});
    const [substituteSelectorOpen, setSubstituteSelectorOpen] = useState({});

    const userMatriculaMap = useMemo(() => {
        const map = new Map();
        allUsers.forEach(user => {
            map.set(normalizeName(user.nome), user.matricula);
        });
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
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchServices();
        }
    }, [startDate, endDate]);

    // ALTERAÇÃO CENTRAL: Lógica reescrita para garantir supervisores únicos por dia
    const allWorkEntries = useMemo(() => {
        if (services.length === 0 && convoysForPeriod.length === 0) return [];

        const teamEntries = [];
        const serviceMap = new Map(services.map(s => [s.id, s]));

        // 1. Adiciona os membros das equipes operacionais (sem alteração aqui)
        services.forEach(service => {
            const vagaDate = service?.vaga_info?.data || service?.vagaDate;
            const data = typeof vagaDate === 'string' ? new Date(vagaDate) : new Date(vagaDate?.seconds * 1000);
            if (!data || Number.isNaN(data.getTime())) return;

            const turno = service?.vaga_info?.turno || service?.vagaShiftType;
            const inicio = service.horarioEntrada || (turno === 'day' ? '08:00' : '19:00');
            const fim = service.horarioSaida || (turno === 'day' ? '20:00' : '01:00');
            const horas = calculateHours(inicio, fim);
            const lotacao = service.teamName || service.delegaciaPrincipal || service?.vaga_info?.delegacia_nome || 'N/A';
            const leaderName = service?.registeringOfficer?.nome || service?.chefe_nome || 'Chefe não informado';
            const leaderMatricula = service?.registeringOfficer?.matricula || userMatriculaMap.get(normalizeName(leaderName)) || 'N/A';

            teamEntries.push({
                id: `${service.id}-${leaderMatricula}`,
                isService: true,
                serviceObject: service,
                date: data,
                station: lotacao,
                officerName: leaderName,
                matricula: leaderMatricula,
                startTime: inicio,
                endTime: fim,
                totalHours: horas,
                paymentStatus: service.paymentStatus || 'pending'
            });
        });

        // 2. Cria uma lista de supervisores únicos por dia
        const supervisorEntriesMap = new Map(); // Usado para garantir a unicidade
        convoysForPeriod.forEach(convoy => {
            const convoyDate = convoy?.data || convoy?.date;
            const data = typeof convoyDate === 'string' ? new Date(convoyDate) : new Date(convoyDate?.seconds * 1000);
            if (!data || Number.isNaN(data.getTime())) return;
            const dateKey = data.toISOString().split('T')[0];
            const representativeTeam = serviceMap.values().next().value;
            const representativeShift = representativeTeam?.vaga_info?.turno || representativeTeam?.vagaShiftType || 'day';
            const inicio = representativeTeam?.horarioEntrada || (representativeShift === 'day' ? '08:00' : '19:00');
            const fim = representativeTeam?.horarioSaida || (representativeShift === 'day' ? '20:00' : '01:00');
            const horas = calculateHours(inicio, fim);

            // Adiciona DPC se não existir para esse dia
            if (convoy.dpc) {
                const entryKey = `${dateKey}-${convoy.dpc}`;
                if (!supervisorEntriesMap.has(entryKey)) {
                    supervisorEntriesMap.set(entryKey, {
                        id: `${convoy.id || dateKey}-dpc`,
                        isService: false,
                        isSupervisor: true,
                        convoyId: convoy.id,
                        supervisorRole: 'dpc',
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
                        id: `${convoy.id || dateKey}-oip`,
                        isService: false,
                        isSupervisor: true,
                        convoyId: convoy.id,
                        supervisorRole: 'oip',
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
        return [...teamEntries, ...supervisorEntries].sort((a, b) => b.date - a.date);

    }, [services, convoysForPeriod, userMatriculaMap]);

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
                    teamName: service.teamName || service.delegaciaPrincipal || service?.vaga_info?.delegacia_nome || `Equipe ${service.id}`,
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
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.dateObj - a.dateObj);
    }, [services, convoysByDate]);

    const toggleTeamExpand = (teamId) => {
        setExpandedTeams((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
    };

    const getMemberStatusKey = (teamId, member) => `${teamId}-${member?.id || member?.uid || member?.matricula || member?.nome}`;

    const setMemberStatus = (teamRow, member, status) => {
        const key = getMemberStatusKey(teamRow.id, member);
        setAttendanceStatus((prev) => ({ ...prev, [key]: status }));
        if (status !== 'substituto') {
            setSubstitutions((prev) => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
            setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: false }));
        }
    };

    const handleOpenSubstituteSelector = (teamRow, member) => {
        const key = getMemberStatusKey(teamRow.id, member);
        setAttendanceStatus((prev) => ({ ...prev, [key]: 'substituto' }));
        setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: true }));
    };

    const handleSelectSubstitute = (teamRow, member, substituteId) => {
        const key = getMemberStatusKey(teamRow.id, member);
        const selected = allUsers.find((u) => String(u.id) === String(substituteId));
        if (!selected) return;

        setSubstitutions((prev) => ({
            ...prev,
            [key]: {
                id: selected.id,
                nome: selected.nome,
                matricula: selected.matricula,
            },
        }));

        setAttendanceStatus((prev) => ({ ...prev, [key]: 'substituto' }));
        setSubstituteSelectorOpen((prev) => ({ ...prev, [key]: false }));
        showNotification(`Substituição registrada: ${selected.nome}`, 'success');
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
            <h3 className="text-2xl font-bold mb-4">Frequência Operacional</h3>
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
                                                <button
                                                    onClick={() => toggleTeamExpand(teamRow.id)}
                                                    className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                                >
                                                    {isExpanded ? 'Ocultar' : 'Ver equipe'}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-gray-900/40 border-b border-gray-700">
                                                <td colSpan="6" className="px-4 py-3">
                                                    <div className="text-xs text-gray-400 mb-2">
                                                        Janela para registrar presença/falta: {windowLabel} {canMarkActions ? '(permitido)' : '(fora do horário)'}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {teamRow.members.length === 0 ? (
                                                            <div className="text-sm text-gray-400">Nenhum integrante encontrado nesta equipe.</div>
                                                        ) : (
                                                            teamRow.members.map((member, idx) => {
                                                                const key = getMemberStatusKey(teamRow.id, member);
                                                                const status = attendanceStatus[key] || 'pendente';
                                                                const substitute = substitutions[key];
                                                                return (
                                                                    <div key={key || idx} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-800 p-2 rounded">
                                                                        <div>
                                                                            <div className="font-semibold text-white">{member?.nome || 'Sem nome'}</div>
                                                                            <div className="text-xs text-gray-400">Mat.: {displayMatricula(member?.matricula || '')}</div>
                                                                            {substitute && (
                                                                                <div className="text-xs text-purple-300 mt-1">
                                                                                    Substituído por: {substitute.nome} ({displayMatricula(substitute.matricula)})
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                                                status === 'presente' ? 'bg-green-700 text-green-100' :
                                                                                status === 'falta' ? 'bg-red-700 text-red-100' :
                                                                                status === 'substituto' ? 'bg-purple-700 text-purple-100' :
                                                                                'bg-gray-600 text-gray-100'
                                                                            }`}>
                                                                                {status === 'presente' ? 'Presente' : status === 'falta' ? 'Falta' : status === 'substituto' ? 'Substituto' : 'Pendente'}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => setMemberStatus(teamRow, member, 'presente')}
                                                                                disabled={!canMarkActions}
                                                                                title={!canMarkActions ? 'Fora da janela permitida para presença' : 'Confirmar presença'}
                                                                                className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white text-xs"
                                                                            >
                                                                                Presença
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setMemberStatus(teamRow, member, 'falta')}
                                                                                disabled={!canMarkActions}
                                                                                title={!canMarkActions ? 'Fora da janela permitida para falta' : 'Marcar falta'}
                                                                                className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white text-xs"
                                                                            >
                                                                                Falta
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleOpenSubstituteSelector(teamRow, member)}
                                                                                className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                                                            >
                                                                                Substituto
                                                                            </button>
                                                                        </div>
                                                                        {substituteSelectorOpen[key] && (
                                                                            <div className="md:col-span-2">
                                                                                <select
                                                                                    defaultValue=""
                                                                                    onChange={(e) => handleSelectSubstitute(teamRow, member, e.target.value)}
                                                                                    className="w-full md:w-96 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                                                                                >
                                                                                    <option value="" disabled>Selecione quem substituiu</option>
                                                                                    {allUsers
                                                                                        .filter((u) => String(u?.matricula || '') !== String(member?.matricula || ''))
                                                                                        .map((u) => (
                                                                                            <option key={u.id} value={u.id}>
                                                                                                {u.nome} ({displayMatricula(u.matricula)})
                                                                                            </option>
                                                                                        ))}
                                                                                </select>
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