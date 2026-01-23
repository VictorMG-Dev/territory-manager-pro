
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, ChevronRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import AnimatedBackground from '../components/AnimatedBackground';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [shake, setShake] = useState(false);
  const { login, loading } = useAuth();
  const { getDefaultRoute } = usePermissions();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Email inválido' }));
    } else {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });

    // Validação de campos vazios
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Validação de email
    if (!validateEmail(email)) {
      setFieldErrors({ ...fieldErrors, email: 'Email inválido' });
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      // Redirect to default route based on user's role
      const defaultRoute = getDefaultRoute();
      navigate(defaultRoute);
    } catch (error: any) {
      // Mensagens de erro específicas
      const errorMessage = error.message || 'Erro ao realizar login';

      if (errorMessage.includes('senha') || errorMessage.includes('password')) {
        setFieldErrors({ ...fieldErrors, password: 'Senha incorreta' });
        setError('Senha incorreta. Tente novamente.');
      } else if (errorMessage.includes('encontrado') || errorMessage.includes('not found')) {
        setFieldErrors({ ...fieldErrors, email: 'Usuário não encontrado' });
        setError('Usuário não encontrado. Verifique seu email.');
      } else if (errorMessage.includes('credenciais') || errorMessage.includes('credentials')) {
        setError('Email ou senha incorretos');
      } else {
        setError(errorMessage);
      }

      setShake(true);
      setTimeout(() => setShake(false), 500);
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

      <div className={`max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500 relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30 rotate-6 backdrop-blur-sm ring-2 ring-white/30 hover:rotate-12 transition-transform duration-300">
            <Layers className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Territory<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Pro</span></h1>
          <p className="text-gray-300 mt-2 font-medium">Gestão inteligente de territórios.</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-200 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-10 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">E-mail de acesso</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors({ ...fieldErrors, email: '' });
                    setError('');
                  }}
                  onBlur={handleEmailBlur}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border transition-all font-medium text-white placeholder:text-gray-500 ${fieldErrors.email
                    ? 'border-red-500/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20'
                    : 'border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20'
                    } outline-none`}
                  placeholder="seu@email.com"
                  disabled={isSubmitting}
                />
                {fieldErrors.email && (
                  <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1">Senha</label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 transition-colors">
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors({ ...fieldErrors, password: '' });
                    setError('');
                  }}
                  className={`w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border transition-all font-medium text-white placeholder:text-gray-500 ${fieldErrors.password
                    ? 'border-red-500/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20'
                    : 'border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20'
                    } outline-none`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {fieldErrors.password && (
                  <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 hover:shadow-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed ring-2 ring-white/20"
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
            <Link to="/register" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold hover:from-blue-300 hover:to-purple-300 underline underline-offset-4 transition-all">
              Crie uma agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

