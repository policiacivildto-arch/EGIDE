// src/views/admin/componets/PaymentReport.js


import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { apiClient } from '../../../config/api';
import { 
    displayMatricula 
} from '../../../utils/helpers'
import { calculateShiftCost } from '../../../utils/calculateCost';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const PaymentReportView = ({ allUsers = [], showNotification, departamento, onDatesChange }) => {
    const toLocalISODate = useCallback((dateObj) => {
        if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    const parseDateSafe = useCallback((value) => {
        if (!value) return null;

        if (typeof value === 'string') {
            const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
            if (dateOnlyMatch) {
                const year = Number(dateOnlyMatch[1]);
                const month = Number(dateOnlyMatch[2]);
                const day = Number(dateOnlyMatch[3]);
                return new Date(year, month - 1, day, 0, 0, 0, 0);
            }
        }

        if (typeof value === 'object' && value?.seconds) {
            return new Date(value.seconds * 1000);
        }

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, []);

    const buildConvoyIdentityKey = useCallback((convoy, fallbackDateKey = '') => {
        const rawId = String(convoy?.id || '').trim();
        if (rawId) return `id:${rawId}`;

        const dateObj = parseDateSafe(convoy?.data || convoy?.date);
        const dateKey = fallbackDateKey || (dateObj ? toLocalISODate(dateObj) : '');
        const dpcKey = String(convoy?.dpc || convoy?.dpc_nome || '').trim().toUpperCase();
        const oipKey = String(convoy?.oip || convoy?.oip_nome || '').trim().toUpperCase();
        const aisKey = String(convoy?.ais || '').trim().toUpperCase();
        const bairrosKey = (Array.isArray(convoy?.bairros) ? convoy.bairros : [convoy?.bairros])
            .filter(Boolean)
            .map((value) => String(value).trim().toUpperCase())
            .sort()
            .join('|');

        return `raw:${dateKey}::${dpcKey}::${oipKey}::${aisKey}::${bairrosKey}`;
    }, [parseDateSafe, toLocalISODate]);

    const today = toLocalISODate(new Date());
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [services, setServices] = useState([]);
    const [vagaDelegaciaById, setVagaDelegaciaById] = useState({});
    const [convoysForPeriod, setConvoysForPeriod] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedTeams, setExpandedTeams] = useState({});
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [substitutions, setSubstitutions] = useState({});
    const [substituteSelectorOpen, setSubstituteSelectorOpen] = useState({});
    const [substituteSearchTerms, setSubstituteSearchTerms] = useState({});
    const [holidayDateStrings, setHolidayDateStrings] = useState([]);
    // Ref para evitar que a hidratação do backend sobrescreva status recém confirmado pelo usuário
    const isSavingRef = React.useRef(false);

    // Notifica AdminDashboard quando as datas mudam para sincronizar com OperationCostView
    useEffect(() => {
        if (onDatesChange) {
            onDatesChange(startDate, endDate);
        }
    }, [startDate, endDate, onDatesChange]);

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

    const getMemberStatusKey = (teamId, member) => `${teamId}-${member?.id || member?.uid || member?.matricula || member?.nome}`;

    const formatCurrencyBRL = (value) =>
        Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const normalizeMatriculaKey = (value) => String(value || '').trim().toUpperCase().replaceAll(/[^0-9X]/g, '');
    const normalizeNameKey = (value) => String(value || '')
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .replaceAll(/\s+/g, ' ')
        .trim()
        .toUpperCase();

    const usersById = useMemo(() => {
        const map = new Map();
        allUsers.forEach((u) => {
            if (u?.id !== undefined && u?.id !== null) {
                map.set(String(u.id), u);
            }
        });
        return map;
    }, [allUsers]);

    const usersByMatricula = useMemo(() => {
        const map = new Map();
        allUsers.forEach((u) => {
            const key = normalizeMatriculaKey(u?.matricula);
            if (key) map.set(key, u);
        });
        return map;
    }, [allUsers]);

    const usersByName = useMemo(() => {
        const map = new Map();
        allUsers.forEach((u) => {
            const key = normalizeNameKey(getUserName(u));
            if (key) map.set(key, u);
        });
        return map;
    }, [allUsers]);

    const resolveSupervisorUser = useCallback((idField, nameField) => {
        if (idField !== undefined && idField !== null && usersById.has(String(idField))) {
            return usersById.get(String(idField));
        }

        const idAsNameKey = normalizeNameKey(idField);
        if (idAsNameKey && usersByName.has(idAsNameKey)) {
            return usersByName.get(idAsNameKey);
        }

        const nameKey = normalizeNameKey(nameField);
        if (nameKey && usersByName.has(nameKey)) {
            return usersByName.get(nameKey);
        }

        return null;
    }, [usersById, usersByName]);

    const getSupervisorIdentityKey = useCallback((user, fallbackId, fallbackName) => {
        const matriculaKey = normalizeMatriculaKey(user?.matricula);
        if (matriculaKey) return `mat:${matriculaKey}`;

        if (user?.id !== undefined && user?.id !== null) {
            return `id:${user.id}`;
        }

        const fallbackIdKey = String(fallbackId || '').trim();
        if (fallbackIdKey) return `raw:${fallbackIdKey}`;

        const nameKey = normalizeNameKey(user?.nome || fallbackName);
        if (nameKey) return `name:${nameKey}`;

        return '';
    }, []);

    const resolvedHolidayList = useMemo(() => {
        const unique = new Set();

        holidayDateStrings.forEach((item) => {
            const dateObj = parseDateSafe(item);
            if (!dateObj || Number.isNaN(dateObj.getTime())) return;

            const dia = String(dateObj.getDate()).padStart(2, '0');
            const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
            const ano = dateObj.getFullYear();
            unique.add(`${dia}/${mes}/${ano}`);
        });

        return [...unique];
    }, [holidayDateStrings, parseDateSafe]);

    const isGenericDepartmentLabel = useCallback((value) => {
        const normalized = String(value || '').trim().toUpperCase();
        if (!normalized) return true;

        if (
            normalized.startsWith('COAF') ||
            normalized.startsWith('DTO') ||
            normalized.includes('DEPARTAMENTO TECNICO OPERACIONAL') ||
            normalized.includes('DEPARTAMENTO TÉCNICO OPERACIONAL')
        ) {
            return true;
        }

        return false;
    }, []);

    const pickTeamLabel = useCallback((value) => {
        const text = String(value || '').trim();
        if (!text) return '';
        if (isGenericDepartmentLabel(text)) return '';
        return text;
    }, [isGenericDepartmentLabel]);

    const getDelegaciaFromMembers = useCallback((service) => {
        const memberDelegacias = (service?.membros_detalhes || [])
            .map((member) => String(member?.delegacia_nome || '').trim())
            .filter(Boolean);

        const uniqueDelegacias = [...new Set(memberDelegacias)];
        if (uniqueDelegacias.length === 1) {
            return uniqueDelegacias[0];
        }

        if (uniqueDelegacias.length > 1) {
            return uniqueDelegacias.join(' / ');
        }

        return '';
    }, []);

    const resolveTeamName = useCallback((service) => {
        // Prioridade refinada: usar delegacia real, nunca departamento genérico (ex.: COAF).
        const vagaInfoDelegacia = pickTeamLabel(service?.vaga_info?.delegacia_nome);
        if (vagaInfoDelegacia) return vagaInfoDelegacia;

        const vagaId = String(service?.vaga || service?.vaga_info?.id || '').trim();
        const vagaMapDelegacia = pickTeamLabel(vagaDelegaciaById[vagaId]);
        if (vagaMapDelegacia) return vagaMapDelegacia;

        const memberDelegacia = getDelegaciaFromMembers(service);
        if (memberDelegacia) {
            return memberDelegacia;
        }

        const delegaciaPrincipal = pickTeamLabel(service?.delegaciaPrincipal);
        if (delegaciaPrincipal) return delegaciaPrincipal;

        const teamName = pickTeamLabel(service?.teamName);
        if (teamName) return teamName;

        return `Equipe ${service?.id}`;
    }, [getDelegaciaFromMembers, pickTeamLabel, vagaDelegaciaById]);

    const getPolicialId = useCallback((member) => {
        if (!member) return null;
        if (member?.id) return member.id;

        const matricula = String(member?.matricula || '').replaceAll(/\D/g, '');
        if (matricula) {
            const byMatricula = allUsers.find((u) => String(u?.matricula || '').replaceAll(/\D/g, '') === matricula);
            if (byMatricula?.id) return byMatricula.id;
        }

        const memberName = getUserName(member).toLowerCase();
        if (memberName) {
            const byName = allUsers.find((u) => getUserName(u).toLowerCase() === memberName);
            if (byName?.id) return byName.id;
        }

        return null;
    }, [allUsers]);

    const getAttendanceTeamId = useCallback((teamRow) => {
        const candidate = teamRow?.equipeIdForAttendance ?? teamRow?.id;
        const numeric = Number(candidate);
        return Number.isFinite(numeric) ? numeric : null;
    }, []);

    const persistTeamAttendance = async (teamRow, nextAttendanceStatus, nextSubstitutions) => {
        const attendanceTeamId = getAttendanceTeamId(teamRow);
        if (!attendanceTeamId) return;

        const registros = teamRow.members
            .map((member) => {
                const policialId = getPolicialId(member);
                // Rejeita IDs inválidos (null, string não-numérica) para evitar erro no backend
                const numericId = Number(policialId);
                if (!policialId || !Number.isFinite(numericId) || numericId <= 0) return null;

                const key = getMemberStatusKey(teamRow.id, member);
                const status = nextAttendanceStatus[key] || 'pendente';
                const substitutoRaw = nextSubstitutions[key]?.id || null;
                const substituto = substitutoRaw !== null && Number.isFinite(Number(substitutoRaw)) && Number(substitutoRaw) > 0
                    ? Number(substitutoRaw)
                    : null;

                return {
                    equipe: attendanceTeamId,
                    policial: numericId,
                    data_operacao: teamRow.dateKey,
                    status,
                    substituto,
                };
            })
            .filter(Boolean);

        // Evita enviar a mesma combinação equipe+policial+data mais de uma vez.
        // Isso pode ocorrer com dados duplicados de membros e gera conflito de unicidade no backend.
        const uniqueByKey = new Map();
        registros.forEach((registro) => {
            const dedupeKey = `${registro.equipe}-${registro.policial}-${registro.data_operacao}`;
            uniqueByKey.set(dedupeKey, registro);
        });
        const registrosDeduped = Array.from(uniqueByKey.values());

        if (registrosDeduped.length === 0) return;

        isSavingRef.current = true;
        try {
            const response = await apiClient.registrarFrequenciasLote(registrosDeduped);
            const erros = Array.isArray(response?.erros) ? response.erros : [];
            if (erros.length > 0) {
                const primeiraMensagem = String(erros[0]?.erro || 'Falha ao salvar parte das frequências.');
                showNotification(`Atenção: ${primeiraMensagem}`, 'warning');
            }
        } catch (error) {
            console.error('Falha ao persistir frequência no backend:', error);
            showNotification('Falha ao salvar frequência no servidor.', 'error');
        } finally {
            isSavingRef.current = false;
        }
    };

    const hydrateAttendanceFromBackend = useCallback((rows, frequencias) => {
        const nextAttendanceStatus = {};
        const nextSubstitutions = {};

        const byTeamAndPolicial = new Map();
        const byTeamAndMatricula = new Map();
        frequencias.forEach((item) => {
            const mapKey = `${item?.equipe}-${item?.policial}-${item?.data_operacao || ''}`;
            byTeamAndPolicial.set(mapKey, item);

            const matriculaKey = String(item?.policial_matricula || '').replaceAll(/\D/g, '');
            if (matriculaKey) {
                byTeamAndMatricula.set(`${item?.equipe}-${matriculaKey}-${item?.data_operacao || ''}`, item);
            }
        });

        rows.forEach((teamRow) => {
            const attendanceTeamId = getAttendanceTeamId(teamRow);
            if (!attendanceTeamId) return;

            teamRow.members.forEach((member) => {
                const policialId = getPolicialId(member);
                const memberMatricula = String(member?.matricula || '').replaceAll(/\D/g, '');

                const item = byTeamAndPolicial.get(`${attendanceTeamId}-${policialId}-${teamRow.dateKey}`)
                    || byTeamAndMatricula.get(`${attendanceTeamId}-${memberMatricula}-${teamRow.dateKey}`);
                if (!item) return;

                const statusKey = getMemberStatusKey(teamRow.id, member);
                nextAttendanceStatus[statusKey] = item.status || 'pendente';

                if (item.substituto) {
                    nextSubstitutions[statusKey] = {
                        id: item.substituto,
                        nome: item.substituto_nome || 'Substituto',
                        matricula: item.substituto_matricula || '',
                    };
                }
            });
        });

        setAttendanceStatus(nextAttendanceStatus);
        setSubstitutions(nextSubstitutions);
    }, [getAttendanceTeamId, getPolicialId]);

    const fetchServices = useCallback(async () => {
        if (!startDate || !endDate) {
            showNotification("Por favor, selecione as datas de início e fim.", "error");
            return;
        }
        setLoading(true);
        setServices([]);
        setConvoysForPeriod([]);
        try {
            const [teamsResponse, convoysResponse, vagasResponse, holidaysResponse] = await Promise.all([
                apiClient.getAllTeams({
                    'vaga__data__gte': startDate,
                    'vaga__data__lte': endDate,
                }),
                apiClient.getAllConvoys(),
                apiClient.getAllVagas({
                    'data__gte': startDate,
                    'data__lte': endDate,
                }),
                apiClient.getHolidays({
                    data__gte: startDate,
                    data__lte: endDate,
                }),
            ]);

            const fetchedServices = Array.isArray(teamsResponse)
                ? teamsResponse
                : (teamsResponse?.results || []);
            const allConvoys = Array.isArray(convoysResponse)
                ? convoysResponse
                : (convoysResponse?.results || []);
            const fetchedVagas = Array.isArray(vagasResponse)
                ? vagasResponse
                : (vagasResponse?.results || []);
            const holidayRows = Array.isArray(holidaysResponse)
                ? holidaysResponse
                : (holidaysResponse?.results || []);

            const vagaMap = fetchedVagas.reduce((acc, vaga) => {
                const key = String(vaga?.id || '').trim();
                if (!key) return acc;
                acc[key] = String(vaga?.delegacia_nome || '').trim();
                return acc;
            }, {});

            const filteredConvoys = allConvoys.filter((convoy) => {
                const convoyDate = convoy?.data || convoy?.date;
                if (!convoyDate) return false;
                const convoyDateObj = parseDateSafe(convoyDate);
                if (!convoyDateObj) return false;
                const isoDate = toLocalISODate(convoyDateObj);
                return isoDate >= startDate && isoDate <= endDate;
            });

            const dedupedConvoys = [];
            const seenConvoys = new Set();
            filteredConvoys.forEach((convoy) => {
                const convoyDateObj = parseDateSafe(convoy?.data || convoy?.date);
                const dateKey = convoyDateObj ? toLocalISODate(convoyDateObj) : '';
                const identityKey = buildConvoyIdentityKey(convoy, dateKey);
                if (!identityKey || seenConvoys.has(identityKey)) {
                    return;
                }

                seenConvoys.add(identityKey);
                dedupedConvoys.push(convoy);
            });

            setServices(fetchedServices);
            setConvoysForPeriod(dedupedConvoys);
            setVagaDelegaciaById(vagaMap);
            setHolidayDateStrings(holidayRows.map((item) => item?.data).filter(Boolean));

        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
            showNotification("Falha ao carregar relatório.", "error");
            setVagaDelegaciaById({});
            setHolidayDateStrings([]);
        } finally {
            setLoading(false);
        }
    }, [buildConvoyIdentityKey, endDate, showNotification, startDate, toLocalISODate, parseDateSafe]);

    const resolveUserForMember = useCallback((member) => {
        if (!member) return null;

        if (member?.id !== undefined && member?.id !== null) {
            const byId = usersById.get(String(member.id));
            if (byId) return byId;
        }

        const matKey = normalizeMatriculaKey(member?.matricula);
        if (matKey && usersByMatricula.has(matKey)) {
            return usersByMatricula.get(matKey);
        }

        const nameKey = normalizeNameKey(getUserName(member));
        if (nameKey && usersByName.has(nameKey)) {
            return usersByName.get(nameKey);
        }

        return null;
    }, [usersById, usersByMatricula, usersByName]);

    const calculateMemberCostByStatus = useCallback((teamRow, member) => {
        const key = getMemberStatusKey(teamRow.id, member);
        const status = attendanceStatus[key] || 'pendente';

        if (status === 'falta') {
            return 0;
        }

        let effectiveUser = resolveUserForMember(member);

        if (status === 'substituto') {
            const substituteId = substitutions[key]?.id;
            if (substituteId !== undefined && substituteId !== null) {
                const byId = usersById.get(String(substituteId));
                if (byId) effectiveUser = byId;
            }
        }

        if (!effectiveUser?.cargo || !effectiveUser?.classe) {
            return 0;
        }

        return calculateShiftCost(
            effectiveUser,
            teamRow.dateObj,
            teamRow.startTime,
            teamRow.endTime,
            resolvedHolidayList,
        );
    }, [attendanceStatus, substitutions, usersById, resolveUserForMember, resolvedHolidayList]);

    useEffect(() => {
        if (startDate && endDate) {
            fetchServices();
        }
    }, [fetchServices, startDate, endDate]);

    const convoysByDate = useMemo(() => {
        const map = new Map();
        convoysForPeriod.forEach((convoy) => {
            const convoyDate = convoy?.data || convoy?.date;
            const dateObj = parseDateSafe(convoyDate);
            if (!dateObj || Number.isNaN(dateObj.getTime())) return;
            const dateKey = toLocalISODate(dateObj);
            const existing = map.get(dateKey) || [];

            const identityKey = buildConvoyIdentityKey(convoy, dateKey);
            if (existing.some((item) => buildConvoyIdentityKey(item, dateKey) === identityKey)) {
                return;
            }

            map.set(dateKey, [...existing, convoy]);
        });
        return map;
    }, [buildConvoyIdentityKey, convoysForPeriod, parseDateSafe, toLocalISODate]);

    const frequencyRows = useMemo(() => {
        const teamRows = services
            .map((service) => {
                const vagaDate = service?.vaga_info?.data || service?.vagaDate;
                const dateObj = parseDateSafe(vagaDate);
                if (!dateObj || Number.isNaN(dateObj.getTime())) return null;

                const dateKey = toLocalISODate(dateObj);
                const convoysOnDate = convoysByDate.get(dateKey) || [];
                const firstConvoy = convoysOnDate[0];

                const turno = service?.vaga_info?.turno || service?.vagaShiftType;
                const startTime = service.horarioEntrada || (turno === 'night' ? '19:00' : '08:00');
                const endTime = service.horarioSaida || (turno === 'night' ? '01:00' : '20:00');

                let members = [];
                if (Array.isArray(service?.membros_detalhes) && service.membros_detalhes.length > 0) {
                    members = service.membros_detalhes;
                } else if (service?.registeringOfficer) {
                    members = [service.registeringOfficer];
                }

                return {
                    id: service.id,
                    equipeIdForAttendance: service.id,
                    dateObj,
                    dateKey,
                    shiftType: turno,
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
            .filter(Boolean);

        // Alguns ambientes podem retornar a mesma equipe mais de uma vez no mesmo dia.
        // Mantemos apenas uma linha por combinação data + equipe para evitar duplicidade no relatório.
        const dedupedTeamRows = [];
        const seenTeamRows = new Set();

        teamRows.forEach((row) => {
            const teamIdKey = String(row?.equipeIdForAttendance ?? row?.id ?? '').trim();
            const dedupeKey = `${row?.dateKey || ''}::${teamIdKey}`;
            if (!teamIdKey || !row?.dateKey) {
                dedupedTeamRows.push(row);
                return;
            }

            if (seenTeamRows.has(dedupeKey)) {
                return;
            }

            seenTeamRows.add(dedupeKey);
            dedupedTeamRows.push(row);
        });

        const teamIdsByDate = new Map();
        const teamRowsByDate = new Map();
        const dateHasNightTeam = new Map();
        dedupedTeamRows.forEach((row) => {
            if (!row?.dateKey) return;
            const existing = teamIdsByDate.get(row.dateKey) || [];
            teamIdsByDate.set(row.dateKey, [...existing, row.id]);

            const existingRows = teamRowsByDate.get(row.dateKey) || [];
            teamRowsByDate.set(row.dateKey, [...existingRows, row]);

            const isNightShift = String(row?.shiftType || '').toLowerCase() === 'night';
            if (isNightShift) {
                dateHasNightTeam.set(row.dateKey, true);
            }
        });

        const convoysGroupedByDate = new Map();
        convoysForPeriod.forEach((convoy) => {
            const convoyDate = convoy?.data || convoy?.date;
            const dateObj = parseDateSafe(convoyDate);
            if (!dateObj || Number.isNaN(dateObj.getTime())) return;

            const dateKey = toLocalISODate(dateObj);
            const existing = convoysGroupedByDate.get(dateKey) || [];

            const identityKey = buildConvoyIdentityKey(convoy, dateKey);
            if (existing.some((item) => buildConvoyIdentityKey(item, dateKey) === identityKey)) {
                return;
            }

            convoysGroupedByDate.set(dateKey, [...existing, convoy]);
        });

        const supervisionRows = [];
        convoysGroupedByDate.forEach((convoysOnDate, dateKey) => {
            // Requisito operacional: exibir a supervisão apenas em dias com vaga/equipe noturna.
            if (!dateHasNightTeam.get(dateKey)) return;

            const teamRowsOnDate = teamRowsByDate.get(dateKey) || [];
            const referenceTeamRow = teamRowsOnDate.find((row) => String(row?.shiftType || '').toLowerCase() === 'night')
                || teamRowsOnDate[0]
                || null;
            const attendanceTeamId = referenceTeamRow?.equipeIdForAttendance || referenceTeamRow?.id || null;
            if (!attendanceTeamId || !referenceTeamRow) return;

            const dateObj = parseDateSafe(dateKey);
            if (!dateObj || Number.isNaN(dateObj.getTime())) return;

            const supervisorMembers = [];
            const seenSupervisors = new Set();

            convoysOnDate.forEach((convoy) => {
                const dpcUser = resolveSupervisorUser(convoy?.dpc, convoy?.dpc_nome);
                const dpcKey = getSupervisorIdentityKey(dpcUser, convoy?.dpc, convoy?.dpc_nome);
                if ((dpcUser || convoy?.dpc_nome || convoy?.dpc) && dpcKey && !seenSupervisors.has(dpcKey)) {
                    seenSupervisors.add(dpcKey);
                    supervisorMembers.push({
                        id: dpcUser?.id || convoy?.dpc,
                        nome: dpcUser?.nome || convoy?.dpc_nome || 'DPC',
                        matricula: dpcUser?.matricula || '',
                    });
                }

                const oipUser = resolveSupervisorUser(convoy?.oip, convoy?.oip_nome);
                const oipKey = getSupervisorIdentityKey(oipUser, convoy?.oip, convoy?.oip_nome);
                if ((oipUser || convoy?.oip_nome || convoy?.oip) && oipKey && !seenSupervisors.has(oipKey)) {
                    seenSupervisors.add(oipKey);
                    supervisorMembers.push({
                        id: oipUser?.id || convoy?.oip,
                        nome: oipUser?.nome || convoy?.oip_nome || 'OIP',
                        matricula: oipUser?.matricula || '',
                    });
                }
            });

            if (supervisorMembers.length === 0) return;

            const firstConvoy = convoysOnDate[0];
            const aisValues = [...new Set(convoysOnDate.map((convoy) => convoy?.ais).filter(Boolean))];
            const bairroValues = [...new Set(convoysOnDate.flatMap((convoy) => (
                Array.isArray(convoy?.bairros) ? convoy.bairros : [convoy?.bairros]
            )).filter(Boolean))];

            supervisionRows.push({
                id: `sup-${dateKey}`,
                equipeIdForAttendance: attendanceTeamId,
                dateObj,
                dateKey,
                teamName: 'Supervisão do Dia (DTO)',
                comboio: convoysOnDate.length > 1 ? `Supervisão (${convoysOnDate.length} comboios)` : 'Supervisão',
                area: `AIS ${aisValues.join(', ') || 'N/A'} - ${bairroValues.join(', ') || 'N/A'}`,
                phone: 'N/A',
                // Vincula a janela de confirmação ao horário real da equipe do dia.
                startTime: referenceTeamRow.startTime,
                endTime: referenceTeamRow.endTime,
                members: supervisorMembers,
                rawService: firstConvoy,
            });
        });

        return [...dedupedTeamRows, ...supervisionRows].sort((a, b) => b.dateObj - a.dateObj);
    }, [buildConvoyIdentityKey, convoysByDate, convoysForPeriod, getSupervisorIdentityKey, parseDateSafe, resolveSupervisorUser, resolveTeamName, services, toLocalISODate]);

    const totalCostByTeam = useMemo(() => {
        const map = {};
        frequencyRows.forEach((teamRow) => {
            const total = (teamRow.members || []).reduce((acc, member) => {
                return acc + calculateMemberCostByStatus(teamRow, member);
            }, 0);
            map[teamRow.id] = total;
        });
        return map;
    }, [frequencyRows, calculateMemberCostByStatus]);

    const grandTotalCost = useMemo(() => {
        return Object.values(totalCostByTeam).reduce((acc, value) => acc + Number(value || 0), 0);
    }, [totalCostByTeam]);

    useEffect(() => {
        const loadPersistedAttendance = async () => {
            if (frequencyRows.length === 0) {
                setAttendanceStatus({});
                setSubstitutions({});
                return;
            }

            const teamIds = [...new Set(frequencyRows.map((row) => getAttendanceTeamId(row)).filter(Boolean))];
            if (teamIds.length === 0) return;

            try {
                const frequencias = await apiClient.getAllFrequencias({
                    equipe__in: teamIds.join(','),
                    data_operacao__gte: startDate,
                    data_operacao__lte: endDate,
                });
                // Não sobrescreve estado se o usuário está no meio de uma confirmação
                if (!isSavingRef.current) {
                    hydrateAttendanceFromBackend(frequencyRows, frequencias);
                }
            } catch (error) {
                console.error('Falha ao carregar frequência registrada:', error);
            }
        };

        loadPersistedAttendance();
    }, [frequencyRows, startDate, endDate, hydrateAttendanceFromBackend, getAttendanceTeamId]);

    const toggleTeamExpand = (teamId) => {
        setExpandedTeams((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
    };

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

    const exportToXLSX = () => {
        if (frequencyRows.length === 0) {
            showNotification('Nenhum dado para exportar. Realize uma busca primeiro.', 'warning');
            return;
        }

        const exportData = frequencyRows.flatMap(teamRow => {
            const baseRow = {
                'Data': teamRow.dateObj.toLocaleDateString('pt-BR'),
                'Equipe': teamRow.teamName,
                'Comboio': teamRow.comboio,
                'Área': teamRow.area,
                'Telefone': teamRow.phone,
                'Hora Início': teamRow.startTime,
                'Hora Fim': teamRow.endTime,
            };

            // Se houver membros, expandir em linhas separadas
            if (teamRow.members.length > 0) {
                return teamRow.members.map((member, idx) => {
                    const key = getMemberStatusKey(teamRow.id, member);
                    const status = attendanceStatus[key] || 'pendente';
                    const substitute = substitutions[key];
                    const statusLabel = getStatusLabel(status);
                    
                    return {
                        ...baseRow,
                        'Integrante': getUserDisplayName(member),
                        'Matrícula': displayMatricula(member?.matricula || ''),
                        'Status': statusLabel,
                        'Substituto Por': substitute ? `${substitute.nome} (${displayMatricula(substitute.matricula)})` : '',
                        'Custo (R$)': Number(calculateMemberCostByStatus(teamRow, member) || 0),
                        'Custo Equipe (R$)': Number(totalCostByTeam[teamRow.id] || 0),
                    };
                });
            } else {
                return [{
                    ...baseRow,
                    'Integrante': 'Nenhum',
                    'Matrícula': '',
                    'Status': 'N/A',
                    'Substituto Por': '',
                    'Custo (R$)': 0,
                    'Custo Equipe (R$)': Number(totalCostByTeam[teamRow.id] || 0),
                }];
            }
        });

        const dedupedExportData = [];
        const seenExportRows = new Set();

        exportData.forEach((row) => {
            const dedupeKey = [
                row?.Data,
                row?.Equipe,
                row?.Comboio,
                row?.['Hora Início'],
                row?.['Hora Fim'],
                row?.Integrante,
                row?.Matrícula,
            ].map((value) => String(value || '').trim()).join('||');

            if (!dedupeKey || seenExportRows.has(dedupeKey)) {
                return;
            }

            seenExportRows.add(dedupeKey);
            dedupedExportData.push(row);
        });

        dedupedExportData.push({
            'Data': '',
            'Equipe': '',
            'Comboio': '',
            'Área': '',
            'Telefone': '',
            'Hora Início': '',
            'Hora Fim': '',
            'Integrante': 'TOTAL GERAL',
            'Matrícula': '',
            'Status': '',
            'Substituto Por': '',
            'Custo (R$)': Number(grandTotalCost || 0),
            'Custo Equipe (R$)': '',
        });

        const worksheet = XLSX.utils.json_to_sheet(dedupedExportData);
        
        // Ajustar largura de colunas
        worksheet['!cols'] = [
            { wch: 12 },  // Data
            { wch: 20 },  // Equipe
            { wch: 15 },  // Comboio
            { wch: 25 },  // Área
            { wch: 15 },  // Telefone
            { wch: 12 },  // Hora Início
            { wch: 12 },  // Hora Fim
            { wch: 25 },  // Integrante
            { wch: 12 },  // Matrícula
            { wch: 15 },  // Status
            { wch: 30 },  // Substituto Por
            { wch: 14 },  // Custo (R$)
            { wch: 16 },  // Custo Equipe (R$)
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Frequência Operacional');
        
        const fileName = `Frequencia_${startDate}_a_${endDate}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        showNotification(`Planilha exportada: ${fileName}`, 'success');
    };

    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Frequência Operacional (Atualizada v2)</h3>
            <div className="mb-4 flex flex-wrap gap-3 items-center">
                <div className="px-4 py-2 rounded-lg bg-emerald-900/40 border border-emerald-700 text-emerald-100 text-sm">
                    Custo total estimado: <strong>{formatCurrencyBRL(grandTotalCost)}</strong>
                </div>
                <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs">
                    Regras aplicadas: OIP (A-D) dia/noite e DPC Especial dia/noite; fim de semana/feriado = valor noturno.
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div><label htmlFor="payment-report-start-date" className="block text-sm font-bold mb-1">Data de Início</label><input id="payment-report-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <div><label htmlFor="payment-report-end-date" className="block text-sm font-bold mb-1">Data de Fim</label><input id="payment-report-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <button onClick={fetchServices} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>
                <button onClick={exportToXLSX} disabled={frequencyRows.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 flex items-center space-x-2">
                    <Download size={18} />
                    <span>Baixar Planilha</span>
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
                            <th className="px-4 py-2">Custo Equipe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7"><LoadingSpinner /></td></tr>
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
                                            <td className="px-4 py-2 font-semibold text-emerald-300">{formatCurrencyBRL(totalCostByTeam[teamRow.id])}</td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-gray-900/40 border-b border-gray-700">
                                                <td colSpan="7" className="px-4 py-3">
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                                                        <div className="text-xs text-gray-400">
                                                            Janela para registrar presença/substituição: {windowLabel} {canMarkActions ? '✅ permitido' : '🔒 fora do horário - ações bloqueadas'}
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
                                                                            <div className="text-xs text-emerald-300 mt-1">
                                                                                Custo estimado: {formatCurrencyBRL(calculateMemberCostByStatus(teamRow, member))}
                                                                            </div>
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
                            <tr><td colSpan="7" className="text-center p-4 text-gray-500">Nenhuma equipe encontrada para o período selecionado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};