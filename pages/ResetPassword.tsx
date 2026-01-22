import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers, Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            toast.error('Token de recuperação não encontrado.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                toast.success('Senha redefinida com sucesso!');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                toast.error(data.message || 'Erro ao redefinir senha.');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <AnimatedBackground />
                </div>

                <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500 relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
                    <div className="text-center">
                        <AlertCircle className="text-red-400 mx-auto mb-4" size={64} />
                        <h1 className="text-2xl font-bold text-white mb-4">Token Inválido</h1>
                        <p className="text-gray-300 mb-6">
                            O link de recuperação está inválido ou expirado.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="inline-block bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-2xl font-bold hover:-translate-y-1 transition-all shadow-xl shadow-black/20"
                        >
                            Solicitar Novo Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Premium Background */}
            <div className="absolute inset-0 z-0">
                <AnimatedBackground />
            </div>

            <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500 relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
                <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600/90 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 rotate-6 backdrop-blur-sm ring-1 ring-white/20">
                        <Layers className="text-white" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Redefinir <span className="text-blue-400">Senha</span>
                    </h1>
                    <p className="text-gray-300 mt-2 font-medium">
                        {isSuccess ? 'Senha alterada com sucesso!' : 'Digite sua nova senha.'}
                    </p>
                </div>

                {isSuccess ? (
                    <div className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                            <CheckCircle className="text-green-400 mx-auto mb-3" size={48} />
                            <p className="text-green-200 font-medium mb-2">
                                Sua senha foi redefinida com sucesso!
                            </p>
                            <p className="text-gray-400 text-sm">
                                Redirecionando para o login...
                            </p>
                        </div>

                        <Link
                            to="/login"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group ring-1 ring-white/10"
                        >
                            Ir para Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">
                                    Nova Senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                                        placeholder="••••••••"
                                        disabled={isSubmitting}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">
                                    Confirmar Nova Senha
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                                        placeholder="••••••••"
                                        disabled={isSubmitting}
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed ring-1 ring-white/10"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                'Redefinir Senha'
                            )}
                        </button>

                        <div className="pt-6 text-center border-t border-white/10">
                            <Link
                                to="/login"
                                className="text-gray-400 font-medium hover:text-blue-400 transition-colors"
                            >
                                Voltar ao Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
