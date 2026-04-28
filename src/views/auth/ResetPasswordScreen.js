import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { KeyRound } from 'lucide-react';
import { apiClient } from '../../config/api';
import { AuthLayout, LoadingSpinner } from '../../App';

export const ResetPasswordScreen = ({ showNotification }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isLinkValid = Boolean(token);
    const shouldShowResetForm = isLinkValid;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLinkValid) {
            showNotification('Link inválido para redefinição de senha.', 'error');
            return;
        }

        if (!password || password.length < 6) {
            showNotification('A nova senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('As senhas não conferem.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.confirmPasswordReset(token, password);
            showNotification('Senha redefinida com sucesso! Faça login novamente.', 'success');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Erro ao confirmar redefinição de senha:', error);
            showNotification(error?.message || 'Token inválido ou expirado', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Redefinir Senha">
            <p className="text-center text-gray-400 mb-6 text-sm">
                Defina sua nova senha para concluir a recuperação da conta.
            </p>

            {shouldShowResetForm ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="reset-password-new" className="block text-sm font-medium text-gray-300 mb-1">Nova Senha</label>
                        <input
                            id="reset-password-new"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                            placeholder="Digite sua nova senha"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-gray-300 mb-1">Confirmar Nova Senha</label>
                        <input
                            id="reset-password-confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
                            placeholder="Repita a nova senha"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-500"
                    >
                        {isLoading ? <LoadingSpinner /> : <><KeyRound size={20} /><span>Salvar Nova Senha</span></>}
                    </button>
                </form>
            ) : (
                <div className="text-center text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-4">
                    Link inválido ou incompleto. Solicite uma nova redefinição de senha.
                </div>
            )}
        </AuthLayout>
    );
};

ResetPasswordScreen.propTypes = {
    showNotification: PropTypes.func.isRequired,
};
