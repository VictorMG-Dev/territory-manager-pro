import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                toast.success('Verifique o console do servidor para o link de recuperação!');
            } else {
                toast.error(data.message || 'Erro ao processar solicitação.');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                        Recuperar <span className="text-blue-400">Senha</span>
                    </h1>
                    <p className="text-gray-300 mt-2 font-medium">
                        {isSuccess
                            ? 'Instruções enviadas com sucesso!'
                            : 'Digite seu email para redefinir sua senha.'}
                    </p>
                </div>

                {isSuccess ? (
                    <div className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                            <CheckCircle className="text-green-400 mx-auto mb-3" size={48} />
                            <p className="text-green-200 font-medium">
                                Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.
                            </p>
                            <p className="text-gray-400 text-sm mt-3">
                                <strong>Nota:</strong> Verifique o console do servidor para obter o link de recuperação (modo de desenvolvimento).
                            </p>
                        </div>

                        <Link
                            to="/login"
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group ring-1 ring-white/10"
                        >
                            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                            Voltar ao Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">
                                    E-mail cadastrado
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                                        placeholder="seu@email.com"
                                        disabled={isSubmitting}
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
                                'Enviar Instruções'
                            )}
                        </button>

                        <div className="pt-6 text-center border-t border-white/10">
                            <Link
                                to="/login"
                                className="text-gray-400 font-medium hover:text-blue-400 transition-colors inline-flex items-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Voltar ao Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
