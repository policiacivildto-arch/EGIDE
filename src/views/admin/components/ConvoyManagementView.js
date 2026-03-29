/* eslint-disable react/prop-types, sonarjs/no-nested-functions */
// src/views/admin/components/ConvoyManagementView.js       
import React, { useState } from 'react';
import { apiClient } from '../../../config/api';
import { normalizeName, displayMatricula } from '../../../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { AIS_OPTIONS, AIS_BAIRROS, BRIEFING_LOCATIONS } from '../../../constants/data'; 
import brasaoPcce from '../../../assets/brasao-pcce.png';

const CONVOY_META_STORAGE_KEY = 'egide_convoy_meta';

const formatLocalDate = (dateValue) => {
    if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) return '';
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateSafe = (rawDate) => {
    if (!rawDate) return null;
    if (typeof rawDate === 'string') {
        const isoDateMatch = rawDate.match(/^(\d{4}-\d{2}-\d{2})/);
        if (isoDateMatch) {
            return new Date(`${isoDateMatch[1]}T12:00:00`);
        }
        return new Date(rawDate);
    }
    if (rawDate?.seconds) return new Date(rawDate.seconds * 1000);
    return new Date(rawDate);
};

const getDateStringYmd = (rawDate) => {
    const parsed = parseDateSafe(rawDate);
    if (!parsed || Number.isNaN(parsed.getTime())) return '';
    return formatLocalDate(parsed);
};

const getTeamOperationDateStringForPdf = (team) => {
    const rawDate = team?.vaga_info?.data || team?.vagaDate || team?.dataEntrada || team?.data_entrada || team?.entryDate || team?.entrada;
    const parsed = parseDateSafe(rawDate);
    if (!parsed || Number.isNaN(parsed.getTime())) return '';

    const shiftType = String(team?.vaga_info?.turno || team?.vagaShiftType || '').toLowerCase();
    if (shiftType === 'night') {
        parsed.setDate(parsed.getDate() - 1);
    }

    return formatLocalDate(parsed);
};

const buildTeamTableBody = (team, resolveTeamMembers) => {
    const members = resolveTeamMembers(team);

    if (!Array.isArray(members) || members.length === 0) {
        return [[
            team?.chefe_nome || 'Sem nome',
            team?.chefe_matricula ? displayMatricula(team.chefe_matricula) : 'N/A',
            team?.telefone_contato || 'N/A',
        ]];
    }

    return members.map((member) => {
        const phone = member?.telefone || member?.telefone_contato || team?.telefone_contato || 'N/A';
        return [
            member?.nome || 'Sem nome',
            member?.matricula ? displayMatricula(member.matricula) : 'N/A',
            phone,
        ];
    });
};

const drawTeamTable = (pdf, tableBody, startY) => {
    autoTable(pdf, {
        head: [['NOME', 'MATRÍCULA', 'TELEFONE']],
        body: tableBody,
        startY,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 1.5,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            halign: 'center',
        },
    });

    return pdf.lastAutoTable.finalY + 10;
};

