
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, User, Mail, Lock, ChevronRight, Loader2, Users, Building2, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/AnimatedBackground';

const Register = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [congregationChoice, setCongregationChoice] = useState<'create' | 'join' | 'skip'>('create');
  const [congregationName, setCongregationName] = useState('');
  const [congregationDescription, setCongregationDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [shake, setShake] = useState(false);
  const { register } = useAuth();
  const { getDefaultRoute } = usePermissions();
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 1) return { strength: 1, label: 'Fraca', color: 'bg-red-500' };
    if (strength <= 2) return { strength: 2, label: 'Média', color: 'bg-orange-500' };
    if (strength <= 3) return { strength: 3, label: 'Boa', color: 'bg-yellow-500' };
    return { strength: 4, label: 'Forte', color: 'bg-green-500' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ name: '', email: '', password: '', confirmPassword: '' });

    // Validação de nome
    if (name.length < 3) {
      setFieldErrors(prev => ({ ...prev, name: 'Nome muito curto (mínimo 3 caracteres)' }));
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Validação de email
    if (!validateEmail(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Email inválido' }));
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Validação de senha
    if (password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: 'Senha muito curta (mínimo 6 caracteres)' }));
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Validação de confirmação de senha
    if (password !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'As senhas não coincidem' }));
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (name && email && password) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      let congregationData = undefined;

      if (congregationChoice === 'create' && congregationName) {
        congregationData = { name: congregationName, description: congregationDescription };
      } else if (congregationChoice === 'join' && inviteCode) {
        congregationData = { inviteCode };
      }

      await register(name, email, password, congregationData);
      // Redirect to default route based on user's role
      const defaultRoute = getDefaultRoute();
      navigate(defaultRoute);
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao criar conta';

      if (errorMessage.includes('já existe') || errorMessage.includes('already exists')) {
        setError('Este email já está cadastrado. Tente fazer login.');
      } else if (errorMessage.includes('código') || errorMessage.includes('code')) {
        setError('Código de convite inválido. Verifique e tente novamente.');
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
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors relative overflow-hidden">
      {/* Animated Premium Background */}
      <div className="absolute inset-0 z-0">
        <AnimatedBackground />
      </div>

      <div className={`max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl ${shake ? 'animate-shake' : ''}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30 -rotate-3 backdrop-blur-sm ring-2 ring-white/30 hover:-rotate-6 transition-transform duration-300">
            <Layers className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Criar Conta</h1>
          <p className="text-gray-300 mt-2 font-medium">
            {step === 1 ? 'Comece a gerenciar seus territórios hoje.' : 'Configure sua congregação'}
          </p>
          {/* Progress indicator */}
          <div className="flex gap-2 justify-center mt-4">
            <div className={`h-1 w-12 rounded-full transition-all ${step === 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'}`} />
            <div className={`h-1 w-12 rounded-full transition-all ${step === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'}`} />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-200 text-sm font-medium">{error}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-purple-200 uppercase tracking-widest ml-1 mb-1 block">Nome Completo</label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.name ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors({ ...fieldErrors, name: '' });
                      setError('');
                    }}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border transition-all font-medium text-white placeholder:text-gray-500 ${fieldErrors.name
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20'
                      } outline-none`}
                    placeholder="Seu Nome"
                  />
                  {fieldErrors.name && (
                    <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-purple-200 uppercase tracking-widest ml-1 mb-1 block">E-mail</label>
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
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border transition-all font-medium text-white placeholder:text-gray-500 ${fieldErrors.email
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20'
                        : 'border-white/10 focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20'
                      } outline-none`}
                    placeholder="exemplo@email.com"
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
                <label className="text-xs font-bold text-purple-200 uppercase tracking-widest ml-1 mb-1 block">Senha</label>
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
                        : 'border-white/10 focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20'
                      } outline-none`}
                    placeholder="Mínimo 6 caracteres"
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
                  {/* Password strength indicator */}
                  {password && !fieldErrors.password && passwordStrength && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-white/10'
                              }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ml-1 font-medium ${passwordStrength.strength === 1 ? 'text-red-400' :
                          passwordStrength.strength === 2 ? 'text-orange-400' :
                            passwordStrength.strength === 3 ? 'text-yellow-400' :
                              'text-green-400'
                        }`}>
                        Força da senha: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-purple-200 uppercase tracking-widest ml-1 mb-1 block">Confirmar Senha</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                      setError('');
                    }}
                    className={`w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border transition-all font-medium text-white placeholder:text-gray-500 ${fieldErrors.confirmPassword
                        ? 'border-red-500/50 focus:border-red-400 focus:ring-4 focus:ring-red-500/20'
                        : confirmPassword && password === confirmPassword
                          ? 'border-green-500/50 focus:border-green-400 focus:ring-4 focus:ring-green-500/20'
                          : 'border-white/10 focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20'
                      } outline-none`}
                    placeholder="Digite a senha novamente"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1">
                      <X size={12} />
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && !fieldErrors.confirmPassword && (
                    <p className="text-green-400 text-xs mt-1 ml-1 flex items-center gap-1">
                      <Check size={12} />
                      As senhas coincidem
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 hover:shadow-2xl transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 group ring-2 ring-white/20"
            >
              Continuar
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="mt-10 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-3 block">
                Como deseja começar?
              </label>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setCongregationChoice('create')}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${congregationChoice === 'create'
                    ? 'border-purple-400 bg-purple-500/20 ring-2 ring-purple-400/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={congregationChoice === 'create' ? 'text-purple-300' : 'text-gray-400'} size={24} />
                    <div>
                      <div className={`font-bold ${congregationChoice === 'create' ? 'text-purple-200' : 'text-white'}`}>
                        Criar Nova Congregação
                      </div>
                      <div className="text-sm text-gray-400">Comece do zero e convide membros</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCongregationChoice('join')}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${congregationChoice === 'join'
                    ? 'border-purple-400 bg-purple-500/20 ring-2 ring-purple-400/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className={congregationChoice === 'join' ? 'text-purple-300' : 'text-gray-400'} size={24} />
                    <div>
                      <div className={`font-bold ${congregationChoice === 'join' ? 'text-purple-200' : 'text-white'}`}>
                        Entrar em Congregação Existente
                      </div>
                      <div className="text-sm text-gray-400">Use um código de convite</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCongregationChoice('skip')}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${congregationChoice === 'skip'
                    ? 'border-purple-400 bg-purple-500/20 ring-2 ring-purple-400/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={congregationChoice === 'skip' ? 'text-purple-300' : 'text-gray-400'} size={24} />
                    <div>
                      <div className={`font-bold ${congregationChoice === 'skip' ? 'text-purple-200' : 'text-white'}`}>
                        Pular por Enquanto
                      </div>
                      <div className="text-sm text-gray-400">Configurar depois no perfil</div>
                    </div>
                  </div>
                </button>
              </div>

              {congregationChoice === 'create' && (
                <div className="space-y-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-xs font-bold text-purple-200 uppercase tracking-widest ml-1 mb-1 block">
                      Nome da Congregação
                    </label>
                    <input
                      type="text"
                      required
                      value={congregationName}
                      onChange={(e) => setCongregationName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                      placeholder="Ex: Congregação Central"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-200 uppercase tracking-widest ml-1 mb-1 block">
                      Descrição (Opcional)
                    </label>
                    <textarea
                      value={congregationDescription}
                      onChange={(e) => setCongregationDescription(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500 resize-none"
                      rows={3}
                      placeholder="Informações adicionais sobre a congregação"
                    />
                  </div>
                </div>
              )}

              {congregationChoice === 'join' && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-purple-200 uppercase tracking-widest ml-1 mb-1 block">
                    Código de Convite
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-purple-400 focus:bg-white/10 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all font-medium text-white uppercase tracking-wider text-center text-lg placeholder:text-gray-500"
                    placeholder="XXXXXXXX"
                    maxLength={8}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all disabled:opacity-50 ring-1 ring-white/10"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (congregationChoice === 'create' && !congregationName) || (congregationChoice === 'join' && !inviteCode)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 hover:shadow-2xl transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed ring-2 ring-white/20"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    Cadastrar Conta
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="pt-6 text-center border-t border-white/10">
          <p className="text-gray-400 font-medium">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold hover:from-purple-300 hover:to-pink-300 underline underline-offset-4 transition-all">
              Faça o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
