import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const AccessDenied = () => {
    const navigate = useNavigate();
    const { getDefaultRoute } = usePermissions();

    const handleGoBack = () => {
        navigate(getDefaultRoute());
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldOff className="text-red-600 dark:text-red-400" size={40} />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        Acesso Negado
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Você não tem permissão para acessar esta página. Entre em contato com um administrador se acredita que isso é um erro.
                    </p>

                    <button
                        onClick={handleGoBack}
                        className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-blue-900/20 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        Voltar à Página Inicial
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Suas permissões são baseadas no seu cargo na congregação
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