const drawConvoyBlock = ({ pdf, convoy, index, startY, teams, resolveTeamVehicle, resolveTeamMembers, getConvoyMeta, briefingFallback }) => {
    let cursorY = startY;
    const safeText = (value) => {
        if (Array.isArray(value)) return value.map((item) => String(item ?? '')).join(', ');
        if (value === null || value === undefined) return '';
        return String(value);
    };

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`COMBOIO ${index + 1}`, 14, cursorY);
    cursorY += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    const addInfoLine = (label, value) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(safeText(label), 14, cursorY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(safeText(value), 42, cursorY);
        cursorY += 5;
    };

    const meta = getConvoyMeta(convoy);
    const bairrosTexto = Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : convoy.bairros;
    addInfoLine('ÁREA:', `AIS ${convoy.ais || 'N/A'} - ${bairrosTexto || 'N/A'}`);
    addInfoLine('MISSÃO:', convoy.descricao || 'N/A');
    addInfoLine('SUPERVISÃO:', `DPC ${convoy.dpc_nome || convoy.dpc || 'N/A'} | OIP ${convoy.oip_nome || convoy.oip || 'N/A'}`);
    addInfoLine('BRIEFING:', meta.localBriefing || convoy.localBriefing || briefingFallback || 'N/A');
    cursorY += 4;

    pdf.setFont('helvetica', 'bold');
    pdf.text('EQUIPES:', 14, cursorY);
    cursorY += 5;

    const explicitTeamIds = Array.isArray(convoy.teamIds) ? convoy.teamIds : [];
    const metaTeamIds = Array.isArray(meta.teamIds) ? meta.teamIds : [];
    let teamIds = explicitTeamIds.length > 0 ? explicitTeamIds : metaTeamIds;

    if (teamIds.length === 0) {
        const convoyDateStr = getDateStringYmd(convoy?.date || convoy?.data);
        if (convoyDateStr) {
            teamIds = teams
                .filter((team) => getTeamOperationDateStringForPdf(team) === convoyDateStr)
                .map((team) => team.id)
                .filter(Boolean);
        }
    }

    teamIds = [...new Set(teamIds.map((id) => Number(id)).filter(Number.isFinite))];

    for (let teamIndex = 0; teamIndex < teamIds.length; teamIndex += 1) {
        const teamId = teamIds[teamIndex];
        const team = teams.find((t) => Number(t.id) === Number(teamId));
        if (!team) continue;

        const teamSeq = teamIndex + 1;
        const teamVehicle = resolveTeamVehicle(team) || 'N/A';

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
            safeText(`Equipe ${teamSeq} | VTR ${teamSeq}${teamVehicle !== 'N/A' ? ` - ${teamVehicle}` : ''}`),
            14,
            cursorY
        );
        cursorY += 5;

        const tableBody = buildTeamTableBody(team, resolveTeamMembers);
        cursorY = drawTeamTable(pdf, tableBody, cursorY);
    }

    return cursorY;
};

const generateEscalaPDF = async ({ dataOperacaoStr, convoysDoDia, teams, showNotification, resolveTeamVehicle, resolveTeamMembers, getConvoyMeta, briefingFallback, departamento }) => {
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let startY = 15;

        const addCoverImage = async () => {
            try {
                const imageElement = new Image();
                imageElement.crossOrigin = 'anonymous';
                imageElement.src = brasaoPcce;
                await new Promise((resolve, reject) => {
                    imageElement.onload = resolve;
                    imageElement.onerror = reject;
                });
                const imageWidth = 40;
                const imageHeight = 40;
                const imageX = (pageWidth - imageWidth) / 2;
                const imageY = 54;
                pdf.addImage(imageElement, 'PNG', imageX, imageY, imageWidth, imageHeight);
            } catch (error) {
                console.warn('Nao foi possivel carregar o brasao na capa do PDF:', error);
            }
        };

        const data = new Date(dataOperacaoStr + 'T12:00:00');
        const dataFormatada = data.toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Capa no estilo do template de plano operacional
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('DEPARTAMENTO TÉCNICO OPERACIONAL', pageWidth / 2, 42, { align: 'center' });
        pdf.setFontSize(13);
        pdf.text('SEÇÃO DE OPERAÇÕES', pageWidth / 2, 52, { align: 'center' });

        await addCoverImage();

        pdf.setFontSize(18);
        pdf.text('Plano Operacional', pageWidth / 2, 98, { align: 'center' });
        pdf.setFontSize(15);
        pdf.text('Operação ÉGIDE', pageWidth / 2, 110, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.text(`Data da Escala: ${dataFormatada}`, pageWidth / 2, 146, { align: 'center' });
        pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 156, { align: 'center' });

        pdf.setFontSize(10);
        pdf.text('Documento de Escala Operacional', pageWidth / 2, pageHeight - 18, { align: 'center' });

        // Nova página com a escala em tabela
        pdf.addPage();
        startY = 15;

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ESCALA OPERACIONAL DIÁRIA', pageWidth / 2, startY, { align: 'center' });
        startY += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(dataFormatada, pageWidth / 2, startY, { align: 'center' });
        startY += 15;

        for (let index = 0; index < convoysDoDia.length; index += 1) {
            const convoy = convoysDoDia[index];
            if (startY > 260) {
                pdf.addPage();
                startY = 15;
            }

            startY = drawConvoyBlock({
                pdf,
                convoy,
                index,
                startY,
                teams,
                resolveTeamVehicle,
                resolveTeamMembers,
                getConvoyMeta,
                briefingFallback,
            });
        }

        pdf.save(`Escala_Operacional_${dataOperacaoStr}.pdf`);
        showNotification('PDF da escala gerado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showNotification('Ocorreu um erro ao gerar o PDF.', 'error');
    }
};
    

