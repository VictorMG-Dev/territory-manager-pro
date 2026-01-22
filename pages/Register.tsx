
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, User, Mail, Lock, ChevronRight, Loader2, Users, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [congregationChoice, setCongregationChoice] = useState<'create' | 'join' | 'skip'>('create');
  const [congregationName, setCongregationName] = useState('');
  const [congregationDescription, setCongregationDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let congregationData = undefined;

      if (congregationChoice === 'create' && congregationName) {
        congregationData = { name: congregationName, description: congregationDescription };
      } else if (congregationChoice === 'join' && inviteCode) {
        congregationData = { inviteCode };
      }

      await register(name, email, password, congregationData);
      navigate('/');
    } catch (error) {
      // Error handling done in context via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors relative overflow-hidden">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/assets/img/map_background.png')`,
        }}
      >
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600/90 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 -rotate-3 backdrop-blur-sm ring-1 ring-white/20">
            <Layers className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Criar Conta</h1>
          <p className="text-gray-300 mt-2 font-medium">
            {step === 1 ? 'Comece a gerenciar seus territórios hoje.' : 'Configure sua congregação'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                    placeholder="Seu Nome"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group ring-1 ring-white/10"
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
                    ? 'border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={congregationChoice === 'create' ? 'text-blue-300' : 'text-gray-400'} size={24} />
                    <div>
                      <div className={`font-bold ${congregationChoice === 'create' ? 'text-blue-200' : 'text-white'}`}>
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
                    ? 'border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className={congregationChoice === 'join' ? 'text-blue-300' : 'text-gray-400'} size={24} />
                    <div>
                      <div className={`font-bold ${congregationChoice === 'join' ? 'text-blue-200' : 'text-white'}`}>
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
                    ? 'border-blue-400 bg-blue-500/20 ring-1 ring-blue-400/50'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={congregationChoice === 'skip' ? 'text-blue-300' : 'text-gray-400'} size={24} />
                    <div>
                      <div className={`font-bold ${congregationChoice === 'skip' ? 'text-blue-200' : 'text-white'}`}>
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
                    <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">
                      Nome da Congregação
                    </label>
                    <input
                      type="text"
                      required
                      value={congregationName}
                      onChange={(e) => setCongregationName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500"
                      placeholder="Ex: Congregação Central"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">
                      Descrição (Opcional)
                    </label>
                    <textarea
                      value={congregationDescription}
                      onChange={(e) => setCongregationDescription(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white placeholder:text-gray-500 resize-none"
                      rows={3}
                      placeholder="Informações adicionais sobre a congregação"
                    />
                  </div>
                </div>
              )}

              {congregationChoice === 'join' && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-blue-200 uppercase tracking-widest ml-1 mb-1 block">
                    Código de Convite
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-400 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium text-white uppercase tracking-wider text-center text-lg placeholder:text-gray-500"
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
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg hover:-translate-y-1 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed ring-1 ring-white/10"
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
            <Link to="/login" className="text-blue-400 font-bold hover:text-blue-300 underline underline-offset-4">
              Faça o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
