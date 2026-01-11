/**
 * Utilitário para gerar Plano Operacional em formato DOCX
 * Organiza equipes por departamento e numera todas as equipes
 */

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

    // Gerar HTML do documento
    const html = gerarHTMLPlano(operacao, equipesPorDepartamento, alvos);
    
    // Criar e baixar arquivo
    baixarComoDocx(html, `Plano_Operacional_${operacao.nome.replace(/\s+/g, '_')}.doc`);
}

function gerarHTMLPlano(operacao, equipesPorDepartamento, alvos) {
    const dataOperacao = new Date(operacao.data_hora_inicio).toLocaleDateString('pt-BR');
    const horaOperacao = new Date(operacao.data_hora_inicio).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // Gerar seções de equipes por departamento no novo formato
    let equipesHTML = '';
    Object.keys(equipesPorDepartamento).sort().forEach(dept => {
        equipesHTML += `
            <div style="margin-top: 30px; page-break-inside: avoid;">
                <h3 style="color: #000; font-size: 12pt; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 5px;">DEPARTAMENTO: ${dept}</h3>
        `;

        equipesPorDepartamento[dept].forEach((equipe, idx) => {
            const tituloEquipe = equipe.tipo === 'Supervisão' 
                ? `EQUIPE SUPERVISÃO: ${equipe.delegacia || dept}` 
                : `EQUIPE ${equipe.numeroGlobal}: ${equipe.delegacia || 'N.O ' + dept}`;
            
            equipesHTML += `
                <div style="margin-bottom: 25px; page-break-inside: avoid;">
                    <p style="font-weight: bold; font-size: 11pt; margin-bottom: 10px;">${tituloEquipe} | VTR: ${equipe.viatura || '-'}</p>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #ffffff; border: 1px solid #000;">
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; font-size: 10pt; width: 12%;">CARGO</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; font-size: 10pt; width: 45%;">NOME</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; font-size: 10pt; width: 18%;">MATRÍCULA</th>
                                <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; font-size: 10pt; width: 25%;">TELEFONE</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            // Adicionar chefe se existir
            if (equipe.chefe) {
                const cargo = equipe.cargoChefe || 'DPC';
                const matriculaChefe = equipe.matriculaChefe || '-';
                const telefoneChefe = equipe.telefoneChefe || '-';
                
                equipesHTML += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${cargo}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${equipe.chefe}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${matriculaChefe}</td>
                        <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${telefoneChefe}</td>
                    </tr>
                `;
            }

            // Adicionar membros
            const membros = Array.isArray(equipe.membros) ? equipe.membros : 
                           (equipe.membros ? equipe.membros.split(',').map(m => m.trim()) : []);
            
            if (equipe.membrosDetalhes && Array.isArray(equipe.membrosDetalhes)) {
                // Se tiver detalhes dos membros
                equipe.membrosDetalhes.forEach(membro => {
                    equipesHTML += `
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${membro.cargo || 'OIP'}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${membro.nome}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${membro.matricula || '-'}</td>
                            <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${membro.telefone || '-'}</td>
                        </tr>
                    `;
                });
            } else if (membros.length > 0) {
                // Se tiver apenas nomes
                membros.forEach(nome => {
                    if (nome) {
                        equipesHTML += `
                            <tr>
                                <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">OIP</td>
                                <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${nome}</td>
                                <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">-</td>
                                <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">-</td>
                            </tr>
                        `;
                    }
                });
            }

            equipesHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        });

        equipesHTML += `</div>`;
    });

    // Gerar lista de alvos (se houver)
    let alvosHTML = '';
    const alvosDaOperacao = alvos.filter(a => a.operationId === operacao.id);
    
    if (alvosDaOperacao.length > 0) {
        alvosHTML = `
            <div style="page-break-before: always; margin-top: 30px;">
                <h2 style="color: #000; font-size: 14pt; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 5px;">ALVOS DA OPERAÇÃO</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #ffffff;">
                            <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; width: 5%;">Nº</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; width: 30%;">NOME</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; width: 15%;">CPF</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; width: 40%;">ENDEREÇO</th>
                            <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 10%;">EQUIPE</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        alvosDaOperacao.forEach((alvo, index) => {
            alvosHTML += `
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 10pt;">${index + 1}</td>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${alvo.nome || '-'}</td>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 10pt;">${alvo.cpf || '-'}</td>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 9pt;">${alvo.endereco_cumprimento || '-'}</td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 10pt;">${alvo.equipeNumero || '-'}</td>
                </tr>
            `;
        });

        alvosHTML += `
                    </tbody>
                </table>
            </div>
        `;
    }

    // Estatísticas
    const totalEquipes = Object.values(equipesPorDepartamento).reduce((sum, eqs) => sum + eqs.length, 0);
    const departamentos = Object.keys(equipesPorDepartamento).length;
    const numeroOperacao = operacao.numeroOperacao || operacao.id;
    const anoOperacao = new Date(operacao.data_hora_inicio).getFullYear();

    // Template completo do documento
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Plano Operacional - ${operacao.nome}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm 2cm 2cm 2cm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        h1 {
            font-size: 14pt;
            font-weight: bold;
            margin: 5px 0;
        }
        h2 {
            font-size: 12pt;
            font-weight: bold;
            margin: 15px 0 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ANEXO I</h1>
        <h2>EFETIVO DA OPERAÇÃO ${numeroOperacao}/${anoOperacao}</h2>
        <p style="font-weight: bold; margin: 10px 0;">DIA ${dataOperacao}</p>
    </div>

    ${equipesHTML}

    ${alvosHTML}

</body>
</html>
    `;
}

function baixarComoDocx(html, nomeArquivo) {
    // Criar blob com o HTML
    const blob = new Blob([html], { 
        type: 'application/msword' 
    });
    
    // Criar link de download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    
    // Disparar download
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
