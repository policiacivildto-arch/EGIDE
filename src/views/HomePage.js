import React from 'react';
import { PCCE_LOGO_URL } from '../constants/data';

/**
 * HomePage - Página inicial com seleção de sistema
 * Permite escolher entre dois sistemas: EGIDE e OPERAÇÕES
 * Ambos compartilham o mesmo backend Django
 */
export default function HomePage({ onSelectSystem }) {
    return (
        <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white min-h-screen flex flex-col items-center justify-center p-4">
            {/* Logo e Cabeçalho */}
            <div className="text-center mb-12 animate-fade-in">
                <img 
                    src={PCCE_LOGO_URL} 
                    alt="Brasão PCCE" 
                    className="h-32 w-32 mx-auto mb-6 drop-shadow-2xl"
                />
                <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                    Sistema Integrado PCCE
                </h1>
                <p className="text-xl text-gray-300 mb-2">
                    Gestão Unificada e Eficiente
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full"></div>
            </div>

            {/* Container dos Botões */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full px-4">
                {/* Botão EGIDE */}
                <button
                    onClick={() => onSelectSystem('egide')}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-2xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/50 border-2 border-blue-500/30"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="text-6xl mb-4">🛡️</div>
                        <h2 className="text-4xl font-bold mb-3">EGIDE</h2>
                        <p className="text-blue-200 text-lg">
                            Sistema de Escala e Gestão Integrada de Equipes
                        </p>
                        <div className="mt-6 flex items-center justify-center text-blue-300 group-hover:text-white transition-colors">
                            <span className="mr-2">Acessar</span>
                            <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>
                </button>

                {/* Botão OPERAÇÕES */}
                <button
                    onClick={() => onSelectSystem('operacoes')}
                    className="group relative overflow-hidden bg-gradient-to-br from-cyan-600 to-teal-800 hover:from-cyan-500 hover:to-teal-700 rounded-2xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50 border-2 border-cyan-500/30"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="relative z-10">
                        <div className="text-6xl mb-4">⚙️</div>
                        <h2 className="text-4xl font-bold mb-3">OPERAÇÕES</h2>
                        <p className="text-cyan-200 text-lg">
                            Sistema de Gestão Operacional e Logística
                        </p>
                        <div className="mt-6 flex items-center justify-center text-cyan-300 group-hover:text-white transition-colors">
                            <span className="mr-2">Acessar</span>
                            <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Footer informativo */}
            <div className="mt-16 text-center text-gray-400 text-sm">
                <p>Sistemas integrados compartilhando a mesma base de dados</p>
                <p className="mt-2">Polícia Civil do Estado do Ceará</p>
            </div>
        </div>
    );
}
