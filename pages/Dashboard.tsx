import React, { useMemo, useState, useEffect } from 'react';
import {
  Users,
  Layers,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  FileText,
  Plus,
  Search,
  Map,
  MoreHorizontal,
  ArrowUpRight,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TerritoryStatus } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// --- Helper Components ---

const CountUp = ({ end, duration = 1500 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
};

const WelcomeHeader = ({ user }: { user: any }) => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in slide-in-from-top duration-700">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{user?.name?.split(' ')[0] || 'Publicador'}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
          <Calendar size={16} />
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
};

const PremiumStatCard = ({ title, value, icon: Icon, color, delay, trend }: any) => {
  const colors = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/20"
  };

  const bgColors = {
    blue: "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400"
  };

  const selectedColor = colors[color as keyof typeof colors] || colors.blue;
  const selectedBg = bgColors[color as keyof typeof bgColors] || bgColors.blue;

  return (
    <div
      className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300 transform group-hover:scale-125`}>
        <Icon size={80} />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${selectedColor} text-white shadow-lg`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          {trend && (
            <span className="flex items-center gap-1 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              {trend}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-4xl font-bold text-slate-900 dark:text-white">
            <CountUp end={value} />
          </h3>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, color = 'blue' }: any) => {
  const colors = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
  };

  const current = colors[color as keyof typeof colors] || colors.blue;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group h-full w-full shadow-sm hover:shadow"
    >
      <div className={`p-3 rounded-2xl ${current.bg} ${current.text} group-hover:scale-110 transition-transform shadow-sm`}>
        <Icon size={28} />
      </div>
      <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{label}</span>
    </button>
  );
};

const Dashboard = () => {
  const { territories, getHistory, user } = useData();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  const stats = useMemo(() => {
    const total = territories.length;
    const green = territories.filter(t => t.status === TerritoryStatus.GREEN).length;
    const yellow = territories.filter(t => t.status === TerritoryStatus.YELLOW).length;
    const red = territories.filter(t => t.status === TerritoryStatus.RED).length;

    return { total, green, yellow, red };
  }, [territories]);

  const statsData = [
    { name: 'Em dia', value: stats.green, color: '#10B981', gradient: ['#34D399', '#059669'] },
    { name: 'Atenção', value: stats.yellow, color: '#F59E0B', gradient: ['#FBBF24', '#D97706'] },
    { name: 'Atrasado', value: stats.red, color: '#EF4444', gradient: ['#F87171', '#DC2626'] },
  ];

  const recentActivity = useMemo(() => {
    const allActivity = territories.flatMap(t => {
      const history = getHistory(t.id);
      return history.map(h => ({
        id: h.id,
        territory: t.name,
        territoryCode: t.code,
        user: h.publisherName,
        date: h.date,
        parsedDate: new Date(h.date),
        action: 'Relatório enviado',
        status: t.status
      }));
    });

    return allActivity.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()).slice(0, 5);
  }, [territories, getHistory]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Resumo Geral TerritoryPro", 105, 20, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Data: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 40);
      doc.text(`Total de Territórios: ${stats.total}`, 20, 50);

      const headers = [["Status", "Quantidade", "Porcentagem"]];
      const data = [
        ["Em dia (Verde)", stats.green, `${stats.total > 0 ? Math.round((stats.green / stats.total) * 100) : 0}%`],
        ["Atenção (Amarelo)", stats.yellow, `${stats.total > 0 ? Math.round((stats.yellow / stats.total) * 100) : 0}%`],
        ["Atrasados (Vermelho)", stats.red, `${stats.total > 0 ? Math.round((stats.red / stats.total) * 100) : 0}%`],
      ];

      autoTable(doc, {
        startY: 60,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.text("Últimas Atividades", 20, (doc as any).lastAutoTable.finalY + 15);

      const historyHeaders = [["Data", "Território", "Publicador"]];
      const historyData = recentActivity.map(h => [
        format(h.parsedDate, "dd/MM/yyyy"),
        `${h.territoryCode} - ${h.territory}`,
        h.user
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: historyHeaders,
        body: historyData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
      });

      doc.save(`Resumo_Dashboard_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      <WelcomeHeader user={user} />

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Stats Cards Row */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PremiumStatCard
            title="Total Cadastrado"
            value={stats.total}
            icon={Layers}
            color="blue"
            delay={100}
          // trend="+2 este mês"
          />
          <PremiumStatCard
            title="Em Dia"
            value={stats.green}
            icon={Users}
            color="emerald"
            delay={200}
          // trend="Ótimo" 
          />
          <PremiumStatCard
            title="Atenção"
            value={stats.yellow}
            icon={Calendar}
            color="amber"
            delay={300}
          />
          <PremiumStatCard
            title="Atrasado"
            value={stats.red}
            icon={AlertTriangle}
            color="rose"
            delay={400}
          />
        </div>

        {/* Main Chart Section */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Cobertura do Território
              </h3>
              <p className="text-slate-500 text-sm mt-1">Visão geral do status de todos os territórios</p>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              <span>Exportar PDF</span>
            </button>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  {statsData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.gradient[0]} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={entry.gradient[1]} stopOpacity={0.3} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-700/50" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '12px 20px',
                    color: '#1E293B'
                  }}
                  itemStyle={{ color: '#1E293B', fontWeight: 600 }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60} animationDuration={2000}>
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} style={{ filter: `drop-shadow(0 4px 6px ${entry.color}30)` }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side Column (Activity & Actions) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 space-y-6">

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <QuickAction icon={Plus} label="Novo" color="blue" onClick={() => navigate('/territories/new')} />
            <QuickAction icon={Zap} label="Relatório" color="amber" onClick={() => navigate('/service-report')} />
            <QuickAction icon={Search} label="Buscar" color="emerald" onClick={() => navigate('/territories')} />
            <QuickAction icon={Map} label="Mapa" color="purple" onClick={() => navigate('/map')} />
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm flex flex-col h-full max-h-[500px]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              Atividade Recente
            </h3>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={activity.id} className="group flex gap-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 p-3 rounded-2xl -mx-2">
                    <div className={`
                        w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm
                        ${activity.status === TerritoryStatus.GREEN ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                        ${activity.status === TerritoryStatus.YELLOW ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : ''}
                        ${activity.status === TerritoryStatus.RED ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : ''}
                      `}>
                      {activity.territoryCode}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{activity.territory}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.user}</p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(activity.parsedDate, { locale: ptBR, addSuffix: false }).replace('cerca de ', '')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Clock size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <Link
                to="/territories"
                className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-2"
              >
                Ver Histórico Completo <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
