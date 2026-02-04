/**
 * Utilitário para gerar Plano Operacional em formato DOCX
 * Organiza equipes por departamento e numera todas as equipes
 * Usa a biblioteca docx para gerar Word verdadeiro (.docx)
 */

import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export function gerarPlanoOperacional(operacao, equipes, alvos) {
    // Agrupar equipes por departamento
    const equipesPorDepartamento = {};
    let numeroEquipeGlobal = 1;

    equipes
        .filter(eq => eq.operationId === operacao.id)
        .forEach(equipe => {
            const dept = equipe.departamento || 'Sem Departamento';
            
            if (!equipesPorDepartamento[dept]) {
                equipesPorDepartamento[dept] = [];
            }
            
            equipesPorDepartamento[dept].push({
                ...equipe,
                numeroGlobal: numeroEquipeGlobal++,
                tipo: equipe.chefe ? 'Supervisão' : 'Equipe'
            });
        });

    // Gerar documento Word real
    const doc = criarDocumentoWord(operacao, equipesPorDepartamento, alvos);
    
    // Criar e baixar arquivo
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Plano_Operacional_${operacao.nome.replace(/\s+/g, '_')}.docx`);
    });
}

function criarDocumentoWord(operacao, equipesPorDepartamento, alvos) {
    const dataOperacao = new Date(operacao.data_hora_inicio).toLocaleDateString('pt-BR');
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const numeroOperacao = operacao.numeroOperacao || operacao.id;
    const anoOperacao = new Date(operacao.data_hora_inicio).getFullYear();
    const horarioApresentacao = new Date(operacao.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Extrair informações da operação
    const departamentoDemandante = operacao.departamentoDemandante || 'DEPARTAMENTO TÉCNICO OPERACIONAL';
    const nup = operacao.nup || '[NUP não informado]';
    const tipoMandado = operacao.tipoMandado || 'mandados de prisão e busca e apreensão';
    const localOperacao = operacao.local || operacao.bairros || '[Local não informado]';
    const localApresentacao = operacao.localApresentacao || 'DTO - Departamento Técnico Operacional';
    const diretor = operacao.diretor || 'DPC [Nome do Diretor]';
    const diretorDemandante = operacao.diretorDemandante || diretor;
    
    // Departamentos envolvidos
    const departamentosEnvolvidos = Object.keys(equipesPorDepartamento).join(', ') || 'Departamentos Envolvidos';

    const sections = [];

    // CABEÇALHO OFICIAL
    sections.push(
        new Paragraph({
            text: 'DEPARTAMENTO TÉCNICO OPERACIONAL',
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 }
        }),
        new Paragraph({
            text: 'SEÇÃO DE OPERAÇÕES',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }),
        new Paragraph({
            text: '',
            spacing: { after: 800 }
        }),
        new Paragraph({
            text: `PLANO OPERACIONAL Nº ${numeroOperacao}`,
            alignment: AlignmentType.CENTER,
            bold: true,
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: 'CUMPRIMENTO DE MANDADOS JUDICIAIS',
            alignment: AlignmentType.CENTER,
            bold: true,
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: `Dia ${dataOperacao}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    // 1. FINALIDADE
    sections.push(
        new Paragraph({
            text: '1. FINALIDADE',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: `Executar, por solicitação do ${departamentoDemandante}, através do NUP ${nup}, no cumprimento de ${tipoMandado}, que ocorrerá na(s) cidade(s) de ${localOperacao}, além de viabilizar a otimização da atuação desta Instituição nas diversas ações delitivas, tudo em consonância com as diretrizes da Delegacia Geral da Polícia Civil.`,
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        })
    );

    // 2. CALENDÁRIO
    sections.push(
        new Paragraph({
            text: '2. CALENDÁRIO',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: 'a) Cronograma operacional:',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: `●\tDATA: ${dataOperacao}`,
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: `●\tHORÁRIO DE APRESENTAÇÃO: ${horarioApresentacao}`,
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: `●\tLOCAL: ${localApresentacao}`,
            spacing: { after: 150 }
        }),
        new Paragraph({
            text: 'b) Ações a serem realizadas:',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: `●\tCumprimento de ${tipoMandado};`,
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: '●\tLavratura de Auto de Prisão em Flagrante;',
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: '●\tElaboração de Termo Circunstanciado de Ocorrência;',
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: '●\tInstauração de Inquérito Policial mediante Portaria;',
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: '●\tRegistro de BO\'s;',
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: '●\tOutros atos imprescindíveis à elucidação dos crimes, contravenções e respectivas autorias, resultantes desta Operação, dentro da área de competência constitucionalmente atribuída à Polícia Civil.',
            spacing: { after: 200 }
        })
    );

    // 3. REFERÊNCIAS
    sections.push(
        new Paragraph({
            text: '3. REFERÊNCIAS',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: '●\tConstituição Federal;',
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: '●\tCódigo Penal, Processo Penal Brasileira e legislação extravagante.',
            spacing: { after: 200 }
        })
    );

    // 4. PARTICIPANTES
    sections.push(
        new Paragraph({
            text: '4. PARTICIPANTES',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: `●\tPolícia Civil através do ${departamentosEnvolvidos}.`,
            spacing: { after: 200 }
        })
    );

    // 5. EXECUÇÃO
    sections.push(
        new Paragraph({
            text: '5. EXECUÇÃO',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: `A cargo do ${departamentoDemandante}.`,
            spacing: { after: 200 }
        })
    );

    // 6. EFETIVO EMPREGADO
    sections.push(
        new Paragraph({
            text: '6. EFETIVO EMPREGADO',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: 'De acordo com o contido no Anexo I deste Plano.',
            spacing: { after: 200 }
        })
    );

    // 7. APOIO LOGÍSTICO
    sections.push(
        new Paragraph({
            text: '7. APOIO LOGÍSTICO',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: 'Tendo em vista o caráter reservado do presente Plano Operacional, somente será encaminhado aos Departamentos envolvidos, após o envio do Relatório Circunstanciado, indicando o local e horário que cada equipe efetivamente executou a missão, sob pena do não pagamento da Diária de Reforço Operacional aos policiais participantes, à qual ficará a cargo do DTO, conforme legislação em vigor.',
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        })
    );

    // 8. CONTROLE DA OPERAÇÃO
    sections.push(
        new Paragraph({
            text: '8. CONTROLE DA OPERAÇÃO',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: 'a) SUPERVISÃO GERAL',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: `${diretor}.`,
            spacing: { after: 150 }
        }),
        new Paragraph({
            text: 'b) SUPERVISÃO OPERACIONAL',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: `${diretorDemandante}.`,
            spacing: { after: 150 }
        }),
        new Paragraph({
            text: 'c) COORDENAÇÃO OPERACIONAL',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: 'A cargo de cada Delegado escalado na Missão.',
            spacing: { after: 200 }
        })
    );

    // 9. RELATÓRIO
    sections.push(
        new Paragraph({
            text: '9. RELATÓRIO',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: 'O DTO, após o término da Operação, elaborará Relatório Circunstanciado da mesma, informando o efetivo empregado nominalmente, comunicando as substituições e faltas, e o encaminhará aos Departamentos envolvidos.',
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 }
        })
    );

    // 10. PRESCRIÇÕES GERAIS
    sections.push(
        new Paragraph({
            text: '10. PRESCRIÇÕES GERAIS',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: 'Priorizar o atendimento aos fatos emergentes da presente Operação.',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: `O(s) ${departamentosEnvolvidos} se encarregará(ão) de informar aos policiais das Delegacias que lhe são subordinadas acerca do dia, horário e apresentação das equipes.`,
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: 'Cada órgão participante deverá manter sigilo sobre as informações da Operação, cuja divulgação será de responsabilidade do Coordenador Operacional no momento do briefing.',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: 'Recomenda-se aos integrantes deste Plano Operacional o costumeiro entrosamento com os demais Órgãos participantes.',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: 'Os policiais civis deverão estar devidamente identificados com distintivo e fardamento da POLÍCIA CIVIL, conforme portaria nº 04/2024 da Polícia Civil do Ceará, salvo aqueles que por necessidade de serviço atuarão de forma velada, usando traje social.',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: 'É obrigatório o uso de Colete Balístico durante toda operação.',
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: 'A distribuição e atribuições das equipes no ambiente operacional ficarão a cargo da Coordenação Operacional.',
            spacing: { after: 200 }
        })
    );

    // 11. CUSTOS OPERACIONAIS
    sections.push(
        new Paragraph({
            text: '11. CUSTOS OPERACIONAIS',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: 'Os custos operacionais encontram-se dispostos no anexo II para aporte financeiro ao DTO;',
            spacing: { after: 200 }
        })
    );

    // 12. DIFUSÃO
    sections.push(
        new Paragraph({
            text: '12. DIFUSÃO',
            bold: true,
            spacing: { before: 300, after: 200 }
        }),
        new Paragraph({
            text: `${departamentosEnvolvidos}.`,
            spacing: { after: 400 }
        })
    );

    // ASSINATURAS
    sections.push(
        new Paragraph({
            text: '',
            spacing: { after: 400 }
        }),
        new Paragraph({
            text: `Fortaleza, ${dataEmissao}.`,
            spacing: { after: 400 }
        }),
        new Paragraph({
            text: '',
            spacing: { after: 200 }
        }),
        new Paragraph({
            text: diretor,
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: 'Diretor do Departamento Técnico Operacional',
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        }),
        new Paragraph({
            text: '',
            spacing: { after: 200 }
        }),
        new Paragraph({
            text: 'Aprovo: DPC Otávio Duarte Vieira Coutinho',
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 }
        }),
        new Paragraph({
            text: 'Diretor de Planejamento e Gestão Interna',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    // QUEBRA DE PÁGINA PARA ANEXO I
    sections.push(
        new Paragraph({
            text: '',
            pageBreakBefore: true
        })
    );

    // ANEXO I - EFETIVO
    sections.push(
        new Paragraph({
            text: 'ANEXO I',
            alignment: AlignmentType.CENTER,
            bold: true,
            spacing: { after: 200 }
        }),
        new Paragraph({
            text: `EFETIVO DA OPERAÇÃO ${numeroOperacao}/${anoOperacao}`,
            alignment: AlignmentType.CENTER,
            bold: true,
            spacing: { after: 100 }
        }),
        new Paragraph({
            text: `DIA ${dataOperacao}`,
            alignment: AlignmentType.CENTER,
            bold: true,
            spacing: { after: 300 }
        })
    );

    // Gerar seções de equipes por departamento
    Object.keys(equipesPorDepartamento).sort().forEach(dept => {
        // Título do departamento
        sections.push(
            new Paragraph({
                text: `DEPARTAMENTO: ${dept}`,
                spacing: { before: 300, after: 200 },
                bold: true,
                border: {
                    bottom: {
                        color: '000000',
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6
                    }
                }
            })
        );

        equipesPorDepartamento[dept].forEach(equipe => {
            const tituloEquipe = equipe.tipo === 'Supervisão' 
                ? `EQUIPE SUPERVISÃO: ${equipe.delegacia || dept}` 
                : `EQUIPE ${equipe.numeroGlobal}: ${equipe.delegacia || 'N.O ' + dept}`;

            // Título da equipe
            sections.push(
                new Paragraph({
                    text: `${tituloEquipe} | VTR: ${equipe.viatura || '-'}`,
                    spacing: { before: 200, after: 100 },
                    bold: true
                })
            );

            // Criar tabela da equipe
            const rows = [];

            // Cabeçalho da tabela
            rows.push(
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ text: 'CARGO', bold: true })],
                            width: { size: 15, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'NOME', bold: true })],
                            width: { size: 45, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'MATRÍCULA', bold: true })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'TELEFONE', bold: true })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        })
                    ]
                })
            );

            // Adicionar chefe se existir
            if (equipe.chefe) {
                const cargo = equipe.cargoChefe || 'DPC';
                const matriculaChefe = equipe.matriculaChefe || '-';
                const telefoneChefe = equipe.telefoneChefe || '-';
                
                rows.push(
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(cargo)] }),
                            new TableCell({ children: [new Paragraph(equipe.chefe)] }),
                            new TableCell({ children: [new Paragraph(matriculaChefe)] }),
                            new TableCell({ children: [new Paragraph(telefoneChefe)] })
                        ]
                    })
                );
            }

            // Adicionar membros
            const membros = Array.isArray(equipe.membros) ? equipe.membros : 
                           (equipe.membros ? equipe.membros.split(',').map(m => m.trim()) : []);
            
            if (equipe.membrosDetalhes && Array.isArray(equipe.membrosDetalhes)) {
                equipe.membrosDetalhes.forEach(membro => {
                    rows.push(
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(membro.cargo || 'OIP')] }),
                                new TableCell({ children: [new Paragraph(membro.nome)] }),
                                new TableCell({ children: [new Paragraph(membro.matricula || '-')] }),
                                new TableCell({ children: [new Paragraph(membro.telefone || '-')] })
                            ]
                        })
                    );
                });
            } else if (membros.length > 0) {
                membros.forEach(nome => {
                    if (nome) {
                        rows.push(
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph('OIP')] }),
                                    new TableCell({ children: [new Paragraph(nome)] }),
                                    new TableCell({ children: [new Paragraph('-')] }),
                                    new TableCell({ children: [new Paragraph('-')] })
                                ]
                            })
                        );
                    }
                });
            }

            // Adicionar tabela ao documento
            sections.push(
                new Table({
                    rows: rows,
                    width: { size: 100, type: WidthType.PERCENTAGE }
                })
            );
        });
    });

    // Adicionar alvos se houver
    const alvosDaOperacao = alvos.filter(a => a.operationId === operacao.id);
    
    if (alvosDaOperacao.length > 0) {
        sections.push(
            new Paragraph({
                text: 'ALVOS DA OPERAÇÃO',
                spacing: { before: 400, after: 200 },
                bold: true,
                border: {
                    bottom: {
                        color: '000000',
                        space: 1,
                        style: BorderStyle.SINGLE,
                        size: 6
                    }
                }
            })
        );

        const alvosRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: 'Nº', bold: true })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'NOME', bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'CPF', bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'ENDEREÇO', bold: true })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'EQUIPE', bold: true })], width: { size: 10, type: WidthType.PERCENTAGE } })
                ]
            })
        ];

        alvosDaOperacao.forEach((alvo, index) => {
            alvosRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph((index + 1).toString())] }),
                        new TableCell({ children: [new Paragraph(alvo.nome || '-')] }),
                        new TableCell({ children: [new Paragraph(alvo.cpf || '-')] }),
                        new TableCell({ children: [new Paragraph(alvo.endereco_cumprimento || '-')] }),
                        new TableCell({ children: [new Paragraph(alvo.equipeNumero?.toString() || '-')] })
                    ]
                })
            );
        });

        sections.push(
            new Table({
                rows: alvosRows,
                width: { size: 100, type: WidthType.PERCENTAGE }
            })
        );
    }

    // Criar e retornar documento
    return new Document({
        sections: [{
            properties: {},
            children: sections
        }]
    });
}
