
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { apiClient } from '../../config/api';
import { Mail } from 'lucide-react';
import { AuthLayout, LoadingSpinner } from '../../App'; 

export const ForgotPasswordScreen = ({ showNotification, setAuthScreen }) => {
    const navigate = useNavigate();
    const [matricula, setMatricula] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const trimmedMatricula = matricula.trim().toUpperCase();
        if (!trimmedMatricula) {
            showNotification("Por favor, insira sua matrícula.", "error");
            return;
        }
        setIsLoading(true);
        try {
            const response = await apiClient.requestPasswordReset(trimmedMatricula);

            // Em modo debug/fallback (dev), seguimos fluxo automático sem depender do e-mail externo.
            if (response?.delivery === 'debug' && response?.token) {
                showNotification('Link de redefinição gerado. Redirecionando...', 'success');
                navigate(`/reset-password?token=${encodeURIComponent(response.token)}`);
                return;
            }

            showNotification("E-mail enviado para o endereço cadastrado na sua matrícula.", "success");
            setAuthScreen('login');
        } catch (error) {
            console.error("Erro ao redefinir senha:", error);
            showNotification(error?.message || "Matrícula não encontrada ou ocorreu um erro.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Recuperar Senha">
            <p className="text-center text-gray-400 mb-6 text-sm">Insira sua matrícula para receber um link de redefinição de senha no email cadastrado.</p>
            <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                    <label htmlFor="forgot-password-matricula" className="block text-sm font-medium text-gray-300 mb-1">Matrícula</label>
                    <input
                        id="forgot-password-matricula"
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                        placeholder="Ex: 12345678"
                        pattern="^\d{7}[\dX]$"
                        maxLength={8}
                        required
                    />
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