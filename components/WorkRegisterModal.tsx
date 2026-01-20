import React, { useState } from 'react';
import { X, Save, Upload, Calendar } from 'lucide-react';
import { WorkRecord } from '../types';

interface WorkRegisterModalProps {
    territoryId: string;
    territoryName: string;
    onSubmit: (data: Omit<WorkRecord, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

const WorkRegisterModal: React.FC<WorkRegisterModalProps> = ({ territoryId, territoryName, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        publisherName: '',
        notes: '',
        photos: [] as { url: string, name: string }[]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            territoryId,
            date: formData.date,
            publisherName: formData.publisherName,
            notes: formData.notes,
            photos: formData.photos
        });
    };

    const handlePhotoAdd = () => {
        const url = prompt('URL da foto:');
        if (url) {
            setFormData(prev => ({
                ...prev,
                photos: [...prev.photos, { url, name: `Foto ${prev.photos.length + 1}` }]
            }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Registrar Trabalho</h2>
                        <p className="text-sm text-gray-500">{territoryName}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Data do Trabalho</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Publicador Responsável</label>
                        <input
                            type="text"
                            name="publisherName"
                            value={formData.publisherName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Seu nome"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Observações</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                            placeholder="Descreva como foi o trabalho..."
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-700">Fotos</label>
                            <button type="button" onClick={handlePhotoAdd} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                <Upload size={14} /> Adicionar Foto
                            </button>
                        </div>

                        {formData.photos.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {formData.photos.map((photo, i) => (
                                    <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
                        >
                            <Save size={20} />
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkRegisterModal;
