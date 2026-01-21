import React, { useState } from 'react';
import {
  FileDown,
  BarChart2,
  PieChart as PieIcon,
  Download,
  Filter,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TerritoryStatus } from '../types';
import toast from 'react-hot-toast';

const Reports = () => {
  const { territories, allWorkHistory } = useData();
  const [loading, setLoading] = useState(false);

  const handleGeneralSummary = () => {
    try {
      setLoading(true);
      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Resumo Geral da Congregação", 105, 20, { align: "center" });

      // Stats calculation
      const total = territories.length;
      const green = territories.filter(t => t.status === TerritoryStatus.GREEN).length;
      const yellow = territories.filter(t => t.status === TerritoryStatus.YELLOW).length;
      const red = territories.filter(t => t.status === TerritoryStatus.RED).length;

      const coverage = total > 0 ? Math.round((green / total) * 100) : 0;

      // Stats Section
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Data do Relatório: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`, 20, 40);
      doc.text(`Total de Territórios: ${total}`, 20, 50);
      doc.text(`Cobertura Atual: ${coverage}%`, 20, 60);

      const headers = [["Status", "Quantidade", "Porcentagem"]];
      const data = [
        ["Em dia (Verde)", green, `${total > 0 ? Math.round((green / total) * 100) : 0}%`],
        ["Atenção (Amarelo)", yellow, `${total > 0 ? Math.round((yellow / total) * 100) : 0}%`],
        ["Atrasados (Vermelho)", red, `${total > 0 ? Math.round((red / total) * 100) : 0}%`],
      ];

      autoTable(doc, {
        startY: 70,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      // Recent Activity
      doc.text("Últimas Atividades", 20, (doc as any).lastAutoTable.finalY + 15);

      const recentHistory = [...allWorkHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      const historyHeaders = [["Data", "Território", "Publicador"]];
      const historyData = recentHistory.map(h => {
        const territoryName = territories.find(t => t.id === h.territoryId)?.name || "N/A";
        return [
          format(new Date(h.date), "dd/MM/yyyy"),
          territoryName,
          h.publisherName
        ];
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: historyHeaders,
        body: historyData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
      });

      doc.save(`Resumo_Geral_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    try {
      setLoading(true);
      const wb = XLSX.utils.book_new();

      // Territories Sheet
      const territoriesData = territories.map(t => ({
        Codigo: t.code,
        Nome: t.name,
        Endereco: t.address,
        Status: t.status === 'green' ? 'Em dia' : t.status === 'yellow' ? 'Atenção' : 'Atrasado',
        Ultimo_Trabalho: t.lastWorkedDate ? format(new Date(t.lastWorkedDate), "dd/MM/yyyy") : 'Nunca',
        Ultimo_Publicador: t.lastWorkedBy || '-',
        Dias_Sem_Trabalhar: t.daysSinceWork
      }));

      const wsTerritories = XLSX.utils.json_to_sheet(territoriesData);
      XLSX.utils.book_append_sheet(wb, wsTerritories, "Territórios");

      // History Sheet
      const historyData = allWorkHistory.map(h => {
        const territory = territories.find(t => t.id === h.territoryId);
        return {
          Data: format(new Date(h.date), "dd/MM/yyyy"),
          Territorio_Codigo: territory?.code || 'N/A',
          Territorio_Nome: territory?.name || 'N/A',
          Publicador: h.publisherName,
          Observacoes: h.notes
        };
      });

      const wsHistory = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(wb, wsHistory, "Histórico");

      XLSX.writeFile(wb, `Dados_Territorios_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast.success("Excel exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar Excel");
    } finally {
      setLoading(false);
    }
  };

  const handleOverdueReport = () => {
    try {
      setLoading(true);
      const doc = new jsPDF();
      const overdue = territories.filter(t => t.status === TerritoryStatus.RED);

      doc.setFontSize(22);
      doc.setTextColor(231, 76, 60);
      doc.text("Relatório de Territórios Atrasados", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Atrasados: ${overdue.length}`, 20, 35);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 42);

      const headers = [["Cód", "Nome", "Dias", "Último Pub."]];
      const data = overdue.map(t => [
        t.code,
        t.name,
        `${t.daysSinceWork} dias`,
        t.lastWorkedBy || '-'
      ]);

      autoTable(doc, {
        startY: 50,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] },
      });

      doc.save(`Territorios_Atrasados_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Lista gerada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar lista");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyReport = () => {
    try {
      setLoading(true);
      const doc = new jsPDF();
      const today = new Date();
      const currentMonth = format(today, "MMMM 'de' yyyy", { locale: ptBR });

      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Relatório Mensal de Campo", 105, 20, { align: "center" });
      doc.setFontSize(16);
      doc.text(currentMonth, 105, 30, { align: "center" });

      // Calculate monthly stats
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlyWork = allWorkHistory.filter(h => new Date(h.date) >= firstDay);

      const uniqueTerritories = new Set(monthlyWork.map(w => w.territoryId)).size;
      const publishers = new Set(monthlyWork.map(w => w.publisherName)).size;

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Territórios Trabalhados: ${uniqueTerritories}`, 20, 50);
      doc.text(`Publicadores Ativos: ${publishers}`, 20, 60);
      doc.text(`Total de registros: ${monthlyWork.length}`, 20, 70);

      const headers = [["Data", "Território", "Publicador"]];
      const data = monthlyWork
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(h => {
          const t = territories.find(t => t.id === h.territoryId);
          return [
            format(new Date(h.date), "dd/MM/yyyy"),
            t?.code || 'N/A',
            h.publisherName
          ];
        });

      autoTable(doc, {
        startY: 80,
        head: headers,
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`Relatorio_Mensal_${format(today, "MM-yyyy")}.pdf`);
      toast.success("Relatório mensal gerado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório mensal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Relatórios</h1>
          <p className="text-gray-500 dark:text-slate-400">Exporte dados e analise o desempenho da congregação.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Resumo Geral */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all group">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BarChart2 size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Resumo Geral</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
            Gera um PDF completo com estatísticas de status, média de tempo e lista de territórios em dia.
          </p>
          <button
            onClick={handleGeneralSummary}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            <Download size={20} />
            {loading ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>

        {/* Dados Excel */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all group">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileDown size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Dados (Excel)</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
            Exporte todos os dados brutos dos territórios e histórico de trabalhos em formato .xlsx para análise externa.
          </p>
          <button
            onClick={handleExcelExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            <Download size={20} />
            {loading ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>

        {/* Territórios Atrasados */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all group">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PieIcon size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Territórios Atrasados</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
            Lista específica focada nos territórios vermelhos (90+ dias) para planejamento de urgência.
          </p>
          <button
            onClick={handleOverdueReport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 hover:bg-amber-600 dark:hover:bg-amber-600 hover:text-white text-amber-600 dark:text-amber-400 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            <Download size={20} />
            {loading ? 'Gerando...' : 'Gerar Lista'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Relatórios Agendados</h3>
          <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">Ver todos</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-emerald-500 shadow-sm transition-colors">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">Relatório Mensal de Campo</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">Referente ao mês atual</p>
              </div>
            </div>
            <button
              onClick={handleMonthlyReport}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
              title="Gerar agora"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
