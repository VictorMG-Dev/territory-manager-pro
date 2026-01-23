import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, Calendar, Download, Filter, ChevronLeft, ChevronRight,
    Search, FileText, CheckCircle2, AlertCircle, Clock, BookOpen,
    BarChart3, User as UserIcon, ArrowUpRight
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 text-white">
                            <Users size={24} />
                        </div>
                        Relatórios da Congregação
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Visualize e gerencie os relatórios enviados pelos publicadores.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setViewMode('annual')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'annual' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Anual
                        </button>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-premium border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronLeft size={20} className="text-gray-500" />
                        </button>
                        <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[120px] text-center capitalize">
                            {viewMode === 'monthly' ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) : yearKey}
                        </span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronRight size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FileText size={20} />
                        </div>
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Relatórios</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.count}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Clock size={20} />
                        </div>
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total de Horas</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.floor(stats.hours)}h</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total de Estudos</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.studies}</p>
                    </div>
                </div>
            </div>

            {/* List & Search */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-premium overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar publicador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Download size={20} />
                        Exportar CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Publicador</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Mês</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Horas</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Estudos</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-500 font-medium">Carregando relatórios...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-500">
                                        Nenhum relatório encontrado para este período.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {report.userName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{report.userName}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{report.userRole?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-gray-600 dark:text-gray-400 font-medium">
                                            {format(new Date(report.month + '-01'), 'MMMM yyyy', { locale: ptBR })}
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="font-bold text-gray-900 dark:text-white px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                {report.hours}:{report.minutes?.toString().padStart(2, '0') || '00'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <span className="font-bold text-gray-600 dark:text-gray-300">
                                                {report.bibleStudies || 0}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 text-emerald-500 font-bold text-sm">
                                                <CheckCircle2 size={16} />
                                                Enviado
                                            </div>
                                            {report.submittedAt && (
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {format(new Date(report.submittedAt), 'dd/MM/yyyy HH:mm')}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CongregationReports;
