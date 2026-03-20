import React, { useState, useEffect, useMemo } from 'react';
import ReactCalendar from 'react-calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { apiClient } from '../../../config/api';
import { Modal, LoadingSpinner } from '../../../components/ui/Shared';
import { displayMatricula, formatMatricula, formatPlaca, formatTelefone, normalizeName } from '../../../utils/helpers';
import { findPolicialByMatricula } from '../../../constants/policiais';
import { DEPARTMENTS } from '../../../constants/data';
import { checkLeaderWeeklyLimit, checkWeeklyLimit } from '../../../utils/helpers';
import { getCycleInfo, getWeekInfo } from '../../../utils/helpers';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

const getVagaDateObject = (vaga) => {
    const rawDate = vaga?.data || vaga?.date;
    if (!rawDate) return null;
    if (typeof rawDate === 'string') {
        const isoDateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(rawDate);
        if (isoDateMatch) return new Date(`${isoDateMatch[1]}T12:00:00`);
        return new Date(rawDate);
    }
    if (rawDate?.seconds) return new Date(rawDate.seconds * 1000);
    return null;
};

const getVagaShiftType = (vaga) => String(vaga?.turno || vaga?.shiftType || '').toLowerCase();

const getVagaOperationalDateObject = (vaga) => {
    const parsedDate = getVagaDateObject(vaga);
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;
    return parsedDate;
};

const getVagaDayKey = (vaga) => {
    const parsedDate = getVagaOperationalDateObject(vaga);
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;
    return format(parsedDate, 'yyyy-MM-dd');
};

const getVagaOperationalDayKeys = (vaga) => {
    const parsedDate = getVagaDateObject(vaga);
    if (!parsedDate || Number.isNaN(parsedDate.getTime())) return [];

    if (getVagaShiftType(vaga) === 'night') {
        const previousDay = new Date(parsedDate);
        previousDay.setDate(previousDay.getDate() - 1);
        return [format(previousDay, 'yyyy-MM-dd')];
    }

    return [format(parsedDate, 'yyyy-MM-dd')];
};

const getVagaCapacity = (vaga) => Math.max(1, Number(vaga?.posicoes_disponiveis || 1));

const isVagaDisponivel = (vaga) => {
    const status = String(vaga?.status || '').toLowerCase();
    return status.includes('dispon');
};

const normalizeMatriculaDigits = (value) => String(value || '').replace(/\D/g, '');

const teamHasOfficer = (team, user) => {
    const userMatricula = normalizeMatriculaDigits(user?.matricula);
    if (!userMatricula || !team) return false;

    if (Array.isArray(team?.membros_detalhes) && team.membros_detalhes.some((m) => normalizeMatriculaDigits(m?.matricula) === userMatricula)) {
        return true;
    }

    if (Array.isArray(team?.members) && team.members.some((m) => normalizeMatriculaDigits(m?.matricula) === userMatricula)) {
        return true;
    }

    return false;
};



