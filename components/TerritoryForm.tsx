import React, { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { Territory, TerritoryStatus, TerritorySize } from '../types';

interface TerritoryFormProps {
    initialData?: Territory;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    title: string;
}

const TerritoryForm: React.FC<TerritoryFormProps> = ({ initialData, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        observations: '',
        status: TerritoryStatus.GREEN,
        size: TerritorySize.MEDIUM,
        images: [] as string[]
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                code: initialData.code,
                address: initialData.address,
                observations: initialData.observations,
                status: initialData.status,
                size: initialData.size || TerritorySize.MEDIUM,
                images: initialData.images?.map(img => img.url) || []
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert image URLs to TerritoryImage objects
        const formattedImages = formData.images.map((url, index) => ({
            url,
            name: `image-${index}`,
            isPrimary: index === 0,
            uploadedAt: new Date().toISOString()
        }));

        onSubmit({
            ...formData,
            images: formattedImages
        });
    };

    const handleImageAdd = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Limit checks if necessary
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB

            files.forEach((file: File) => {
                if (file.size > MAX_SIZE) {
                    alert(`O arquivo ${file.name} é muito grande (Máx 5MB).`);
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({ ...prev, images: [...prev.images, base64String] }));
                };
                reader.readAsDataURL(file);
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl dark:shadow-blue-900/20 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800 transition-colors">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800 transition-colors">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Nome do Território</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-all"
                                placeholder="Ex: Centro Comercial"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Código</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-all"
                                placeholder="Ex: T-01"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Tamanho do Território</label>
                            <select
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                            >
                                <option value={TerritorySize.SMALL}>Pequeno</option>
                                <option value={TerritorySize.MEDIUM}>Médio</option>
                                <option value={TerritorySize.LARGE}>Grande</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Status Inicial</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                            >
                                <option value={TerritoryStatus.GREEN}>Em dia (Verde)</option>
                                <option value={TerritoryStatus.YELLOW}>Atenção (Amarelo)</option>
                                <option value={TerritoryStatus.RED}>Atrasado (Vermelho)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Endereço Principal</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-all"
                            placeholder="Rua, Número, Bairro, Cidade"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Observações</label>
                        <textarea
                            name="observations"
                            value={formData.observations}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-all resize-none"
                            placeholder="Notas importantes sobre o território..."
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Imagens</label>
                            <div className="flex gap-4">
                                <label className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <Upload size={14} /> Carregar da Galeria
                                </label>
                                <button type="button" onClick={handleImageAdd} className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold hover:underline flex items-center gap-1">
                                    <Upload size={14} /> Adicionar URL
                                </button>
                            </div>
                        </div>
                        {formData.images.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {formData.images.map((img, i) => (
                                    <div key={i} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-rose-500"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()} className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 hover:border-blue-300 dark:hover:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer">
                                <Upload size={32} className="mb-2" />
                                <span className="text-sm font-medium">Clique para adicionar imagens</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 transition-colors">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 rounded-xl font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all flex items-center gap-2"
                        >
                            <Save size={20} />
                            Salvar Território
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TerritoryForm;
