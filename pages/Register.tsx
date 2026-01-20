
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, User, Mail, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (error) {
      // Error handling done in context via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200 -rotate-3">
            <Layers className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Criar Conta</h1>
          <p className="text-gray-500 mt-2 font-medium">Comece a gerenciar seus territórios hoje.</p>
        </div>

        <form onSubmit={handleRegister} className="mt-10 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
                  placeholder="Seu Nome"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
                  placeholder="exemplo@email.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 hover:-translate-y-1 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
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
        </form>

        <div className="pt-6 text-center">
          <p className="text-gray-500 font-medium">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 underline underline-offset-4">
              Faça o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
