import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, Calendar, Download, Filter, ChevronLeft, ChevronRight,
    Search, FileText, CheckCircle2, AlertCircle, Clock, BookOpen,
    BarChart3, User as UserIcon, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceReport } from '../types';
import toast from 'react-hot-toast';

const CongregationReports = () => {
    const { fetchCongregationReports } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');

    const monthKey = format(currentDate, 'yyyy-MM');
    const yearKey = format(currentDate, 'yyyy');

    useEffect(() => {
        loadReports();
    }, [currentDate, viewMode]);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const data = await fetchCongregationReports(
                viewMode === 'monthly' ? monthKey : undefined,
                viewMode === 'annual' ? yearKey : undefined
            );
            setReports(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar relatórios da congregação.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReports = useMemo(() => {
        return reports.filter(r =>
            r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.month.includes(searchTerm)
        );
    }, [reports, searchTerm]);

    const stats = useMemo(() => {
        if (reports.length === 0) return { hours: 0, studies: 0, count: 0 };
        return reports.reduce((acc, r) => ({
            hours: acc.hours + (r.hours || 0) + ((r.minutes || 0) / 60),
            studies: acc.studies + (r.bibleStudies || 0),
            count: acc.count + 1
        }), { hours: 0, studies: 0, count: 0 });
    }, [reports]);

    const handleExport = () => {
        // Logic for CSV export
        const headers = ["Publicador", "Mês", "Horas", "Estudos", "Enviado em"];
        const rows = filteredReports.map(r => [
            r.userName,
            r.month,
            `${r.hours}:${(r.minutes || 0).toString().padStart(2, '0')}`,
            r.bibleStudies,
            r.submittedAt ? format(new Date(r.submittedAt), 'dd/MM/yyyy HH:mm') : '-'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_congregacao_${viewMode === 'monthly' ? monthKey : yearKey}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
                        <div className="p-4 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-[1.25rem] shadow-xl shadow-indigo-500/20 text-white">
                            <Users size={28} />
                        </div>
                        <span>Relatórios da Congregação</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg ml-1 font-medium">
                        Gestão administrativa e visão geral de atividades.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setViewMode('annual')}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'annual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Anual
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900/60 backdrop-blur-md p-2 rounded-2xl shadow-premium border border-slate-200 dark:border-white/5">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
                            <ChevronLeft size={20} className="text-slate-500" />
                        </button>
                        <span className="text-lg font-bold text-slate-900 dark:text-white min-w-[130px] text-center capitalize tracking-tight">
                            {viewMode === 'monthly' ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) : yearKey}
                        </span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
                            <ChevronRight size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="group bg-white dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-premium hover:shadow-premium-hover transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                            <FileText size={22} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Relatórios</span>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-count-up">{stats.count}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">Submissões recebidas</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <ArrowUpRight size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="group bg-white dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-premium hover:shadow-premium-hover transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Clock size={22} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Horas Totais</span>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-count-up">{Math.floor(stats.hours)}h</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">Acúmulo do período</p>
                        </div>
                        <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                            <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="group bg-white dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-premium hover:shadow-premium-hover transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500"></div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                            <BookOpen size={22} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Estudos</span>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                        <div>
                            <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-count-up">{stats.studies}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">Bíblias e publicações</p>
                        </div>
                        <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                            <BarChart3 size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List & Search */}
            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 shadow-premium overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar publicador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800/50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white border border-slate-200 dark:border-white/5 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
                    >
                        <Download size={22} className="group-hover:translate-y-0.5 transition-transform" />
                        <span>Exportar CSV</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {/* Desktop Table View */}
                    <table className="w-full text-left hidden md:table">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md">
                                <th className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 opacity-60 uppercase tracking-widest">Publicador</th>
                                <th className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 opacity-60 uppercase tracking-widest">Mês Referência</th>
                                <th className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 opacity-60 uppercase tracking-widest text-center">Horas</th>
                                <th className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 opacity-60 uppercase tracking-widest text-center">Estudos</th>
                                <th className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400 opacity-60 uppercase tracking-widest text-right">Status de Envio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-indigo-600/20 rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 w-16 h-16 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg animate-pulse-slow">Sincronizando relatórios...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-slate-600">
                                            <Filter size={48} className="opacity-20" />
                                            <p className="text-xl font-bold">Nenhum registro encontrado</p>
                                            <p className="text-base font-medium opacity-60">Tente ajustar seus filtros ou período selecionado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report, index) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all duration-300 group animate-slide-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                                                        {report.userName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{report.userName}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-500 font-bold capitalize flex items-center gap-1.5 mt-0.5">
                                                        <UserIcon size={14} className="opacity-50" />
                                                        {report.userRole?.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                                                <Calendar size={18} className="opacity-40" />
                                                <span className="capitalize">{format(new Date(report.month + '-01T12:00:00'), 'MMMM yyyy', { locale: ptBR })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex items-center gap-2 font-black text-slate-900 dark:text-white px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50 text-base shadow-sm group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                                <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                                                {report.hours}:{report.minutes?.toString().padStart(2, '0') || '00'}h
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="inline-flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                                                <BookOpen size={16} className="opacity-60" />
                                                {report.bibleStudies || 0}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                                    <CheckCircle2 size={16} />
                                                    <span>REGISTRADO</span>
                                                </div>
                                                {report.submittedAt && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-600 font-bold mt-1">
                                                        <Clock size={10} />
                                                        <span>{format(new Date(report.submittedAt), 'dd/MM/yyyy HH:mm')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-bold">Buscando...</p>
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="py-20 text-center text-slate-500">Nenhum registro.</div>
                        ) : (
                            filteredReports.map((report, index) => (
                                <div
                                    key={report.id}
                                    className="p-6 transition-all active:bg-slate-50 dark:active:bg-white/[0.02] animate-slide-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                                                {report.userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 dark:text-white">{report.userName}</p>
                                                <p className="text-xs text-slate-500 font-bold capitalize">{report.userRole?.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md mb-1 capitalize">
                                                {format(new Date(report.month + '-01T12:00:00'), 'MMM yyyy', { locale: ptBR })}
                                            </div>
                                            <div className="text-emerald-500 font-black text-[10px] bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded flex items-center gap-1">
                                                <CheckCircle2 size={10} />
                                                ENVIADO
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Horas</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <Clock size={16} className="text-blue-500" />
                                                {report.hours}:{report.minutes?.toString().padStart(2, '0') || '00'}h
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Estudos</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <BookOpen size={16} className="text-amber-500" />
                                                {report.bibleStudies || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {report.submittedAt && (
                                        <p className="text-[10px] text-slate-400 mt-3 text-center font-bold font-mono uppercase tracking-tighter opacity-60">
                                            Enviado em {format(new Date(report.submittedAt), 'dd/MM/yyyy HH:mm')}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CongregationReports;
