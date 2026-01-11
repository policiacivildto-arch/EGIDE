import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';           
import { auth, db, appId } from '../../config/firebase';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { UserPlus } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/Shared';
import { formatTelefone, formatMatricula, normalizeName } from '../../utils/helpers';
import { findPolicialByMatricula } from '../../constants/policiais';
import { DEPARTMENTS } from '../../constants/data';
export const SignUpScreen = ({ showNotification, setAuthScreen }) => {

    // --- ALTERADO: Adicionado 'cargo' e 'classe' ao estado inicial do formulário ---
    const [formData, setFormData] = useState({ 
        nome: '', 
        matricula: '', 
        departamento: '', 
        delegacia: '', 
        telefone: '', 
        cargo: '', // --- NOVO ---
        classe: '', // --- NOVO ---
        email: '', 
        password: '' 
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (field, value) => {
        const updatedData = { ...formData, [field]: value };
        if (field === 'departamento') updatedData.delegacia = '';

        // --- NOVO: Reseta a classe quando o cargo é alterado ---
        if (field === 'cargo') updatedData.classe = '';

        if (field === 'telefone') updatedData.telefone = formatTelefone(value);
        if (field === 'matricula') {
            const formatted = formatMatricula(value);
            updatedData.matricula = formatted;
            // Tentar autocompletar nome e cargo a partir da base local
            const encontrado = findPolicialByMatricula(formatted);
            if (encontrado) {
                updatedData.nome = encontrado.nome;
                updatedData.cargo = encontrado.cargo;
            }
        }
        setFormData(updatedData);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        const telefoneDigits = formData.telefone.replace(/\D/g, '').length;
        // A validação 'some(val => val === '')' agora inclui os novos campos 'cargo' e 'classe'
        if (Object.values(formData).some(val => val === '') || formData.password.length < 6 || (telefoneDigits !== 10 && telefoneDigits !== 11)) {
            showNotification("Preencha todos os campos. A senha deve ter no mínimo 6 caracteres e o telefone 10 ou 11 dígitos.", "error");
            return;
        }
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
            const user = userCredential.user;
            
            // --- ALTERADO: Adicionado 'cargo' e 'classe' aos dados do usuário a serem salvos ---
            const userData = {
                nome: normalizeName(formData.nome),
                matricula: formData.matricula,
                departamento: formData.departamento,
                delegacia: formData.delegacia,
                telefone: formData.telefone,
                cargo: formData.cargo,   // --- NOVO ---
                classe: formData.classe, // --- NOVO ---
                role: 'policial' // Todos os novos usuários são policiais por padrão
            };
            
            await setDoc(doc(db, `/artifacts/${appId}/users`, user.uid), userData);
            showNotification("Conta criada com sucesso! Você já pode fazer o login.", "success");
            setAuthScreen('login');
        } catch (error) {
            console.error("Erro ao criar conta:", error.code);
            if (error.code === 'auth/email-already-in-use') {
                showNotification("Este email já está em uso por outra conta.", "error");
            } else {
                showNotification("Ocorreu um erro ao criar a conta.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Criar Nova Conta">
            <form onSubmit={handleSignUp} className="space-y-4">
                <input type="text" placeholder="Nome Completo" value={formData.nome} onChange={e => handleChange('nome', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required />
                <input type="text" placeholder="Matrícula" value={formData.matricula} onChange={e => handleChange('matricula', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required />
                <select value={formData.departamento} onChange={e => handleChange('departamento', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required><option value="">Selecione o Departamento</option>{Object.keys(DEPARTMENTS).map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select value={formData.delegacia} onChange={e => handleChange('delegacia', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required disabled={!formData.departamento}><option value="">Selecione a Delegacia</option>{formData.departamento && DEPARTMENTS[formData.departamento].map(d => <option key={d} value={d}>{d}</option>)}</select>
                
                {/* --- NOVO: Campos de Cargo e Classe --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <select value={formData.cargo} onChange={e => handleChange('cargo', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required>
                            <option value="">Selecione o Cargo</option>
                            <option value="DPC">(DPC)</option>
                            <option value="OIP">(OIP)</option>
                         </select>
                    </div>
                     <div>
                         <select value={formData.classe} onChange={e => handleChange('classe', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required disabled={!formData.cargo}>
                            <option value="">Selecione a Classe</option>
                            {formData.cargo === 'DPC' && <option value="Especial">Especial</option>}
                            {formData.cargo === 'OIP' && <>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </>}
                         </select>
                    </div>
                </div>
                {/* --- FIM dos novos campos --- */}

                <input type="tel" placeholder="Telefone" value={formData.telefone} onChange={e => handleChange('telefone', e.target.value)} maxLength="15" className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required />
                <input type="email" placeholder="Email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required />
                <input type="password" placeholder="Senha (mínimo 6 caracteres)" value={formData.password} onChange={e => handleChange('password', e.target.value)} className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600" required />
                <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-500">
                    {isLoading ? <LoadingSpinner /> : <><UserPlus size={20} /><span>Criar Conta</span></>}
                </button>
            </form>
            <div className="text-center mt-4 text-sm">
                <button onClick={() => setAuthScreen('login')} className="text-blue-400 hover:underline">Já tem uma conta? Entrar</button>
            </div>
        </AuthLayout>
    );
};
