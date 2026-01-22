
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth(); // Use global loading state or just local? 
  // Context loading is for initial session check. We need local loading for the action.
  // Actually context exposes loading, but that might be "app loading". 
  // Let's rely on the promise from login for local loading state if needed.
  // But wait, the context's login function sets the global loading state. 
  // Let's use a local submitting state for better UI control if needed, 
  // or just rely on the fact that we await login.

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      // Toast is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assets/img/map_background.png')`,
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500 relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600/90 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 rotate-6 backdrop-blur-sm ring-1 ring-white/20">
            <Layers className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Territory<span className="text-blue-400">Pro</span></h1>
          <p className="text-gray-300 mt-2 font-medium">Gestão inteligente de territórios.</p>
        </div>

        <form onSubmit={handleLogin} className="mt-10 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">E-mail de acesso</label>
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

            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1">Senha</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                  placeholder="••••••••"
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
              <>
                Entrar no Painel
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </>
            )}
          </button>
        </form>

        <div className="pt-6 text-center border-t border-white/10">
          <p className="text-gray-400 font-medium">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-blue-400 font-bold hover:text-blue-300 underline underline-offset-4">
              Crie uma agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
