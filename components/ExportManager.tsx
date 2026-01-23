import React from 'react';
import { FileDown, FileSpreadsheet, Share2 } from 'lucide-react';
import { MonthlyPlan } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface ExportManagerProps {
    monthlyPlan: MonthlyPlan | undefined;
    currentDate: Date;
    currentHours: number;
}

const ExportManager: React.FC<ExportManagerProps> = ({ monthlyPlan, currentDate, currentHours }) => {

    const exportToPDF = () => {
        if (!monthlyPlan) {
            toast.error('Nenhum planejamento para exportar');
            return;
        }

        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(99, 102, 241); // Indigo
            doc.text("Planejamento Mensal", 105, 20, { align: "center" });

            doc.setFontSize(16);
            doc.setTextColor(100, 100, 100);
            doc.text(format(currentDate, "MMMM 'de' yyyy", { locale: ptBR }), 105, 30, { align: "center" });

            // Summary Box
            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60);
            doc.text(`Meta Mensal: ${monthlyPlan.targetHours}h`, 20, 50);
            doc.text(`Total Planejado: ${monthlyPlan.totalPlannedHours.toFixed(1)}h`, 20, 60);
            doc.text(`Horas Realizadas: ${currentHours.toFixed(1)}h`, 20, 70);
            doc.text(`Projeção de Conclusão: ${monthlyPlan.projectedCompletion.toFixed(0)}%`, 20, 80);

            // Progress indicator
            const progress = Math.min(100, monthlyPlan.projectedCompletion);
            doc.setFillColor(99, 102, 241);
            doc.rect(20, 85, progress * 1.7, 5, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(20, 85, 170, 5);

            // Weekly breakdown
            let startY = 100;

            monthlyPlan.weeks.forEach((week, index) => {
                if (startY > 250) {
                    doc.addPage();
                    startY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(99, 102, 241);
                doc.text(`Semana ${week.weekNumber}`, 20, startY);
                doc.text(`Total: ${week.totalPlannedHours.toFixed(1)}h`, 150, startY);

                // Days table
                const headers = [["Dia", "Horas", "Minutos", "Total", "Notas"]];
                const data = Object.entries(week.days).map(([day, planned]: [string, any]) => [
                    day.charAt(0).toUpperCase() + day.slice(1),
                    planned.hours || 0,
                    planned.minutes || 0,
                    `${(planned.hours + (planned.minutes / 60)).toFixed(1)}h`,
                    planned.notes || '-'
                ]);

                autoTable(doc, {
                    startY: startY + 5,
                    head: headers,
                    body: data,
                    theme: 'grid',
                    headStyles: { fillColor: [99, 102, 241] },
                    margin: { left: 20, right: 20 }
                });

                startY = (doc as any).lastAutoTable.finalY + 15;
            });

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Gerado por TerritoryPro - ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
                    105,
                    285,
                    { align: "center" }
                );
                doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
            }

            doc.save(`Planejamento_${format(currentDate, "MM-yyyy")}.pdf`);
            toast.success('PDF exportado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao exportar PDF');
        }
    };

    const exportToExcel = () => {
        if (!monthlyPlan) {
            toast.error('Nenhum planejamento para exportar');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();

            // Summary sheet
            const summaryData: any[][] = [
                ["PLANEJAMENTO MENSAL"],
                [format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })],
                [],
                ["Meta Mensal", `${monthlyPlan.targetHours}h`],
                ["Total Planejado", `${monthlyPlan.totalPlannedHours.toFixed(1)}h`],
                ["Horas Realizadas", `${currentHours.toFixed(1)}h`],
                ["Projeção", `${monthlyPlan.projectedCompletion.toFixed(0)}%`],
                [],
                ["Semana", "Dia", "Horas", "Minutos", "Total (h)", "Notas"]
            ];

            monthlyPlan.weeks.forEach(week => {
                Object.entries(week.days).forEach(([day, planned]: [string, any]) => {
                    summaryData.push([
                        `Semana ${week.weekNumber}`,
                        day.charAt(0).toUpperCase() + day.slice(1),
                        planned.hours || 0,
                        planned.minutes || 0,
                        (planned.hours + (planned.minutes / 60)).toFixed(1),
                        planned.notes || ''
                    ]);
                });
            });

            const ws = XLSX.utils.aoa_to_sheet(summaryData);

            // Set column widths
            ws['!cols'] = [
                { wch: 12 },
                { wch: 12 },
                { wch: 8 },
                { wch: 10 },
                { wch: 10 },
                { wch: 30 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Planejamento");

            XLSX.writeFile(wb, `Planejamento_${format(currentDate, "MM-yyyy")}.xlsx`);
            toast.success('Excel exportado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao exportar Excel');
        }
    };

    const shareWhatsApp = () => {
        if (!monthlyPlan) {
            toast.error('Nenhum planejamento para compartilhar');
            return;
        }

        const monthName = format(currentDate, "MMMM/yyyy", { locale: ptBR });
        let text = `*📅 Planejamento de ${monthName}*\n\n`;

        text += `🎯 *Meta:* ${monthlyPlan.targetHours}h\n`;
        text += `📊 *Planejado:* ${monthlyPlan.totalPlannedHours.toFixed(1)}h\n`;
        text += `✅ *Realizado:* ${currentHours.toFixed(1)}h\n`;
        text += `📈 *Projeção:* ${monthlyPlan.projectedCompletion.toFixed(0)}%\n\n`;

        monthlyPlan.weeks.forEach(week => {
            text += `*Semana ${week.weekNumber}:* ${week.totalPlannedHours.toFixed(1)}h\n`;
            Object.entries(week.days).forEach(([day, planned]: [string, any]) => {
                const total = planned.hours + (planned.minutes / 60);
                if (total > 0) {
                    text += `  • ${day.charAt(0).toUpperCase() + day.slice(1)}: ${total.toFixed(1)}h\n`;
                }
            });
            text += `\n`;
        });

        text += `_Gerado por TerritoryPro_`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        toast.success('Abrindo WhatsApp...');
    };

    const hasData = monthlyPlan && monthlyPlan.totalPlannedHours > 0;

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Exportar Planejamento
            </h3>

            {!hasData ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        Adicione horas ao planejamento para exportar
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* PDF Export */}
                    <button
                        onClick={exportToPDF}
                        className="group p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                        <FileDown className="text-red-600 dark:text-red-400 mx-auto mb-3 group-hover:scale-110 transition-transform" size={40} />
                        <p className="font-bold text-red-700 dark:text-red-400 text-lg">Exportar PDF</p>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">Documento formatado</p>
                    </button>

                    {/* Excel Export */}
                    <button
                        onClick={exportToExcel}
                        className="group p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                        <FileSpreadsheet className="text-green-600 dark:text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" size={40} />
                        <p className="font-bold text-green-700 dark:text-green-400 text-lg">Exportar Excel</p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">Planilha editável</p>
                    </button>

                    {/* WhatsApp Share */}
                    <button
                        onClick={shareWhatsApp}
                        className="group p-6 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all hover:shadow-lg hover:-translate-y-1"
                    >
                        <Share2 className="text-emerald-600 dark:text-emerald-400 mx-auto mb-3 group-hover:scale-110 transition-transform" size={40} />
                        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">Compartilhar</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Via WhatsApp</p>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportManager;
