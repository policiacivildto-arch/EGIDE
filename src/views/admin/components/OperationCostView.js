// src/views/admin/components/OperationCost.js
import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '../../../config/api';
import { useAdminData } from '../useAdminData';
import { calculateShiftCost } from '../../../utils/calculateCost';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import PropTypes from 'prop-types';
import { Document, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, WidthType, Packer } from 'docx';
import { saveAs } from 'file-saver';

export const OperationCostView = ({ showNotification, allUsers, holidays, departamento, sharedStartDate, sharedEndDate }) => {
    const adminData = useAdminData();
    const resolvedAllUsers = allUsers || adminData.allUsers || [];
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(sharedStartDate || today);
    const [endDate, setEndDate] = useState(sharedEndDate || today);
    const [convoySchedules, setConvoySchedules] = useState({});
    const [planoOperacionalNumero, setPlanoOperacionalNumero] = useState('');
    const [diretorNome, setDiretorNome] = useState('');
    const [oipNomeManual, setOipNomeManual] = useState('');
    const [loading, setLoading] = useState(false);
    const [costData, setCostData] = useState(null); // Armazena os resultados do cálculo
    const [memberSchedules, setMemberSchedules] = useState({});
    const [expandedOperations, setExpandedOperations] = useState({});

    // Sincroniza datas com PaymentReportView quando navegando entre abas
    useEffect(() => {
        if (sharedStartDate) setStartDate(sharedStartDate);
        if (sharedEndDate) setEndDate(sharedEndDate);
    }, [sharedStartDate, sharedEndDate]);

    // Para otimizar, criamos um mapa de Matrícula -> Detalhes do Usuário
    const normalizeMatricula = (value) => String(value || '').replaceAll(/\D/g, '');
    const normalizeName = (value) => String(value || '')
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .replaceAll(/\s+/g, ' ')
        .trim()
        .toUpperCase();

    const userMatriculaMap = useMemo(() => {
        const map = new Map();
        for (const u of resolvedAllUsers) {
            map.set(String(u.matricula), u);
            map.set(normalizeMatricula(u.matricula), u);
        }
        return map;
    }, [resolvedAllUsers]);

    const userIdMap = useMemo(() => {
        const map = new Map();
        for (const u of resolvedAllUsers) {
            if (u?.id !== undefined && u?.id !== null) {
                map.set(String(u.id), u);
            }
        }
        return map;
    }, [resolvedAllUsers]);

    const userNameMap = useMemo(() => {
        const map = new Map();
        for (const u of resolvedAllUsers) {
            const key = normalizeName(u?.nome);
            if (key) map.set(key, u);
        }
        return map;
    }, [resolvedAllUsers]);

    const normalizeTime = (value) => {
        const raw = String(value || '');
        if (!raw) return '';
        if (raw.includes('T')) {
            const timePart = raw.split('T')[1] || '';
            return timePart.slice(0, 5);
        }
        if (raw.length >= 5) return raw.slice(0, 5);
        return raw;
    };

    const parseDateValue = (raw) => {
        if (!raw) return null;
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
            if (dateOnlyMatch) {
                const year = Number(dateOnlyMatch[1]);
                const month = Number(dateOnlyMatch[2]);
                const day = Number(dateOnlyMatch[3]);
                return new Date(year, month - 1, day, 0, 0, 0, 0);
            }
            return new Date(trimmed);
        }
        if (typeof raw === 'number') return new Date(raw);
        if (raw?.seconds) return new Date(raw.seconds * 1000);
        return null;
    };

    const toIsoDateKey = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const buildConvoyIdentityKey = (convoy) => {
        const rawId = String(convoy?.id || '').trim();
        if (rawId) return `id:${rawId}`;

        const dateObj = parseDateValue(convoy?.data || convoy?.date);
        const dateKey = toIsoDateKey(dateObj);
        const dpcKey = String(convoy?.dpc || convoy?.dpc_nome || '').trim().toUpperCase();
        const oipKey = String(convoy?.oip || convoy?.oip_nome || '').trim().toUpperCase();
        const aisKey = String(convoy?.ais || '').trim().toUpperCase();
        const bairrosKey = (Array.isArray(convoy?.bairros) ? convoy.bairros : [convoy?.bairros])
            .filter(Boolean)
            .map((value) => String(value).trim().toUpperCase())
            .sort()
            .join('|');

        return `raw:${dateKey}::${dpcKey}::${oipKey}::${aisKey}::${bairrosKey}`;
    };

    const getTeamIdsFromConvoy = (convoy) => {
        if (Array.isArray(convoy?.teamIds)) return convoy.teamIds;
        if (Array.isArray(convoy?.team_ids)) return convoy.team_ids;
        if (Array.isArray(convoy?.equipes)) return convoy.equipes;
        return [];
    };

    const getConvoyRuntimeKey = (convoy) => {
        const rawId = String(convoy?.id || '').trim();
        if (rawId) return `id:${rawId}`;
        return buildConvoyIdentityKey(convoy);
    };

    const getConvoyDept = (convoy) => convoy?.departamento || convoy?.departamento_nome || '';

    const formatMatricula = (value) => {
        if (!value) return 'N/A';
        return String(value);
    };

    const normalizeTextKey = (value) => String(value || '').trim().toUpperCase();

    const getOperationMergeKey = (operation) => {
        const dateKey = toIsoDateKey(operation?.date instanceof Date ? operation.date : parseDateValue(operation?.date));
        const aisKey = normalizeTextKey(operation?.ais);
        const bairrosKey = normalizeTextKey(operation?.bairros);
        const startKey = normalizeTime(operation?.horarioEntrada);
        const endKey = normalizeTime(operation?.horarioSaida);
        return `${dateKey}::${aisKey}::${bairrosKey}::${startKey}::${endKey}`;
    };

    const getEntryMergeKey = (entry) => {
        const dateKey = toIsoDateKey(entry?.date instanceof Date ? entry.date : parseDateValue(entry?.date));
        const equipeKey = normalizeTextKey(entry?.equipe);
        const policialKey = normalizeTextKey(entry?.policial);
        const matriculaKey = normalizeMatricula(entry?.matricula);
        const inicioKey = normalizeTime(entry?.inicio);
        const fimKey = normalizeTime(entry?.fim);
        const situacaoKey = normalizeTextKey(entry?.situacao);
        const substitutoKey = normalizeTextKey(entry?.substituto);
        return `${dateKey}::${equipeKey}::${policialKey}::${matriculaKey}::${inicioKey}::${fimKey}::${situacaoKey}::${substitutoKey}`;
    };

    const consolidateOperations = (operations) => {
        const mergedByKey = new Map();

        operations.forEach((operation) => {
            const mergeKey = getOperationMergeKey(operation);
            const current = mergedByKey.get(mergeKey);

            if (!current) {
                const dedupedEntries = [];
                const seenEntryKeys = new Set();
                (Array.isArray(operation?.entries) ? operation.entries : []).forEach((entry) => {
                    const entryKey = getEntryMergeKey(entry);
                    if (!entryKey || seenEntryKeys.has(entryKey)) return;
                    seenEntryKeys.add(entryKey);
                    dedupedEntries.push(entry);
                });

                mergedByKey.set(mergeKey, {
                    ...operation,
                    entries: dedupedEntries,
                    _entryKeys: seenEntryKeys,
                });
                return;
            }

            current.cost += Number(operation?.cost || 0);
            current.teamCost += Number(operation?.teamCost || 0);
            current.supervisionCost += Number(operation?.supervisionCost || 0);
            current.scheduleConfirmed = Boolean(current.scheduleConfirmed || operation?.scheduleConfirmed);
            current.scheduleConfirmedAt = current.scheduleConfirmedAt || operation?.scheduleConfirmedAt || null;

            const incomingEntries = Array.isArray(operation?.entries) ? operation.entries : [];
            incomingEntries.forEach((entry) => {
                const entryKey = getEntryMergeKey(entry);
                if (!entryKey || current._entryKeys.has(entryKey)) return;
                current._entryKeys.add(entryKey);
                current.entries.push(entry);
            });
        });

        return Array.from(mergedByKey.values()).map((operation) => {
            const { _entryKeys, ...clean } = operation;
            return clean;
        });
    };

    const getDefaultScheduleFromTeam = (team) => {
        const shift = team?.vaga_info?.turno || team?.vagaShiftType;
        const startTime = normalizeTime(team?.horarioEntrada) || (shift === 'day' ? '08:00' : '19:00');
        const endTime = normalizeTime(team?.horarioSaida) || (shift === 'day' ? '20:00' : '01:00');
        return { startTime, endTime };
    };

    const handleCalculateCost = async () => { // NOSONAR
        if (!startDate || !endDate) {
            showNotification("Por favor, selecione as datas de início e fim.", "error");
            return;
        }

        setLoading(true);
        setCostData(null);
        try {
            const [convoysResponse, teamsResponse, frequenciasResponse] = await Promise.all([
                apiClient.getAllConvoys({
                    data__gte: startDate,
                    data__lte: endDate,
                }),
                apiClient.getAllTeams({
                    'vaga__data__gte': startDate,
                    'vaga__data__lte': endDate,
                }),
                apiClient.getAllFrequencias({
                    data_operacao__gte: startDate,
                    data_operacao__lte: endDate,
                }),
            ]);

            const allConvoys = Array.isArray(convoysResponse)
                ? convoysResponse
                : (convoysResponse?.results || []);
            const teamsList = Array.isArray(teamsResponse)
                ? teamsResponse
                : (teamsResponse?.results || []);

            const filteredConvoys = allConvoys.filter((convoy) => {
                const convoyDate = convoy?.data || convoy?.date;
                if (!convoyDate) return false;
                const parsedConvoyDate = parseDateValue(convoyDate);
                if (!parsedConvoyDate || Number.isNaN(parsedConvoyDate.getTime())) return false;
                const isoDate = toIsoDateKey(parsedConvoyDate);
                const inRange = isoDate >= startDate && isoDate <= endDate;
                const deptOk = !departamento || getConvoyDept(convoy) === departamento;
                return inRange && deptOk;
            });

            const convoys = [];
            const seenConvoys = new Set();
            filteredConvoys.forEach((convoy) => {
                const identityKey = buildConvoyIdentityKey(convoy);
                if (!identityKey || seenConvoys.has(identityKey)) return;
                seenConvoys.add(identityKey);
                convoys.push(convoy);
            });

            const teamMap = new Map();
            const teamsByDate = new Map();
            teamsList.forEach((team) => {
                teamMap.set(team.id, team);
                teamMap.set(String(team.id), team);

                const teamDateRaw = team?.vaga_info?.data || team?.vagaDate;
                const teamDateObj = parseDateValue(teamDateRaw);
                const dateKey = toIsoDateKey(teamDateObj);
                if (!dateKey) return;

                const existingTeams = teamsByDate.get(dateKey) || [];
                const teamIdKey = String(team.id);
                if (!existingTeams.includes(teamIdKey)) {
                    teamsByDate.set(dateKey, [...existingTeams, teamIdKey]);
                }
            });

            const assignedFallbackTeamsByDate = new Map();
            const teamIdsByConvoyKey = new Map();

            convoys.forEach((convoy) => {
                const convoyKey = getConvoyRuntimeKey(convoy);
                const explicitTeamIds = [...new Set(getTeamIdsFromConvoy(convoy).map(String).filter(Boolean))];

                const convoyDateRaw = convoy?.data || convoy?.date;
                const convoyDateObj = parseDateValue(convoyDateRaw);
                const dateKey = toIsoDateKey(convoyDateObj);

                if (!dateKey) {
                    teamIdsByConvoyKey.set(convoyKey, explicitTeamIds);
                    return;
                }

                const assignedTeams = assignedFallbackTeamsByDate.get(dateKey) || new Set();
                let resolvedTeamIds = explicitTeamIds;

                if (explicitTeamIds.length > 0) {
                    // Mesmo com teamIds explícitos, evita duplicar a mesma equipe no mesmo dia.
                    resolvedTeamIds = explicitTeamIds.filter((teamId) => !assignedTeams.has(String(teamId)));
                } else {
                    const teamsOnDate = teamsByDate.get(dateKey) || [];
                    resolvedTeamIds = teamsOnDate.filter((teamId) => !assignedTeams.has(String(teamId)));
                }

                resolvedTeamIds.forEach((teamId) => assignedTeams.add(String(teamId)));
                assignedFallbackTeamsByDate.set(dateKey, assignedTeams);
                teamIdsByConvoyKey.set(convoyKey, resolvedTeamIds);
            });

            const resolveTeamIdsForConvoy = (convoy) => {
                const convoyKey = getConvoyRuntimeKey(convoy);
                const mapped = teamIdsByConvoyKey.get(convoyKey);
                if (Array.isArray(mapped)) return mapped;
                return [...new Set(getTeamIdsFromConvoy(convoy).map(String).filter(Boolean))];
            };

            // Mapa de frequência por equipe+policial+data e equipe+matrícula+data.
            const frequencias = Array.isArray(frequenciasResponse) ? frequenciasResponse : (frequenciasResponse?.results || []);
            const frequencyByTeamPolicialDate = new Map();
            const frequencyByTeamMatriculaDate = new Map();
            for (const freq of frequencias) {
                const equipeId = String(freq.equipe);
                const policialId = String(freq.policial || '');
                const dateKey = String(freq.data_operacao || '');
                const matriculaKey = normalizeMatricula(freq.policial_matricula);

                if (equipeId && policialId && dateKey) {
                    frequencyByTeamPolicialDate.set(`${equipeId}::${policialId}::${dateKey}`, freq);
                }

                if (equipeId && matriculaKey && dateKey) {
                    frequencyByTeamMatriculaDate.set(`${equipeId}::${matriculaKey}::${dateKey}`, freq);
                }
            }

            const scheduleDraft = {};
            convoys.forEach((convoy) => {
                const resolvedTeamIds = resolveTeamIdsForConvoy(convoy);
                const firstTeam = teamMap.get(resolvedTeamIds[0]);
                const defaultSchedule = firstTeam
                    ? getDefaultScheduleFromTeam(firstTeam)
                    : { startTime: '19:00', endTime: '01:00' };
                const existing = convoySchedules[convoy.id] || {};
                const startTime = normalizeTime(existing.startTime) || defaultSchedule.startTime;
                const endTime = normalizeTime(existing.endTime) || defaultSchedule.endTime;
                scheduleDraft[convoy.id] = {
                    startTime,
                    endTime,
                    // Confirma automaticamente se já tem horários válidos
                    confirmed: Boolean(existing.confirmed) || Boolean(startTime && endTime),
                    confirmedAt: existing.confirmedAt || new Date().toISOString(),
                };
            });

            setConvoySchedules(scheduleDraft);
            
            // 3. Calcula o custo para cada operação
            let grandTotalCost = 0;
            const operationsDetails = [];
            const processedSupervisorsByDate = new Map();
            for (const convoy of convoys) {
                let currentOperationCost = 0;
                let supervisionCost = 0;
                let teamCost = 0;
                const processedMatriculas = new Set();
                const operationEntries = [];

                const schedule = scheduleDraft[convoy.id] || { startTime: '19:00', endTime: '01:00', confirmed: false, confirmedAt: null };
                const operationStartTime = schedule.startTime;
                const operationEndTime = schedule.endTime;

                const convoyDate = convoy?.data || convoy?.date;
                const convoyDateObj = parseDateValue(convoyDate);
                let convoyBaseDate = new Date();
                if (convoyDateObj && !Number.isNaN(convoyDateObj?.getTime())) {
                    convoyBaseDate = convoyDateObj;
                }

                const convoyDateKey = toIsoDateKey(convoyBaseDate) || `convoy-${convoy.id}`;
                const processedSupervisorsForDate = processedSupervisorsByDate.get(convoyDateKey) || new Set();
                processedSupervisorsByDate.set(convoyDateKey, processedSupervisorsForDate);

                const addCostForUser = (userDetails, date, startTime, endTime) => {
                    if (!userDetails?.cargo || !userDetails?.classe) return;
                    const matKey = normalizeMatricula(userDetails.matricula);
                    if (!matKey || processedMatriculas.has(matKey)) return;
                    processedMatriculas.add(matKey);
                    const userCost = calculateShiftCost(userDetails, date, startTime, endTime, holidays || adminData.holidays || []);
                    currentOperationCost += userCost;
                    return userCost;
                };

                const addEntry = ({ date, equipe, policial, matricula, inicio, fim, situacao = 'pendente', substituto = '', cost = 0 }) => {
                    operationEntries.push({
                        date,
                        equipe,
                        policial,
                        matricula: matricula || '',
                        inicio,
                        fim,
                        situacao,
                        substituto,
                        cost,
                    });
                };

                const resolveSupervisor = (idField, nameField) => {
                    if (idField !== undefined && idField !== null && userIdMap.has(String(idField))) {
                        return userIdMap.get(String(idField));
                    }
                    const idAsName = normalizeName(idField);
                    if (idAsName && userNameMap.has(idAsName)) {
                        return userNameMap.get(idAsName);
                    }
                    const nameKey = normalizeName(nameField);
                    if (nameKey && userNameMap.has(nameKey)) {
                        return userNameMap.get(nameKey);
                    }
                    return null;
                };

                const getSupervisorIdentityKey = (userDetails, fallbackId, fallbackName) => {
                    const matriculaKey = normalizeMatricula(userDetails?.matricula);
                    if (matriculaKey) return `mat:${matriculaKey}`;
                    if (userDetails?.id !== undefined && userDetails?.id !== null) {
                        return `id:${userDetails.id}`;
                    }
                    const fallbackIdKey = String(fallbackId || '').trim();
                    if (fallbackIdKey) return `raw:${fallbackIdKey}`;
                    const nameKey = normalizeName(userDetails?.nome || fallbackName);
                    if (nameKey) return `name:${nameKey}`;
                    return '';
                };

                const addSupervisorEntry = (userDetails, fallbackId, fallbackName) => {
                    if (!userDetails && !fallbackName && !fallbackId) return 0;

                    const supervisorKey = getSupervisorIdentityKey(userDetails, fallbackId, fallbackName);
                    if (supervisorKey && processedSupervisorsForDate.has(supervisorKey)) {
                        return 0;
                    }

                    if (supervisorKey) {
                        processedSupervisorsForDate.add(supervisorKey);
                    }

                    const userCost = addCostForUser(userDetails, convoyBaseDate, operationStartTime, operationEndTime) || 0;
                    addEntry({
                        date: convoyBaseDate,
                        equipe: 'DTO',
                        policial: userDetails?.nome || fallbackName || String(fallbackId || 'N/A'),
                        matricula: userDetails?.matricula || '',
                        inicio: operationStartTime,
                        fim: operationEndTime,
                        cost: userCost,
                    });

                    return userCost;
                };

                const dpcUser = resolveSupervisor(convoy?.dpc, convoy?.dpc_nome);
                const oipUser = resolveSupervisor(convoy?.oip, convoy?.oip_nome);
                const dpcCost = addSupervisorEntry(dpcUser, convoy?.dpc, convoy?.dpc_nome);
                const oipCost = addSupervisorEntry(oipUser, convoy?.oip, convoy?.oip_nome);
                supervisionCost += dpcCost + oipCost;
                
                const teamIds = resolveTeamIdsForConvoy(convoy);
                for (const teamId of teamIds) {
                    const team = teamMap.get(teamId);
                    if (!team) continue;

                    const teamDateRaw = team?.vaga_info?.data || team?.vagaDate;
                    const date = parseDateValue(teamDateRaw);
                    if (!date || Number.isNaN(date.getTime())) continue;

                    const shift = team?.vaga_info?.turno || team?.vagaShiftType;
                    const startTime = normalizeTime(team?.horarioEntrada) || operationStartTime || (shift === 'day' ? '08:00' : '19:00');
                    const endTime = normalizeTime(team?.horarioSaida) || operationEndTime || (shift === 'day' ? '20:00' : '01:00');

                    const teamMembers = Array.isArray(team?.membros_detalhes) && team.membros_detalhes.length > 0
                        ? team.membros_detalhes
                        : [];

                    const leaderFallback = team?.chefe_matricula || team?.chefe?.matricula;
                    if (teamMembers.length === 0 && leaderFallback) {
                        teamMembers.push({ matricula: leaderFallback });
                    }

                    const seenMatriculas = new Set();
                    const teamDateKey = toIsoDateKey(date);
                    for (const member of teamMembers) {
                        const mat = member?.matricula;
                        const key = normalizeMatricula(mat);
                        if (!key || seenMatriculas.has(key) || processedMatriculas.has(key)) continue;

                        const userDetails = userMatriculaMap.get(String(mat)) || userMatriculaMap.get(key);
                        const memberPolicialId = member?.id !== undefined && member?.id !== null
                            ? String(member.id)
                            : null;
                        const userPolicialId = userDetails?.id !== undefined && userDetails?.id !== null
                            ? String(userDetails.id)
                            : null;

                        let freqRecord = null;
                        if (teamDateKey) {
                            if (memberPolicialId) {
                                freqRecord = frequencyByTeamPolicialDate.get(`${team.id}::${memberPolicialId}::${teamDateKey}`) || null;
                            }

                            if (!freqRecord && userPolicialId) {
                                freqRecord = frequencyByTeamPolicialDate.get(`${team.id}::${userPolicialId}::${teamDateKey}`) || null;
                            }

                            if (!freqRecord && key) {
                                freqRecord = frequencyByTeamMatriculaDate.get(`${team.id}::${key}::${teamDateKey}`) || null;
                            }
                        }

                        // Somente policiais com presença registrada aparecem no RDO.
                        if (!freqRecord || !['presente', 'substituto'].includes(String(freqRecord.status || '').toLowerCase())) {
                            continue;
                        }

                        seenMatriculas.add(key);

                        const plannedName = member?.policial_planejado_nome || userDetails?.nome || member?.nome || 'Sem nome';
                        const plannedMatricula = member?.policial_planejado_matricula || userDetails?.matricula || member?.matricula || '';

                        let effectiveName = plannedName;
                        let effectiveMatricula = plannedMatricula;
                        let freqSituacao = String(freqRecord?.status || 'pendente').toLowerCase();
                        let substitutoStr = '';

                        if (freqRecord?.status === 'substituto' && freqRecord.substituto) {
                            const subUser = userIdMap.get(String(freqRecord.substituto));
                            if (subUser) {
                                effectiveName = freqRecord.substituto_nome || subUser.nome || plannedName;
                                effectiveMatricula = freqRecord.substituto_matricula || subUser.matricula || plannedMatricula;
                                substitutoStr = `Substituiu: ${plannedName} (${formatMatricula(plannedMatricula)})`;
                                const subKey = normalizeMatricula(subUser.matricula);
                                if (!processedMatriculas.has(subKey)) {
                                    const subCost = addCostForUser(subUser, date, startTime, endTime) || 0;
                                    teamCost += subCost;
                                    addEntry({
                                        date,
                                        equipe: team?.teamName || team?.delegaciaPrincipal || team?.vaga_info?.delegacia_nome || `Equipe ${team.id}`,
                                        policial: effectiveName,
                                        matricula: effectiveMatricula,
                                        inicio: startTime,
                                        fim: endTime,
                                        situacao: 'substituto',
                                        substituto: substitutoStr,
                                        cost: subCost,
                                    });
                                }
                                continue;
                            }
                        }

                        const rowCost = addCostForUser(userDetails, date, startTime, endTime) || 0;
                        teamCost += rowCost;

                        addEntry({
                            date,
                            equipe: team?.teamName || team?.delegaciaPrincipal || team?.vaga_info?.delegacia_nome || `Equipe ${team.id}`,
                            policial: effectiveName,
                            matricula: effectiveMatricula,
                            inicio: startTime,
                            fim: endTime,
                            situacao: freqSituacao,
                            substituto: substitutoStr,
                            cost: rowCost,
                        });
                    }
                }

                grandTotalCost += currentOperationCost;
                operationsDetails.push({
                    id: convoy.id,
                    date: parseDateValue(convoy?.data || convoy?.date) || new Date(),
                    ais: convoy.ais,
                    bairros: Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : convoy.bairro,
                    horarioEntrada: operationStartTime,
                    horarioSaida: operationEndTime,
                    supervisionCost,
                    teamCost,
                    scheduleConfirmed: Boolean(schedule.confirmed),
                    scheduleConfirmedAt: schedule.confirmedAt,
                    entries: operationEntries,
                    cost: currentOperationCost
                });
            }

            if (operationsDetails.length === 0 && teamsList.length > 0) {
                for (const team of teamsList) {
                    const teamDateRaw = team?.vaga_info?.data || team?.vagaDate;
                    const date = parseDateValue(teamDateRaw);
                    if (!date || Number.isNaN(date.getTime())) continue;

                    const shift = team?.vaga_info?.turno || team?.vagaShiftType;
                    const startTime = normalizeTime(team?.horarioEntrada) || (shift === 'day' ? '08:00' : '19:00');
                    const endTime = normalizeTime(team?.horarioSaida) || (shift === 'day' ? '20:00' : '01:00');

                    const members = Array.isArray(team?.membros_detalhes) && team.membros_detalhes.length > 0
                        ? team.membros_detalhes
                        : [];

                    const seenMatriculas = new Set();
                    let teamCost = 0;
                    for (const member of members) {
                        const mat = member?.matricula;
                        const key = normalizeMatricula(mat);
                        if (!key || seenMatriculas.has(key)) continue;
                        seenMatriculas.add(key);
                        const userDetails = userMatriculaMap.get(String(mat)) || userMatriculaMap.get(key);
                        if (!userDetails?.cargo || !userDetails?.classe) continue;
                        teamCost += calculateShiftCost(userDetails, date, startTime, endTime, holidays || adminData.holidays || []);
                    }

                    grandTotalCost += teamCost;
                    const fallbackEntries = members.map((member) => {
                        const mat = member?.matricula;
                        const key = normalizeMatricula(mat);
                        const userDetails = userMatriculaMap.get(String(mat)) || userMatriculaMap.get(key);
                        const rowCost = userDetails?.cargo && userDetails?.classe
                            ? calculateShiftCost(userDetails, date, startTime, endTime, holidays || adminData.holidays || [])
                            : 0;

                        const plannedName = member?.policial_planejado_nome || userDetails?.nome || member?.nome || 'Sem nome';
                        const plannedMatricula = member?.policial_planejado_matricula || userDetails?.matricula || member?.matricula || '';

                        const substituteName =
                            member?.policial_substituto_nome ||
                            member?.substituto_nome ||
                            member?.substituto?.nome ||
                            member?.substituido_por_nome ||
                            '';
                        const substituteMatricula =
                            member?.policial_substituto_matricula ||
                            member?.substituto_matricula ||
                            member?.substituto?.matricula ||
                            member?.substituido_por_matricula ||
                            '';
                        const isSubstituido = Boolean(substituteName);

                        return {
                            date,
                            equipe: team?.teamName || team?.delegaciaPrincipal || team?.vaga_info?.delegacia_nome || `Equipe ${team.id}`,
                            policial: plannedName,
                            matricula: plannedMatricula,
                            inicio: startTime,
                            fim: endTime,
                            situacao: isSubstituido ? 'substituido' : 'pendente',
                            substituto: isSubstituido
                                ? `${substituteName} (${formatMatricula(substituteMatricula)})`
                                : '',
                            cost: rowCost,
                        };
                    });

                    operationsDetails.push({
                        id: `team-${team.id}`,
                        date,
                        ais: team?.vaga_info?.ais || 'Sem comboio',
                        bairros: team?.vaga_info?.delegacia_nome || team?.delegaciaPrincipal || team?.teamName || 'Equipe sem comboio',
                        horarioEntrada: startTime,
                        horarioSaida: endTime,
                        supervisionCost: 0,
                        teamCost,
                        scheduleConfirmed: false,
                        scheduleConfirmedAt: null,
                        entries: fallbackEntries,
                        cost: teamCost,
                    });
                }
            }

            if (operationsDetails.length === 0) {
                showNotification("Nenhuma operação/equipe encontrada para o período.", "info");
                setLoading(false);
                return;
            }
            
            const consolidatedOperations = consolidateOperations(operationsDetails);
            const sortedOperations = [...consolidatedOperations].sort((a, b) => a.date - b.date);
            setCostData({
                totalCost: grandTotalCost,
                operations: sortedOperations,
                totalOperations: consolidatedOperations.length
            });

            const pendingConfirmations = operationsDetails.filter((op) => !op.scheduleConfirmed).length;
            if (pendingConfirmations > 0) {
                showNotification(`${pendingConfirmations} comboio(s) ainda sem confirmação de horário.`, 'info');
            }

        } catch (error) {
            console.error("Erro ao calcular custo:", error);
            showNotification("Falha ao calcular o custo das operações.", "error");
        } finally {
            setLoading(false);
        }
    };

    const getOperationsForExport = () => {
        if (!costData?.operations?.length) return [];

        return costData.operations
            .map((op) => {
                const schedule = convoySchedules[op.id] || {};
                const confirmed = Boolean(schedule.confirmed);
                const startTime = normalizeTime(schedule.startTime) || op.horarioEntrada;
                const endTime = normalizeTime(schedule.endTime) || op.horarioSaida;
                return {
                    ...op,
                    horarioEntrada: startTime,
                    horarioSaida: endTime,
                    scheduleConfirmed: confirmed,
                };
            });
    };

    const getMemberKey = (opId, entry) => `${opId}-${entry.matricula || entry.policial}`;

    const handleMemberTimeChange = (opId, entry, field, value) => {
        const key = getMemberKey(opId, entry);
        setMemberSchedules((prev) => ({
            ...prev,
            [key]: { ...(prev[key] || {}), [field]: value },
        }));
    };

    const toggleOperationExpand = (opId) => {
        setExpandedOperations((prev) => ({ ...prev, [opId]: !prev[opId] }));
    };

    const getEntriesForExport = () => {
        const operations = getOperationsForExport();
        const rows = operations.flatMap((op) => {
            const schedule = convoySchedules[op.id] || {};
            const convoyInicio = normalizeTime(schedule.startTime) || op.horarioEntrada || 'N/A';
            const convoyFim = normalizeTime(schedule.endTime) || op.horarioSaida || 'N/A';
            const entries = Array.isArray(op.entries) ? op.entries : [];

            return entries.map((entry) => {
                const mKey = getMemberKey(op.id, entry);
                const mSchedule = memberSchedules[mKey];
                return {
                    ...entry,
                    inicio: mSchedule?.startTime || convoyInicio,
                    fim: mSchedule?.endTime || convoyFim,
                };
            });
        });

        return rows;
    };

    const handleScheduleTimeChange = (convoyId, field, value) => {
        setConvoySchedules((prev) => {
            const current = prev[convoyId] || {};
            return {
                ...prev,
                [convoyId]: {
                    ...current,
                    [field]: value,
                    confirmed: false,
                    confirmedAt: null,
                },
            };
        });
    };

    const handleConfirmConvoySchedule = (operation) => {
        const current = convoySchedules[operation.id] || {};
        const startTime = normalizeTime(current.startTime) || operation.horarioEntrada;
        const endTime = normalizeTime(current.endTime) || operation.horarioSaida;

        if (!startTime || !endTime) {
            showNotification('Informe entrada e saída para confirmar o horário do comboio.', 'warning');
            return;
        }

        setConvoySchedules((prev) => ({
            ...prev,
            [operation.id]: {
                ...prev[operation.id],
                startTime,
                endTime,
                confirmed: true,
                confirmedAt: new Date().toISOString(),
            },
        }));

        showNotification(`Horário do comboio ${operation.id} confirmado (${startTime} - ${endTime}).`, 'success');
    };

    const exportToPDF = () => {
        const exportRows = getEntriesForExport();
        if (!exportRows.length) {
            showNotification('Não há dados para imprimir.', 'warning');
            return;
        }

        const hasPendingConfirmation = (costData?.operations || []).some((op) => !convoySchedules[op.id]?.confirmed);
        if (hasPendingConfirmation) {
            showNotification('PDF gerado com horários atuais (há comboios não confirmados).', 'info');
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        const dataInicioFmt = new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR');
        const dataReferencia = exportRows[0]?.date
            ? new Date(exportRows[0].date).toLocaleDateString('pt-BR')
            : dataInicioFmt;
        const dataEmissao = new Date().toLocaleDateString('pt-BR');
        const planoNumero = planoOperacionalNumero || '<<n°_plano>>';
        const diretor = diretorNome || '<<diretor>>';
        const oipAssinatura = oipNomeManual || exportRows.find((row) => row.equipe === 'DTO')?.policial || '<<OIP>>';
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        let cursorY = 16;

        const drawFooter = () => {
            const pageCount = doc.getNumberOfPages();
            const currentPage = doc.getCurrentPageInfo().pageNumber;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(
                `POLÍCIA CIVIL DO CEARÁ | DTO | Relatório de Pagamento | Emissão: ${dataEmissao}`,
                pageWidth / 2,
                pageHeight - 8,
                { align: 'center' }
            );
            doc.text(`Página ${currentPage}/${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
        };

        const addWrapped = (text, x = 14, fontSize = 11, lineHeight = 6) => {
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, 182);
            doc.text(lines, x, cursorY);
            cursorY += lines.length * lineHeight;
        };

        const addCentered = (text, fontSize = 12, lineHeight = 6) => {
            doc.setFontSize(fontSize);
            doc.text(text, 105, cursorY, { align: 'center' });
            cursorY += lineHeight;
        };

        doc.setFont('helvetica', 'bold');
        addCentered('DEPARTAMENTO TÉCNICO OPERACIONAL', 12, 6);
        addCentered('SEÇÃO DE OPERAÇÕES', 12, 6);

        cursorY += 6;
        doc.setFont('helvetica', 'bold');
        addCentered('RELATÓRIO DE PAGAMENTO', 14, 7);
        addCentered('OPERAÇÃO “ÉGIDE”', 14, 7);
        addCentered(`PLANO OPERACIONAL Nº ${planoNumero}`, 12, 6);

        cursorY += 4;
        doc.setFont('helvetica', 'normal');
        addWrapped(`Ao ${diretor}`, 14, 11, 6);
        addWrapped(`Referência: Plano Operacional n° ${planoNumero} – DTO/PCCE`, 14, 11, 6);
        addWrapped(`Apresentamos a seguir o relatório de pagamento das equipes da Polícia Civil do Ceará que participaram da Operação “ÉGIDE”, coordenada pelo DTO. As equipes policiais realizaram o serviço operacional no dia ${dataReferencia}, de acordo com o Plano Operacional n° ${planoNumero} – DTO/PCCE.`, 14, 11, 6);

        cursorY += 2;
        doc.setFont('helvetica', 'bold');
        addWrapped('DO EFETIVO E ALTERAÇÕES', 14, 12, 6);
        doc.setFont('helvetica', 'normal');
        addWrapped('Os Policiais Civis a seguir descritos efetivamente participaram da operação:', 14, 11, 6);

        const tableHead = [['Data', 'Equipe', 'Policial', 'Matrícula', 'Horário', 'Situação', 'Substituto', 'Custo']];
        const tableBody = exportRows.map((row) => [
            row.date ? new Date(row.date).toLocaleDateString('pt-BR') : 'N/A',
            row.equipe || 'N/A',
            row.policial || 'N/A',
            row.matricula || 'N/A',
            `${row.inicio || 'N/A'} - ${row.fim || 'N/A'}`,
            row.situacao || 'pendente',
            row.substituto || '',
            `R$ ${Number(row.cost || 0).toFixed(2).replaceAll('.', ',')}`,
        ]);

        autoTable(doc, {
            head: tableHead,
            body: tableBody,
            startY: cursorY + 2,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { textColor: [0, 0, 0], fontSize: 8 },
            margin: { left: 14, right: 14, bottom: 20 },
            didDrawPage: () => {
                drawFooter();
            },
        });

        const finalY = doc.lastAutoTable?.finalY || cursorY + 30;
        const assinaturaY = Math.min(finalY + 16, pageHeight - 40);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Fortaleza, ${dataEmissao}.`, pageWidth - 14, assinaturaY, { align: 'right' });
        doc.text(oipAssinatura, pageWidth / 2, assinaturaY + 12, { align: 'center' });
        doc.text('Oficial Investigador de Polícia', pageWidth / 2, assinaturaY + 18, { align: 'center' });
        doc.text(`Destinatário: ${diretor}`, 14, assinaturaY + 30);

        drawFooter();

        doc.save(`Relatorio_Pagamento_${startDate}_a_${endDate}.pdf`);
    };

    const exportToDocx = async () => {
        const exportRows = getEntriesForExport();
        if (!exportRows.length) {
            showNotification('Não há dados para exportar.', 'warning');
            return;
        }

        const dataInicioFmt = new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR');
        const dataReferencia = exportRows[0]?.date
            ? new Date(exportRows[0].date).toLocaleDateString('pt-BR')
            : dataInicioFmt;
        const dataEmissao = new Date().toLocaleDateString('pt-BR');
        const planoNumero = planoOperacionalNumero || '<<n°_plano>>';
        const diretor = diretorNome || '<<diretor>>';
        const oipAssinatura = oipNomeManual || exportRows.find((r) => r.equipe === 'DTO')?.policial || '<<OIP>>';
        const totalCost = exportRows.reduce((sum, r) => sum + Number(r.cost || 0), 0);

        const makeCell = (text, bold = false) =>
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), bold, size: 18 })] })],
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
            });

        const headerRow = new TableRow({
            children: [
                makeCell('Data', true),
                makeCell('Equipe', true),
                makeCell('Policial', true),
                makeCell('Matrícula', true),
                makeCell('Horário', true),
                makeCell('Situação', true),
                makeCell('Substituto', true),
                makeCell('Valor (R$)', true),
            ],
            tableHeader: true,
        });

        const dataRows = exportRows.map(
            (row) =>
                new TableRow({
                    children: [
                        makeCell(row.date ? new Date(row.date).toLocaleDateString('pt-BR') : 'N/A'),
                        makeCell(row.equipe || 'N/A'),
                        makeCell(row.policial || 'N/A'),
                        makeCell(row.matricula || 'N/A'),
                        makeCell(`${row.inicio || 'N/A'} - ${row.fim || 'N/A'}`),
                        makeCell(row.situacao || 'pendente'),
                        makeCell(row.substituto || ''),
                        makeCell(`R$ ${Number(row.cost || 0).toFixed(2).replaceAll('.', ',')}`),
                    ],
                })
        );

        const p = (text, bold = false, center = false, size = 22) =>
            new Paragraph({
                children: [new TextRun({ text, bold, size })],
                alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { after: 120 },
            });

        const doc = new Document({
            sections: [{
                children: [
                    p('DEPARTAMENTO TÉCNICO OPERACIONAL', true, true, 24),
                    p('SEÇÃO DE OPERAÇÕES', true, true, 24),
                    p(''),
                    p('RELATÓRIO DE PAGAMENTO', true, true, 28),
                    p('OPERAÇÃO "ÉGIDE"', true, true, 28),
                    p(`PLANO OPERACIONAL Nº ${planoNumero}`, true, true, 24),
                    p(''),
                    p(`Ao ${diretor}`),
                    p(`Referência: Plano Operacional n° ${planoNumero} – DTO/PCCE`),
                    p(''),
                    p(`Apresentamos a seguir o relatório de pagamento das equipes da Polícia Civil do Ceará que participaram da Operação "ÉGIDE", coordenada pelo DTO. As equipes policiais realizaram o serviço operacional no dia ${dataReferencia}, de acordo com o Plano Operacional n° ${planoNumero} – DTO/PCCE.`),
                    p(''),
                    p('DO EFETIVO E ALTERAÇÕES', true, false, 24),
                    p('Os Policiais Civis a seguir descritos efetivamente participaram da operação:'),
                    p(''),
                    new Table({
                        rows: [headerRow, ...dataRows],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                    }),
                    p(''),
                    new Paragraph({
                        children: [new TextRun({ text: `Custo Total: R$ ${totalCost.toFixed(2).replaceAll('.', ',')}`, bold: true, size: 22 })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 120 },
                    }),
                    p(''),
                    p(''),
                    new Paragraph({
                        children: [new TextRun({ text: `Fortaleza, ${dataEmissao}.`, size: 22 })],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 400 },
                    }),
                    p(oipAssinatura, true, true),
                    p('Oficial Investigador de Polícia', false, true),
                    p(''),
                    p(`Destinatário: ${diretor}`),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Relatorio_Pagamento_${startDate}_a_${endDate}.docx`);
        showNotification('Relatório Word exportado com sucesso.', 'success');
    };

    const exportToXLSX = () => {
        const exportRows = getEntriesForExport();
        if (!exportRows.length) {
            showNotification('Não há dados para exportar.', 'warning');
            return;
        }

        const rows = exportRows.map((row) => ({
            Data: row.date ? new Date(row.date).toLocaleDateString('pt-BR') : 'N/A',
            Equipe: row.equipe || 'N/A',
            Policial: row.policial || 'N/A',
            Matricula: row.matricula || 'N/A',
            Horario: `${row.inicio || 'N/A'} - ${row.fim || 'N/A'}`,
            Situacao: row.situacao || 'pendente',
            Substituto: row.substituto || '',
            Custo: `R$ ${Number(row.cost || 0).toFixed(2).replaceAll('.', ',')}`,
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        worksheet['!cols'] = [
            { wch: 12 },
            { wch: 25 },
            { wch: 30 },
            { wch: 16 },
            { wch: 16 },
            { wch: 14 },
            { wch: 30 },
            { wch: 16 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'RelatorioPagamento');
        XLSX.writeFile(workbook, `Relatorio_Pagamento_${startDate}_a_${endDate}.xlsx`);
    };
    
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Relatório de Pagamento</h3>
            <div className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div><label htmlFor="operation-cost-start-date" className="block text-sm font-bold mb-1">Data de Início</label><input id="operation-cost-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <div><label htmlFor="operation-cost-end-date" className="block text-sm font-bold mb-1">Data de Fim</label><input id="operation-cost-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" /></div>
                <button onClick={handleCalculateCost} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Calculando...' : 'Calcular Custo da Operação'}
                </button>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="operation-cost-plano-numero" className="block text-sm font-bold mb-1">Nº do Plano Operacional</label>
                    <input
                        id="operation-cost-plano-numero"
                        type="text"
                        value={planoOperacionalNumero}
                        onChange={(e) => setPlanoOperacionalNumero(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-md"
                        placeholder="Ex: 012/2026"
                    />
                </div>
                <div>
                    <label htmlFor="operation-cost-diretor" className="block text-sm font-bold mb-1">Diretor</label>
                    <input
                        id="operation-cost-diretor"
                        type="text"
                        value={diretorNome}
                        onChange={(e) => setDiretorNome(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-md"
                        placeholder="Nome do diretor"
                    />
                </div>
                <div>
                    <label htmlFor="operation-cost-oip-assinatura" className="block text-sm font-bold mb-1">OIP (assinatura)</label>
                    <input
                        id="operation-cost-oip-assinatura"
                        type="text"
                        value={oipNomeManual}
                        onChange={(e) => setOipNomeManual(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-md"
                        placeholder="Nome do OIP"
                    />
                </div>
            </div>

            <div className="mb-4 p-3 rounded-lg text-sm bg-blue-900/30 text-blue-200 border border-blue-700">
                O horário agora é individual por comboio. Após ajustar um horário na tabela, clique em "Confirmar Horário" no comboio e recalcule o custo.
            </div>
            
            {loading && <LoadingSpinner />}
            
            {costData && (
                 <div className="animate-fade-in space-y-6">
                    {/* --- SEÇÃO DE RESUMO --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-green-400">R$ {costData.totalCost.toFixed(2).replaceAll('.', ',')}</p>
                            <p className="text-sm text-gray-400">Custo Total das Operações no Período</p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg text-center">
                            <p className="text-3xl font-bold text-blue-400">{costData.totalOperations}</p>
                            <p className="text-sm text-gray-400">Operações Realizadas</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 flex-wrap">
                        <button onClick={exportToXLSX} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                            <Download size={18} />
                            <span>Exportar Planilha</span>
                        </button>
                        <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                            <Download size={18} />
                            <span>Exportar PDF</span>
                        </button>
                        <button onClick={exportToDocx} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                            <Download size={18} />
                            <span>Exportar Word</span>
                        </button>
                    </div>
                    
                    {/* --- TABELA DETALHADA --- */}
                    <div className="overflow-x-auto bg-gray-800 rounded-lg">
                        <table className="w-full text-sm text-left">
                           <thead className="text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-4 py-2">Data</th>
                                    <th className="px-4 py-2">Área (AIS)</th>
                                    <th className="px-4 py-2">Bairro(s)</th>
                                    <th className="px-4 py-2">Entrada</th>
                                    <th className="px-4 py-2">Saída</th>
                                    <th className="px-4 py-2">Supervisão</th>
                                    <th className="px-4 py-2">Confirmar Horário</th>
                                    <th className="px-4 py-2">Equipe</th>
                                    <th className="px-4 py-2 text-right">Pagamento Estimado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {costData.operations.map(op => {
                                    const isExpanded = Boolean(expandedOperations[op.id]);
                                    const opEntries = Array.isArray(op.entries) ? op.entries : [];
                                    return (
                                        <React.Fragment key={op.id}>
                                            <tr className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="px-4 py-2">{op.date.toLocaleDateString('pt-BR')}</td>
                                                <td className="px-4 py-2">{op.ais}</td>
                                                <td className="px-4 py-2">{op.bairros}</td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="time"
                                                        value={normalizeTime(convoySchedules[op.id]?.startTime) || op.horarioEntrada || ''}
                                                        onChange={(e) => handleScheduleTimeChange(op.id, 'startTime', e.target.value)}
                                                        className="p-1 bg-gray-700 rounded-md"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="time"
                                                        value={normalizeTime(convoySchedules[op.id]?.endTime) || op.horarioSaida || ''}
                                                        onChange={(e) => handleScheduleTimeChange(op.id, 'endTime', e.target.value)}
                                                        className="p-1 bg-gray-700 rounded-md"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-purple-300 font-semibold">
                                                    R$ {(op.supervisionCost || 0).toFixed(2).replaceAll('.', ',')}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <button
                                                        onClick={() => handleConfirmConvoySchedule(op)}
                                                        className={`${convoySchedules[op.id]?.confirmed ? 'bg-green-700 hover:bg-green-800' : 'bg-purple-600 hover:bg-purple-700'} text-white text-xs font-bold py-1 px-2 rounded`}
                                                    >
                                                        {convoySchedules[op.id]?.confirmed ? 'Confirmado' : 'Confirmar Horário'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <button
                                                        onClick={() => toggleOperationExpand(op.id)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                                                    >
                                                        {isExpanded ? 'Ocultar' : `Ver equipe (${opEntries.length})`}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2 text-right font-bold text-green-400">R$ {op.cost.toFixed(2).replaceAll('.', ',')}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-900/40 border-b border-gray-700">
                                                    <td colSpan="9" className="px-4 py-3">
                                                        <div className="text-xs text-yellow-300 mb-2">
                                                            Somente policiais com presença registrada na aba Frequência aparecem aqui. Edite os horários individuais (opcional — sobrescreve o horário do comboio no relatório Word).
                                                        </div>
                                                        {opEntries.length === 0 ? (
                                                            <div className="text-sm text-gray-400">Nenhum integrante com presença registrada nesta operação.</div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {opEntries.map((entry, idx) => {
                                                                    const mKey = getMemberKey(op.id, entry);
                                                                    const mSchedule = memberSchedules[mKey];
                                                                    const convStart = normalizeTime(convoySchedules[op.id]?.startTime) || op.horarioEntrada || '08:00';
                                                                    const convEnd = normalizeTime(convoySchedules[op.id]?.endTime) || op.horarioSaida || '20:00';
                                                                    const inicio = mSchedule?.startTime || entry.inicio || convStart;
                                                                    const fim = mSchedule?.endTime || entry.fim || convEnd;
                                                                    return (
                                                                        <div key={mKey || idx} className="flex flex-wrap items-center gap-3 bg-gray-800 p-2 rounded">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-semibold text-white text-sm">{entry.policial}</div>
                                                                                <div className="text-xs text-gray-400">Mat.: {entry.matricula || 'N/A'}</div>
                                                                                {entry.situacao && (
                                                                                    <span className={`text-xs px-1 rounded ${
                                                                                        entry.situacao === 'presente' ? 'bg-green-700 text-green-100' :
                                                                                        entry.situacao === 'substituto' ? 'bg-purple-700 text-purple-100' :
                                                                                        'bg-gray-600 text-gray-100'
                                                                                    }`}>{entry.situacao}</span>
                                                                                )}
                                                                                {entry.substituto && <div className="text-xs text-purple-300 mt-1">{entry.substituto}</div>}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="text-xs text-gray-400">Entrada:</span>
                                                                                <input
                                                                                    type="time"
                                                                                    value={inicio}
                                                                                    onChange={(e) => handleMemberTimeChange(op.id, entry, 'startTime', e.target.value)}
                                                                                    className="p-1 bg-gray-700 rounded text-sm"
                                                                                />
                                                                                <span className="text-xs text-gray-400">Saída:</span>
                                                                                <input
                                                                                    type="time"
                                                                                    value={fim}
                                                                                    onChange={(e) => handleMemberTimeChange(op.id, entry, 'endTime', e.target.value)}
                                                                                    className="p-1 bg-gray-700 rounded text-sm"
                                                                                />
                                                                                <span className="text-xs text-green-400 ml-2 font-semibold">R$ {Number(entry.cost || 0).toFixed(2).replaceAll('.', ',')}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

OperationCostView.propTypes = {
    showNotification: PropTypes.func,
    allUsers: PropTypes.array,
    holidays: PropTypes.array,
    departamento: PropTypes.string,
    sharedStartDate: PropTypes.string,
    sharedEndDate: PropTypes.string,
};