export const VagasCalendarView = ({ user, showNotification }) => {
    const [activeDate, setActiveDate] = useState(new Date());
    const [monthlyVagas, setMonthlyVagas] = useState([]);
    const [monthlyTeams, setMonthlyTeams] = useState([]);
    const [mySchedule, setMySchedule] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null);

    const fetchAllPages = async (fetcher, params = {}) => {
        const aggregated = [];
        let page = 1;

        while (true) {
            const response = await fetcher({ ...params, page });
            const items = Array.isArray(response) ? response : (response?.results || []);
            aggregated.push(...items);

            if (Array.isArray(response) || !response?.next) {
                break;
            }

            page += 1;
        }

        return aggregated;
    };

    useEffect(() => {
        const fetchMonthlyData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);

            const start = startOfMonth(activeDate);
            const end = endOfMonth(activeDate);

            try {
                const [vagasArray, teamsArray] = await Promise.all([
                    fetchAllPages(apiClient.getVagas.bind(apiClient), {
                        data__gte: format(start, 'yyyy-MM-dd'),
                        data__lte: format(end, 'yyyy-MM-dd')
                    }),
                    fetchAllPages(apiClient.getTeams.bind(apiClient), {
                        vaga__data__gte: format(start, 'yyyy-MM-dd'),
                        vaga__data__lte: format(end, 'yyyy-MM-dd')
                    })
                ]);

                setMonthlyVagas(vagasArray);
                setMonthlyTeams(teamsArray);
            } catch (error) {
                console.error('Erro ao carregar dados do mês:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyData();
        
        // Atualiza dados a cada 20 segundos
        const interval = setInterval(fetchMonthlyData, 20000);
        return () => clearInterval(interval);
    }, [user, activeDate]);

    const vagasByDay = useMemo(() => {
        return monthlyVagas.reduce((acc, vaga) => {
            const dayKey = getVagaDayKey(vaga);
            if (!dayKey) return acc;
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(vaga);
            return acc;
        }, {});
    }, [monthlyVagas]);

    const teamsByVaga = useMemo(() => {
        return monthlyTeams.reduce((acc, team) => {
            const vagaId = Number(team?.vaga || team?.vagaId || team?.vaga_info?.id);
            if (!vagaId) return acc;
            if (!acc[vagaId]) acc[vagaId] = [];
            acc[vagaId].push(team);
            return acc;
        }, {});
    }, [monthlyTeams]);

    const myTeamsByVaga = useMemo(() => {
        return monthlyTeams.reduce((acc, team) => {
            if (!teamHasOfficer(team, user)) return acc;
            const vagaId = Number(team?.vaga || team?.vagaId || team?.vaga_info?.id);
            if (!vagaId) return acc;
            if (!acc[vagaId]) acc[vagaId] = [];
            acc[vagaId].push(team);
            return acc;
        }, {});
    }, [monthlyTeams, user]);

    const myTeamsByOperationalDay = useMemo(() => {
        const vagasById = new Map(monthlyVagas.map((vaga) => [Number(vaga?.id), vaga]));

        return Object.values(myTeamsByVaga).flat().reduce((acc, team) => {
            const vagaId = Number(team?.vaga || team?.vagaId || team?.vaga_info?.id);
            const teamVaga = vagasById.get(vagaId) || team?.vaga_info || null;
            const dayKeys = getVagaOperationalDayKeys(teamVaga);

            dayKeys.forEach((dayKey) => {
                if (!dayKey) return;
                if (!acc[dayKey]) acc[dayKey] = [];
                acc[dayKey].push(team);
            });

            return acc;
        }, {});
    }, [monthlyVagas, myTeamsByVaga]);

    const hasRemainingSlots = (vaga) => {
        const capacity = getVagaCapacity(vaga);
        const used = (teamsByVaga[Number(vaga?.id)] || []).length;
        return used < capacity;
    };

    const handleRegister = async (vaga, teamData) => {
        const parsedVagaDate = getVagaDateObject(vaga);
        const resolvedWeekId = vaga.weekId || (parsedVagaDate ? getWeekInfo(parsedVagaDate).weekId : null);

        const isAlreadyLeader = resolvedWeekId
            ? await checkLeaderWeeklyLimit(user.matricula, resolvedWeekId)
            : false;
        if (isAlreadyLeader) {
            showNotification(
                'Você já é o chefe de uma equipe escalada para esta semana e não pode registrar outra.',
                'error'
            );
            return;
        }

        const memberMatriculas = teamData.members.map(m => m.matricula);
        const validation = resolvedWeekId
            ? await checkWeeklyLimit(memberMatriculas, resolvedWeekId)
            : { conflict: false };

        let teamStatus = 'Em Análise';
        let conflictDetails = null;

        if (validation.conflict) {
            teamStatus = 'Pendente (Conflito)';
            conflictDetails = {
                officerName: validation.officerName,
                officerMatricula: validation.officerMatricula,
            };
            showNotification(
                `ALERTA: ${validation.officerName} (Mat. ${displayMatricula(validation.officerMatricula)}) já está escalado(a) nesta semana. A inscrição será enviada para análise do conflito.`,
                'warning',
                8000
            );
        }

        try {
            const vagaDateObj = getVagaDateObject(vaga);
            if (!vagaDateObj) {
                showNotification('Data da vaga inválida. Atualize a página e tente novamente.', 'error');
                return;
            }

            const membrosMatriculas = teamData.members
                .map((member) => normalizeMatriculaDigits(member?.matricula))
                .filter(Boolean);

            if (membrosMatriculas.length !== teamData.members.length) {
                showNotification('Informe a matrícula válida de todos os integrantes da equipe.', 'error');
                return;
            }

            const membrosNomes = teamData.members.reduce((acc, member) => {
                const matricula = normalizeMatriculaDigits(member?.matricula);
                if (matricula) {
                    acc[matricula] = member?.nome || '';
                }
                return acc;
            }, {});
            
            const team = {
                vaga: vaga.id,
                chefe_matricula: membrosMatriculas[0],
                membros_matriculas: membrosMatriculas,
                membros_nomes: membrosNomes,
                status: teamStatus,
                telefone_contato: teamData.telefone,
                observacoes: conflictDetails
                    ? `Conflito de escala: ${conflictDetails.officerName} (${conflictDetails.officerMatricula})`
                    : null,
            };

            // Cria o team
            const createdTeam = await apiClient.createTeam(team);
            
            const refreshedTeams = await apiClient.getTeams({ vaga: vaga.id });
            const teamsForVaga = Array.isArray(refreshedTeams)
                ? refreshedTeams
                : (refreshedTeams?.results || []);
            const nextStatus = teamsForVaga.length >= getVagaCapacity(vaga) ? 'Ocupada' : 'Disponível';
            await apiClient.updateVaga(vaga.id, { status: nextStatus });

            showNotification('Candidatura registrada com status Em Análise.', 'success');

            const optimisticTeam = {
                ...createdTeam,
                vaga: vaga.id,
                status: teamStatus,
                members: teamData.members,
                membros_detalhes: createdTeam?.membros_detalhes || [],
            };

            setMonthlyTeams((prev) => {
                const filtered = prev.filter((t) => Number(t?.id) !== Number(optimisticTeam?.id));
                return [...filtered, optimisticTeam];
            });

            setMonthlyVagas((prev) => prev.map((item) => (
                Number(item?.id) === Number(vaga?.id)
                    ? { ...item, status: nextStatus }
                    : item
            )));

            setModalContent(null);

        } catch (error) {
            console.error('Erro ao registrar equipe:', error);
            showNotification('Falha ao registrar a equipe. Tente novamente.', 'error');
        }
    };

    const renderTileContent = ({ date, view }) => {
        if (view === 'month') {
            const dayKey = format(date, 'yyyy-MM-dd');
            const vagasDoDia = vagasByDay[dayKey] || [];

            const myTeamOnThisDay = (myTeamsByOperationalDay[dayKey] || [])[0] || null;

            const availableSlots = vagasDoDia.reduce((sum, vaga) => {
                if (!isVagaDisponivel(vaga)) return sum;
                const capacity = getVagaCapacity(vaga);
                const used = (teamsByVaga[Number(vaga?.id)] || []).length;
                return sum + Math.max(0, capacity - used);
            }, 0);

            if (myTeamOnThisDay) {
                if (myTeamOnThisDay.status === 'Em Análise' || myTeamOnThisDay.status === 'Pendente (Conflito)') {
                    return (
                        <div className="mt-1 text-xs text-center bg-yellow-600/90 text-white rounded-md p-1 animate-fade-in">Em Análise</div>
                    );
                }
                return (
                    <div className="mt-1 text-xs text-center bg-green-600/90 text-white rounded-md p-1 animate-fade-in">Meu Turno</div>
                );
            }

            if (availableSlots > 0) {
                return (
                    <div className="mt-1 text-xs text-center bg-blue-600/80 text-white rounded-md p-1 animate-fade-in">{availableSlots} Vaga(s)</div>
                );
            }
        }
        return null;
    };

    const handleDayClick = (date) => {
        const dayKey = format(date, 'yyyy-MM-dd');
        const vagasDoDia = vagasByDay[dayKey] || [];
        const firstAvailableVaga = vagasDoDia.find((vaga) => isVagaDisponivel(vaga) && hasRemainingSlots(vaga));

        if (firstAvailableVaga) {
            setModalContent({ type: 'register', vaga: firstAvailableVaga });
        } else {
            showNotification('Nenhuma vaga disponível para este dia.', 'info');
        }
    };

    const renderModalContent = () => {
        if (!modalContent) return null;
        if (modalContent.type === 'register') {
            return (
                <RegistrationForm
                    vaga={modalContent.vaga}
                    user={user}
                    onSubmit={handleRegister}
                    onCancel={() => setModalContent(null)}
                    showNotification={showNotification}
                />
            );
        }
        return null;
    };

    return (
        <div>
            {modalContent && (
                <Modal size="5xl" onClose={() => setModalContent(null)}>{renderModalContent()}</Modal>
            )}
            <h2 className="text-3xl font-bold mb-4 text-center text-blue-400">Escala e Vagas Disponíveis</h2>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg calendar-container">
                    <style>{`
                        .calendar-container .react-calendar { width: 100%; border: none; background-color: transparent; color: white; }
                        .calendar-container .react-calendar__navigation button { color: #60a5fa; font-weight: bold; }
                        .calendar-container .react-calendar__month-view__weekdays__weekday { color: #9ca3af; text-align: center; font-weight: bold; }
                        .calendar-container .react-calendar__tile { background-color: #1f2937; border-radius: 8px; border: 2px solid #374151; height: 120px; display:flex; flex-direction:column; align-items:flex-start; padding:4px; }
                    `}</style>
                    <ReactCalendar
                        onChange={setActiveDate}
                        value={activeDate}
                        onActiveStartDateChange={({ activeStartDate }) => setActiveDate(activeStartDate)}
                        prevLabel="<"
                        nextLabel=">"
                        prev2Label={null}
                        next2Label={null}
                        formatMonthYear={(_, date) => format(date, 'MM/yyyy')}
                        tileContent={renderTileContent}
                        onClickDay={handleDayClick}
                        locale="pt-BR"
                    />
                </div>
            )}
        </div>
    );
};
export default VagasCalendarView;
export const RegistrationForm = ({ vaga, user, onSubmit, onCancel, showNotification }) => {
    const [team, setTeam] = useState([
        { nome: user?.nome || '', matricula: user?.matricula || '', departamento: user?.departamento || '', delegacia: user?.delegacia || '', telefone: user?.telefone || '', uid: user?.uid || '' },
        { nome: '', matricula: '', departamento: '', delegacia: '' },
        { nome: '', matricula: '', departamento: '', delegacia: '' },
    ]);
    const [vehicle, setVehicle] = useState('');
    const handleMemberChange = (index, field, value) => {
        const newTeam = [...team];
        newTeam[index][field] = value;
        if (field === 'departamento') newTeam[index]['delegacia'] = '';
        if (field === 'nome') newTeam[index][field] = normalizeName(value);
        if (field === 'matricula') {
            newTeam[index][field] = formatMatricula(value);
            const found = findPolicialByMatricula(value);
            if (found) {
                newTeam[index]['nome'] = found.nome;
                // Optionally set department/cargo if available
                if (found.cargo) newTeam[index]['departamento'] = found.cargo;
            }
        }
        if (field === 'telefone') newTeam[index][field] = formatTelefone(value);
        setTeam(newTeam);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const finalTeam = team.map(m => ({ ...m, matricula: formatMatricula(m.matricula) }));
        if (finalTeam.some(m => !m.nome || m.matricula.length < 7 || !m.delegacia) || !vehicle || team[0].telefone.replace(/\D/g, '').length < 10) {
            showNotification("Preencha todos os campos da equipe, incluindo telefone válido do líder e placa da viatura.", "error");
            return;
        }
        onSubmit(vaga, { members: finalTeam, vehicle, telefone: team[0].telefone });
    };
    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Equipe para Serviço</h2>
            <p className="mb-6 text-gray-600">Dia: <span className="font-semibold">{(getVagaOperationalDateObject(vaga) || new Date()).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span></p>
            {team.map((member, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-2 text-gray-700">Componente {index + 1} {index === 0 ? "(Chefe da Equipe)" : ""}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="NOME COMPLETO" value={member.nome} onChange={(e) => handleMemberChange(index, 'nome', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 uppercase" required />
                        <div><input type="text" placeholder="MATRÍCULA" value={member.matricula} onChange={(e) => handleMemberChange(index, 'matricula', e.target.value)} maxLength="8" className="w-full p-2 border rounded-md text-gray-800" required /><small className="text-gray-500">Formato final: {displayMatricula(member.matricula)}</small></div>
                        <select value={member.departamento} onChange={(e) => handleMemberChange(index, 'departamento', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required><option value="">SELECIONE O DEPARTAMENTO</option>{Object.keys(DEPARTMENTS || {}).map(dep => <option key={dep} value={dep}>{dep}</option>)}</select>
                        <select value={member.delegacia} onChange={(e) => handleMemberChange(index, 'delegacia', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required disabled={!member.departamento}><option value="">SELECIONE A DELEGACIA</option>{member.departamento && (DEPARTMENTS[member.departamento] || []).map(del => <option key={del} value={del}>{del}</option>)}</select>
                        {index === 0 && <div><label className="block text-sm font-medium text-gray-700">Telefone do Chefe da Equipe</label><input type="tel" placeholder="(XX) XXXXX-XXXX" value={member.telefone} onChange={(e) => handleMemberChange(index, 'telefone', e.target.value)} maxLength="15" className="w-full p-2 border rounded-md text-gray-800" required /></div>}
                    </div>
                </div>
            ))}
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white"><h3 className="font-bold text-lg mb-2 text-gray-700">Viatura</h3><input type="text" placeholder="PLACA (ABC-1234)" value={vehicle} onChange={(e) => setVehicle(formatPlaca(e.target.value))} maxLength="8" className="w-full p-2 border rounded-md text-gray-800 uppercase" required /></div>
            <div className="flex justify-end space-x-4"><button type="button" onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button><button type="submit" className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Confirmar Registro</button></div>
        </form>
    );
};