import { apiClient } from '../config/api';
import { PAY_RATES } from '../constants/data';

// --- Formatadores ---
export const normalizeName = (name) => {
    if (name) {
        return name.toUpperCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
    }
    return '';
};

export const formatMatricula = (matricula) => {
    if (matricula) {
        return matricula.toUpperCase().replaceAll(/[^0-9X]/g, '').substring(0, 8);
    }
    return '';
};

export const displayMatricula = (matricula) => {
    if (matricula) {
        return matricula.padStart(8, '0').replace(/(\d{3})(\d{3})(\d)(\d)/, '$1.$2-$3-$4');
    }
    return '';
};
export const formatPlaca = (value) => {
    if (!value) return '';
    let v = value.toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
    if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
    return v.slice(0, 8);
};
export const formatTelefone = (value) => {
    if (!value) return "";
    const digits = value.replaceAll(/\D/g, '').substring(0, 11);
    if (digits.length > 10) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length > 6) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (digits.length > 2) {
        return digits.replace(/(\d{2})(\d+)/, '($1) $2');
    } else {
        return digits.replace(/(\d*)/, '($1');
    }
};

// --- Lógica de Data e Cálculo ---
export const getCycleInfo = (date = new Date()) => {
    const mutableDate = new Date(date);
    const day = mutableDate.getDate();

    if (day < 21) {
        mutableDate.setDate(0);
    }
    const year = mutableDate.getFullYear();
    const month = mutableDate.getMonth() + 1;
    return { cycleId: `${year}-${String(month).padStart(2, '0')}` };
};

export const getWeekInfo = (date = new Date()) => {
    const current = new Date(date); current.setHours(0, 0, 0, 0);
    const dayOfWeek = current.getDay();
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const week = Array.from({ length: 7 }, (_, i) => { const day = new Date(monday); day.setDate(monday.getDate() + i); return day; });
    const weekNumber = Math.ceil((((monday - new Date(monday.getFullYear(), 0, 1)) / 86400000) + new Date(monday.getFullYear(), 0, 1).getDay() + 1) / 7);
    return { weekId: `${monday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`, weekDays: week };
};

export const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const toMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };
    if (typeof startTime !== 'string' || typeof endTime !== 'string') return 0;
    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    let diff = e - s;
    if (diff < 0) diff += 24 * 60;
    return Math.round((diff / 60) * 100) / 100;
};

export const calculateShiftCost = (officer, date, startTime, endTime, holidays) => {
    const rates = PAY_RATES[officer.cargo]?.[officer.classe];
    if (!rates) return 0;

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = Array.isArray(holidays) && holidays.includes(date.toDateString());

    const totalHours = calculateHours(startTime, endTime);
    if (isWeekend || isHoliday) return totalHours * rates.noite;

    const toMinutes = (t) => t.split(':').map(Number).reduce((a,b,i) => a + (i===0?b*60:b), 0);
    let start = toMinutes(startTime);
    let end = toMinutes(endTime);
    if (end < start) end += 24 * 60;

    let nightHours = 0;
    let dayHours = 0;
    for (let minute = start; minute < end; minute++) {
        const hour = Math.floor((minute % (24*60)) / 60);
        if (hour >=0 && hour < 6) nightHours += 1/60;
        else dayHours += 1/60;
    }
    const cost = (dayHours * rates.dia) + (nightHours * rates.noite);
    return Math.round(cost * 100) / 100;
};

