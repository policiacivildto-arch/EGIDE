import React, { useState, useEffect } from 'react';
import { 
    Shield, Menu, X, LayoutDashboard, Plus, ClipboardList, CheckCircle, 
    FileText, Target, BarChart, Users
} from 'lucide-react';
import policiaisData from '../../data/policiais.json';

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
    // Verificar tipo de usuário
    const isDTO = userData?.role === 'admin';
    const isDepartamento = userData?.role === 'departamento';
    const isPolicialOperacional = !isDTO && !isDepartamento;
    const userDepartamento = userData?.departamento || '';
    
    // Debug
    console.log('=== OPERATIONS DASHBOARD DEBUG ===');
    console.log('userData:', userData);
    console.log('isDTO:', isDTO);
    console.log('isDepartamento:', isDepartamento);
    console.log('userDepartamento:', userDepartamento);
    
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
        ,
        // Campos para apoio DTO (externo)
        precisa_apoio_dto: false,
        dto_apoio_oip: 0,
        dto_apoio_dpc: 0
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
    
    // Função para buscar policial por matrícula
    const buscarPolicialPorMatricula = (matricula) => {
        if (!matricula || matricula.length < 3) return null;
        const policial = policiaisData.find(p => p.matricula === matricula.trim());
        return policial ? policial.nome : null;
    };
    const [selectedOperationRelatorio, setSelectedOperationRelatorio] = useState(null);
    const [showSubstituicaoModal, setShowSubstituicaoModal] = useState(false);
    const [policiaisPresenca, setPoliciaisPresenca] = useState({});
    const [resultadosOperacao, setResultadosOperacao] = useState(() => {
        // Carregar resultados salvos do localStorage
        const saved = localStorage.getItem('resultadosOperacao');
        return saved ? JSON.parse(saved) : {};
    });
    const [showResultadosModal, setShowResultadosModal] = useState(false);
    const [informacoesAlvos, setInformacoesAlvos] = useState(() => {
        // Carregar informações dos alvos do localStorage
        const saved = localStorage.getItem('informacoesAlvos');
        return saved ? JSON.parse(saved) : {};
    });

    // Salvar resultados no localStorage quando houver mudanças
    useEffect(() => {
        if (Object.keys(resultadosOperacao).length > 0) {
            localStorage.setItem('resultadosOperacao', JSON.stringify(resultadosOperacao));
            console.log('✅ Resultados salvos em tempo real:', resultadosOperacao);
        }
    }, [resultadosOperacao]);

    // Salvar informações dos alvos no localStorage
    useEffect(() => {
        if (Object.keys(informacoesAlvos).length > 0) {
            localStorage.setItem('informacoesAlvos', JSON.stringify(informacoesAlvos));
            console.log('✅ Informações dos alvos salvas:', informacoesAlvos);
        }
    }, [informacoesAlvos]);

    // Identificar equipes e operações do policial
    const nomePolicial = userData?.nome || userData?.displayName || 'Klever Farias Martins';
    const emailPolicial = userData?.email || '';
    
    console.log('🔍 DEBUG - userData:', userData);
    console.log('🔍 DEBUG - nomePolicial:', nomePolicial);
    console.log('🔍 DEBUG - emailPolicial:', emailPolicial);
    console.log('🔍 DEBUG - Todas as equipes:', equipes);
    console.log('🔍 DEBUG - Todos os alvos:', alvos);
    
    const equipesDoPolicialAtual = isPolicialOperacional 
        ? equipes.filter(eq => 
            eq.chefe?.toUpperCase() === nomePolicial?.toUpperCase() || 
            (eq.membros && eq.membros.some(m => m?.toUpperCase() === nomePolicial?.toUpperCase())) ||
            (emailPolicial.toLowerCase() === 'kleverdpc@gmail.com' && eq.chefe?.toUpperCase().includes('KLEVER'))
        )
        : isDepartamento
        ? equipes.filter(eq => eq.departamento === userDepartamento)
        : equipes;

    console.log('🔍 DEBUG - equipesDoPolicialAtual:', equipesDoPolicialAtual);

    // Filtrar operações baseado no tipo de usuário
    const operacoesDoPolicialAtual = isPolicialOperacional
        ? operations.filter(op => equipesDoPolicialAtual.some(eq => eq.operacaoId === op.id))
        : isDepartamento
        ? operations.filter(op => op.departamento === userDepartamento || op.departamento_solicitante === userDepartamento || op.departamento_solicitante_sigla === userDepartamento)
        : operations;

    const alvosDoPolicialAtual = isPolicialOperacional
        ? alvos.filter(alvo => alvo.equipesVinculadas && alvo.equipesVinculadas.some(eqId => 
            equipesDoPolicialAtual.some(eq => eq.id === eqId)))
        : isDepartamento
        ? alvos.filter(alvo => alvo.departamento === userDepartamento)
        : alvos;
    
    console.log('🔍 DEBUG - alvosDoPolicialAtual:', alvosDoPolicialAtual);

    useEffect(() => {
        loadOperations();
        loadStats();
        loadMockData();
    }, []);

    const loadMockData = () => {
        // Adicionar alvos de teste
        setAlvos([
            {
                id: 1,
                operacaoId: 3,
                nome: 'José da Silva Santos',
                vulgo: 'Zé Pequeno',
                cpf: '987.654.321-00',
                foto: null,
                envolvimento: 'Tráfico de Drogas',
                mandado: true,
                numeroInquerito: '001/2025',
                dataFatos: '2025-11-15',
                artigo: 'Art. 33 Lei 11.343/06',
                endereco: 'Rua das Flores, 123',
                bairro: 'Centro',
                cidade: 'Fortaleza',
                referencia: 'Próximo ao mercado central',
                informacoesAdicionais: 'Alvo confirmado pela equipe de inteligência. Alta periculosidade. Líder de facção local.',
                status: 'pendente',
                equipesVinculadas: [1]
            },
            {
                id: 2,
                operacaoId: 3,
                nome: 'Carlos Alberto Mendes',
                vulgo: 'Carlão',
                cpf: '123.456.789-00',
                foto: null,
                envolvimento: 'Roubo',
                mandado: true,
                numeroInquerito: '045/2025',
                dataFatos: '2025-12-01',
                artigo: 'Art. 157 CP',
                endereco: 'Avenida Principal, 456',
                bairro: 'Bairro Industrial',
                cidade: 'Fortaleza',
                referencia: 'Ao lado da oficina mecânica',
                informacoesAdicionais: 'Especializado em roubo de veículos. Possui tatuagem de cobra no braço direito.',
                status: 'pendente',
                equipesVinculadas: [1]
            }
        ]);

        // Adicionar equipe de teste com Klever como líder
        setEquipes([
            {
                id: 1,
                operacaoId: 3,
                departamento: 'DRE',
                delegacia: '1ª Delegacia',
                chefe: 'KLEVER MARTINS FARIAS',
                membros: ['João Pedro Santos', 'Maria Oliveira Silva', 'Pedro Costa Lima'],
                viatura: 'ABC-1234',
                alvosVinculados: [1, 2]
            }
        ]);
    };

    const loadOperations = async () => {
        try {
            setLoading(true);
            // Mock temporário - operações de diferentes departamentos
            setOperations([
                { id: 1, nome: 'Operação Cerco', status: 'Aguardando Aprovação', tipo_operacao: 'Com Apoio', data_hora_inicio: '2025-12-20T08:00:00', departamento_solicitante_sigla: 'DRE', departamento: 'DRE', total_equipes: 5 },
                { id: 2, nome: 'Operação Fortaleza Segura', status: 'Aprovada pelo DTO', tipo_operacao: 'Interna', data_hora_inicio: '2025-12-18T06:00:00', departamento_solicitante_sigla: 'DHPP', departamento: 'DHPP', total_equipes: 3 },
                { id: 3, nome: 'Operação Protetor', status: 'Em Execução', tipo_operacao: 'Com Apoio', data_hora_inicio: '2025-12-16T14:00:00', departamento_solicitante_sigla: 'DRE', departamento: 'DRE', total_equipes: 8 },
                { id: 4, nome: 'Operação Maracanaú Seguro', status: 'Aprovada pelo DTO', tipo_operacao: 'Interna', data_hora_inicio: '2026-01-15T08:00:00', departamento_solicitante_sigla: 'DPM', departamento: 'DPM', total_equipes: 6 },
                { id: 5, nome: 'Operação Cidade Protegida', status: 'Em Execução', tipo_operacao: 'Com Apoio', data_hora_inicio: '2026-01-10T06:00:00', departamento_solicitante_sigla: 'DPM', departamento: 'DPM', total_equipes: 4 }
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

    const handleRegistrarInformacoesAlvo = (dados) => {
        const alvoId = dados.alvoId;
        const novaInformacao = {
            ...dados,
            registradoPor: userData?.nome || userData?.displayName || 'Usuário',
            emailPolicial: userData?.email || ''
        };

        setInformacoesAlvos(prev => ({
            ...prev,
            [alvoId]: [...(prev[alvoId] || []), novaInformacao]
        }));

        console.log('📝 Nova informação registrada para alvo:', alvoId, novaInformacao);
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
                {(isDTO || isDepartamento) && (
                    <>
                        <MenuItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} collapsed={!sidebarOpen} />
                        <MenuItem icon={<Plus size={20} />} label="Nova Demanda" active={activeView === 'nova-demanda'} onClick={() => setActiveView('nova-demanda')} collapsed={!sidebarOpen} />
                        {stats.aprovadas > 0 && (
                            <MenuItem icon={<ClipboardList size={20} />} label="Planejamento" active={activeView === 'planejamento'} onClick={() => setActiveView('planejamento')} collapsed={!sidebarOpen} badge={stats.aprovadas} />
                        )}
                        {isDTO && (
                            <MenuItem icon={<CheckCircle size={20} />} label="Aprovação" active={activeView === 'aprovacao'} onClick={() => setActiveView('aprovacao')} collapsed={!sidebarOpen} badge={stats.aguardandoAprovacao} />
                        )}
                    </>
                )}
                <MenuItem icon={<FileText size={20} />} label="Relatório" active={activeView === 'relatorio'} onClick={() => setActiveView('relatorio')} collapsed={!sidebarOpen} />
                {(isDTO || isDepartamento) && (
                    <MenuItem icon={<Users size={20} />} label="Equipes" active={activeView === 'equipes'} onClick={() => setActiveView('equipes')} collapsed={!sidebarOpen} />
                )}
                {isPolicialOperacional && (
                    <MenuItem icon={<Target size={20} />} label="Meus Alvos" active={activeView === 'meus-alvos'} onClick={() => setActiveView('meus-alvos')} collapsed={!sidebarOpen} />
                )}
                {(isDTO || isDepartamento) && (
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
                                {isPolicialOperacional 
                                    ? 'Modo Operacional - Policial' 
                                    : isDepartamento 
                                    ? `Gestão Departamental - ${userDepartamento}`
                                    : 'Gestão Operacional e Logística'}
                            </p>
                        </div>
                        {isDTO && (
                            <div className="bg-white/20 px-4 py-2 rounded-lg">
                                <p className="text-white font-semibold">Modo: DTO</p>
                                <p className="text-cyan-100 text-sm">Controle Total</p>
                            </div>
                        )}
                        {isDepartamento && (
                            <div className="bg-white/20 px-4 py-2 rounded-lg">
                                <p className="text-white font-semibold">{userDepartamento}</p>
                                <p className="text-cyan-100 text-sm">Departamento</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="p-6">
                    {(isDTO || isDepartamento) && activeView === 'dashboard' && (
                        <DashboardView 
                            stats={stats} 
                            operations={operacoesDoPolicialAtual} 
                            setSelectedOperation={setSelectedOperation} 
                            setActiveView={setActiveView} 
                        />
                    )}
                    {(isDTO || isDepartamento) && activeView === 'nova-demanda' && (
                        <NovaDemandaView 
                            formData={formData} 
                            setFormData={setFormData} 
                            handleSubmit={handleSubmitNovaDemanda}
                            showNotification={showNotification}
                            userDepartamento={userDepartamento}
                        />
                    )}
                    {(isDTO || isDepartamento) && activeView === 'planejamento' && (
                        <PlanejamentoView 
                            operations={operacoesDoPolicialAtual}
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
                            setOperacoes={setOperations}
                            operacoes={operations}
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
                            showNotification={showNotification}
                            onRegistrarInformacoes={handleRegistrarInformacoesAlvo}
                        />
                    )}
                    {(isDTO || isDepartamento) && activeView === 'estatisticas' && (
                        <EstatisticasView 
                            operations={operacoesDoPolicialAtual}
                            equipes={equipesDoPolicialAtual}
                            alvos={alvosDoPolicialAtual}
                            stats={stats}
                        />
                    )}
                    {(isDTO || isDepartamento) && activeView === 'equipes' && (
                        <div className="bg-gray-700 p-6 rounded-lg">
                            <h2 className="text-2xl font-bold text-white mb-6">
                                {isDTO ? 'Solicitação de Equipes' : 'Minhas Solicitações de Equipes'}
                            </h2>
                            
                            {/* DTO: Criar Solicitação */}
                            {isDTO && (
                                <div className="mb-8 bg-gray-800 p-6 rounded-lg border border-cyan-500">
                                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Nova Solicitação</h3>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target);
                                        const novaSolicitacao = {
                                            id: Date.now(),
                                            operacaoId: formData.get('operacao'),
                                            operacaoNome: operations.find(op => op.id === parseInt(formData.get('operacao')))?.nome,
                                            departamentoDestino: formData.get('departamento'),
                                            quantidadeEquipes: parseInt(formData.get('quantidade')),
                                            status: 'Pendente',
                                            dataEnvio: new Date().toISOString(),
                                            equipesAlocadas: []
                                        };
                                        
                                        // Salvar no localStorage
                                        const solicitacoes = JSON.parse(localStorage.getItem('solicitacoesEquipes') || '[]');
                                        solicitacoes.push(novaSolicitacao);
                                        localStorage.setItem('solicitacoesEquipes', JSON.stringify(solicitacoes));
                                        
                                        showNotification(`Solicitação enviada para ${formData.get('departamento')}!`, 'success');
                                        e.target.reset();
                                        window.location.reload();
                                    }}>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Operação</label>
                                                <select name="operacao" required className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500">
                                                    <option value="">Selecione...</option>
                                                    {operations.filter(op => op.status === 'Aprovada pelo DTO').map(op => (
                                                        <option key={op.id} value={op.id}>{op.nome}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Departamento</label>
                                                <select name="departamento" required className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500">
                                                    <option value="">Selecione...</option>
                                                    <option value="DHPP">DHPP</option>
                                                    <option value="DPM">DPM</option>
                                                    <option value="DRE">DRE</option>
                                                    <option value="DRFR">DRFR</option>
                                                    <option value="DCIP">DCIP</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Qtd. Equipes</label>
                                                <input type="number" name="quantidade" min="1" required className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500" />
                                            </div>
                                        </div>
                                        <button type="submit" className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg">
                                            Enviar Solicitação
                                        </button>
                                    </form>
                                </div>
                            )}
                            
                            {/* Lista de Solicitações */}
                            <div className="space-y-4">
                                {(() => {
                                    const todasSolicitacoes = JSON.parse(localStorage.getItem('solicitacoesEquipes') || '[]');
                                    const solicitacoesFiltradas = isDepartamento 
                                        ? todasSolicitacoes.filter(s => s.departamentoDestino === userDepartamento)
                                        : todasSolicitacoes;
                                    
                                    if (solicitacoesFiltradas.length === 0) {
                                        return (
                                            <div className="text-center py-12">
                                                <p className="text-gray-400 text-lg">
                                                    {isDepartamento ? 'Nenhuma solicitação recebida' : 'Nenhuma solicitação enviada'}
                                                </p>
                                            </div>
                                        );
                                    }
                                    
                                    return solicitacoesFiltradas.map((solicitacao) => (
                                        <div key={solicitacao.id} className="bg-gray-800 p-5 rounded-lg border-l-4 border-cyan-500">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{solicitacao.operacaoNome}</h3>
                                                    <p className="text-sm text-gray-400">
                                                        Para: <span className="font-semibold text-cyan-400">{solicitacao.departamentoDestino}</span>
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    solicitacao.status === 'Completa' ? 'bg-green-600 text-white' :
                                                    solicitacao.status === 'Parcial' ? 'bg-yellow-600 text-white' :
                                                    'bg-orange-600 text-white'
                                                }`}>
                                                    {solicitacao.status}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Equipes Solicitadas</p>
                                                    <p className="text-2xl font-bold text-white">{solicitacao.quantidadeEquipes}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Equipes Alocadas</p>
                                                    <p className="text-2xl font-bold text-cyan-400">{solicitacao.equipesAlocadas.length}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Departamento: Alocar Equipes */}
                                            {isDepartamento && solicitacao.equipesAlocadas.length < solicitacao.quantidadeEquipes && (
                                                <form onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.target);
                                                    
                                                    // Coletar dados dos policiais
                                                    const policiais = [];
                                                    let lider = null;
                                                    
                                                    for (let i = 1; i <= 4; i++) {
                                                        const matricula = formData.get(`policial${i}_matricula`);
                                                        const nome = formData.get(`policial${i}_nome`);
                                                        
                                                        if (matricula && nome) {
                                                            const policial = {
                                                                matricula,
                                                                nome,
                                                                isLider: formData.get(`policial${i}_lider`) === 'on'
                                                            };
                                                            
                                                            if (policial.isLider) lider = nome;
                                                            policiais.push(policial);
                                                        }
                                                    }
                                                    
                                                    const novaEquipe = {
                                                        id: Date.now(),
                                                        departamento: formData.get('departamento'),
                                                        delegacia: formData.get('delegacia'),
                                                        chefe: lider || policiais[0]?.nome,
                                                        viatura: formData.get('viatura'),
                                                        membros: policiais.map(p => p.nome),
                                                        policiais: policiais,
                                                        operacaoId: solicitacao.operacaoId
                                                    };
                                                    
                                                    // Atualizar solicitação
                                                    const solicitacoes = JSON.parse(localStorage.getItem('solicitacoesEquipes') || '[]');
                                                    const index = solicitacoes.findIndex(s => s.id === solicitacao.id);
                                                    solicitacoes[index].equipesAlocadas.push(novaEquipe);
                                                    
                                                    // Atualizar status
                                                    if (solicitacoes[index].equipesAlocadas.length >= solicitacoes[index].quantidadeEquipes) {
                                                        solicitacoes[index].status = 'Completa';
                                                    } else {
                                                        solicitacoes[index].status = 'Parcial';
                                                    }
                                                    
                                                    localStorage.setItem('solicitacoesEquipes', JSON.stringify(solicitacoes));
                                                    
                                                    // Adicionar às equipes gerais
                                                    const equipesAtuais = equipes;
                                                    equipesAtuais.push(novaEquipe);
                                                    setEquipes(equipesAtuais);
                                                    
                                                    showNotification('Equipe alocada com sucesso!', 'success');
                                                    window.location.reload();
                                                }} className="bg-gray-700 p-6 rounded border border-cyan-500 mt-4">
                                                    <h4 className="font-bold text-white mb-1 text-lg flex items-center">
                                                        🚔 Equipes Operacionais
                                                    </h4>
                                                    <p className="text-sm text-gray-400 mb-4">Efetivo de 3 a 4 policiais</p>
                                                    
                                                    {/* Dados da Equipe */}
                                                    <div className="bg-gray-800 p-4 rounded mb-4">
                                                        <h5 className="font-bold text-cyan-400 mb-3">Dados da Equipe</h5>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                                                    Departamento <span className="text-red-500">*</span>
                                                                </label>
                                                                <input 
                                                                    type="text" 
                                                                    name="departamento" 
                                                                    value={userDepartamento}
                                                                    readOnly
                                                                    className="w-full bg-gray-900 text-gray-400 rounded px-3 py-2 border border-gray-600"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                                                    Delegacia/Unidade <span className="text-red-500">*</span>
                                                                </label>
                                                                <select 
                                                                    name="delegacia" 
                                                                    required
                                                                    className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                                                >
                                                                    <option value="">Selecione a delegacia</option>
                                                                    <option value="1ª Delegacia de Polícia Civil de Caucaia">1ª Delegacia de Polícia Civil de Caucaia</option>
                                                                    <option value="1ª Delegacia de Polícia Civil de Maracanaú">1ª Delegacia de Polícia Civil de Maracanaú</option>
                                                                    <option value="1ª Delegacia de Polícia Civil de Pacatuba">1ª Delegacia de Polícia Civil de Pacatuba</option>
                                                                    <option value="1ª Seccional da Região Metropolitana">1ª Seccional da Região Metropolitana</option>
                                                                    <option value="2ª Delegacia de Polícia Civil de Caucaia">2ª Delegacia de Polícia Civil de Caucaia</option>
                                                                    <option value="2ª Delegacia de Polícia Civil de Maracanaú">2ª Delegacia de Polícia Civil de Maracanaú</option>
                                                                    <option value="2ª Delegacia de Polícia Civil de Pacatuba">2ª Delegacia de Polícia Civil de Pacatuba</option>
                                                                    <option value="2ª Seccional da Região Metropolitana">2ª Seccional da Região Metropolitana</option>
                                                                    <option value="3ª Delegacia de Polícia Civil de Caucaia">3ª Delegacia de Polícia Civil de Caucaia</option>
                                                                    <option value="3ª Delegacia de Polícia Civil de Maracanaú">3ª Delegacia de Polícia Civil de Maracanaú</option>
                                                                    <option value="3ª Seccional da Região Metropolitana">3ª Seccional da Região Metropolitana</option>
                                                                    <option value="4ª Delegacia de Polícia Civil de Caucaia">4ª Delegacia de Polícia Civil de Caucaia</option>
                                                                    <option value="4ª Delegacia de Polícia Civil de Maracanaú">4ª Delegacia de Polícia Civil de Maracanaú</option>
                                                                    <option value="4ª Seccional da Região Metropolitana">4ª Seccional da Região Metropolitana</option>
                                                                    <option value="5ª Delegacia de Polícia Civil de Caucaia">5ª Delegacia de Polícia Civil de Caucaia</option>
                                                                    <option value="5ª Delegacia de Polícia Civil de Maracanaú">5ª Delegacia de Polícia Civil de Maracanaú</option>
                                                                    <option value="5ª Seccional da Região Metropolitana">5ª Seccional da Região Metropolitana</option>
                                                                    <option value="6ª Delegacia de Polícia Civil de Maracanaú">6ª Delegacia de Polícia Civil de Maracanaú</option>
                                                                    <option value="6ª Seccional da Região Metropolitana">6ª Seccional da Região Metropolitana</option>
                                                                    <option value="Delegacia de Polícia Civil de Aquiraz">Delegacia de Polícia Civil de Aquiraz</option>
                                                                    <option value="Delegacia de Polícia Civil de Cascavel">Delegacia de Polícia Civil de Cascavel</option>
                                                                    <option value="Delegacia de Polícia Civil de Chorozinho">Delegacia de Polícia Civil de Chorozinho</option>
                                                                    <option value="Delegacia de Polícia Civil de Eusébio">Delegacia de Polícia Civil de Eusébio</option>
                                                                    <option value="Delegacia de Polícia Civil de Guaiúba">Delegacia de Polícia Civil de Guaiúba</option>
                                                                    <option value="Delegacia de Polícia Civil de Horizonte">Delegacia de Polícia Civil de Horizonte</option>
                                                                    <option value="Delegacia de Polícia Civil de Itaitinga">Delegacia de Polícia Civil de Itaitinga</option>
                                                                    <option value="Delegacia de Polícia Civil de Maranguape">Delegacia de Polícia Civil de Maranguape</option>
                                                                    <option value="Delegacia de Polícia Civil de Pacajus">Delegacia de Polícia Civil de Pacajus</option>
                                                                    <option value="Delegacia de Polícia Civil de Paracuru">Delegacia de Polícia Civil de Paracuru</option>
                                                                    <option value="Delegacia de Polícia Civil de Paraipaba">Delegacia de Polícia Civil de Paraipaba</option>
                                                                    <option value="Delegacia de Polícia Civil de Pindoretama">Delegacia de Polícia Civil de Pindoretama</option>
                                                                    <option value="Delegacia de Polícia Civil de São Gonçalo do Amarante">Delegacia de Polícia Civil de São Gonçalo do Amarante</option>
                                                                    <option value="Delegacia de Polícia Civil de Trairí">Delegacia de Polícia Civil de Trairí</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3">
                                                            <label className="block text-sm font-semibold text-gray-300 mb-2">Placa da Viatura</label>
                                                            <input 
                                                                type="text" 
                                                                name="viatura" 
                                                                placeholder="ABC-1234"
                                                                required
                                                                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-600"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Policiais */}
                                                    <div className="bg-gray-800 p-4 rounded">
                                                        <h5 className="font-bold text-cyan-400 mb-3 flex items-center">
                                                            👮 OIP - Oficiais de Investigação Policial
                                                        </h5>
                                                        
                                                        {[1, 2, 3, 4].map(num => (
                                                            <div key={num} className="mb-4 pb-4 border-b border-gray-700 last:border-0">
                                                                <p className="text-sm font-semibold text-gray-300 mb-2">
                                                                    Policial {num} {num <= 3 && <span className="text-red-500">*</span>}
                                                                    {num === 4 && <span className="text-gray-500 text-xs ml-2">(Opcional)</span>}
                                                                </p>
                                                                <div className="grid grid-cols-12 gap-3">
                                                                    <div className="col-span-2 flex items-center">
                                                                        <label className="flex items-center space-x-2 cursor-pointer">
                                                                            <input 
                                                                                type="checkbox" 
                                                                                name={`policial${num}_lider`}
                                                                                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                                                            />
                                                                            <span className="text-sm text-gray-400">Líder</span>
                                                                        </label>
                                                                    </div>
                                                                    <div className="col-span-4">
                                                                        <input 
                                                                            type="text" 
                                                                            name={`policial${num}_matricula`}
                                                                            placeholder="Matrícula"
                                                                            required={num <= 3}
                                                                            onChange={(e) => {
                                                                                const matricula = e.target.value;
                                                                                const nome = buscarPolicialPorMatricula(matricula);
                                                                                if (nome) {
                                                                                    const nomeInput = document.querySelector(`input[name="policial${num}_nome"]`);
                                                                                    if (nomeInput) {
                                                                                        nomeInput.value = nome;
                                                                                        nomeInput.classList.add('border-green-500', 'bg-green-900/20');
                                                                                    }
                                                                                } else {
                                                                                    const nomeInput = document.querySelector(`input[name="policial${num}_nome"]`);
                                                                                    if (nomeInput && matricula.length > 0) {
                                                                                        nomeInput.classList.remove('border-green-500', 'bg-green-900/20');
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="w-full bg-gray-900 text-white rounded px-3 py-2 text-sm border border-gray-600"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-6">
                                                                        <input 
                                                                            type="text" 
                                                                            name={`policial${num}_nome`}
                                                                            placeholder="Nome completo do policial"
                                                                            required={num <= 3}
                                                                            readOnly
                                                                            className="w-full bg-gray-900 text-white rounded px-3 py-2 text-sm border border-gray-600 cursor-not-allowed"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    <button type="submit" className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg transition-colors">
                                                        ✓ Adicionar Equipe à Operação
                                                    </button>
                                                </form>
                                            )}
                                            
                                            {/* Mostrar Equipes Alocadas */}
                                            {solicitacao.equipesAlocadas.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <p className="text-sm font-bold text-gray-300">Equipes Alocadas:</p>
                                                    {solicitacao.equipesAlocadas.map((eq, idx) => (
                                                        <div key={idx} className="bg-gray-900 p-3 rounded">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="text-white font-semibold">{eq.chefe}</p>
                                                                    <p className="text-xs text-gray-400">{eq.delegacia} • {eq.viatura}</p>
                                                                </div>
                                                                {eq.membros.length > 0 && (
                                                                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                                                                        +{eq.membros.length} membros
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                    {isDTO && activeView === 'aprovacao' && (
                        <div className="bg-gray-700 p-6 rounded-lg">
                            <h2 className="text-2xl font-bold text-white mb-6">Aprovação de Operações</h2>
                            <p className="text-gray-400">Sistema em desenvolvimento...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Substituição */}
            {showSubstituicaoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Substituir Policial</h3>
                        <p className="text-gray-300 mb-4">
                            Substituindo: <strong>{showSubstituicaoModal.policial}</strong>
                        </p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const novoPolicial = e.target.novoPolicial.value;
                            
                            // Atualizar equipe
                            const equipesAtualizadas = equipes.map(eq => {
                                if (eq.id === showSubstituicaoModal.equipeId) {
                                    if (eq.chefe === showSubstituicaoModal.policial) {
                                        return { ...eq, chefe: novoPolicial };
                                    } else {
                                        return {
                                            ...eq,
                                            membros: eq.membros.map(m => 
                                                m === showSubstituicaoModal.policial ? novoPolicial : m
                                            )
                                        };
                                    }
                                }
                                return eq;
                            });
                            setEquipes(equipesAtualizadas);
                            
                            showNotification(`Policial substituído: ${showSubstituicaoModal.policial} → ${novoPolicial}`, 'success');
                            setShowSubstituicaoModal(false);
                        }}>
                            <input
                                type="text"
                                name="novoPolicial"
                                required
                                placeholder="Nome do novo policial"
                                className="w-full bg-gray-700 text-white rounded px-4 py-2 border border-gray-500 mb-4"
                            />
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSubstituicaoModal(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded text-white"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 py-2 rounded text-white"
                                >
                                    Confirmar Substituição
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Resultados da Operação em Tempo Real */}
            {showResultadosModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full my-8">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                            <CheckCircle size={28} className="text-green-400" />
                            <span>Registrar Resultados da Operação - Tempo Real</span>
                        </h3>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            
                            const resultados = {
                                operacaoId: selectedOperationRelatorio,
                                mpCumpridos: parseInt(formData.get('mpCumpridos') || 0),
                                mpDiligenciados: parseInt(formData.get('mpDiligenciados') || 0),
                                flagrante: parseInt(formData.get('flagrante') || 0),
                                buscaCumpridos: parseInt(formData.get('buscaCumpridos') || 0),
                                mbaDiligenciados: parseInt(formData.get('mbaDiligenciados') || 0),
                                qtdCelular: parseInt(formData.get('qtdCelular') || 0),
                                qtdVeiculo: parseInt(formData.get('qtdVeiculo') || 0),
                                qtdMunicoes: parseInt(formData.get('qtdMunicoes') || 0),
                                qtdArma: parseInt(formData.get('qtdArma') || 0),
                                dinheiro: parseFloat(formData.get('dinheiro') || 0),
                                medidasCautelares: parseInt(formData.get('medidasCautelares') || 0),
                                droga: formData.get('droga') || '',
                                observacoes: formData.get('observacoes') || '',
                                timestamp: new Date().toISOString()
                            };
                            
                            setResultadosOperacao({
                                ...resultadosOperacao,
                                [selectedOperationRelatorio]: resultados
                            });
                            
                            setShowResultadosModal(false);
                            showNotification('Resultados salvos com sucesso em tempo real!', 'success');
                        }}>
                            {/* Mandados e Prisões */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-cyan-400 mb-4">Mandados e Prisões</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            MP Cumpridos
                                        </label>
                                        <input
                                            type="number"
                                            name="mpCumpridos"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.mpCumpridos || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            MP Diligenciados
                                        </label>
                                        <input
                                            type="number"
                                            name="mpDiligenciados"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.mpDiligenciados || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Flagrante
                                        </label>
                                        <input
                                            type="number"
                                            name="flagrante"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.flagrante || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Busca Cumpridos
                                        </label>
                                        <input
                                            type="number"
                                            name="buscaCumpridos"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.buscaCumpridos || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            MBA Diligenciados
                                        </label>
                                        <input
                                            type="number"
                                            name="mbaDiligenciados"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.mbaDiligenciados || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Medidas Cautelares
                                        </label>
                                        <input
                                            type="number"
                                            name="medidasCautelares"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.medidasCautelares || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Apreensões */}
                            <div className="mb-6">
                                <h4 className="text-lg font-semibold text-cyan-400 mb-4">Apreensões</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Quantidade de Celulares
                                        </label>
                                        <input
                                            type="number"
                                            name="qtdCelular"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.qtdCelular || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Quantidade de Veículos
                                        </label>
                                        <input
                                            type="number"
                                            name="qtdVeiculo"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.qtdVeiculo || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Quantidade de Munições
                                        </label>
                                        <input
                                            type="number"
                                            name="qtdMunicoes"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.qtdMunicoes || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Quantidade de Armas
                                        </label>
                                        <input
                                            type="number"
                                            name="qtdArma"
                                            min="0"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.qtdArma || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Dinheiro (R$)
                                        </label>
                                        <input
                                            type="number"
                                            name="dinheiro"
                                            min="0"
                                            step="0.01"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.dinheiro || 0}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Droga
                                        </label>
                                        <input
                                            type="text"
                                            name="droga"
                                            placeholder="Ex: 5kg cocaína, 2kg maconha"
                                            defaultValue={resultadosOperacao[selectedOperationRelatorio]?.droga || ''}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Observações da Diligência (Tempo Real)
                                </label>
                                <textarea
                                    name="observacoes"
                                    rows="4"
                                    placeholder="Descreva os detalhes da diligência em tempo real..."
                                    defaultValue={resultadosOperacao[selectedOperationRelatorio]?.observacoes || ''}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            {/* Botões */}
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white font-semibold"
                                >
                                    💾 Salvar Resultados em Tempo Real
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowResultadosModal(false)}
                                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-white"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
