import React, { useState } from 'react';
import { Save, Trash2, X, BookmarkPlus, Sparkles } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PlanTemplate, ServiceRole } from '../types';
import toast from 'react-hot-toast';

interface TemplateManagerProps {
    currentDistribution: Record<string, { hours: string; minutes: string }>;
    onApplyTemplate: (distribution: any) => void;
    targetHours: number;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
    currentDistribution,
    onApplyTemplate,
    targetHours
}) => {
    const { user } = useAuth();
    const { planTemplates, saveTemplate, deleteTemplate, getPublicTemplates } = useData();
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    const serviceRole: ServiceRole = user?.serviceRole || 'publisher';
    const availableTemplates = getPublicTemplates();

    const handleSaveAsTemplate = async () => {
        if (!templateName.trim()) {
            toast.error('Digite um nome para o template');
            return;
        }

        // Calculate distribution from current hours
        const distribution: any = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

        days.forEach(day => {
            const dayData = currentDistribution[day];
            const hours = parseFloat(dayData?.hours || '0');
            const minutes = parseFloat(dayData?.minutes || '0');
            distribution[day] = hours + (minutes / 60);
        });

        const totalHours = Object.values(distribution).reduce((sum: number, h: any) => sum + h, 0);

        if (totalHours === 0) {
            toast.error('Adicione horas ao planejamento antes de salvar como template');
            return;
        }

        try {
            await saveTemplate({
                userId: user?.uid || '',
                name: templateName,
                description: templateDescription,
                serviceRole,
                targetHours,
                distribution,
                isPublic
            });

            toast.success('Template salvo com sucesso!');
            setShowSaveModal(false);
            setTemplateName('');
            setTemplateDescription('');
            setIsPublic(false);
        } catch (error) {
            toast.error('Erro ao salvar template');
        }
    };

    const handleApplyTemplate = (template: PlanTemplate) => {
        const distribution: any = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

        days.forEach(day => {
            const totalHours = template.distribution[day];
            const hours = Math.floor(totalHours);
            const minutes = Math.round((totalHours - hours) * 60);

            distribution[day] = {
                hours: hours.toString(),
                minutes: minutes.toString(),
                notes: '',
                isFlexible: false
            };
        });

        onApplyTemplate(distribution);
        toast.success(`Template "${template.name}" aplicado!`);
    };

    const handleDeleteTemplate = async (templateId: string, templateName: string) => {
        if (window.confirm(`Deseja realmente excluir o template "${templateName}"?`)) {
            try {
                await deleteTemplate(templateId);
                toast.success('Template excluído');
            } catch (error) {
                toast.error('Erro ao excluir template');
            }
        }
    };

    const myTemplates = availableTemplates.filter(t => t.userId === user?.uid);
    const publicTemplates = availableTemplates.filter(t => t.isPublic && t.userId !== user?.uid);

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Templates de Planejamento
                </h3>
                <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                >
                    <BookmarkPlus size={18} />
                    Salvar como Template
                </button>
            </div>

            {/* My Templates */}
            {myTemplates.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
                        Meus Templates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {myTemplates.map(template => (
                            <div
                                key={template.id}
                                className="group p-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h5 className="font-bold text-indigo-900 dark:text-indigo-300">
                                            {template.name}
                                        </h5>
                                        {template.description && (
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                        {Object.values(template.distribution).reduce((sum: number, h: any) => sum + h, 0).toFixed(1)}h total
                                    </span>
                                    <button
                                        onClick={() => handleApplyTemplate(template)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Public Templates */}
            {publicTemplates.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                        <Sparkles size={16} />
                        Templates da Comunidade
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {publicTemplates.map(template => (
                            <div
                                key={template.id}
                                className="p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:shadow-lg transition-all"
                            >
                                <div className="mb-2">
                                    <h5 className="font-bold text-purple-900 dark:text-purple-300">
                                        {template.name}
                                    </h5>
                                    {template.description && (
                                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                            {template.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                                        {Object.values(template.distribution).reduce((sum: number, h: any) => sum + h, 0).toFixed(1)}h total
                                    </span>
                                    <button
                                        onClick={() => handleApplyTemplate(template)}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {myTemplates.length === 0 && publicTemplates.length === 0 && (
                <div className="text-center py-8">
                    <BookmarkPlus className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">
                        Nenhum template salvo ainda
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Crie um planejamento e salve como template para reutilizar
                    </p>
                </div>
            )}

            {/* Save Template Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Salvar como Template
                            </h3>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Nome do Template *
                                </label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Ex: Meu Planejamento Padrão"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-colors dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                                    Descrição (opcional)
                                </label>
                                <textarea
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    placeholder="Descreva quando usar este template..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-colors resize-none h-24 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tornar público (compartilhar com a comunidade)
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveAsTemplate}
                                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateManager;
