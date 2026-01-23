import React, { useState, useEffect } from 'react';
import {
    BarChart2, Calendar, CheckCircle2, AlertCircle, Clock,
    BookOpen, Target, TrendingUp, Save, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceRole, ServiceReport } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const ServiceReportPage = () => {
    const { user } = useAuth();
    const { serviceReports, saveServiceReport } = useData();

    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [studies, setStudies] = useState('');
    const [participated, setParticipated] = useState(false);
    const [isCampaign, setIsCampaign] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Derived
    const currentrole: ServiceRole = user?.serviceRole || 'publisher';
    const monthKey = format(currentDate, 'yyyy-MM');

    useEffect(() => {
        // Load existing report for this month
        const report = serviceReports.find(r => r.userId === user?.uid && r.month === monthKey);
        if (report) {
            setHours(report.hours.toString());
            setMinutes(report.minutes.toString());
            setStudies(report.studies.toString());
            setParticipated(report.participated);
            setIsCampaign(report.isCampaign);
        } else {
            // Reset form
            setHours('');
            setMinutes('');
            setStudies('');
            setParticipated(false);
            setIsCampaign(false);
        }
    }, [monthKey, serviceReports, user]);

    // Goal Logic
    const getMonthlyGoal = () => {
        if (currentrole === 'regular_pioneer') return 50;
        if (currentrole === 'auxiliary_pioneer') return isCampaign ? 15 : 30;
        return 0;
    };

    const monthlyGoal = getMonthlyGoal();
    const currentHours = parseFloat(hours || '0') + (parseFloat(minutes || '0') / 60);
    const progress = monthlyGoal > 0 ? Math.min(100, (currentHours / monthlyGoal) * 100) : 0;
    const remaining = Math.max(0, monthlyGoal - currentHours);

    // Yearly Calculation (Regular Pioneer)
    // Assuming Calendar Year (Jan-Dec) for simplicity as requested "pro ano"
    const getYearlyStats = () => {
        const currentYear = currentDate.getFullYear();
        const reportsThisYear = serviceReports.filter(r =>
            r.userId === user?.uid && r.month.startsWith(`${currentYear}-`)
        );

        const totalYearHours = reportsThisYear.reduce((acc, r) => acc + r.hours + (r.minutes / 60), 0);
        // Add current form state if it's the current month (to show live preview)
        // Note: serviceReports only updates on save. 
        // Logic: Total saved + current input difference? 
        // Simpler: Just rely on saved reports + current input IF current month is not saved yet?
        // Let's rely on saved reports for the "Yearly" global stat to be consistent. 

        return {
            total: totalYearHours,
            goal: 600,
            remaining: Math.max(0, 600 - totalYearHours)
        };
    };

    const yearlyStats = getYearlyStats();

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await saveServiceReport({
                userId: user.uid,
                month: monthKey,
                hours: parseInt(hours || '0'),
                minutes: parseInt(minutes || '0'),
                bibleStudies: parseInt(studies || '0'),
                participated,
                isCampaign
            });
            toast.success('Relatório salvo com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar relatório');
        } finally {
            setIsSaving(false);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    // Colors
    const progressColor = progress >= 100 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#3b82f6';

    const renderPublisherView = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Atividade do Mês</h3>

                <button
                    onClick={() => setParticipated(!participated)}
                    className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all ${participated
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                >
                    <CheckCircle2 size={48} />
                </button>

                <p className="mt-6 text-lg font-medium text-gray-900 dark:text-white">
                    {participated ? 'Participei no Ministério' : 'Toque para confirmar participação'}
                </p>

                <div className="mt-8 max-w-xs mx-auto">
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Estudos Bíblicos</label>
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-2xl border border-transparent focus-within:border-blue-500 transition-all">
                        <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                            <BookOpen className="text-blue-500" size={20} />
                        </div>
                        <input
                            type="number"
                            value={studies}
                            onChange={e => setStudies(e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent border-none outline-none text-xl font-bold text-gray-900 dark:text-white text-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPioneerView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Relatório</h3>
                        <p className="text-sm text-gray-500">Registre sua atividade</p>
                    </div>
                    {currentrole === 'auxiliary_pioneer' && (
                        <label className="flex items-center gap-2 cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30">
                            <input
                                type="checkbox"
                                checked={isCampaign}
                                onChange={e => setIsCampaign(e.target.checked)}
                                className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Campanha (15h)</span>
                        </label>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Horas</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="number"
                                    value={hours}
                                    onChange={e => setHours(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-2xl font-bold text-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Minutos</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">min</span>
                                <input
                                    type="number"
                                    value={minutes}
                                    onChange={e => setMinutes(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-2xl font-bold text-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="0"
                                    max="59"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Estudos Bíblicos</label>
                        <div className="relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="number"
                                value={studies}
                                onChange={e => setStudies(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-2xl font-bold text-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="space-y-6">
                {/* Monthly Goal Card */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Meta Mensal</h3>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">{currentHours.toFixed(1)}<span className="text-lg text-gray-400 ml-1">/ {monthlyGoal}h</span></p>
                            <p className={`mt-2 font-medium ${remaining === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {remaining === 0 ? 'Meta atingida! 🎉' : `Faltam ${remaining.toFixed(1)} horas`}
                            </p>
                        </div>
                        <div className="h-24 w-24">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[{ value: currentHours }, { value: remaining }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={40}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        <Cell fill={progressColor} />
                                        <Cell fill="#e2e8f0" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Progress Bar background */}
                    <div className="absolute bottom-0 left-0 h-1.5 bg-gray-100 w-full">
                        <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, backgroundColor: progressColor }}></div>
                    </div>
                </div>

                {/* Yearly Goal Card (Regular Pioneer Only) */}
                {currentrole === 'regular_pioneer' && (
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                        <h3 className="text-lg font-bold opacity-90 mb-6">Meta Anual</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-5xl font-bold">{yearlyStats.total.toFixed(0)}</span>
                            <span className="text-xl opacity-60 mb-1">/ 600h</span>
                        </div>

                        <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-white/90 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (yearlyStats.total / 600) * 100)}%` }}
                            ></div>
                        </div>

                        <p className="text-sm font-medium opacity-80">
                            Faltam {yearlyStats.remaining.toFixed(1)} horas para fechar o ano.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/30 text-white">
                            <Target size={24} />
                        </div>
                        Relatório de Campo
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Gerencie suas horas e atividade no ministério.
                    </p>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-gray-500" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 dark:text-white min-w-[140px] text-center capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {currentrole === 'publisher' ? renderPublisherView() : renderPioneerView()}

            {/* Save Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                    <span className="text-lg">Salvar Relatório</span>
                </button>
            </div>
        </div>
    );
};

export default ServiceReportPage;
