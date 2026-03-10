
import React, { useState, useEffect, useMemo } from 'react';
import { getCycleInfo } from '../../../utils/helpers';
import { LoadingSpinner } from '../../../components/ui/Shared';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
    
 export  const ReportsDashboardView = ({ showNotification, departamento }) => {
     const [cycle, setCycle] = useState(getCycleInfo());
     const [reports, setReports] = useState([]);
     const [loading, setLoading] = useState(false);
 
     useEffect(() => {
         // Temporariamente desabilitado - migração para Django em andamento
         setLoading(false);
         setReports([]);
         
         /* TODO: Implementar busca de relatórios via Django API
         setLoading(true);
         const loadReports = async () => {
             try {
                 const data = await apiClient.getReports({ 
                     cycle_id: cycle.cycleId,
                     departamento: departamento 
                 });
                 setReports(Array.isArray(data) ? data : []);
             } catch (error) {
                 console.error('Erro ao carregar relatórios:', error);
                 setReports([]);
             } finally {
                 setLoading(false);
             }
         };
         loadReports();
         */
     }, [cycle, departamento]);
 
     const goToPreviousCycle = () => {
         const [year, month] = cycle.cycleId.split('-').map(Number);
         let prevYear = year;
         let prevMonth = month - 1;
         if (prevMonth < 1) {
             prevMonth = 12;
             prevYear = year - 1;
         }
         const prevCycleId = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
         setCycle({ cycleId: prevCycleId });
     };
 
     const goToNextCycle = () => {
         const [year, month] = cycle.cycleId.split('-').map(Number);
         let nextYear = year;
         let nextMonth = month + 1;
         if (nextMonth > 12) {
             nextMonth = 1;
             nextYear = year + 1;
         }
         const nextCycleId = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
         const today = new Date();
         const currentCalendarCycleId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
         if (nextCycleId > currentCalendarCycleId) {
             showNotification("Não é possível visualizar ciclos futuros.", "info");
             return;
         }
         setCycle({ cycleId: nextCycleId });
     };
 
     // ALTERADO: Lógica para gerar o título e o intervalo de datas do ciclo
     const cycleDisplay = useMemo(() => {
         if (!cycle.cycleId) return { title: '', range: '' };
 
         const [year, month] = cycle.cycleId.split('-').map(Number);
         
         // O ciclo termina no dia 20 do mês/ano do cycleId
         const endDate = new Date(year, month - 1, 20);
         // O ciclo começa no dia 21 do mês anterior
         const startDate = new Date(year, month - 2, 21);
         
         const title = `Ciclo ${month}`;
         // Formata as strings para um visual mais limpo
         const startStr = `${startDate.toLocaleDateString('pt-BR', { day: '2-digit' })} de ${startDate.toLocaleDateString('pt-BR', { month: 'long' })}`;
         const endStr = `${endDate.toLocaleDateString('pt-BR', { day: '2-digit' })} de ${endDate.toLocaleDateString('pt-BR', { month: 'long' })}`;
 
         return { title, range: `${startStr} a ${endStr}` };
     }, [cycle]);
 
     const stats = useMemo(() => {
         const initialStats = {
             pessoasAbordadas: 0, veiculosAbordados: 0,
             armasApreendidas: 0, municoesApreendidas: 0, drogasApreendidas: 0,
             celularesApreendidos: 0, veiculosApreendidos: 0,
             prisoesPorTipo: {}, totalPrisoes: 0,
             totalBoc: 0, totalTco: 0, totalApf: 0,
             totalOperations: reports.length || 0,
         };
         return reports.reduce((acc, report) => {
             acc.pessoasAbordadas += report.abordagens?.pessoas || 0;
             acc.veiculosAbordados += report.abordagens?.veiculos || 0;
             acc.totalBoc += report.procedimentos?.boc || 0;
             acc.totalTco += report.procedimentos?.tco || 0;
             acc.totalApf += report.procedimentos?.apf || 0;
             if (Array.isArray(report.prisoes)) {
                 report.prisoes.forEach(p => {
                     const qtd = Number(p.quantidade) || 0;
                     acc.prisoesPorTipo[p.tipo] = (acc.prisoesPorTipo[p.tipo] || 0) + qtd;
                     acc.totalPrisoes += qtd;
                 });
             }
             if (report.apreensoes) {
                 acc.armasApreendidas += report.apreensoes.armas?.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0) || 0;
                 acc.municoesApreendidas += report.apreensoes.municoes?.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0) || 0;
                 acc.drogasApreendidas += report.apreensoes.drogas?.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0) || 0;
                 acc.celularesApreendidos += report.apreensoes.celulares || 0;
                 acc.veiculosApreendidos += report.apreensoes.veiculos || 0;
             }
             return acc;
         }, initialStats);
     }, [reports]);
     
     const exportDashboardToXLSX = () => {
         if (reports.length === 0) {
             showNotification("Não há dados para exportar neste ciclo.", "warning");
             return;
         }
         const dataForSheet = [
             { Indicador: "Ciclo de Referência", Valor: cycleDisplay.title },
             { Indicador: "Período", Valor: cycleDisplay.range },
             { Indicador: "Operações Realizadas", Valor: stats.totalOperations },
             { Indicador: "Pessoas Abordadas", Valor: stats.pessoasAbordadas },
             { Indicador: "Veículos Abordados", Valor: stats.veiculosAbordados },
             { Indicador: "Total de Prisões / Capturas", Valor: stats.totalPrisoes },
         ];
         Object.entries(stats.prisoesPorTipo).forEach(([tipo, quantidade]) => {
             dataForSheet.push({ Indicador: `   - Prisões (${tipo})`, Valor: quantidade });
         });
         dataForSheet.push(
             { Indicador: "Armas Apreendidas", Valor: stats.armasApreendidas },
             { Indicador: "Munições Apreendidas", Valor: stats.municoesApreendidas },
             { Indicador: "Veículos Apreendidos/Recuperados", Valor: stats.veiculosApreendidos },
             { Indicador: "Celulares Apreendidos/Recuperados", Valor: stats.celularesApreendidos },
             { Indicador: "BOCs Registrados", Valor: stats.totalBoc },
             { Indicador: "TCOs Registrados", Valor: stats.totalTco },
             { Indicador: "APFs Registrados", Valor: stats.totalApf }
         );
         const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
         worksheet["!cols"] = [{ wch: 40 }, { wch: 30 }];
         const workbook = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(workbook, worksheet, `Dashboard ${cycle.cycleId}`);
         XLSX.writeFile(workbook, `Dashboard_EGIDE_${cycle.cycleId}.xlsx`);
         showNotification("Relatório exportado com sucesso!", "success");
     };
 
     const abordagensChartData = useMemo(() => {
     // Garante que stats e suas propriedades existam antes de usar
     const labels = ['Pessoas Abordadas', 'Veículos Abordados'];
     const data = [
         stats.pessoasAbordadas || 0, // Usar || 0 para garantir que é um número
         stats.veiculosAbordados || 0
     ];
 
     return {
         labels: labels,
         datasets: [{
             label: 'Abordagens',
             data: data,
             backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
             borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
             borderWidth: 1,
         }],
     };
 }, [stats]); // stats como dependência
 
 const prisoesChartData = useMemo(() => {
     // Garante que stats e suas propriedades existam antes de usar
     const labels = Object.keys(stats.prisoesPorTipo || {}); // Use || {} para garantir um objeto vazio se undefined
     const data = Object.values(stats.prisoesPorTipo || {}); // Use || {} para garantir um objeto vazio se undefined
 
     return {
         labels: labels,
         datasets: [{
             label: 'Total de Prisões por Tipo',
             data: data,
             backgroundColor: [
                 'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
                 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'
             ],
             borderColor: [
                 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)',
                 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'
             ],
             borderWidth: 1,
         }],
     };
 }, [stats]);
 
     if (loading) return <LoadingSpinner />;
 
     return (
         <div>
             {/* ALTERADO: Estrutura do cabeçalho para acomodar o novo título */}
             <div className="flex justify-between items-center mb-6">
                 <div className="text-left">
                     <h3 className="text-2xl font-bold capitalize text-white">{cycleDisplay.title}</h3>
                     <p className="text-sm text-gray-400">{cycleDisplay.range}</p>
                 </div>
                 
                 <div className="flex items-center space-x-4">
                     <div className="flex items-center bg-gray-800 p-1 rounded-lg">
                         <button onClick={goToPreviousCycle} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Ciclo Anterior">
                             <ChevronLeft size={24} />
                         </button>
                         <button onClick={goToNextCycle} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Ciclo Seguinte">
                             <ChevronRight size={24} />
                         </button>
                     </div>
                     {reports.length > 0 && (
                         <button onClick={exportDashboardToXLSX} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                             <Download size={18} /><span>Exportar XLSX</span>
                         </button>
                     )}
                 </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-blue-400">{stats.totalOperations}</p><p className="text-sm text-gray-400">Operações Realizadas</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-blue-400">{stats.pessoasAbordadas}</p><p className="text-sm text-gray-400">Pessoas Abordadas</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-blue-400">{stats.veiculosAbordados}</p><p className="text-sm text-gray-400">Veículos Abordados</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-green-400">{stats.totalPrisoes}</p><p className="text-sm text-gray-400">Total de Prisões</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-yellow-400">{stats.armasApreendidas}</p><p className="text-sm text-gray-400">Armas Apreendidas</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-yellow-400">{stats.municoesApreendidas}</p><p className="text-sm text-gray-400">Munições Apreendidas</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-red-400">{stats.veiculosApreendidos}</p><p className="text-sm text-gray-400">Veículos Apreendidos</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-red-400">{stats.celularesApreendidos}</p><p className="text-sm text-gray-400">Celulares Apreendidos</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-gray-300">{stats.totalBoc}</p><p className="text-sm text-gray-400">BOCs Registrados</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-gray-300">{stats.totalTco}</p><p className="text-sm text-gray-400">TCOs Registrados</p></div>
                 <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-gray-300">{stats.totalApf}</p><p className="text-sm text-gray-400">APFs Registrados</p></div>
             </div>
 
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                 <div className="bg-gray-800 p-6 rounded-lg">
                     <h4 className="text-lg font-bold text-center mb-4">Distribuição de Abordagens</h4>
                     {stats.pessoasAbordadas > 0 || stats.veiculosAbordados > 0 ? (
                        <div style={{ position: 'relative', height: '300px' }}>
                          <Pie data={abordagensChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                     ) : <p className='text-center text-gray-500'>Sem dados de abordagens para este ciclo.</p>}
                 </div>
                 <div className="bg-gray-800 p-6 rounded-lg">
                     <h4 className="text-lg font-bold text-center mb-4">Tipos de Prisão</h4>
                      {stats.totalPrisoes > 0 ? (
                          <div style={{ position: 'relative', height: '300px' }}>
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={prisoesChartData} />
                          </div>
                       ) : <p className='text-center text-gray-500'>Sem dados de prisões para este ciclo.</p>}
                 </div>
             </div>
         </div>
     );
 };