import React from 'react';
import jsPDF from 'jspdf';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { DEPARTMENTS, AIS_OPTIONS } from '../../../constants/data';

export function NovaDemandaView({ formData, setFormData, handleSubmit, showNotification, userDepartamento }) {
    const tiposPenais = ['Homicídio', 'Tráfico de Drogas', 'ORCRIM / Lavagem de Dinheiro', 'Roubo', 'Furto'];
    const aisList = AIS_OPTIONS.map((ais) => `AIS ${ais}`);
    const faccoesList = ['CV', 'GDE', 'Neutros', 'PCC', 'TCP'];
    const alvosSensiveisList = ['Mulher', 'Policial', 'Político', 'Advogado', 'Servidor Público'];
    const orgaosApoio = ['MP', 'Polícia Militar', 'Polícia Federal', 'Polícia Rodoviária Federal', 'Receita Federal', 'SEFAZ', 'AMC', 'Guarda Municipal'];
    const orgaosSolicitantes = ['DEPATRI', 'DHPP', 'DPC', 'DPM', 'DPI NORTE', 'DPI SUL', 'DPE', 'DPGV', 'DRA', 'DRCO', 'DTO', 'CORE'];

    const addBriefingLocal = () => {
        setFormData({ ...formData, locais_briefing: [...formData.locais_briefing, ''] });
    };

    const removeBriefingLocal = (index) => {
        const newLocais = formData.locais_briefing.filter((_, i) => i !== index);
        setFormData({ ...formData, locais_briefing: newLocais });
    };

    const updateBriefingLocal = (index, value) => {
        const newLocais = [...formData.locais_briefing];
        newLocais[index] = value;
        setFormData({ ...formData, locais_briefing: newLocais });
    };

    const toggleCheckbox = (field, value) => {
        const current = formData[field] || [];
        const newValue = current.includes(value) 
            ? current.filter(v => v !== value)
            : [...current, value];
        setFormData({ ...formData, [field]: newValue });
    };

    const updateModalidade = (tipo, qtd) => {
        const modalidades = { ...formData.modalidades };
        modalidades[tipo] = qtd;
        setFormData({ ...formData, modalidades });
    };

    // Função auxiliar: converter hora para minutos
    const converterParaMinutos = (valor) => {
        if (Object.prototype.toString.call(valor) === '[object Date]' && !Number.isNaN(valor.getTime())) {
            return valor.getHours() * 60 + valor.getMinutes();
        } else if (typeof valor === 'string') {
            const valorNormalizado = valor.trim().replace('.', ':');
            const partes = valorNormalizado.split(':');
            if (partes.length >= 2) {
                const horas = Number.parseInt(partes[0], 10);
                const minutos = Number.parseInt(partes[1], 10);
                if (!Number.isNaN(horas) && !Number.isNaN(minutos)) {
                    return horas * 60 + minutos;
                }
            }
        }

        console.warn(`Erro: Horário inválido detectado - ${valor}`);
        return Number.NaN;
    };

    // Função auxiliar: obter dia da semana
    const obterDiaSemana = (data) => {
        const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

        if (Object.prototype.toString.call(data) === '[object Date]' && !Number.isNaN(data.getTime())) {
            return dias[data.getDay()];
        }

        if (typeof data === 'number') {
            const dataFormatada = new Date((data - 25569) * 86400000);
            return dias[dataFormatada.getDay()];
        }

        if (typeof data === 'string') {
            const dataStr = data.trim();

            const partesBr = dataStr.split('/');
            if (partesBr.length === 3) {
                const dia = Number.parseInt(partesBr[0], 10);
                const mes = Number.parseInt(partesBr[1], 10) - 1;
                const ano = Number.parseInt(partesBr[2], 10);
                const dataFormatada = new Date(ano, mes, dia);
                if (!Number.isNaN(dataFormatada.getTime())) {
                    return dias[dataFormatada.getDay()];
                }
            }

            // Mantém compatibilidade com data ISO do formulário (YYYY-MM-DD)
            const dataIso = new Date(`${dataStr}T00:00:00`);
            if (!Number.isNaN(dataIso.getTime())) {
                return dias[dataIso.getDay()];
            }
        }

        console.warn(`Erro: Data inválida detectada - ${data}`);
        return null;
    };

    // Função auxiliar: verificar feriado
    const verificarFeriado = (data) => {
        const feriados = new Set(['18/04/2025', '21/04/2025']);

        if (typeof data === 'string') {
            const dataStr = data.trim();
            if (feriados.has(dataStr)) return true;

            const dataIso = new Date(`${dataStr}T00:00:00`);
            if (!Number.isNaN(dataIso.getTime())) {
                const dataFormatada = dataIso.getDate().toString().padStart(2, '0') + '/' +
                    (dataIso.getMonth() + 1).toString().padStart(2, '0') + '/' +
                    dataIso.getFullYear();
                return feriados.has(dataFormatada);
            }
            return false;
        }

        if (Object.prototype.toString.call(data) === '[object Date]' && !Number.isNaN(data.getTime())) {
            const dataFormatada = data.getDate().toString().padStart(2, '0') + '/' +
                (data.getMonth() + 1).toString().padStart(2, '0') + '/' +
                data.getFullYear();
            return feriados.has(dataFormatada);
        }

        return false;
    };

    // Função auxiliar: calcular horas trabalhadas
    const calcularHorasTrabalhadas = (horaInicio, horaFim) => {
        return horaFim < horaInicio ? (1440 - horaInicio) + horaFim : horaFim - horaInicio;
    };

    // Função auxiliar: calcular valor do trabalho
    const calcularValorTrabalho = (horasTrabalhadas, horaInicio, cargo, classe, diaDaSemana, feriado) => {
        const valores = {
            "OIP": {
                "A": { dia: 36.15, noite: 47 },
                "B": { dia: 36.15, noite: 47 },
                "C": { dia: 36.15, noite: 47 },
                "D": { dia: 36.15, noite: 47 }
            },
            "DPC": {
                "Especial": { dia: 50.6, noite: 65.8 }
            }
        };

        if (!valores[cargo] || !valores[cargo][classe]) {
            return 0;
        }

        const valorHora = valores[cargo][classe];
        let totalPago = 0;
        const horasInteiras = Math.ceil(horasTrabalhadas / 60);

        for (let i = 0; i < horasInteiras; i++) {
            const horaAtual = Math.floor((horaInicio / 60 + i) % 24);

            if (diaDaSemana === "sábado" || diaDaSemana === "domingo" || feriado) {
                totalPago += valorHora.noite;
            } else {
                totalPago += (horaAtual >= 6 && horaAtual < 24) ? valorHora.dia : valorHora.noite;
            }
        }

        return totalPago;
    };

    const calcularProjecao = () => {
        // Obter horas e data
        const horaInicio = converterParaMinutos(formData.hora_inicio);
        const horaFim = converterParaMinutos(formData.hora_fim);

        if (Number.isNaN(horaInicio) || Number.isNaN(horaFim)) {
            return {
                totalDPC: 0,
                totalOIP: 0,
                custoEstimado: 0,
                valorUnitarioDPC: 0,
                valorUnitarioOIP: 0,
                horasTrabalhadas: 0,
            };
        }

        const diaDaSemana = obterDiaSemana(formData.data_inicio);
        const feriado = verificarFeriado(formData.data_inicio);

        // Calcular horas trabalhadas
        let horasTrabalhadas = calcularHorasTrabalhadas(horaInicio, horaFim);
        if (horasTrabalhadas === 0 && horaInicio === horaFim) {
            horasTrabalhadas = 1440; // 24 horas
        }

        // Quantidades de efetivo
        const apoioOperacionalDPC = formData.precisa_apoio_operacional ? Number(formData.apoio_operacional_dpc || 0) : 0;
        const apoioOperacionalOIP = formData.precisa_apoio_operacional ? Number(formData.apoio_operacional_oip || 0) : 0;
        const apoioCartorarioDPC = formData.precisa_apoio_operacional ? Number(formData.apoio_cartorario_dpc || 0) : 0;
        const apoioCartorarioOIP = formData.precisa_apoio_operacional ? Number(formData.apoio_cartorario_oip || 0) : 0;
        
        const totalDPC = apoioOperacionalDPC + apoioCartorarioDPC + Number(formData.efetivo_interno_dpc || 0);
        const totalOIP = apoioOperacionalOIP + apoioCartorarioOIP + Number(formData.efetivo_interno_oip || 0);

        // Calcular valor unitário por policial (assumindo classe padrão)
        const valorUnitarioDPC = calcularValorTrabalho(horasTrabalhadas, horaInicio, "DPC", "Especial", diaDaSemana, feriado);
        const valorUnitarioOIP = calcularValorTrabalho(horasTrabalhadas, horaInicio, "OIP", "A", diaDaSemana, feriado);

        // Custo total
        const custoEstimado = (totalDPC * valorUnitarioDPC) + (totalOIP * valorUnitarioOIP);
        
        // Debug
        console.log('🔢 Cálculo de Custo:', {
            hora_inicio: formData.hora_inicio,
            hora_fim: formData.hora_fim,
            data_inicio: formData.data_inicio,
            horaInicioMinutos: horaInicio,
            horaFimMinutos: horaFim,
            horasTrabalhadas,
            diaDaSemana,
            feriado,
            valorUnitarioDPC,
            valorUnitarioOIP,
            totalDPC,
            totalOIP,
            custoEstimado
        });
        
        return { totalDPC, totalOIP, custoEstimado, valorUnitarioDPC, valorUnitarioOIP, horasTrabalhadas };
    };

    const { totalDPC, totalOIP, custoEstimado, valorUnitarioDPC, valorUnitarioOIP, horasTrabalhadas } = calcularProjecao();

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Nao informado';
        const parsed = new Date(`${dateStr}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) return dateStr;
        return parsed.toLocaleDateString('pt-BR');
    };

    const formatList = (list) => {
        if (!Array.isArray(list) || list.length === 0) return 'Nao informado';
        return list.join(', ');
    };

    const numeroPorExtensoAteVinte = (valor) => {
        const mapa = {
            0: 'zero',
            1: 'um',
            2: 'dois',
            3: 'tres',
            4: 'quatro',
            5: 'cinco',
            6: 'seis',
            7: 'sete',
            8: 'oito',
            9: 'nove',
            10: 'dez',
            11: 'onze',
            12: 'doze',
            13: 'treze',
            14: 'quatorze',
            15: 'quinze',
            16: 'dezesseis',
            17: 'dezessete',
            18: 'dezoito',
            19: 'dezenove',
            20: 'vinte'
        };
        return mapa[valor] || String(valor);
    };

    const gerarDocumentoSolicitacaoWord = async () => {
        const totalPoliciais = Number(totalOIP || 0) > 0
            ? Number(totalOIP || 0)
            : Number(totalDPC || 0) + Number(totalOIP || 0);
        const qtdEquipes = Math.max(1, Math.ceil(totalPoliciais / 4));
        const qtdEquipesExtenso = numeroPorExtensoAteVinte(qtdEquipes);
        const dataOperacao = formatDate(formData.data_inicio);
        const horarioApresentacao = `${formData.hora_inicio || '00:00'} às ${formData.hora_fim || '00:00'}`;
        const localApresentacao = (formData.locais_briefing || []).find(Boolean) || 'local a definir';
        const nomeOperacao = formData.nome || 'xxxx';

        const texto = `Senhor(a) Diretor(a), Informamos a V. Exa. deflagração de Operação Policial que ocorrerá no dia ${dataOperacao}, razão pela qual solicitamos o envio de equipes operacionais de acordo com as especificações abaixo, às quais serão empregadas na operação ${nomeOperacao}.\n\n` +
            `EQUIPES OPERACIONAIS SOLICITADAS\n${qtdEquipes} - ${qtdEquipesExtenso} equipes operacionais, em VTRs caracterizadas, compostas por 04 (quatro) policiais, devendo o efetivo se apresentar trajando fardamento completo, conforme Portaria Normativa 004/2024 – GAB/PCCE.\n\n` +
            `APRESENTAÇÃO\nA apresentação será às ${horarioApresentacao}, no local ${localApresentacao}.`;

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: texto.split('\n\n').map((paragrafo) =>
                        new Paragraph({
                            children: [new TextRun(paragrafo)],
                            spacing: { after: 220 },
                        })
                    ),
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        const safeName = (formData.nome || 'operacao').replace(/[^a-zA-Z0-9_-]/g, '_');
        const dateSuffix = formData.data_inicio || new Date().toISOString().slice(0, 10);

        saveAs(blob, `Solicitacao_Equipes_${safeName}_${dateSuffix}.docx`);
    };

    const handleSubmitComDocumento = async (e) => {
        const sucesso = await handleSubmit(e);
        if (!sucesso) return;

        await gerarDocumentoSolicitacaoWord();
        showNotification('Documento Word da solicitação gerado com sucesso!', 'success');
    };

    const gerarPdfDemanda = () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageHeight = pdf.internal.pageSize.getHeight();
            const maxTextWidth = 180;
            let y = 18;

            const ensureSpace = (requiredHeight = 8) => {
                if (y + requiredHeight > pageHeight - 14) {
                    pdf.addPage();
                    y = 18;
                }
            };

            const drawTitle = (title) => {
                ensureSpace(10);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                pdf.text(title, 14, y);
                y += 6;
            };

            const drawLine = (label, value) => {
                const content = `${label}: ${value || 'Nao informado'}`;
                const lines = pdf.splitTextToSize(content, maxTextWidth);
                ensureSpace(lines.length * 5 + 1);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.text(lines, 14, y);
                y += lines.length * 5;
            };

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text('Cadastro de Operacao Policial - Nova Demanda', 14, y);
            y += 7;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, y);
            y += 8;

            drawTitle('1. Dados Gerais');
            drawLine('Nome da operacao', formData.nome);
            drawLine('Orgao solicitante', formData.orgao_solicitante);
            drawLine('Delegacia responsavel', formData.delegacia_responsavel);
            drawLine('Departamento do usuario', userDepartamento || 'Nao informado');
            drawLine('Data de inicio', formatDate(formData.data_inicio));
            drawLine('Hora de inicio', formData.hora_inicio || 'Nao informado');
            drawLine('Hora de fim', formData.hora_fim || 'Nao informado');

            y += 3;
            drawTitle('2. Objetivo');
            drawLine('Descricao', formData.objetivo || 'Nao informado');

            y += 3;
            drawTitle('3. Locais de Briefing');
            drawLine('Locais', formatList(formData.locais_briefing));

            y += 3;
            drawTitle('4. Caracteristicas da Operacao');
            drawLine('Tipos penais', formatList(formData.tipos_penais));
            drawLine('Tipos penais - outros', formData.tipo_penal_outros || 'Nao informado');
            drawLine('Modalidade - Busca e apreensao', formData.modalidades?.busca_apreensao ?? 0);
            drawLine('Modalidade - Prisao preventiva', formData.modalidades?.prisao_preventiva ?? 0);
            drawLine('Modalidade - Prisao temporaria', formData.modalidades?.prisao_temporaria ?? 0);
            drawLine('Modalidade - Sequestro de bens', formData.modalidades?.sequestro_bens ?? 0);
            drawLine('Modalidade - outros', formData.modalidade_outros || 'Nao informado');
            drawLine('AIS de cumprimento', formatList(formData.ais_locais));
            drawLine('Faccoes', formatList(formData.faccoes));
            drawLine('Faccoes - outros', formData.faccao_outros || 'Nao informado');
            drawLine('Alvos sensiveis', formatList(formData.alvos_sensiveis));
            drawLine('Alvos sensiveis - outros', formData.alvos_sensiveis_outros || 'Nao informado');
            drawLine('Apoio de outros departamentos', formData.apoio_outros_departamentos || 'Nao informado');

            y += 3;
            drawTitle('5. Apoio Operacional');
            drawLine('Precisa de apoio operacional', formData.precisa_apoio_operacional ? 'Sim' : 'Nao');
            drawLine('Apoio operacional DPC', formData.precisa_apoio_operacional ? (formData.apoio_operacional_dpc ?? 0) : 0);
            drawLine('Apoio operacional OIP', formData.precisa_apoio_operacional ? (formData.apoio_operacional_oip ?? 0) : 0);
            drawLine('Apoio cartorario DPC', formData.precisa_apoio_operacional ? (formData.apoio_cartorario_dpc ?? 0) : 0);
            drawLine('Apoio cartorario OIP', formData.precisa_apoio_operacional ? (formData.apoio_cartorario_oip ?? 0) : 0);

            y += 3;
            drawTitle('6. Apoio de Outros Orgaos');
            drawLine('Orgaos de apoio', formatList(formData.orgaos_apoio));

            y += 3;
            drawTitle('7. Efetivo Interno Previsto');
            drawLine('Efetivo interno DPC', formData.efetivo_interno_dpc ?? 0);
            drawLine('Efetivo interno OIP', formData.efetivo_interno_oip ?? 0);

            y += 3;
            drawTitle('8. Projecao de Efetivo e Custos');
            drawLine('Total de DPCs previstos', totalDPC);
            drawLine('Total de OIPs previstos', totalOIP);
            drawLine('Horas trabalhadas (min)', horasTrabalhadas);
            drawLine('Valor unitario DPC', `R$ ${Number(valorUnitarioDPC || 0).toFixed(2)}`);
            drawLine('Valor unitario OIP', `R$ ${Number(valorUnitarioOIP || 0).toFixed(2)}`);
            drawLine('Custo estimado da operacao', `R$ ${Number(custoEstimado || 0).toFixed(2)}`);

            const totalPoliciais = Number(totalOIP || 0) > 0
                ? Number(totalOIP || 0)
                : Number(totalDPC || 0) + Number(totalOIP || 0);
            const qtdEquipes = Math.max(1, Math.ceil(totalPoliciais / 4));
            const qtdEquipesExtenso = numeroPorExtensoAteVinte(qtdEquipes);
            const dataOperacao = formatDate(formData.data_inicio);
            const localApresentacao = (formData.locais_briefing || []).find(Boolean) || 'local a definir';

            y += 4;
            drawTitle('9. Minuta de Solicitacao de Equipes');
            const oficioParagrafos = [
                `Senhor(a) Diretor(a), Informamos a V. Exa. deflagracao de Operacao Policial que ocorrera no dia ${dataOperacao}, razao pela qual solicitamos o envio de equipes operacionais de acordo com as especificacoes abaixo, as quais serao empregadas na operacao ${formData.nome || 'XXXX'}.`,
                `EQUIPES OPERACIONAIS SOLICITADAS: ${qtdEquipes} (${qtdEquipesExtenso}) equipes operacionais, em VTRs caracterizadas, compostas por 04 (quatro) policiais, devendo o efetivo se apresentar trajando fardamento completo, conforme Portaria Normativa 004/2024 - GAB/PCCE.`,
                `APRESENTACAO: As equipes deverao se apresentar em ${localApresentacao}, no dia ${dataOperacao}, para briefing operacional e posterior emprego na operacao.`
            ];

            oficioParagrafos.forEach((paragrafo) => {
                const lines = pdf.splitTextToSize(paragrafo, maxTextWidth);
                ensureSpace(lines.length * 5 + 2);
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.text(lines, 14, y);
                y += lines.length * 5 + 2;
            });

            const safeName = (formData.nome || 'demanda').replace(/[^a-zA-Z0-9_-]/g, '_');
            const dateSuffix = formData.data_inicio || new Date().toISOString().slice(0, 10);
            pdf.save(`Nova_Demanda_${safeName}_${dateSuffix}.pdf`);
            showNotification('PDF da Nova Demanda gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF da Nova Demanda:', error);
            showNotification('Nao foi possivel gerar o PDF da Nova Demanda.', 'error');
        }
    };

    return (
        <div className="bg-gray-700 p-6 rounded-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <FileText size={28} />
                <span>📋 Formulário — Cadastro de Operação Policial</span>
            </h2>

            <form onSubmit={handleSubmitComDocumento} className="space-y-8">
                {/* 1. Dados Gerais */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">1. Dados Gerais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Nome da Operação *</label>
                            <input
                                type="text"
                                required
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="Ex: Operação Cerco"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Órgão Solicitante *</label>
                            <select
                                required
                                value={formData.orgao_solicitante}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    orgao_solicitante: e.target.value,
                                    delegacia_responsavel: '' // Limpa delegacia ao mudar órgão
                                })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            >
                                <option value="">Selecione um Órgão</option>
                                {orgaosSolicitantes.map(org => (
                                    <option key={org} value={org}>{org}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-gray-300 mb-2">Delegacia Responsável</label>
                            <select
                                value={formData.delegacia_responsavel}
                                onChange={(e) => setFormData({ ...formData, delegacia_responsavel: e.target.value })}
                                disabled={!formData.orgao_solicitante}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 disabled:bg-gray-800 disabled:text-gray-500"
                            >
                                <option value="">{formData.orgao_solicitante ? 'Selecione a delegacia...' : 'Selecione primeiro o órgão solicitante'}</option>
                                {formData.orgao_solicitante && DEPARTMENTS[formData.orgao_solicitante] ? 
                                    DEPARTMENTS[formData.orgao_solicitante].map(delegacia => (
                                        <option key={delegacia} value={delegacia}>{delegacia}</option>
                                    ))
                                : null}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Data de Início *</label>
                            <input
                                type="date"
                                required
                                value={formData.data_inicio}
                                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Hora de Início Padrão</label>
                            <input
                                type="time"
                                value={formData.hora_inicio}
                                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                placeholder="--:--"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Hora de Fim Padrão</label>
                            <input
                                type="time"
                                value={formData.hora_fim}
                                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Objetivo */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">2. Objetivo da Operação</h3>
                    <textarea
                        value={formData.objetivo}
                        onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                        rows={4}
                        className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                        placeholder="Descrever os principais objetivos..."
                    />
                </section>

                {/* 3. Locais de Briefing */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">3. Local(is) do Briefing</h3>
                    <div className="space-y-2">
                        {formData.locais_briefing.map((local, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <span className="text-white font-semibold w-8">{index + 1}.</span>
                                <input
                                    type="text"
                                    value={local}
                                    onChange={(e) => updateBriefingLocal(index, e.target.value)}
                                    className="flex-1 bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    placeholder={`Local ${index + 1}`}
                                />
                                {formData.locais_briefing.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeBriefingLocal(index)}
                                        className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addBriefingLocal}
                        className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-white mt-4 flex items-center space-x-2"
                    >
                        <Plus size={16} />
                        <span>Adicionar Local de Briefing</span>
                    </button>
                </section>

                {/* 4. Características da Operação */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">4. Características da Operação</h3>

                    {/* 4.1 Tipo Penal */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">4.1 Tipo Penal</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {tiposPenais.map(tipo => (
                                <label key={tipo} className="inline-flex items-center text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={(formData.tipos_penais || []).includes(tipo)}
                                        onChange={() => toggleCheckbox('tipos_penais', tipo)}
                                        className="mr-2"
                                    />
                                    {tipo}
                                </label>
                            ))}
                            <div className="md:col-span-3">
                                <label className="block text-gray-300 mb-2">Outros</label>
                                <input
                                    type="text"
                                    value={formData.tipo_penal_outros || ''}
                                    onChange={(e) => setFormData({ ...formData, tipo_penal_outros: e.target.value })}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    placeholder="Especifique outros tipos penais..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4.2 Modalidade */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">4.2 Modalidade</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2">Mandado de Busca e Apreensão Domiciliar — Qtd:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={(formData.modalidades?.busca_apreensao) || 0}
                                    onChange={(e) => updateModalidade('busca_apreensao', Number(e.target.value))}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Mandado de Prisão Preventiva — Qtd:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={(formData.modalidades?.prisao_preventiva) || 0}
                                    onChange={(e) => updateModalidade('prisao_preventiva', Number(e.target.value))}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Mandado de Prisão Temporária — Qtd:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={(formData.modalidades?.prisao_temporaria) || 0}
                                    onChange={(e) => updateModalidade('prisao_temporaria', Number(e.target.value))}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Sequestro/Bloqueio de Bens — Qtd:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={(formData.modalidades?.sequestro_bens) || 0}
                                    onChange={(e) => updateModalidade('sequestro_bens', Number(e.target.value))}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-gray-300 mb-2">Outros:</label>
                                <input
                                    type="text"
                                    value={formData.modalidade_outros || ''}
                                    onChange={(e) => setFormData({ ...formData, modalidade_outros: e.target.value })}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    placeholder="Especifique outras modalidades..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4.3 Local de Cumprimento (AIS) */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">4.3 Local de Cumprimento (AIS)</h4>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto bg-gray-700 p-4 rounded">
                            {aisList.map(ais => (
                                <label key={ais} className="inline-flex items-center text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={(formData.ais_locais || []).includes(ais)}
                                        onChange={() => toggleCheckbox('ais_locais', ais)}
                                        className="mr-2"
                                    />
                                    {ais}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 4.4 Facção */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">4.4 Facção</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {faccoesList.map(faccao => (
                                <label key={faccao} className="inline-flex items-center text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={(formData.faccoes || []).includes(faccao)}
                                        onChange={() => toggleCheckbox('faccoes', faccao)}
                                        className="mr-2"
                                    />
                                    {faccao}
                                </label>
                            ))}
                            <div className="md:col-span-3">
                                <label className="block text-gray-300 mb-2">Outros</label>
                                <input
                                    type="text"
                                    value={formData.faccao_outros || ''}
                                    onChange={(e) => setFormData({ ...formData, faccao_outros: e.target.value })}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    placeholder="Especifique outras facções..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4.5 Alvos Sensíveis */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">4.5 Alvos Sensíveis</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {alvosSensiveisList.map(alvo => (
                                <label key={alvo} className="inline-flex items-center text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={(formData.alvos_sensiveis || []).includes(alvo)}
                                        onChange={() => toggleCheckbox('alvos_sensiveis', alvo)}
                                        className="mr-2"
                                    />
                                    {alvo}
                                </label>
                            ))}
                            <div className="md:col-span-3">
                                <label className="block text-gray-300 mb-2">Outros</label>
                                <input
                                    type="text"
                                    value={formData.alvos_sensiveis_outros || ''}
                                    onChange={(e) => setFormData({ ...formData, alvos_sensiveis_outros: e.target.value })}
                                    className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                                    placeholder="Especifique outros alvos sensíveis..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Especifique apoio de outros Departamentos */}
                    <div>
                        <label className="block text-gray-300 mb-2">Especifique o apoio de outros Departamentos:</label>
                        <textarea
                            value={formData.apoio_outros_departamentos || ''}
                            onChange={(e) => setFormData({ ...formData, apoio_outros_departamentos: e.target.value })}
                            rows={3}
                            className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            placeholder="Descreva qual apoio será necessário..."
                        />
                    </div>
                </section>

                {/* 5. Apoio Operacional */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">5. Apoio Operacional</h3>
                    
                    {/* Pergunta principal */}
                    <div className="mb-6 bg-gray-700 p-4 rounded">
                        <label className="flex items-center text-lg font-semibold text-white cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.precisa_apoio_operacional || false}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    precisa_apoio_operacional: e.target.checked,
                                    // Zerar valores se desmarcar
                                    apoio_operacional_dpc: e.target.checked ? formData.apoio_operacional_dpc : 0,
                                    apoio_operacional_oip: e.target.checked ? formData.apoio_operacional_oip : 0,
                                    apoio_cartorario_dpc: e.target.checked ? formData.apoio_cartorario_dpc : 0,
                                    apoio_cartorario_oip: e.target.checked ? formData.apoio_cartorario_oip : 0
                                })}
                                className="mr-3 w-5 h-5"
                            />
                            Precisa de Apoio Operacional?
                        </label>
                        <p className="text-gray-400 text-sm mt-2 ml-8">
                            Marque esta opção se a operação necessita de apoio operacional ou cartorário de outros departamentos
                        </p>
                    </div>

                    {/* Campos condicionais - só aparecem se marcou SIM */}
                    {formData.precisa_apoio_operacional && (
                        <>
                            <div className="mb-6 bg-gray-700 p-4 rounded">
                                <h4 className="text-lg font-semibold text-cyan-300 mb-3">Apoio Operacional</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-300 mb-2">Quantidade de DPC (Delegado/Perito):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.apoio_operacional_dpc || 0}
                                            onChange={(e) => setFormData({ ...formData, apoio_operacional_dpc: Number(e.target.value) })}
                                            className="w-full bg-gray-800 text-white rounded px-4 py-2 border border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2">Quantidade de OIP (Policiais):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.apoio_operacional_oip || 0}
                                            onChange={(e) => setFormData({ ...formData, apoio_operacional_oip: Number(e.target.value) })}
                                            className="w-full bg-gray-800 text-white rounded px-4 py-2 border border-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-700 p-4 rounded">
                                <h4 className="text-lg font-semibold text-cyan-300 mb-3">Apoio Cartorário</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-300 mb-2">Quantidade de DPC (Delegado/Perito):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.apoio_cartorario_dpc || 0}
                                            onChange={(e) => setFormData({ ...formData, apoio_cartorario_dpc: Number(e.target.value) })}
                                            className="w-full bg-gray-800 text-white rounded px-4 py-2 border border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 mb-2">Quantidade de OIP (Policiais):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.apoio_cartorario_oip || 0}
                                            onChange={(e) => setFormData({ ...formData, apoio_cartorario_oip: Number(e.target.value) })}
                                            className="w-full bg-gray-800 text-white rounded px-4 py-2 border border-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* 6. Necessita apoio de outros Órgãos */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">6. Necessita apoio de outros Órgãos?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {orgaosApoio.map(orgao => (
                            <label key={orgao} className="inline-flex items-center text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={(formData.orgaos_apoio || []).includes(orgao)}
                                    onChange={() => toggleCheckbox('orgaos_apoio', orgao)}
                                    className="mr-2"
                                />
                                {orgao}
                            </label>
                        ))}
                    </div>
                </section>

                {/* 7. Efetivo Interno Previsto */}
                <section className="bg-gray-600 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">7. Efetivo Interno Previsto (Seu Departamento)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Quantidade de DPC (Delegado/Perito):</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.efetivo_interno_dpc || 0}
                                onChange={(e) => setFormData({ ...formData, efetivo_interno_dpc: Number(e.target.value) })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2">Quantidade de OIP (Policiais):</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.efetivo_interno_oip || 0}
                                onChange={(e) => setFormData({ ...formData, efetivo_interno_oip: Number(e.target.value) })}
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500"
                            />
                        </div>
                    </div>
                </section>

                {/* 8. Projeção Automática */}
                <section className="bg-gradient-to-r from-cyan-600 to-teal-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-white mb-4">8. Projeção de Efetivo e Custos</h3>
                    <p className="text-cyan-100 text-sm mb-4 italic">Esta seção é calculada automaticamente</p>
                    
                    {/* Debug - Detalhamento dos valores */}
                    <div className="bg-white/10 p-3 rounded mb-4 text-xs text-cyan-100">
                        <p className="font-semibold mb-2">📊 Detalhamento do Cálculo:</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div>
                                <strong>DPC:</strong>
                                <p>• Apoio Operacional: {formData.precisa_apoio_operacional ? (formData.apoio_operacional_dpc || 0) : 0}</p>
                                <p>• Apoio Cartorário: {formData.precisa_apoio_operacional ? (formData.apoio_cartorario_dpc || 0) : 0}</p>
                                <p>• Efetivo Interno: {formData.efetivo_interno_dpc || 0}</p>
                            </div>
                            <div>
                                <strong>OIP:</strong>
                                <p>• Apoio Operacional: {formData.precisa_apoio_operacional ? (formData.apoio_operacional_oip || 0) : 0}</p>
                                <p>• Apoio Cartorário: {formData.precisa_apoio_operacional ? (formData.apoio_cartorario_oip || 0) : 0}</p>
                                <p>• Efetivo Interno: {formData.efetivo_interno_oip || 0}</p>
                            </div>
                        </div>
                        <div className="border-t border-white/20 pt-2 mt-2">
                            <p><strong>⏱️ Horas trabalhadas:</strong> {(horasTrabalhadas / 60).toFixed(1)}h ({horasTrabalhadas} min)</p>
                            <p><strong>💰 Valor/hora DPC:</strong> R$ {valorUnitarioDPC.toFixed(2)}</p>
                            <p><strong>💰 Valor/hora OIP:</strong> R$ {valorUnitarioOIP.toFixed(2)}</p>
                            <p className="mt-1 text-yellow-200"><strong>📅 Data:</strong> {formData.data_inicio || 'não informada'} | <strong>🕐 Horário:</strong> {formData.hora_inicio || '00:00'} - {formData.hora_fim || '00:00'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 p-4 rounded">
                            <p className="text-cyan-100 text-sm">Total de DPCs Previstos:</p>
                            <p className="text-3xl font-bold text-white">{totalDPC}</p>
                            <p className="text-xs text-cyan-200 mt-1">R$ {(totalDPC * valorUnitarioDPC).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded">
                            <p className="text-cyan-100 text-sm">Total de OIPs Previstos:</p>
                            <p className="text-3xl font-bold text-white">{totalOIP}</p>
                            <p className="text-xs text-cyan-200 mt-1">R$ {(totalOIP * valorUnitarioOIP).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded">
                            <p className="text-cyan-100 text-sm">Custo Estimado da Operação:</p>
                            <p className="text-3xl font-bold text-white">
                                R$ {custoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Botões */}
                <div className="flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={gerarPdfDemanda}
                        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-semibold flex items-center space-x-2"
                    >
                        <Download size={18} />
                        <span>Baixar PDF</span>
                    </button>
                    <button
                        type="submit"
                        className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg text-white font-semibold"
                    >
                        Salvar Operação
                    </button>
                </div>
            </form>
        </div>
    );
}
