import React, { useMemo } from 'react';
import {
  Users,
  Layers,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight
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
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TerritoryStatus } from '../types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const CountUp = ({ end, duration = 1500 }: { end: number; duration?: number }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
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

const StatsCard = ({ title, value, icon: Icon, variant, delay = 0 }: any) => {
  const styles = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      light: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      shadow: "shadow-blue-500/20"
    },
    green: {
      gradient: "from-emerald-500 to-emerald-600",
      light: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      shadow: "shadow-emerald-500/20"
    },
    yellow: {
      gradient: "from-amber-400 to-amber-500",
      light: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      shadow: "shadow-amber-500/20"
    },
    red: {
      gradient: "from-rose-500 to-rose-600",
      light: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
      shadow: "shadow-rose-500/20"
    },
  };

  const currentStyle = styles[variant as keyof typeof styles] || styles.blue;

  return (
    <div
      className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 animate-fade-in-up md:backdrop-blur-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentStyle.gradient} text-white shadow-lg ${currentStyle.shadow} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>

      </div>
      <div>
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
          <CountUp end={value} />
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { territories, getHistory } = useData();

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
        action: 'Trabalho realizado',
        status: t.status
      }));
    });

    return allActivity.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()).slice(0, 5);
  }, [territories, getHistory]);

  const [generating, setGenerating] = React.useState(false);

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
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Visão geral do progresso e atividades recentes.
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          {generating ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
          {generating ? 'Exportando...' : 'Exportar Relatório'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Cadastrado" value={stats.total} icon={Layers} variant="blue" delay={0} />
        <StatsCard title="Em Dia" value={stats.green} icon={Users} variant="green" delay={100} />
        <StatsCard title="Atenção Necessária" value={stats.yellow} icon={Calendar} variant="yellow" delay={200} />
        <StatsCard title="Atrasado" value={stats.red} icon={AlertTriangle} variant="red" delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                <TrendingUp size={20} />
              </div>
              Distribuição da Cobertura
            </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  {statsData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={entry.gradient[0]} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={entry.gradient[1]} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-700" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    padding: '12px 20px',
                  }}
                  itemStyle={{ fontWeight: 600, color: '#1e293b' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60} animationDuration={1500} animationBegin={500}>
                  {statsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <Clock size={20} />
            </div>
            Atividade Recente
          </h3>
          <div className="flex-1 space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default group"
                  style={{ animationDelay: `${600 + (index * 100)}ms` }}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                    ${activity.status === TerritoryStatus.GREEN ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                    ${activity.status === TerritoryStatus.YELLOW ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : ''}
                    ${activity.status === TerritoryStatus.RED ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' : ''}
                  `}>
                    {activity.territoryCode}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                      {activity.territory}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="truncate max-w-[120px]">{activity.user}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span>{formatDistanceToNow(activity.parsedDate, { addSuffix: true, locale: ptBR })}</span>
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1" />
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={24} className="text-slate-300" />
                </div>
                <p className="text-sm text-gray-400">Nenhuma atividade recente.</p>
              </div>
            )}
          </div>
          <Link
            to="/territories"
            className="mt-8 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 transition-all active:scale-95"
          >
            Ver todos os territórios
          </Link>
        </div>
      </div>
    </div>
  );
};



export default Dashboard;
