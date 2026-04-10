import React, { useState, useEffect, useMemo } from 'react';
import ReactCalendar from 'react-calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { apiClient } from '../../../config/api';
import { Modal, LoadingSpinner } from '../../../components/ui/Shared';
import {
    checkLeaderWeeklyLimit,
    checkSingleDelegaciaDepartmentWeeklyLimit,
    checkWeeklyLimit,
    displayMatricula,
    formatMatricula,
    formatPlaca,
    formatTelefone,
    getWeekInfo,
    normalizeName,
    parseApiDate,
} from '../../../utils/helpers';
import { findPolicialByMatricula } from '../../../constants/policiais';
import { DEPARTMENTS } from '../../../constants/data';

const getVagaDateObject = (vaga) => {
    const rawDate = vaga?.data || vaga?.date;
    return parseApiDate(rawDate);
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
    return [format(parsedDate, 'yyyy-MM-dd')];
};

const getVagaCapacity = (vaga) => Math.max(1, Number(vaga?.posicoes_disponiveis || 1));

const isVagaDisponivel = (vaga) => {
    const status = String(vaga?.status || '').toLowerCase();
    return status.includes('dispon');
};

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

const normalizeMatriculaDigits = (value) => String(value || '').replaceAll(/\D/g, '');

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
    const [loading, setLoading] = useState(true);
    const [modalContent, setModalContent] = useState(null);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);
    const userIdentity = user?.uid || user?.matricula || user?.email || null;

    useEffect(() => {
        setHasInitialLoad(false);
    }, [userIdentity]);

    useEffect(() => {
        let cancelled = false;

        const fetchMonthlyData = async ({ showSpinner = false } = {}) => {
            if (!userIdentity) {
                if (!cancelled) setLoading(false);
                return;
            }

            if (showSpinner && !cancelled) {
                setLoading(true);
            }

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

                if (!cancelled) {
                    setMonthlyVagas(vagasArray);
                    setMonthlyTeams(teamsArray);
                }
            } catch (error) {
                console.error('Erro ao carregar dados do mês:', error);
            } finally {
                if (showSpinner && !cancelled) {
                    setLoading(false);
                }
                if (!cancelled) {
                    setHasInitialLoad(true);
                }
            }
        };

        fetchMonthlyData({ showSpinner: !modalContent && !hasInitialLoad });

        if (modalContent) {
            return () => {
                cancelled = true;
            };
        }

        // Atualiza dados em background sem interromper interação do formulario.
        const interval = setInterval(() => {
            fetchMonthlyData();
        }, 20000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [userIdentity, activeDate, modalContent, hasInitialLoad]);

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
            const backendMessage =
                error?.response?.data?.detail
                || error?.response?.data?.non_field_errors?.[0]
                || error?.response?.data?.membros_matriculas?.[0]
                || error?.response?.data?.message
                || error?.message;

            showNotification(backendMessage || 'Falha ao registrar a equipe. Tente novamente.', 'error', 10000);
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
    { rowId: 'member-0', nome: user?.nome || '', matricula: user?.matricula || '', departamento: user?.departamento || '', delegacia: user?.delegacia || '', telefone: user?.telefone || '', uid: user?.uid || '' },
        { rowId: 'member-1', nome: '', matricula: '', departamento: '', delegacia: '' },
        { rowId: 'member-2', nome: '', matricula: '', departamento: '', delegacia: '' },
    ]);
    const [vehicle, setVehicle] = useState('');
    const [policiaisCatalog, setPoliciaisCatalog] = useState([]);
    const [delegaciasCatalog, setDelegaciasCatalog] = useState([]);
    const [singleDelegaciaRestriction, setSingleDelegaciaRestriction] = useState({ blocked: false, loading: false, message: '' });

    const policiaisByMatricula = useMemo(() => new Map(
        policiaisCatalog
            .filter((policial) => policial?.matricula)
            .map((policial) => [normalizeMatriculaDigits(policial.matricula), policial])
    ), [policiaisCatalog]);

    const delegaciasById = useMemo(() => new Map(
        delegaciasCatalog
            .filter((delegacia) => delegacia?.id != null)
            .map((delegacia) => [String(delegacia.id), delegacia])
    ), [delegaciasCatalog]);

    useEffect(() => {
        let cancelled = false;

        const loadCatalogs = async () => {
            try {
                const [policiais, delegacias] = await Promise.all([
                    fetchAllPages(apiClient.getPoliciais.bind(apiClient)),
                    fetchAllPages(apiClient.getDelegacias.bind(apiClient), { ativo: true }),
                ]);

                if (!cancelled) {
                    setPoliciaisCatalog(policiais);
                    setDelegaciasCatalog(delegacias);
                }
            } catch (error) {
                console.error('Erro ao carregar catálogos para preenchimento automático da equipe:', error);
            }
        };

        loadCatalogs();

        return () => {
            cancelled = true;
        };
    }, []);

    const restoreMatriculaInputFocus = (index) => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        window.requestAnimationFrame(() => {
            const input = document.getElementById(`team-member-matricula-${index}`);
            if (!input || document.activeElement === input) return;
            input.focus();
            const cursorPosition = input.value?.length || 0;
            if (typeof input.setSelectionRange === 'function') {
                input.setSelectionRange(cursorPosition, cursorPosition);
            }
        });
    };

    const vagaWeekId = useMemo(() => {
        const parsedVagaDate = getVagaDateObject(vaga);
        return vaga?.weekId || (parsedVagaDate ? getWeekInfo(parsedVagaDate).weekId : null);
    }, [vaga]);

    const normalizedMemberMatriculas = useMemo(() => (
        team.map((member) => normalizeMatriculaDigits(member?.matricula))
    ), [team]);

    useEffect(() => {
        const hasIncompleteMember = normalizedMemberMatriculas.some((matricula) => matricula.length !== 8);

        if (!vagaWeekId || hasIncompleteMember) {
            setSingleDelegaciaRestriction({ blocked: false, loading: false, message: '' });
            return undefined;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setSingleDelegaciaRestriction((prev) => ({ ...prev, loading: true }));

            try {
                const validation = await checkSingleDelegaciaDepartmentWeeklyLimit(normalizedMemberMatriculas, vagaWeekId);
                if (!cancelled) {
                    setSingleDelegaciaRestriction({
                        blocked: Boolean(validation?.blocked),
                        loading: false,
                        message: validation?.message || '',
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Erro ao validar restrição semanal de departamento com delegacia única:', error);
                    setSingleDelegaciaRestriction({ blocked: false, loading: false, message: '' });
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [normalizedMemberMatriculas, vagaWeekId]);

    const handleMemberChange = (index, field, value) => {
        setTeam((prevTeam) => {
            const newTeam = [...prevTeam];
            const updatedMember = { ...newTeam[index], [field]: value };

            if (field === 'departamento') updatedMember.delegacia = '';
            if (field === 'nome') updatedMember.nome = normalizeName(value);
            if (field === 'matricula') {
                updatedMember.matricula = formatMatricula(value);
                const normalizedMatricula = normalizeMatriculaDigits(updatedMember.matricula);

                const foundInApi = policiaisByMatricula.get(normalizedMatricula);
                if (foundInApi) {
                    if (foundInApi.nome) updatedMember.nome = normalizeName(foundInApi.nome);

                    const delegaciaFromApi = delegaciasById.get(String(foundInApi.delegacia));
                    const resolvedDepartamento = delegaciaFromApi?.departamento_nome || '';
                    const resolvedDelegacia = delegaciaFromApi?.nome || foundInApi.delegacia_nome || '';

                    if (resolvedDepartamento) updatedMember.departamento = resolvedDepartamento;
                    if (resolvedDelegacia) updatedMember.delegacia = resolvedDelegacia;
                } else {
                    const found = findPolicialByMatricula(normalizedMatricula);
                    if (found?.nome) {
                        updatedMember.nome = found.nome;
                    }
                }
            }
            if (field === 'telefone') updatedMember.telefone = formatTelefone(value);

            newTeam[index] = updatedMember;
            return newTeam;
        });

        if (field === 'matricula') {
            restoreMatriculaInputFocus(index);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalTeam = team.map(m => ({ ...m, matricula: formatMatricula(m.matricula) }));
        if (finalTeam.some(m => !m.nome || normalizeMatriculaDigits(m.matricula).length !== 8 || !m.delegacia) || !vehicle || team[0].telefone.replaceAll(/\D/g, '').length < 10) {
            showNotification("Preencha todos os campos da equipe, incluindo telefone válido do líder e placa da viatura.", "error");
            return;
        }

        const matriculas = finalTeam.map((member) => normalizeMatriculaDigits(member.matricula));
        const latestRestriction = vagaWeekId
            ? await checkSingleDelegaciaDepartmentWeeklyLimit(matriculas, vagaWeekId)
            : { blocked: false };

        if (latestRestriction.blocked) {
            setSingleDelegaciaRestriction({
                blocked: true,
                loading: false,
                message: latestRestriction.message,
            });
            showNotification(latestRestriction.message, 'error', 9000);
            return;
        }

        if (singleDelegaciaRestriction.blocked) {
            showNotification(singleDelegaciaRestriction.message, 'error', 9000);
            return;
        }

        onSubmit(vaga, { members: finalTeam, vehicle, telefone: team[0].telefone });
    };
    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Equipe para Serviço</h2>
            <p className="mb-6 text-gray-600">Dia: <span className="font-semibold">{(getVagaOperationalDateObject(vaga) || new Date()).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span></p>
            <div className="mb-4 min-h-[56px]">
                {singleDelegaciaRestriction.loading && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Validando restrições semanais da equipe...
                    </div>
                )}
                {singleDelegaciaRestriction.blocked && (
                    const memberKey = member.rowId || `member-${index}`;
                        {singleDelegaciaRestriction.message}
                    const fieldClassName = "w-full h-12 px-3 border rounded-md text-gray-800 bg-white";
                    </div>
                )}
            </div>
            {team.map((member, index) => {
                     const memberKey = member.rowId || `member-${index}`;
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
                                <input type="text" placeholder="NOME COMPLETO" value={member.nome} onChange={(e) => handleMemberChange(index, 'nome', e.target.value)} className={`${fieldClassName} uppercase`} required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Matrícula</label>
                                <input id={`team-member-matricula-${index}`} type="text" placeholder="MATRÍCULA" value={member.matricula} onChange={(e) => handleMemberChange(index, 'matricula', e.target.value)} maxLength="8" className={fieldClassName} required />
                                <small className="mt-1 block min-h-[18px] text-gray-500">Formato final: {displayMatricula(member.matricula)}</small>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Departamento</label>
                                <select value={member.departamento} onChange={(e) => handleMemberChange(index, 'departamento', e.target.value)} className={fieldClassName} required><option value="">SELECIONE O DEPARTAMENTO</option>{Object.keys(DEPARTMENTS || {}).map(dep => <option key={dep} value={dep}>{dep}</option>)}</select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Delegacia</label>
                                <select value={member.delegacia} onChange={(e) => handleMemberChange(index, 'delegacia', e.target.value)} className={fieldClassName} required disabled={!member.departamento}><option value="">SELECIONE A DELEGACIA</option>{member.departamento && (DEPARTMENTS[member.departamento] || []).map(del => <option key={del} value={del}>{del}</option>)}</select>
                            </div>
                            {index === 0 && (
                                <div className="md:col-span-2">
                                    <label htmlFor={phoneInputId} className="mb-1 block text-sm font-medium text-gray-700">Telefone do Chefe da Equipe</label>
                                    <input id={phoneInputId} type="tel" placeholder="(XX) XXXXX-XXXX" value={member.telefone} onChange={(e) => handleMemberChange(index, 'telefone', e.target.value)} maxLength="15" className={fieldClassName} required />
                                </div>
                            )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="NOME COMPLETO" value={member.nome} onChange={(e) => handleMemberChange(index, 'nome', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 uppercase" required />
                        <div><input id={`team-member-matricula-${index}`} type="text" placeholder="MATRÍCULA" value={member.matricula} onChange={(e) => handleMemberChange(index, 'matricula', e.target.value)} maxLength="8" className="w-full p-2 border rounded-md text-gray-800" required /><small className="text-gray-500">Formato final: {displayMatricula(member.matricula)}</small></div>
                        <select value={member.departamento} onChange={(e) => handleMemberChange(index, 'departamento', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required><option value="">SELECIONE O DEPARTAMENTO</option>{Object.keys(DEPARTMENTS || {}).map(dep => <option key={dep} value={dep}>{dep}</option>)}</select>
                        <select value={member.delegacia} onChange={(e) => handleMemberChange(index, 'delegacia', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required disabled={!member.departamento}><option value="">SELECIONE A DELEGACIA</option>{member.departamento && (DEPARTMENTS[member.departamento] || []).map(del => <option key={del} value={del}>{del}</option>)}</select>
                        {index === 0 && <div><label htmlFor={phoneInputId} className="block text-sm font-medium text-gray-700">Telefone do Chefe da Equipe</label><input id={phoneInputId} type="tel" placeholder="(XX) XXXXX-XXXX" value={member.telefone} onChange={(e) => handleMemberChange(index, 'telefone', e.target.value)} maxLength="15" className="w-full p-2 border rounded-md text-gray-800" required /></div>}
                    </div>
                </div>
                );
            })}
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white"><h3 className="font-bold text-lg mb-2 text-gray-700">Viatura</h3><input type="text" placeholder="PLACA (ABC-1234)" value={vehicle} onChange={(e) => setVehicle(formatPlaca(e.target.value))} maxLength="8" className="w-full p-2 border rounded-md text-gray-800 uppercase" required /></div>
            <div className="flex justify-end space-x-4"><button type="button" onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button><button type="submit" disabled={singleDelegaciaRestriction.loading || singleDelegaciaRestriction.blocked} className="py-2 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition">{singleDelegaciaRestriction.loading ? 'Validando...' : 'Confirmar Registro'}</button></div>
        </form>
    );
};