export const ConvoyManagementView = ({ teams, convoys, weekId, showNotification, departamento }) => {
    const [dataOperacao, setDataOperacao] = useState(() => formatLocalDate(new Date()));
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [operationData, setOperationData] = useState({ dpc: '', oip: '', localBriefing: '', localBriefingOutro: '' });
      

    // MUDANÇA 1: O estado 'bairro' foi trocado para 'bairros' e agora é um array.
    const [assignmentData, setAssignmentData] = useState({ ais: '', bairros: [], mission: '' });
    const [convoyMetaMap, setConvoyMetaMap] = useState(() => {
        try {
            const raw = localStorage.getItem(CONVOY_META_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
        const [showBairroOptions, setShowBairroOptions] = useState(false); // Estado para controlar o dropdown de bairros
    const bairroDropdownRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (bairroDropdownRef.current && !bairroDropdownRef.current.contains(event.target)) {
                setShowBairroOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const resolveTeamLeaderName = (team) => {
        return team?.registeringOfficer?.nome || team?.chefe_nome || team?.membros_detalhes?.[0]?.nome || 'Sem chefe';
    };

    const resolveTeamDisplayName = (team) => {
        const rawName = team?.teamName || team?.delegaciaPrincipal;
        if (rawName && String(rawName).trim()) return rawName;
        return `Equipe #${team?.id || 'N/A'}`;
    };

    const resolveTeamVehicle = (team) => {
        return team?.vehicle || team?.viatura_placa || 'N/A';
    };

    const getTeamOperationRawDate = (team) => {
        return team?.vaga_info?.data || team?.vagaDate || team?.dataEntrada || team?.data_entrada || team?.entryDate || team?.entrada;
    };

    const getTeamOperationDateObject = (team) => {
        const rawDate = getTeamOperationRawDate(team);
        if (!rawDate) return null;

        const parsedDate = parseDateSafe(rawDate);
        if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;

        const shiftType = String(team?.vaga_info?.turno || team?.vagaShiftType || '').toLowerCase();
        if (shiftType === 'night') {
            const operationalDate = new Date(parsedDate);
            operationalDate.setDate(operationalDate.getDate() - 1);
            return operationalDate;
        }

        return parsedDate;
    };

    const resolveTeamDateLabel = (team) => {
        const parsedDate = getTeamOperationDateObject(team);
        if (!parsedDate) return 'Data não informada';
        try {
            return parsedDate.toLocaleDateString('pt-BR');
        } catch (error) {
            console.warn('Data de entrada inválida:', error);
            return 'Data não informada';
        }
    };

    const resolveTeamMembers = (team) => {
        if (Array.isArray(team?.members) && team.members.length > 0) return team.members;
        if (Array.isArray(team?.membros_detalhes) && team.membros_detalhes.length > 0) return team.membros_detalhes;
        return [];
    };

    const resolveConvoyDateLabel = (convoy) => {
        const rawDate = convoy?.date || convoy?.data;
        if (!rawDate) return 'Data não informada';
        try {
            const parsedDate = parseDateSafe(rawDate);
            if (parsedDate && !Number.isNaN(parsedDate.getTime())) return parsedDate.toLocaleDateString('pt-BR');
        } catch (error) {
            console.warn('Data de comboio inválida:', error);
            return 'Data não informada';
        }
        return 'Data não informada';
    };

    const getDateString = (rawDate) => {
        if (!rawDate) return '';
        try {
            if (typeof rawDate === 'string') {
                if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;
                return rawDate.split('T')[0];
            }
            if (rawDate?.seconds) return formatLocalDate(new Date(rawDate.seconds * 1000));
            return formatLocalDate(new Date(rawDate));
        } catch (error) {
            console.warn('Falha ao converter data para string:', error);
            return '';
        }
    };

    const getTeamEntryDateString = (team) => {
        const entryDate = getTeamOperationDateObject(team);
        return getDateString(entryDate);
    };

    const saveConvoyMeta = (comboioId, payload) => {
        if (!comboioId) return;
        setConvoyMetaMap((prev) => {
            const next = {
                ...prev,
                [String(comboioId)]: {
                    ...(prev[String(comboioId)] || {}),
                    ...payload,
                },
            };
            localStorage.setItem(CONVOY_META_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const getConvoyMeta = (convoy) => convoyMetaMap[String(convoy?.id)] || {};

    const unassignedTeams = teams
        .filter(t => !convoys.some(c => Array.isArray(c?.teamIds) && c.teamIds.includes(t.id)))
        .filter((team) => getTeamEntryDateString(team) === dataOperacao);

    const hasTeamAvailable = (teamId) => unassignedTeams.some((team) => team.id === teamId);

    React.useEffect(() => {
        setSelectedTeams((prev) => prev.filter((teamId) => hasTeamAvailable(teamId)));
    }, [dataOperacao, teams, convoys]);

    const handleSelectTeam = (teamId) => setSelectedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
    const handleChange = (setter, field, value) => setter(prev => ({ ...prev, [field]: value }));

    // MUDANÇA 2: Novas funções para adicionar e remover bairros do array.
    const handleAddBairro = (bairro) => {
        if (!assignmentData.bairros.includes(bairro)) {
            setAssignmentData(prev => ({
                ...prev,
                bairros: [...prev.bairros, bairro].sort((a, b) => a.localeCompare(b, 'pt-BR'))
            }));
        }
    };

    const handleRemoveBairro = (bairroToRemove) => {
        setAssignmentData(prev => ({
            ...prev,
            bairros: prev.bairros.filter(b => b !== bairroToRemove)
        }));
    };
    
    // Função para tratar a mudança de AIS, limpando os bairros selecionados
    const handleAisChange = (e) => {
        const newAis = e.target.value;
        setAssignmentData(prev => ({
            ...prev,
            ais: newAis,
            bairros: [] // Limpa os bairros ao trocar a AIS
        }));
    };

    const handleCreateConvoy = async () => {
    // Validações (sem alteração)
    if (selectedTeams.length < 2) { showNotification("Selecione pelo menos 2 equipes.", "error"); return; }
        if (!assignmentData.ais || assignmentData.bairros.length === 0 || !operationData.oip || !operationData.dpc || (!operationData.localBriefing || (operationData.localBriefing === 'OUTRO' && !operationData.localBriefingOutro))) {
        showNotification("Preencha todos os campos da operação, incluindo AIS e pelo menos um bairro.", "error");
        return;
    }

    try {
            const operationDateStr = dataOperacao;

        const resolvePolicialIdByName = async (nome) => {
            const trimmed = String(nome || '').trim();
            if (!trimmed) return null;

            const response = await apiClient.getPoliciais({ search: trimmed });
            const policiais = Array.isArray(response) ? response : (response?.results || []);

            if (policiais.length === 0) return null;

            const normalizedTarget = normalizeName(trimmed);
            const exact = policiais.find((p) => normalizeName(p?.nome || '') === normalizedTarget);
            const fallback = exact || policiais[0];
            return fallback?.id || null;
        };
        
        // Consulta quantos comboios já existem para esta data
        const existingConvoys = await apiClient.getConvoys({ data: operationDateStr });
        const existingConvoysCount = Array.isArray(existingConvoys) ? existingConvoys.length : 0;
        
        // O número do novo comboio é o total existente + 1
        const newConvoyNumber = existingConvoysCount + 1;
        
        const finalDpc = normalizeName(operationData.dpc);
        const finalOip = normalizeName(operationData.oip);
        const finalLocalBriefing = operationData.localBriefing === 'OUTRO' ? normalizeName(operationData.localBriefingOutro) : operationData.localBriefing;
        const finalDescricao = normalizeName(assignmentData.mission || `COMBOIO ${newConvoyNumber}`);

        const dpcId = await resolvePolicialIdByName(finalDpc);
        const oipId = await resolvePolicialIdByName(finalOip);

        if (!dpcId || !oipId) {
            showNotification('DPC/OIP devem corresponder a policiais cadastrados (nome existente).', 'error');
            return;
        }

        const bairrosTexto = assignmentData.bairros.join(', ');
        
        const createdConvoy = await apiClient.createConvoy({
            data: operationDateStr,
            descricao: finalDescricao,
            dpc: dpcId,
            oip: oipId,
            status: 'Planejado',
            ais: assignmentData.ais,
            bairros: bairrosTexto
        });

        saveConvoyMeta(createdConvoy?.id, {
            teamIds: selectedTeams,
            localBriefing: finalLocalBriefing,
        });
        
        showNotification(`Comboio ${newConvoyNumber} criado com sucesso!`, "success");
        setSelectedTeams([]);
        setAssignmentData({ ais: '', bairros: [], mission: '' });
        setOperationData((prev) => ({ ...prev, dpc: '', oip: '' }));
    } catch (error) { console.error(error); showNotification("Falha ao criar comboio.", "error"); }
};
// É recomendável ter uma função auxiliar para comparar as datas de forma segura
    const isSameDay = (convoyDate, dateString) => {
        if (!convoyDate) return false;
            const convoyDateStr = getDateString(convoyDate);
        return convoyDateStr === dateString;
    };

    const getUniqueConvoys = (items) => {
        const seen = new Set();
        return (Array.isArray(items) ? items : []).filter((convoy) => {
            const key = convoy?.id
                ? `id:${convoy.id}`
                : `sig:${getDateString(convoy?.date || convoy?.data)}|${convoy?.ais || ''}|${convoy?.descricao || ''}|${convoy?.dpc || ''}|${convoy?.oip || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const getMergedConvoys = (items) => {
        const mergedMap = new Map();

        getUniqueConvoys(items).forEach((convoy) => {
            const meta = getConvoyMeta(convoy);
            const mergeKey = [
                getDateString(convoy?.date || convoy?.data),
                convoy?.ais || '',
                convoy?.descricao || '',
                convoy?.dpc_nome || convoy?.dpc || '',
                convoy?.oip_nome || convoy?.oip || '',
                meta?.localBriefing || convoy?.localBriefing || '',
            ].join('|');

            const baseTeamIds = Array.isArray(convoy?.teamIds)
                ? convoy.teamIds
                : Array.isArray(meta?.teamIds)
                    ? meta.teamIds
                    : [];

            if (!mergedMap.has(mergeKey)) {
                mergedMap.set(mergeKey, {
                    ...convoy,
                    teamIds: [...baseTeamIds],
                });
                return;
            }

            const existing = mergedMap.get(mergeKey);
            const unionTeamIds = [...new Set([...(existing.teamIds || []), ...baseTeamIds])];
            mergedMap.set(mergeKey, {
                ...existing,
                teamIds: unionTeamIds,
            });
        });

        return Array.from(mergedMap.values());
    };

    const convoysUnicos = getMergedConvoys(convoys);

    const gerarPDF = (dataOperacaoStr) => {
        // ALTERAÇÃO 1: Filtra a lista de comboios ANTES de qualquer outra coisa.
        const convoysDoDia = getMergedConvoys(convoysUnicos.filter(c => isSameDay(c.date || c.data, dataOperacaoStr)));
        
        // ALTERAÇÃO 2: A validação agora usa a lista FILTRADA.
        if (convoysDoDia.length === 0) {
            const data = new Date(dataOperacaoStr + 'T12:00:00'); // Adiciona hora para evitar problemas de fuso
            const dataFormatada = data.toLocaleDateString('pt-BR');
            showNotification(`Nenhum comboio formado para a data ${dataFormatada}.`, "warning");
            return;
        }

        const briefingFallback = operationData.localBriefing === 'OUTRO'
            ? normalizeName(operationData.localBriefingOutro)
            : operationData.localBriefing;

        generateEscalaPDF({
            dataOperacaoStr,
            convoysDoDia,
            teams,
            showNotification,
            resolveTeamVehicle,
            resolveTeamMembers,
            getConvoyMeta,
            briefingFallback,
            departamento,
        });
    };
    
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Criação da Operação</h3>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-8">
                <h4 className="text-xl font-semibold mb-3">Dados Gerais da Operação do Dia</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:max-w-[170px]">
                        <label htmlFor="data-operacao" className="block mb-1 font-semibold text-sm">Data da Operação</label>
                        <input id="data-operacao" type="date" value={dataOperacao} onChange={(e) => setDataOperacao(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" />
                    </div>
                     <div>
                        <label htmlFor="dpc-input" className="block mb-1 font-semibold text-sm">DPC</label>
                        <input
                            id="dpc-input"
                            type="text"
                            value={operationData.dpc}
                            onChange={e => handleChange(setOperationData, 'dpc', e.target.value.toUpperCase())}
                            className="w-full p-2 bg-gray-700 rounded-md uppercase"
                            placeholder="Digite o nome do DPC"
                        />
                    </div>
                    <div>
                        <label htmlFor="oip-input" className="block mb-1 font-semibold text-sm">OIP</label>
                        <input
                            id="oip-input"
                            type="text"
                            value={operationData.oip}
                            onChange={e => handleChange(setOperationData, 'oip', e.target.value.toUpperCase())}
                            className="w-full p-2 bg-gray-700 rounded-md uppercase"
                            placeholder="Digite o nome do OIP"
                        />
                    </div>
                    <div>
                        <label htmlFor="briefing-local" className="block mb-1 font-semibold text-sm">Local do Briefing</label>
                        <select id="briefing-local" value={operationData.localBriefing} onChange={e => handleChange(setOperationData, 'localBriefing', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                            <option value="">Selecione</option>
                            {BRIEFING_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            <option value="OUTRO">OUTRO</option>
                        </select>
                    </div>
                    {operationData.localBriefing === 'OUTRO' && (<div><label htmlFor="briefing-local-outro" className="block mb-1 font-semibold text-sm">Outro Local</label><input id="briefing-local-outro" type="text" value={operationData.localBriefingOutro} onChange={e => handleChange(setOperationData, 'localBriefingOutro', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md uppercase" /></div>)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-xl font-semibold mb-3">Equipes Disponíveis</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {/* ...código das equipes... (sem alterações) */}
                        {unassignedTeams.map(team => (
                            <div key={team.id} className={`p-3 rounded-lg border-2 ${selectedTeams.includes(team.id) ? 'border-blue-500 bg-blue-900/50' : 'border-transparent bg-gray-700'}`}>
                                <div className="flex items-center space-x-3">
                                    <input id={`team-select-${team.id}`} type="checkbox" checked={selectedTeams.includes(team.id)} onChange={() => handleSelectTeam(team.id)} className="form-checkbox h-5 w-5 text-blue-600 bg-gray-800 border-gray-600" />
                                    <div>
                                        <p className="font-bold">{resolveTeamDisplayName(team)}</p>
                                        <p className="text-xs text-blue-300">ID da equipe: {team.id}</p>
                                        <p className="text-sm">Chefe: {resolveTeamLeaderName(team)} | Viatura: {resolveTeamVehicle(team)}</p>
                                        <p className="text-xs text-gray-400">Disponível em: {resolveTeamDateLabel(team)}</p>
								</div>
                                    <label htmlFor={`team-select-${team.id}`} className="text-xs font-semibold text-blue-300 hover:text-blue-200 cursor-pointer whitespace-nowrap">
                                        Selecionar equipe #{team.id}
                                    </label>
                                </div>
                            </div>
                        ))}
                        {unassignedTeams.length === 0 && (<p className="text-gray-400">Nenhuma equipe disponível.</p>)}
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-xl font-semibold mb-3">Formar Novo Comboio</h4>
                    <div className="space-y-4">
                        {/* MUDANÇA 5: O JSX foi totalmente refeito para a seleção múltipla */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ais-select" className="block mb-1 font-semibold text-sm">AIS</label>
                                <select id="ais-select" value={assignmentData.ais} onChange={handleAisChange} className="w-full p-2 bg-gray-700 rounded-md">
                                    <option value="">Selecione</option>
                                    {AIS_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="relative" ref={bairroDropdownRef}>
                                <label htmlFor="bairro-toggle" className="block mb-1 font-semibold text-sm">Bairro(s)</label>
                                <button
                                    id="bairro-toggle"
                                    type="button"
                                    className="w-full p-2 bg-gray-700 rounded-md min-h-[40px] flex flex-wrap items-center gap-1 cursor-pointer text-left"
                                    onClick={() => setShowBairroOptions(!showBairroOptions)}
                                >
                                    {assignmentData.bairros.length > 0 ? (
                                        assignmentData.bairros.map(bairro => (
                                            <span key={bairro} className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
                                                {bairro}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveBairro(bairro); }} className="ml-2 text-blue-200 hover:text-white font-bold"> &times; </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm">Selecione um ou mais bairros</span>
                                    )}
                                </button>
                                {showBairroOptions && assignmentData.ais && (
                                    <div className="absolute z-10 w-full mt-1 bg-gray-600 border border-gray-500 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <ul>
                                            {AIS_BAIRROS[assignmentData.ais]
                                                .filter(b => !assignmentData.bairros.includes(b))
                                                .map(b => (
                                                    <li key={b}>
                                                        <button type="button" onClick={() => { handleAddBairro(b); }} className="w-full px-3 py-2 text-sm text-white hover:bg-blue-600 cursor-pointer text-left">
                                                            {b}
                                                        </button>
                                                    </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="mission-textarea" className="block mb-1 font-semibold text-sm">Missão</label>
                            <textarea id="mission-textarea" value={assignmentData.mission} onChange={e => handleChange(setAssignmentData, 'mission', e.target.value.toUpperCase())} className="w-full p-2 bg-gray-700 rounded-md uppercase" rows="2" placeholder="Ex: PATRULHAMENTO..."/>
                        </div>
                        <button onClick={handleCreateConvoy} disabled={selectedTeams.length < 2} className="w-full py-3 bg-green-600 hover:bg-green-700 font-bold rounded-lg transition disabled:bg-gray-500">Formar Comboio</button>
                    </div>
                </div>
            </div>
            
            <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xl font-semibold">Comboios Formados</h4>
                    <div className='flex items-end space-x-4'>
                        {convoysUnicos.length > 0 && <button onClick={() => gerarPDF(dataOperacao)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><Download size={18} /><span>Baixar Escala</span></button>}
                    </div>
                </div>
                <div className="space-y-4">{convoysUnicos.map(convoy => (<div key={convoy.id} className="bg-gray-800 p-4 rounded-lg"><p className="font-bold text-lg text-blue-400">Comboio - {resolveConvoyDateLabel(convoy)}</p>
                {/* MUDANÇA 6: Exibição na lista também ajustada */}
                <p><span className="font-semibold">Área:</span> AIS {convoy.ais} - {Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : convoy.bairros}</p><p><span className="font-semibold">Missão:</span> {convoy.descricao || 'N/A'}</p><p><span className="font-semibold">Supervisão:</span> DPC {convoy.dpc_nome || convoy.dpc} | OIP {convoy.oip_nome || convoy.oip}</p><p><span className="font-semibold">Briefing:</span> {getConvoyMeta(convoy).localBriefing || convoy.localBriefing || 'N/A'}</p><p className="font-semibold mt-2">Equipes:</p><ul className="list-disc list-inside ml-4">{(Array.isArray(convoy.teamIds) ? convoy.teamIds : (getConvoyMeta(convoy).teamIds || []) ).map(tid => { const team = teams.find(t => t.id === tid); return <li key={tid}>{team ? `Chefe ${resolveTeamLeaderName(team)} (Viatura: ${resolveTeamVehicle(team)})` : `Equipe #${tid}`}</li> })}</ul></div>))}{convoysUnicos.length === 0 && <p className="text-gray-400">Nenhum comboio formado.</p>}</div>
            </div>
        </div>
    );
};