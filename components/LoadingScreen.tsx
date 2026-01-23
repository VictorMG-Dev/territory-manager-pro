import React from 'react';
import { Layers } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-50 transition-colors duration-300">
            <div className="relative mb-8">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>

                {/* Logo Container */}
                <div className="relative relative z-10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-40 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 ring-1 ring-white/10 animate-float-vertical">
                        <Layers className="text-white drop-shadow-md animate-spin-slow-reverse" size={48} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-3 relative z-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1 font-sans">
                    Territory<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Pro</span>
                </h1>

                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