const resolveWeekRange = (weekId) => {
    const [yearPart, weekPart] = String(weekId || '').split('-W');
    const year = Number(yearPart);
    const weekNumber = Number(weekPart);
    if (!Number.isFinite(year) || !Number.isFinite(weekNumber) || weekNumber <= 0) {
        return null;
    }

    const jan1 = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
    const start = new Date(jan1);
    start.setDate(jan1.getDate() + daysOffset - ((jan1.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
};

const formatIsoDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// --- Validações Assíncronas ---
export const checkWeeklyLimit = async (memberMatriculas, weekId) => {
    if (!Array.isArray(memberMatriculas) || memberMatriculas.length === 0 || !weekId) {
        return { conflict: false };
    }

    const range = resolveWeekRange(weekId);
    if (!range) return { conflict: false };

    const teamsResponse = await apiClient.getTeams({
        vaga__data__gte: formatIsoDate(range.start),
        vaga__data__lte: formatIsoDate(range.end),
    });

    const teams = Array.isArray(teamsResponse)
        ? teamsResponse
        : (teamsResponse?.results || []);

    if (teams.length === 0) return { conflict: false };

    const policiaisResponse = await apiClient.getPoliciais();
    const policiais = Array.isArray(policiaisResponse)
        ? policiaisResponse
        : (policiaisResponse?.results || []);

    const policiaisById = new Map(
        policiais
            .filter((p) => p?.id != null)
            .map((p) => [String(p.id), p])
    );

    for (const team of teams) {
        const members = Array.isArray(team?.members) ? team.members : [];
        const memberConflict = members.find((member) => memberMatriculas.includes(member?.matricula));
        if (memberConflict?.matricula) {
            return {
                conflict: true,
                officerName: memberConflict?.nome || 'Desconhecido',
                officerMatricula: memberConflict.matricula,
            };
        }

        const chefeInfo = team?.chefe_info || team?.chefe_detalhes;
        const chefeMatriculaFromInfo = chefeInfo?.matricula;
        const chefeId = team?.chefe;
        const chefeFromMap = chefeId == null ? null : policiaisById.get(String(chefeId));
        const chefeMatricula = chefeMatriculaFromInfo || chefeFromMap?.matricula;

        if (chefeMatricula && memberMatriculas.includes(chefeMatricula)) {
            return {
                conflict: true,
                officerName: team?.chefe_nome || chefeInfo?.nome || chefeFromMap?.nome || 'Desconhecido',
                officerMatricula: chefeMatricula,
            };
        }
    }

    return { conflict: false };
};

export const checkLeaderWeeklyLimit = async (leaderMatricula, weekId) => {
    if (!leaderMatricula || !weekId) return false;
    const result = await checkWeeklyLimit([leaderMatricula], weekId);
    return result.conflict;
};

export const checkSingleDelegaciaDepartmentWeeklyLimit = async (memberMatriculas, weekId) => {
    if (!Array.isArray(memberMatriculas) || memberMatriculas.length === 0 || !weekId) {
        return { blocked: false };
    }

    const normalizedMatriculas = [...new Set(
        memberMatriculas
            .map((matricula) => String(matricula || '').replaceAll(/\D/g, ''))
            .filter((matricula) => matricula.length === 8)
    )];

    if (normalizedMatriculas.length === 0) {
        return { blocked: false };
    }

    const range = resolveWeekRange(weekId);
    if (!range) return { blocked: false };

    const [teamsResponse, policiaisResponse, delegaciasResponse] = await Promise.all([
        apiClient.getTeams({
            vaga__data__gte: formatIsoDate(range.start),
            vaga__data__lte: formatIsoDate(range.end),
        }),
        apiClient.getPoliciais(),
        apiClient.getDelegacias({ ativo: true }),
    ]);

    const teams = Array.isArray(teamsResponse)
        ? teamsResponse
        : (teamsResponse?.results || []);

    const policiais = Array.isArray(policiaisResponse)
        ? policiaisResponse
        : (policiaisResponse?.results || []);

    const delegacias = Array.isArray(delegaciasResponse)
        ? delegaciasResponse
        : (delegaciasResponse?.results || []);

    const policiaisById = new Map(
        policiais
            .filter((policial) => policial?.id != null)
            .map((policial) => [String(policial.id), policial])
    );

    const policiaisByMatricula = new Map(
        policiais
            .filter((policial) => policial?.matricula)
            .map((policial) => [String(policial.matricula).replaceAll(/\D/g, ''), policial])
    );

    const delegaciasById = new Map(
        delegacias
            .filter((delegacia) => delegacia?.id != null)
            .map((delegacia) => [String(delegacia.id), delegacia])
    );

    const activeDelegaciasByDepartment = delegacias.reduce((acc, delegacia) => {
        if (!delegacia?.ativo || delegacia?.departamento == null) {
            return acc;
        }

        const departmentId = String(delegacia.departamento);
        acc.set(departmentId, (acc.get(departmentId) || 0) + 1);
        return acc;
    }, new Map());

    const teamContainsMatricula = (team, matricula) => {
        const detailedMembers = Array.isArray(team?.membros_detalhes) ? team.membros_detalhes : [];
        if (detailedMembers.some((member) => String(member?.matricula || '').replaceAll(/\D/g, '') === matricula)) {
            return true;
        }

        const memberIds = Array.isArray(team?.membros) ? team.membros : [];
        if (memberIds.some((memberId) => String(policiaisById.get(String(memberId))?.matricula || '').replaceAll(/\D/g, '') === matricula)) {
            return true;
        }

        const leader = policiaisById.get(String(team?.chefe));
        return String(leader?.matricula || '').replaceAll(/\D/g, '') === matricula;
    };

    for (const matricula of normalizedMatriculas) {
        const policial = policiaisByMatricula.get(matricula);
        const delegacia = delegaciasById.get(String(policial?.delegacia));
        const departmentId = delegacia?.departamento == null ? null : String(delegacia.departamento);

        if (!policial || !departmentId) {
            continue;
        }

        if ((activeDelegaciasByDepartment.get(departmentId) || 0) !== 1) {
            continue;
        }

        const alreadyScheduled = teams.some((team) => teamContainsMatricula(team, matricula));
        if (!alreadyScheduled) {
            continue;
        }

        const departmentName = delegacia?.departamento_nome || policial?.departamento_nome || 'este departamento';
        return {
            blocked: true,
            officerName: policial?.nome || 'Policial',
            officerMatricula: matricula,
            departmentName,
            message: `${policial?.nome || 'Este policial'} já tem candidatura nesta semana e não pode se candidatar novamente porque ${departmentName} possui apenas uma delegacia ativa. Apenas a administração pode escalá-lo manualmente.`,
        };
    }

    return { blocked: false };
};
