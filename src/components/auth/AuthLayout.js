import React from 'react';
import { PCCE_LOGO_URL } from '../../constants/data';


export const AuthLayout = ({ children, title }) => (
    <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <img src={PCCE_LOGO_URL} alt="Brasão PCCE" className="h-24 w-24 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-blue-400">SGO - Sistema de Gestão Operacional</h1>
                <p className="text-lg text-gray-300">Polícia Civil do Estado do Ceará</p>
            </div>
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
                <h2 className="text-2xl font-bold text-center text-white mb-6">{title}</h2>
                {children}
            </div>
        </div>
    </div>
);
