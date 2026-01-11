import React, { useState, useEffect } from 'react';
import { 
    Shield, Menu, X, LayoutDashboard, Plus, ClipboardList, CheckCircle, 
    FileText, Target, BarChart
} from 'lucide-react';

// Importar componentes de visualização
import { DashboardView } from './components/DashboardView';
import { NovaDemandaView } from './components/NovaDemandaView';
import { PlanejamentoView } from './components/PlanejamentoView';
import { RelatorioView } from './components/RelatorioView';
import { MeusAlvosView } from './components/MeusAlvosView';
import { EstatisticasView } from './components/EstatisticasView';

/**
 * OperationsDashboard - Dashboard completo do Sistema de OPERAÇÕES (Modularizado)
 * Gerencia todo o ciclo de operações policiais
 */
export default function OperationsDashboard({ userData, showNotification }) {
    // Verificar se é DTO (controle total)
    const isDTO = userData?.role === 'admin';
    const isPolicialOperacional = !isDTO;
    
    const [activeView, setActiveView] = useState(isPolicialOperacional ? 'relatorio' : 'dashboard');
    const [operations, setOperations] = useState([]);
    const [selectedOperation, setSelectedOperation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [stats, setStats] = useState({
        aguardandoAprovacao: 0,
        aprovadas: 0,
        emExecucao: 0,
        concluidas: 0
    });

    // Estado do formulário de nova demanda
    const [formData, setFormData] = useState({
        nome: '',
        orgao_solicitante: '',
        delegacia_responsavel: '',
        data_inicio: '',
        hora_inicio: '08:00',
        hora_fim: '18:00',
        status_dto: 'Aguardando Análise DTO',
        objetivo: '',
        locais_briefing: [''],
        tipo_penal: [],
        tipo_penal_outros: '',
        mandados: { busca_apreensao: 0, prisao_preventiva: 0, prisao_temporaria: 0, sequestro_bens: 0, outros: '' },
        ais: [],
        faccoes: [],
        faccao_outros: '',
        alvos_sensiveis: [],
        alvo_sensivel_outros: '',
        apoio_departamentos: '',
        apoio_operacional_dpc: 0,
        apoio_operacional_oip: 0,
        apoio_cartorario_dpc: 0,
        apoio_cartorario_oip: 0,
        apoio_orgaos: [],
        efetivo_interno_dpc: 0,
        efetivo_interno_oip: 0
    });

    // Estados do Planejamento
    const [selectedOperationId, setSelectedOperationId] = useState(null);
    const [showEquipeForm, setShowEquipeForm] = useState(false);
    const [showAlvoForm, setShowAlvoForm] = useState(false);
    const [showPlanoForm, setShowPlanoForm] = useState(false);
    const [equipeForm, setEquipeForm] = useState({ departamento: '', delegacia: '', chefe: '', membros: [], viatura: '' });
    const [alvoForm, setAlvoForm] = useState({
        nome_operacao: '', nome: '', filiacao: '', cpf: '', rg: '', data_nascimento: '',
        endereco_cumprimento: '', endereco_alvo: '', observacoes_confirmacao: '',
        deslocamento_previsto: '', print_maps_url: '', endereco_pem: 'Instituto José Frota - IJF',
        foto_maps_pem: '', qrcode_pem: '', observacoes_finais: ''
    });
    const [planoForm, setPlanoForm] = useState({
        numeroPlano: '', dataOperacao: '', tipoSolicitacao: 'NUP', delegaciaSolicitante: '',
        departamentoSolicitante: '', mandados: [{ tipo: '', quantidade: 1 }], cidades: '',
        horarioApresentacao: '', localApresentacao: '', departamentosEnvolvidos: '',
        departamentoDemandante: '', diretor: '', diretorDemandante: '', dataEmissao: ''
    });
    
    const [alvos, setAlvos] = useState([]);
    const [equipes, setEquipes] = useState([]);
    const [draggedAlvo, setDraggedAlvo] = useState(null);
    const [selectedOperationRelatorio, setSelectedOperationRelatorio] = useState(null);
    const [showSubstituicaoModal, setShowSubstituicaoModal] = useState(false);
    const [policiaisPresenca, setPoliciaisPresenca] = useState({});
    const [resultadosOperacao, setResultadosOperacao] = useState({});
    const [showResultadosModal, setShowResultadosModal] = useState(false);

    // Identificar equipes e operações do policial
    const equipesDoPolicialAtual = isPolicialOperacional 
        ? equipes.filter(eq => eq.chefe === userData?.nome || (eq.membros && eq.membros.includes(userData?.nome)))
        : equipes;

    const operacoesDoPolicialAtual = isPolicialOperacional
        ? operations.filter(op => equipesDoPolicialAtual.some(eq => eq.operacaoId === op.id))
        : operations;

    const alvosDoPolicialAtual = isPolicialOperacional
        ? alvos.filter(alvo => alvo.equipesVinculadas && alvo.equipesVinculadas.some(eqId => 
            equipesDoPolicialAtual.some(eq => eq.id === eqId)))
        : alvos;

    useEffect(() => {
        loadOperations();
        loadStats();
    }, []);

    const loadOperations = async () => {
        try {
            setLoading(true);
            // Mock temporário
            setOperations([
                { id: 1, nome: 'Operação Cerco', status: 'Aguardando Aprovação', tipo_operacao: 'Com Apoio', data_hora_inicio: '2025-12-20T08:00:00', departamento_solicitante_sigla: 'DRE', total_equipes: 5 },
                { id: 2, nome: 'Operação Fortaleza Segura', status: 'Aprovada pelo DTO', tipo_operacao: 'Interna', data_hora_inicio: '2025-12-18T06:00:00', departamento_solicitante_sigla: 'DHPP', total_equipes: 3 },
                { id: 3, nome: 'Operação Protetor', status: 'Em Execução', tipo_operacao: 'Com Apoio', data_hora_inicio: '2025-12-16T14:00:00', departamento_solicitante_sigla: 'DRE', total_equipes: 8 }
            ]);
        } catch (error) {
            showNotification('Erro ao carregar operações', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = () => {
        setStats({ aguardandoAprovacao: 12, aprovadas: 8, emExecucao: 3, concluidas: 45 });
    };

    const handleSubmitNovaDemanda = (e) => {
        e.preventDefault();
        showNotification('Operação criada com sucesso!', 'success');
        setActiveView('dashboard');
    };

    // Menu lateral
    const MenuItem = ({ icon, label, active, onClick, collapsed, badge }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 hover:bg-gray-800 transition-colors ${active ? 'bg-gray-800 border-l-4 border-cyan-500' : ''}`}
        >
            <div className="flex items-center space-x-3">
                <span className={active ? 'text-cyan-400' : 'text-gray-400'}>{icon}</span>
                {!collapsed && <span className={`${active ? 'text-white font-semibold' : 'text-gray-300'}`}>{label}</span>}
            </div>
            {!collapsed && badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{badge}</span>
            )}
        </button>
    );

    const renderSidebar = () => (
        <div className={`fixed left-0 top-0 h-full bg-gray-900 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                {sidebarOpen && <h2 className="text-lg font-bold text-white">Painel de Controle</h2>}
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <nav className="mt-4">
                {isDTO && (
                    <>
                        <MenuItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!sidebarOpen} />
                        <MenuItem icon={<Plus size={20} />} label="Nova Demanda" active={activeView === 'nova-demanda'} onClick={() => setActiveView('nova-demanda')} collapsed={!sidebarOpen} />
                        {stats.aprovadas > 0 && (
                            <MenuItem icon={<ClipboardList size={20} />} label="Planejamento" active={activeView === 'planejamento'} onClick={() => setActiveView('planejamento')} collapsed={!sidebarOpen} badge={stats.aprovadas} />
                        )}
                        <MenuItem icon={<CheckCircle size={20} />} label="Aprovação" active={activeView === 'aprovacao'} onClick={() => setActiveView('aprovacao')} collapsed={!sidebarOpen} badge={stats.aguardandoAprovacao} />
                    </>
                )}
                <MenuItem icon={<FileText size={20} />} label="Relatório" active={activeView === 'relatorio'} onClick={() => setActiveView('relatorio')} collapsed={!sidebarOpen} />
                {isPolicialOperacional && (
                    <MenuItem icon={<Target size={20} />} label="Meus Alvos" active={activeView === 'meus-alvos'} onClick={() => setActiveView('meus-alvos')} collapsed={!sidebarOpen} />
                )}
                {isDTO && (
                    <MenuItem icon={<BarChart size={20} />} label="Estatísticas" active={activeView === 'estatisticas'} onClick={() => setActiveView('estatisticas')} collapsed={!sidebarOpen} />
                )}
            </nav>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-800">
            {renderSidebar()}

            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-teal-700 p-6 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                                <Shield size={32} />
                                <span>Sistema de OPERAÇÕES</span>
                            </h1>
                            <p className="text-cyan-100 mt-1">
                                {isPolicialOperacional ? 'Modo Operacional - Policial' : 'Gestão Operacional e Logística'}
                            </p>
                        </div>
                        {isDTO && (
                            <div className="bg-white/20 px-4 py-2 rounded-lg">
                                <p className="text-white font-semibold">Modo: DTO</p>
                                <p className="text-cyan-100 text-sm">Controle Total</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="p-6">
                    {isDTO && activeView === 'dashboard' && (
                        <DashboardView 
                            stats={stats} 
                            operations={operations} 
                            setSelectedOperation={setSelectedOperation} 
                            setActiveView={setActiveView} 
                        />
                    )}
                    {isDTO && activeView === 'nova-demanda' && (
                        <NovaDemandaView 
                            formData={formData} 
                            setFormData={setFormData} 
                            handleSubmit={handleSubmitNovaDemanda}
                            showNotification={showNotification}
                        />
                    )}
                    {isDTO && activeView === 'planejamento' && (
                        <PlanejamentoView 
                            operations={operations}
                            selectedOperationId={selectedOperationId}
                            setSelectedOperationId={setSelectedOperationId}
                            stats={stats}
                            showEquipeForm={showEquipeForm}
                            setShowEquipeForm={setShowEquipeForm}
                            showAlvoForm={showAlvoForm}
                            setShowAlvoForm={setShowAlvoForm}
                            showPlanoForm={showPlanoForm}
                            setShowPlanoForm={setShowPlanoForm}
                            equipes={equipes}
                            setEquipes={setEquipes}
                            alvos={alvos}
                            setAlvos={setAlvos}
                            draggedAlvo={draggedAlvo}
                            setDraggedAlvo={setDraggedAlvo}
                            showNotification={showNotification}
                            equipeForm={equipeForm}
                            setEquipeForm={setEquipeForm}
                            alvoForm={alvoForm}
                            setAlvoForm={setAlvoForm}
                            planoForm={planoForm}
                            setPlanoForm={setPlanoForm}
                        />
                    )}
                    {activeView === 'relatorio' && (
                        <RelatorioView 
                            operations={operations}
                            equipes={equipes}
                            isPolicialOperacional={isPolicialOperacional}
                            equipesDoPolicialAtual={equipesDoPolicialAtual}
                            selectedOperationRelatorio={selectedOperationRelatorio}
                            setSelectedOperationRelatorio={setSelectedOperationRelatorio}
                            policiaisPresenca={policiaisPresenca}
                            setPoliciaisPresenca={setPoliciaisPresenca}
                            showNotification={showNotification}
                            setShowSubstituicaoModal={setShowSubstituicaoModal}
                            setShowResultadosModal={setShowResultadosModal}
                            resultadosOperacao={resultadosOperacao}
                            setEquipes={setEquipes}
                            userData={userData}
                        />
                    )}
                    {isPolicialOperacional && activeView === 'meus-alvos' && (
                        <MeusAlvosView 
                            alvosDoPolicialAtual={alvosDoPolicialAtual}
                            equipesDoPolicialAtual={equipesDoPolicialAtual}
                        />
                    )}
                    {isDTO && activeView === 'estatisticas' && (
                        <EstatisticasView 
                            operations={operations}
                            equipes={equipes}
                            alvos={alvos}
                            stats={stats}
                        />
                    )}
                    {isDTO && activeView === 'aprovacao' && (
                        <div className="bg-gray-700 p-6 rounded-lg">
                            <h2 className="text-2xl font-bold text-white mb-6">Aprovação de Operações</h2>
                            <p className="text-gray-400">Sistema em desenvolvimento...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
