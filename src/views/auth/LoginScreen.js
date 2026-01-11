import React, { useState } from 'react';

import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AuthLayout, LoadingSpinner } from '../../App';
import { LogIn } from 'lucide-react';

    
 export const LoginScreen = ({ showNotification, setAuthScreen }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            showNotification("Por favor, preencha o email e a senha.", "error");
            return;
        }
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
        } catch (error) {
            console.error("Erro de login:", error.code);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showNotification("Email ou senha inválidos. Verifique suas credenciais.", "error");
            } else {
                showNotification("Ocorreu um erro ao tentar fazer o login.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Acesso ao Sistema">
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="seu.email@pcc.ce.gov.br" />
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