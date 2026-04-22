
import { useState } from 'react';
import PropTypes from 'prop-types';
import { apiClient } from '../../config/api';
import { Mail } from 'lucide-react';
import { AuthLayout, LoadingSpinner } from '../../App'; 

export const ForgotPasswordScreen = ({ showNotification, setAuthScreen }) => {


    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            showNotification("Por favor, insira o seu email.", "error");
            return;
        }
        setIsLoading(true);
        try {
            const response = await apiClient.requestPasswordReset(trimmedEmail);

            if (response?.reset_link) {
                showNotification("Link de redefinição gerado com sucesso.", "success");
                globalThis.location.assign(response.reset_link);
                return;
            }

            showNotification("Email de redefinição de senha enviado! Verifique sua caixa de entrada.", "success");
            setAuthScreen('login');
        } catch (error) {
            console.error("Erro ao redefinir senha:", error);
            showNotification(error?.message || "Ocorreu um erro. Verifique se o email está correto.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Recuperar Senha">
            <p className="text-center text-gray-400 mb-6 text-sm">Insira seu email para receber um link de redefinição de senha.</p>
            <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                    <label htmlFor="forgot-password-email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input id="forgot-password-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" placeholder="seuemail@pc.ce.gov.br" required />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-500">
                    {isLoading ? <LoadingSpinner /> : <><Mail size={20} /><span>Enviar Link</span></>}
                </button>
            </form>
            <div className="text-center mt-4 text-sm">
                <button onClick={() => setAuthScreen('login')} className="text-blue-400 hover:underline">Voltar para o Login</button>
            </div>
        </AuthLayout>
    );
};

ForgotPasswordScreen.propTypes = {
    showNotification: PropTypes.func.isRequired,
    setAuthScreen: PropTypes.func.isRequired,
};