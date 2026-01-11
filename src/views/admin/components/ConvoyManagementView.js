// src/views/admin/components/ConvoyManagementView.js       
import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../../../config/firebase';
import { useAdminData } from '../useAdminData';
import { normalizeName } from '../../../utils/helpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { AIS_OPTIONS, AIS_BAIRROS, DPC_LIST, OIP_LIST, BRIEFING_LOCATIONS } from '../../../constants/data'; 
import { displayMatricula } from '../../../utils/helpers';
    

export const ConvoyManagementView = ({ teams, convoys, weekId, showNotification, departamento }) => {
    const [dataOperacao, setDataOperacao] = useState(() => new Date().toISOString().split("T")[0]);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [operationData, setOperationData] = useState({ dpc: '', oip: '', dpcOutro: '', oipOutro: '', localBriefing: '', localBriefingOutro: '' });
      

    // MUDANÇA 1: O estado 'bairro' foi trocado para 'bairros' e agora é um array.
    const [assignmentData, setAssignmentData] = useState({ ais: '', bairros: [], mission: '' });
        const [showBairroOptions, setShowBairroOptions] = useState(false); // Estado para controlar o dropdown de bairros

    const unassignedTeams = teams.filter(t => !convoys.some(c => c.teamIds.includes(t.id)));

    const handleSelectTeam = (teamId) => setSelectedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
    const handleChange = (setter, field, value) => setter(prev => ({ ...prev, [field]: value }));

    // MUDANÇA 2: Novas funções para adicionar e remover bairros do array.
    const handleAddBairro = (bairro) => {
        if (!assignmentData.bairros.includes(bairro)) {
            setAssignmentData(prev => ({
                ...prev,
                bairros: [...prev.bairros, bairro].sort() // Adiciona e ordena
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
    if (!assignmentData.ais || assignmentData.bairros.length === 0 || (!operationData.oip || (operationData.oip === 'OUTRO' && !operationData.oipOutro)) || (!operationData.dpc || (operationData.dpc === 'OUTRO' && !operationData.dpcOutro)) || (!operationData.localBriefing || (operationData.localBriefing === 'OUTRO' && !operationData.localBriefingOutro))) {
        showNotification("Preencha todos os campos da operação, incluindo AIS e pelo menos um bairro.", "error");
        return;
    }

    try {
        const operationDate = teams.find(t => t.id === selectedTeams[0]).vagaDate.toDate();
        
        // --- INÍCIO DA NOVA LÓGICA PARA NUMERAR O COMBOIO ---
        
        // 1. Define o início e o fim do dia da operação para a consulta
        const startOfDay = new Date(operationDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(operationDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        // 2. Consulta quantos comboios já existem para esta data
        const convoysTodayQuery = query(
            collection(db, `/artifacts/${appId}/public/data/convoys`),
            where("date", ">=", startOfDay),
            where("date", "<=", endOfDay)
        );
        const querySnapshot = await getDocs(convoysTodayQuery);
        const existingConvoysCount = querySnapshot.size;
        
        // 3. O número do novo comboio é o total existente + 1
        const newConvoyNumber = existingConvoysCount + 1;
        
        // --- FIM DA NOVA LÓGICA ---

        const newConvoyRef = doc(collection(db, `/artifacts/${appId}/public/data/convoys`));
        const finalDpc = operationData.dpc === 'OUTRO' ? normalizeName(operationData.dpcOutro) : operationData.dpc;
        const finalOip = operationData.oip === 'OUTRO' ? normalizeName(operationData.oipOutro) : operationData.oip;
        const finalLocalBriefing = operationData.localBriefing === 'OUTRO' ? normalizeName(operationData.localBriefingOutro) : operationData.localBriefing;
        
        await setDoc(newConvoyRef, {
            id: newConvoyRef.id,
            numeroComboio: newConvoyNumber, // <-- SALVA O NÚMERO AQUI
            weekId,
            date: operationDate,
            teamIds: selectedTeams,
            ...assignmentData,
            oip: finalOip,
            dpc: finalDpc,
            localBriefing: finalLocalBriefing,
            status: 'Formado',
            departamento: departamento || 'N/A'
        });
        
        showNotification(`Comboio ${newConvoyNumber} criado com sucesso!`, "success");
        setSelectedTeams([]);
        setAssignmentData({ ais: '', bairros: [], mission: '' });
    } catch (error) { console.error(error); showNotification("Falha ao criar comboio.", "error"); }
};
// É recomendável ter uma função auxiliar para comparar as datas de forma segura
    const isSameDay = (timestamp, dateString) => {
        if (!timestamp || !timestamp.seconds) return false;
        // Converte o timestamp do Firestore para uma string YYYY-MM-DD
        const convoyDate = new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
        return convoyDate === dateString;
    };

    const gerarPDF = (dataOperacaoStr) => {
        // ALTERAÇÃO 1: Filtra a lista de comboios ANTES de qualquer outra coisa.
        const convoysDoDia = convoys.filter(c => isSameDay(c.date, dataOperacaoStr));
        
        // ALTERAÇÃO 2: A validação agora usa a lista FILTRADA.
        if (convoysDoDia.length === 0) {
            const data = new Date(dataOperacaoStr + 'T12:00:00'); // Adiciona hora para evitar problemas de fuso
            const dataFormatada = data.toLocaleDateString('pt-BR');
            showNotification(`Nenhum comboio formado para a data ${dataFormatada}.`, "warning");
            return;
        }

        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            let startY = 15;

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('ESCALA OPERACIONAL DIÁRIA', pageWidth / 2, startY, { align: 'center' });
            startY += 7;

            const data = new Date(dataOperacaoStr + 'T12:00:00');
            const dataFormatada = data.toLocaleDateString('pt-BR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(dataFormatada, pageWidth / 2, startY, { align: 'center' });
            startY += 15;
            
            // ALTERAÇÃO 3: O loop 'forEach' agora itera sobre a lista FILTRADA 'convoysDoDia'.
            convoysDoDia.forEach((convoy, index) => {
                if (startY > 260) {
                    pdf.addPage();
                    startY = 15;
                }

                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`COMBOIO ${index + 1}`, 14, startY);
                startY += 6;

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                
                const addInfoLine = (label, value) => {
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(label, 14, startY);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(value, 42, startY);
                    startY += 5;
                };

                addInfoLine('ÁREA:', `AIS ${convoy.ais} - ${Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : convoy.bairros}`);
                addInfoLine('MISSÃO:', convoy.mission);
                addInfoLine('SUPERVISÃO:', `DPC ${convoy.dpc} | OIP ${convoy.oip}`);
                addInfoLine('BRIEFING:', convoy.localBriefing);
                startY += 4;

                pdf.setFont('helvetica', 'bold');
                pdf.text('EQUIPES:', 14, startY);
                startY += 5;

                convoy.teamIds.forEach(teamId => {
                    const team = teams.find(t => t.id === teamId);
                    if (!team) return;

                    pdf.setFontSize(9);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(`Equipe: ${team.teamName || team.delegaciaPrincipal} | Viatura: ${team.vehicle}`, 14, startY);
                    startY += 5;

                    const tableBody = team.members.map(member => {
                        const isChefe = member.matricula === team.registeringOfficer.matricula;
                        return [
                            isChefe ? 'CHEFE' : 'COMPONENTE',
                            member.nome,
                            displayMatricula(member.matricula) // Supondo que displayMatricula exista
                        ];
                    });

                   autoTable(pdf, {
                      head: [['FUNÇÃO', 'NOME', 'MATRÍCULA']],
                      body: tableBody,
                      startY: startY,
                      theme: 'grid',
                      styles: {
                          fontSize: 8,
                          cellPadding: 1.5,
                          textColor: [0, 0, 0], // <-- ADICIONADO: Define o texto do corpo da tabela como preto
                          lineColor: [0, 0, 0], // <-- ADICIONADO: Define as linhas da grade como pretas
                          lineWidth: 0.1,      // <-- ADICIONADO: Deixa as linhas mais finas e nítidas
                      },
                      headStyles: {
                          fillColor: [220, 220, 220],
                          textColor: [0, 0, 0],
                          fontStyle: 'bold',
                          lineColor: [0, 0, 0],
                          halign: 'center', // <-- ADICIONADO: Centraliza o texto do cabeçalho
                      },
                      didDrawPage: (data) => {
                          startY = data.cursor.y;
                      }
                  });

                    startY = pdf.lastAutoTable.finalY + 10;
                });
            });

            pdf.save(`Escala_Operacional_${dataOperacaoStr}.pdf`);
            showNotification("PDF da escala gerado com sucesso!", "success");

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            showNotification("Ocorreu um erro ao gerar o PDF.", "error");
        }
    };
    
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Criação da Operação</h3>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-8">
                <h4 className="text-xl font-semibold mb-3">Dados Gerais da Operação do Dia</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {/* ...código dos DPC, OIP, etc... (sem alterações) */}
                     <div>
                        <label className="block mb-1 font-semibold text-sm">DPC</label>
                        <select value={operationData.dpc} onChange={e => handleChange(setOperationData, 'dpc', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                            <option value="">Selecione</option>
                            {DPC_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                            <option value="OUTRO">OUTRO</option>
                        </select>
                    </div>
                    {operationData.dpc === 'OUTRO' && (<div><label className="block mb-1 font-semibold text-sm">Outro DPC</label><input type="text" value={operationData.dpcOutro} onChange={e => handleChange(setOperationData, 'dpcOutro', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md uppercase" /></div>)}
                    <div>
                        <label className="block mb-1 font-semibold text-sm">OIP</label>
                        <select value={operationData.oip} onChange={e => handleChange(setOperationData, 'oip', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                            <option value="">Selecione</option>
                            {OIP_LIST.map(o => <option key={o} value={o}>{o}</option>)}
                            <option value="OUTRO">OUTRO</option>
                        </select>
                    </div>
                    {operationData.oip === 'OUTRO' && (<div><label className="block mb-1 font-semibold text-sm">Outro OIP</label><input type="text" value={operationData.oipOutro} onChange={e => handleChange(setOperationData, 'oipOutro', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md uppercase" /></div>)}
                    <div>
                        <label className="block mb-1 font-semibold text-sm">Local do Briefing</label>
                        <select value={operationData.localBriefing} onChange={e => handleChange(setOperationData, 'localBriefing', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md">
                            <option value="">Selecione</option>
                            {BRIEFING_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            <option value="OUTRO">OUTRO</option>
                        </select>
                    </div>
                    {operationData.localBriefing === 'OUTRO' && (<div><label className="block mb-1 font-semibold text-sm">Outro Local</label><input type="text" value={operationData.localBriefingOutro} onChange={e => handleChange(setOperationData, 'localBriefingOutro', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md uppercase" /></div>)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-xl font-semibold mb-3">Equipes Disponíveis</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {/* ...código das equipes... (sem alterações) */}
                        {unassignedTeams.map(team => (
                            <div key={team.id} className={`p-3 rounded-lg border-2 ${selectedTeams.includes(team.id) ? 'border-blue-500 bg-blue-900/50' : 'border-transparent bg-gray-700'}`}>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={selectedTeams.includes(team.id)} onChange={() => handleSelectTeam(team.id)} className="form-checkbox h-5 w-5 text-blue-600 bg-gray-800 border-gray-600" />
                                    <div>
                                        
                           <p className="font-bold">{team.teamName || team.delegaciaPrincipal}</p>
                           <p className="text-sm">
                             Chefe: {team.registeringOfficer.nome} | Viatura: {team.vehicle}</p>
                               <p className="text-xs text-gray-400">
  Disponível em: {team.vagaDate?.seconds 
    ? new Date(team.vagaDate.seconds * 1000).toLocaleDateString('pt-BR') 
    : 'Data não informada'}
</p>
                                </div>
                                </label>
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
                                <label className="block mb-1 font-semibold text-sm">AIS</label>
                                <select value={assignmentData.ais} onChange={handleAisChange} className="w-full p-2 bg-gray-700 rounded-md">
                                    <option value="">Selecione</option>
                                    {AIS_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <label className="block mb-1 font-semibold text-sm">Bairro(s)</label>
                                <div className="w-full p-2 bg-gray-700 rounded-md min-h-[40px] flex flex-wrap items-center gap-1 cursor-pointer" onClick={() => setShowBairroOptions(!showBairroOptions)}>
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
                                </div>
                                {showBairroOptions && assignmentData.ais && (
                                    <div className="absolute z-10 w-full mt-1 bg-gray-600 border border-gray-500 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <ul>
                                            {AIS_BAIRROS[assignmentData.ais]
                                                .filter(b => !assignmentData.bairros.includes(b))
                                                .map(b => (
                                                <li key={b} onClick={() => { handleAddBairro(b); }} className="px-3 py-2 text-sm text-white hover:bg-blue-600 cursor-pointer">
                                                    {b}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold text-sm">Missão</label>
                            <textarea value={assignmentData.mission} onChange={e => handleChange(setAssignmentData, 'mission', e.target.value.toUpperCase())} className="w-full p-2 bg-gray-700 rounded-md uppercase" rows="2" placeholder="Ex: PATRULHAMENTO..."/>
                        </div>
                        <button onClick={handleCreateConvoy} disabled={selectedTeams.length < 2} className="w-full py-3 bg-green-600 hover:bg-green-700 font-bold rounded-lg transition disabled:bg-gray-500">Formar Comboio</button>
                    </div>
                </div>
            </div>
            
            <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xl font-semibold">Comboios Formados</h4>
                    <div className='flex items-end space-x-4'>
                        <div>
                            <label className="block mb-1 font-semibold text-sm">Data da Operação (para PDF)</label>
                            <input type="date" value={dataOperacao} onChange={(e) => setDataOperacao(e.target.value)} className="p-2 bg-gray-700 rounded-md"/>
                        </div>
                        {convoys.length > 0 && <button onClick={() => gerarPDF(dataOperacao)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><Download size={18} /><span>Baixar Escala</span></button>}
                    </div>
                </div>
                <div className="space-y-4">{convoys.map(convoy => (<div key={convoy.id} className="bg-gray-800 p-4 rounded-lg"><p className="font-bold text-lg text-blue-400">Comboio - {new Date(convoy.date.seconds * 1000).toLocaleDateString()}</p>
                {/* MUDANÇA 6: Exibição na lista também ajustada */}
                <p><span className="font-semibold">Área:</span> AIS {convoy.ais} - {Array.isArray(convoy.bairros) ? convoy.bairros.join(', ') : convoy.bairro}</p><p><span className="font-semibold">Supervisão:</span> DPC {convoy.dpc} | OIP {convoy.oip}</p><p><span className="font-semibold">Briefing:</span> {convoy.localBriefing}</p><p className="font-semibold mt-2">Equipes:</p><ul className="list-disc list-inside ml-4">{convoy.teamIds.map(tid => { const team = teams.find(t => t.id === tid); return <li key={tid}>{team ? `Chefe ${team.registeringOfficer.nome} (Viatura: ${team.vehicle})` : 'Equipe não encontrada'}</li> })}</ul></div>))}{convoys.length === 0 && <p className="text-gray-400">Nenhum comboio formado.</p>}</div>
            </div>
        </div>
    );
};