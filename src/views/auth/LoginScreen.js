import React, { useState } from 'react';

import { apiClient } from '../../config/api'; // Substituiu Firebase
import { AuthLayout, LoadingSpinner } from '../../App';
import { LogIn } from 'lucide-react';

    
 export const LoginScreen = ({ showNotification, setAuthScreen, onLoginSuccess }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(''); // Limpa erro anterior
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            setLoginError("Por favor, preencha o email e a senha.");
            return;
        }
        setIsLoading(true);
        try {
            const { access, refresh } = await apiClient.login(trimmedEmail, password);
            // Salva o token JWT e refresh token
            apiClient.setToken(access);
            if (refresh) {
                localStorage.setItem('refresh_token', refresh);
            }
            if (typeof onLoginSuccess === 'function') {
                await onLoginSuccess();
            }
        } catch (error) {
            console.error("Erro de login:", error.message);
            setLoginError("Email ou senha inválidos. Verifique suas credenciais.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Acesso ao Sistema">
            {loginError && (
                <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
                    <p className="text-red-200 text-sm font-medium">{loginError}</p>
                </div>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="seuemail@pcce.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-500">
                    {isLoading ? <LoadingSpinner /> : <><LogIn size={20} /><span>Entrar</span></>}
                </button>
            </form>
            <div className="text-center mt-4 text-sm">
                <button onClick={() => setAuthScreen('forgotPassword')} className="text-blue-400 hover:underline">Esqueci a senha</button>
                <span className="text-gray-500 mx-2">|</span>
                <button onClick={() => setAuthScreen('signup')} className="text-blue-400 hover:underline">Criar nova conta</button>
            </div>
        </AuthLayout>
    );
};
