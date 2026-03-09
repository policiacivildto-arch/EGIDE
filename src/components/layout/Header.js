import React, { useState } from 'react';
import { PCCE_LOGO_URL } from '../../constants/data';
import { displayMatricula } from '../../utils/helpers';
import { ChevronUp, ChevronDown, KeyRound, LogOut, Home } from 'lucide-react';

export default function Header({ user, setCurrentPage, currentPage, onLogout, onOpenProfileModal, selectedSystem, onBackToHome }) {
    // NOVO: Estado para controlar o menu dropdown
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const systemTitle = selectedSystem === 'egide' ? 'SGO' : selectedSystem === 'operacoes' ? 'OPERAÇÕES' : 'Sistema';

    return (
        <header className="bg-gray-900/80 backdrop-blur-sm shadow-lg p-4 flex justify-between items-center sticky top-0 z-40">
            <div className="flex items-center space-x-4">
                <img src={PCCE_LOGO_URL} alt="Brasão PCCE" className="h-16 w-auto object-contain" />
                <div className="hidden sm:block">
                    <h1 className="text-2xl font-bold text-white">{systemTitle}</h1>
                    <p className="text-sm text-gray-400">Polícia Civil do Estado do Ceará</p>
                </div>
            </div>
            <nav className="flex items-center space-x-2 sm:space-x-4">
                {/* Botão para voltar à seleção de sistemas */}
                {onBackToHome && (
                    <button 
                        onClick={onBackToHome} 
                        className="p-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-1"
                        title="Voltar para seleção de sistemas"
                    >
                        <Home size={20} />
                        <span className="hidden md:inline text-sm">Home</span>
                    </button>
                )}
                
                {user?.role === 'admin' && selectedSystem === 'egide' && (<>
                    <button onClick={() => setCurrentPage('dashboard')} className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${currentPage === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>Painel Policial</button>
                    <button onClick={() => setCurrentPage('admin')} className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${currentPage === 'admin' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>Painel Admin</button>
                </>)}
                
                {/* ALTERADO: Estrutura para o menu dropdown */}
                <div className="relative">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="text-right">
                            <p className="font-semibold text-sm sm:text-base">{user?.nome ? user.nome.split(' ')[0] : user?.username || 'Usuário'}</p>
                            <p className="text-xs text-gray-400 hidden sm:block">{user?.matricula ? `Mat. ${displayMatricula(user.matricula)}` : user?.email || ''}</p>
                        </div>
                        {isMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-md shadow-lg z-50 animate-fade-in-down text-sm">
                            <div className="p-2">
                                <button onClick={() => { onOpenProfileModal('phone'); setIsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-600">
                                    <KeyRound size={16} /><span>Alterar Telefone</span>
                                </button>
                                {/* Adicionar botões para Email e Senha aqui */}
                                <div className="border-t border-gray-600 my-1"></div>
                                <button onClick={onLogout} className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-600 text-red-400">
                                    <LogOut size={16} /><span>Sair</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
} 