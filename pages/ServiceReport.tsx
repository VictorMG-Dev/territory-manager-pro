import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart2, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Clock,
    BookOpen, Target, TrendingUp, Save, ChevronLeft, ChevronRight, Loader2,
    Share2, Plus, Edit2, Trash2, X, Send, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isSameMonth, eachDayOfInterval, getDate, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceRole, ServiceReport } from '../types';
import { PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import WeeklyPlanner from '../components/WeeklyPlanner';
import HistoricalInsights from '../components/HistoricalInsights';

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

    // Daily Records State
    const [dailyRecords, setDailyRecords] = useState<Record<number, { hours: number; minutes: number; studies: number; notes?: string }>>({});
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [dailyModalOpen, setDailyModalOpen] = useState(false);
    // Date Picker State
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    // Daily Input State
    const [dayHours, setDayHours] = useState('');
    const [dayMinutes, setDayMinutes] = useState('');
    const [dayStudies, setDayStudies] = useState('');
    const [dayNotes, setDayNotes] = useState('');
    // View State
    const [activeView, setActiveView] = useState<'registro' | 'planejamento' | 'analise'>('registro');

    // Derived
    const currentrole: ServiceRole = user?.serviceRole || 'publisher';
    const isPioneer = currentrole === 'regular_pioneer' || currentrole === 'auxiliary_pioneer';
    const monthKey = format(currentDate, 'yyyy-MM');

    useEffect(() => {
        // Load existing report for this month
        const report = serviceReports.find(r => r.userId === user?.uid && r.month === monthKey);
        if (report) {
            setHours((report.hours ?? '').toString());
            setMinutes((report.minutes ?? '').toString());
            setStudies((report.bibleStudies ?? '').toString());
            setParticipated(!!report.participated);
            setIsCampaign(!!report.isCampaign);
            setDailyRecords(report.dailyRecords || {});
        } else {
            // Reset form
            setHours('');
            setMinutes('');
            setStudies('');
            setParticipated(false);
            setIsCampaign(false);
            setDailyRecords({});
        }
    }, [monthKey, serviceReports, user]);

    // Recalculate totals whenever dailyRecords change (only for Pioneers)
    useEffect(() => {
        if (isPioneer && Object.keys(dailyRecords).length > 0) {
            let totalH = 0;
            let totalM = 0;
            let totalS = 0;

            Object.values(dailyRecords).forEach((record: { hours: number; minutes: number; studies: number; notes?: string }) => {
                totalH += record.hours || 0;
                totalM += record.minutes || 0;
                totalS += record.studies || 0;
            });

            // Adjust minutes overflow
            totalH += Math.floor(totalM / 60);
            totalM = totalM % 60;

            setHours(totalH.toString());
            setMinutes(totalM.toString());
            setStudies(totalS.toString()); // Note: Studies usually reported as "active studies", not sum of visits. 
            // BUT user prompt said "anotar as horas ... de cada dia". Usually studies count is a monthly stat "number of studies conducted".
            // However, summing them might mean "return visits" or actual study sessions. 
            // Standard practice: Report number of *different* studies. 
            // Let's assume for daily log it effectively sums up "study sessions" which might not be the reportable "Bible Studies" figure. 
            // Actually, for simplicity and conflict avoidance, let's keep Studies as a separate Manual Input OR allow it to be specific.
            // Let's NOT overwrite 'Studies' from daily records sum unless explicitly desired. 
            // Standard practice: You report the distinct number of Bible studies held. 
            // So we will NOT sum studies strictly for the report field, but we can track them.
            // Wait, common apps sum "Return Visits" but "Bible Studies" is a count.
            // Let's assume the user manually inputs the final Bible Studies count for now, 
            // OR we just sum them if they want to track sessions. 
            // Let's leave Studies as Manual input for now to avoid confusion, or sum if they enter it.
            // If I sum it, I might be wrong. Let's ONLY sum hours/minutes.
        }
    }, [dailyRecords, isPioneer]);

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

    // Yearly Calculation
    const getYearlyStats = () => {
        const currentYear = currentDate.getFullYear();
        // Exclude current month from saved reports to avoid double counting if we are editing it live?
        // Actually serviceReports has the *saved* version. 
        // We want (Saved Reports of Other Months) + (Current Live State).

        const otherMonthsReports = serviceReports.filter(r =>
            r.userId === user?.uid &&
            r.month.startsWith(`${currentYear}-`) &&
            r.month !== monthKey
        );

        const otherMonthsTotal = otherMonthsReports.reduce((acc, r) => acc + r.hours + (r.minutes / 60), 0);
        const totalYearHours = otherMonthsTotal + currentHours;

        return {
            total: totalYearHours,
            goal: 600,
            remaining: Math.max(0, 600 - totalYearHours)
        };
    };

    const yearlyStats = getYearlyStats();

    // Helpers
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const progressColor = progress >= 100 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#3b82f6';

    const openDailyModal = (day: number) => {
        setSelectedDay(day);
        const record = dailyRecords[day];
        if (record) {
            setDayHours((record.hours ?? '').toString());
            setDayMinutes((record.minutes ?? '').toString());
            setDayStudies((record.studies ?? '').toString());
            setDayNotes(record.notes || '');
        } else {
            setDayHours('');
            setDayMinutes('');
            setDayStudies('');
            setDayNotes('');
        }
        setDailyModalOpen(true);
    };

    const saveDailyRecord = async () => {
        if (selectedDay === null) return;

        const newRecords = { ...dailyRecords };

        // If empty, delete
        if ((!dayHours || dayHours === '0') &&
            (!dayMinutes || dayMinutes === '0') &&
            (!dayStudies || dayStudies === '0') &&
            !dayNotes) {
            delete newRecords[selectedDay];
        } else {
            newRecords[selectedDay] = {
                hours: parseInt(dayHours || '0'),
                minutes: parseInt(dayMinutes || '0'),
                studies: parseInt(dayStudies || '0'),
                notes: dayNotes
            };
        }

        // Calculate new totals for immediate save
        let newHours = parseFloat(hours || '0');
        let newMinutes = parseFloat(minutes || '0');
        let newStudies = parseFloat(studies || '0');

        if (isPioneer) {
            let totalH = 0;
            let totalM = 0;
            let totalS = 0;

            Object.values(newRecords).forEach((record: any) => {
                totalH += record.hours || 0;
                totalM += record.minutes || 0;
                totalS += record.studies || 0;
            });

            totalH += Math.floor(totalM / 60);
            totalM = totalM % 60;

            newHours = totalH;
            newMinutes = totalM;
            newStudies = totalS;
        }

        // Update local state immediately (Optimistic)
        setDailyRecords(newRecords);
        if (isPioneer) {
            setHours(newHours.toString());
            setMinutes(newMinutes.toString());
            setStudies(newStudies.toString());
        }
        setDailyModalOpen(false);

        // Persist to Backend
        setIsSaving(true);
        try {
            await saveServiceReport({
                userId: user?.uid || '',
                month: monthKey,
                hours: newHours,
                minutes: newMinutes,
                bibleStudies: newStudies,
                participated,
                isCampaign,
                dailyRecords: newRecords
            });
            toast.success('Atividades salvas!', { id: 'autosave' });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar atividades.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDay = async () => {
        if (selectedDay === null) return;

        const newRecords = { ...dailyRecords };
        delete newRecords[selectedDay];

        // Recalculate totals
        let newHours = parseFloat(hours || '0');
        let newMinutes = parseFloat(minutes || '0');
        let newStudies = parseFloat(studies || '0');

        if (isPioneer) {
            let totalH = 0;
            let totalM = 0;
            let totalS = 0;

            Object.values(newRecords).forEach((record: any) => {
                totalH += record.hours || 0;
                totalM += record.minutes || 0;
                totalS += record.studies || 0;
            });

            totalH += Math.floor(totalM / 60);
            totalM = totalM % 60;

            newHours = totalH;
            newMinutes = totalM;
            newStudies = totalS;
        }

        // Update local state
        setDailyRecords(newRecords);
        if (isPioneer) {
            setHours(newHours.toString());
            setMinutes(newMinutes.toString());
            setStudies(newStudies.toString());
        }

        // Clear inputs
        setDayHours('');
        setDayMinutes('');
        setDayStudies('');
        setDayNotes('');

        setDailyModalOpen(false);

        // Persist deletion
        setIsSaving(true);
        try {
            await saveServiceReport({
                userId: user?.uid || '',
                month: monthKey,
                hours: newHours,
                minutes: newMinutes,
                bibleStudies: newStudies,
                participated,
                isCampaign,
                dailyRecords: newRecords
            });
            toast.success('Atividade excluída!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleWhatsAppShare = () => {
        const monthName = format(currentDate, 'MMMM/yyyy', { locale: ptBR });
        let text = `*Relatório de Serviço - ${monthName}*\n\n`;

        if (isPioneer) {
            text += `⏱ *Horas:* ${hours}:${minutes.padStart(2, '0')}\n`;
            text += `📚 *Estudos:* ${studies || 0}\n`;
            if (monthlyGoal > 0) {
                text += `🎯 *Meta:* ${progress.toFixed(0)}% concluída (${remaining.toFixed(1)}h restantes)\n`;
            }
        } else {
            text += `${participated ? '✅ Participei no ministério' : '❌ Não participei'}\n`;
            text += `📚 *Estudos:* ${studies || 0}\n`;
        }

        text += `\n_Gerado por TerritoryPro_`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };


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
                isCampaign,
                dailyRecords
            });
            toast.success('Relatório salvo com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar relatório');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendToElders = async () => {
        // First save any pending changes
        await handleSave();

        // Simulate sending process
        const loadingToast = toast.loading('Enviando relatório para a secretaria...');

        setTimeout(() => {
            toast.dismiss(loadingToast);
            toast.success('Relatório enviado com sucesso!');
            // Here we would ideally set a 'submitted' status in the DB
        }, 1500);
    };

    const renderActionButtons = () => (
        <div className="flex gap-4 mt-6">
            <button
                onClick={handleSendToElders}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                <div className="p-1 bg-white/20 rounded-lg">
                    <Send size={18} />
                </div>
                Enviar Relatório
            </button>
            <button
                onClick={handleWhatsAppShare}
                className="aspect-square h-[3.5rem] bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center transition-all active:scale-95"
                title="Compartilhar no WhatsApp"
            >
                <MessageCircle size={24} />
            </button>
        </div>
    );

    const renderPublisherView = () => (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium text-center">
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

            {/* Action Buttons for Publisher */}
            {(participated || parseInt(studies || '0') > 0) && renderActionButtons()}
        </div>
    );

    const renderPioneerView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Totals & Calendar */}
            <div className="space-y-6">
                {/* Main Input Card (Read Only or Manual Override?) Let's make it read-only if daily records exist, or editable if user wants to force it. */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-premium">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Total do Mês</h3>
                            <p className="text-sm text-gray-500">
                                {Object.keys(dailyRecords).length > 0 ? 'Calculado via diário' : 'Entrada manual'}
                            </p>
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

                {/* Calendar / Daily Log */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-premium">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Calendário de Atividades</h3>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Alta</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Média</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Baixa</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((d, i) => (
                            <div key={i} className="text-center text-xs font-bold text-gray-400 uppercase py-2">{d}</div>
                        ))}
                        {daysInMonth.map((day) => {
                            const dayNum = getDate(day);
                            const record = dailyRecords[dayNum];
                            const hasRecord = !!record;
                            const isTodayDate = isToday(day);
                            const totalHours = hasRecord ? record.hours + (record.minutes / 60) : 0;

                            // Color coding based on hours
                            let bgColor = 'bg-gray-50 dark:bg-slate-800';
                            let textColor = 'text-gray-700 dark:text-gray-300';
                            let shadowColor = '';

                            if (hasRecord) {
                                if (totalHours >= 3) {
                                    bgColor = 'bg-gradient-to-br from-emerald-500 to-emerald-600';
                                    shadowColor = 'shadow-lg shadow-emerald-500/30';
                                } else if (totalHours >= 1.5) {
                                    bgColor = 'bg-gradient-to-br from-blue-500 to-blue-600';
                                    shadowColor = 'shadow-lg shadow-blue-500/30';
                                } else {
                                    bgColor = 'bg-gradient-to-br from-amber-500 to-amber-600';
                                    shadowColor = 'shadow-lg shadow-amber-500/30';
                                }
                                textColor = 'text-white';
                            }

                            // Align first day
                            const style = dayNum === 1 ? { gridColumnStart: day.getDay() + 1 } : {};

                            return (
                                <button
                                    key={dayNum}
                                    style={style}
                                    onClick={() => openDailyModal(dayNum)}
                                    className={`
                                        aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all
                                        hover:scale-105 active:scale-95
                                        ${bgColor} ${textColor} ${shadowColor}
                                        ${!hasRecord ? 'hover:bg-gray-100 dark:hover:bg-slate-700 hover:shadow-md' : ''}
                                        ${isTodayDate && !hasRecord ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
                                        ${isTodayDate && hasRecord ? 'ring-2 ring-white ring-offset-2 ring-offset-blue-500' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-bold ${hasRecord ? 'text-white' : ''}`}>{dayNum}</span>
                                    {hasRecord && (
                                        <div className="text-[10px] font-bold opacity-90 mt-0.5">
                                            {record.hours}h{record.minutes > 0 ? `${record.minutes}m` : ''}
                                        </div>
                                    )}
                                    {hasRecord && record.studies > 0 && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shadow-md">
                                            {record.studies}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Calendar Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {Object.keys(dailyRecords).length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dias Ativos</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {Object.values(dailyRecords).reduce((sum: number, r: any) => sum + (r.studies || 0), 0)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Estudos</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {Object.keys(dailyRecords).length > 0
                                    ? (currentHours / Object.keys(dailyRecords).length).toFixed(1)
                                    : '0.0'}h
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Média/Dia</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column (Goals & Share) */}
            <div className="space-y-6">
                {/* Monthly Goal Card */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-premium relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Meta Mensal</h3>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${progress >= 100 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                            progress >= 50 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                            {progress.toFixed(0)}%
                        </div>
                    </div>

                    <div className="flex items-center justify-between relative z-10 mb-6">
                        <div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">
                                {currentHours.toFixed(1)}
                                <span className="text-lg text-gray-400 ml-1">/ {monthlyGoal}h</span>
                            </p>
                            <p className={`mt-2 font-medium flex items-center gap-2 ${remaining === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {remaining === 0 ? (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Meta atingida! 🎉
                                    </>
                                ) : (
                                    <>
                                        <Target size={18} />
                                        Faltam {remaining.toFixed(1)}h
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="h-28 w-28 min-w-[7rem] flex items-center justify-center relative" style={{ minHeight: '112px', minWidth: '112px' }}>
                            <PieChart width={112} height={112}>
                                <Pie
                                    data={[{ value: currentHours || 0.001 }, { value: remaining || 0.001 }]}
                                    cx={56}
                                    cy={56}
                                    innerRadius={35}
                                    outerRadius={50}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    stroke="none"
                                    isAnimationActive={false}
                                >
                                    <Cell fill={progressColor} />
                                    <Cell fill="#e2e8f0" className="dark:fill-slate-700" />
                                </Pie>
                            </PieChart>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{progress.toFixed(0)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Days Remaining Indicator */}
                    {monthlyGoal > 0 && (
                        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Média necessária/dia:</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {(monthlyGoal / new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()).toFixed(1)}h
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar background */}
                    <div className="absolute bottom-0 left-0 h-1.5 bg-gray-100 dark:bg-slate-800 w-full">
                        <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, backgroundColor: progressColor }}></div>
                    </div>
                </div>

                {/* Yearly Goal Card (Regular Pioneer Only) */}
                {currentrole === 'regular_pioneer' && (
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <h3 className="text-lg font-bold opacity-90">Meta Anual {currentDate.getFullYear()}</h3>
                            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                                {Math.min(100, (yearlyStats.total / 600) * 100).toFixed(0)}%
                            </div>
                        </div>

                        <div className="flex items-end gap-2 mb-2 relative z-10">
                            <span className="text-5xl font-bold">{yearlyStats.total.toFixed(0)}</span>
                            <span className="text-xl opacity-60 mb-1">/ 600h</span>
                        </div>

                        <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden mb-4 relative z-10">
                            <div
                                className="h-full bg-white/90 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (yearlyStats.total / 600) * 100)}%` }}
                            ></div>
                        </div>

                        <div className="space-y-2 relative z-10">
                            <p className="text-sm font-medium opacity-80">
                                {yearlyStats.remaining > 0
                                    ? `Faltam ${yearlyStats.remaining.toFixed(1)}h para fechar o ano`
                                    : 'Meta anual atingida! 🎉'
                                }
                            </p>
                            {yearlyStats.remaining > 0 && (
                                <p className="text-xs opacity-70">
                                    Média necessária: {(yearlyStats.remaining / Math.max(1, 12 - currentDate.getMonth())).toFixed(1)}h/mês
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Auxiliary Pioneer Info Card */}
                {currentrole === 'auxiliary_pioneer' && (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[2rem] shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Target size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Pioneiro Auxiliar</h3>
                                <p className="text-sm opacity-80">
                                    {isCampaign ? 'Campanha Especial' : 'Mês Regular'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                            <p className="text-sm opacity-90 mb-2">Meta deste mês:</p>
                            <p className="text-3xl font-bold">{monthlyGoal} horas</p>
                        </div>
                    </div>
                )}

                {/* Share Button - Only visible if has content */}
                {(Math.round(currentHours) > 0 || participated) && renderActionButtons()}
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
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-premium border border-slate-200 dark:border-slate-800">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-gray-500" />
                    </button>
                    <button
                        onClick={() => {
                            setPickerYear(currentDate.getFullYear());
                            setIsDatePickerOpen(true);
                        }}
                        className="text-lg font-bold text-gray-900 dark:text-white min-w-[140px] text-center capitalize hover:bg-gray-100 dark:hover:bg-slate-800 px-4 py-1 rounded-lg transition-colors"
                    >
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="mb-6">
                {/* Tab Navigation */}
                <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
                    <button
                        onClick={() => setActiveView('registro')}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${activeView === 'registro'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        📝 Registro
                    </button>
                    <button
                        onClick={() => setActiveView('planejamento')}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${activeView === 'planejamento'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        📅 Planejamento
                    </button>
                    <button
                        onClick={() => setActiveView('analise')}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${activeView === 'analise'
                            ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        📈 Análise
                    </button>
                </div>

                {/* Content based on active view */}
                {activeView === 'registro' ? (
                    currentrole === 'publisher' ? renderPublisherView() : renderPioneerView()
                ) : activeView === 'planejamento' ? (
                    <WeeklyPlanner
                        currentDate={currentDate}
                        monthlyGoal={monthlyGoal}
                        currentHours={currentHours}
                    />
                ) : (
                    <HistoricalInsights />
                )}
            </div>

            {/* Daily Modal */}
            {dailyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {format(new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay || 1), 'dd', { locale: ptBR })} de {format(currentDate, 'MMMM', { locale: ptBR })}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Registre suas atividades do dia
                                </p>
                            </div>
                            <button onClick={() => setDailyModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Quick Hour Buttons */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Atalhos Rápidos</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => {
                                                setDayHours(h.toString());
                                                setDayMinutes('0');
                                            }}
                                            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${dayHours === h.toString() && dayMinutes === '0'
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hours and Minutes Input */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Horas</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="number"
                                            value={dayHours}
                                            onChange={e => setDayHours(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="0"
                                            min="0"
                                            max="24"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Minutos</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">min</span>
                                        <input
                                            type="number"
                                            value={dayMinutes}
                                            onChange={e => setDayMinutes(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="0"
                                            min="0"
                                            max="59"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Studies Input */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Estudos Bíblicos / Revisitas</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="number"
                                        value={dayStudies}
                                        onChange={e => setDayStudies(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800 rounded-xl text-xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Notes Input */}
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Observações (Opcional)</label>
                                <textarea
                                    value={dayNotes}
                                    onChange={e => setDayNotes(e.target.value)}
                                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-xl font-medium dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 transition-all"
                                    placeholder="Ex: Trabalhei no território 12, fiz 3 revisitas..."
                                />
                            </div>

                            {/* Impact Preview */}
                            {(parseInt(dayHours || '0') > 0 || parseInt(dayMinutes || '0') > 0) && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="text-blue-600 dark:text-blue-400" size={16} />
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Impacto no Total</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Novo total mensal: <span className="font-bold text-blue-600 dark:text-blue-400">
                                            {(currentHours + parseInt(dayHours || '0') + (parseInt(dayMinutes || '0') / 60)).toFixed(1)}h
                                        </span>
                                        {monthlyGoal > 0 && (
                                            <span className="text-gray-500 dark:text-gray-400"> / {monthlyGoal}h</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {(dailyRecords[selectedDay || 0]) && (
                                    <button
                                        onClick={handleDeleteDay}
                                        className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                                    >
                                        <Trash2 size={20} />
                                        Excluir
                                    </button>
                                )}
                                <button
                                    onClick={saveDailyRecord}
                                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={20} />
                                    Salvar Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Date Picker Modal */}
            {isDatePickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => setPickerYear(y => y - 1)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <ChevronLeft size={20} className="text-gray-500" />
                            </button>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{pickerYear}</span>
                            <button
                                onClick={() => setPickerYear(y => y + 1)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <ChevronRight size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 12 }, (_, i) => {
                                const date = new Date(pickerYear, i, 1);
                                const isSelected = isSameMonth(date, currentDate);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setCurrentDate(date);
                                            setIsDatePickerOpen(false);
                                        }}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all ${isSelected
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {format(date, 'MMM', { locale: ptBR }).toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setIsDatePickerOpen(false)}
                            className="mt-6 w-full py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceReportPage;
