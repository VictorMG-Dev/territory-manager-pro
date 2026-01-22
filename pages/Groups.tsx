import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { TerritoryGroup } from '../types';
import {
    Users,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    Layers,
    Search,
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

const Groups: React.FC = () => {
    const { groups, addGroup, updateGroup, deleteGroup, territories, members } = useData();
    const { permissions } = usePermissions();
    const { user: currentUser } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const handleCreateGroup = () => {
        if (!name) {
            toast.error('O nome do grupo é obrigatório');
            return;
        }
        addGroup({
            name,
            description,
            color: '#3b82f6', // Default blue
            territoryIds: selectedTerritories,
            memberIds: selectedMembers
        });
        resetForm();
        setIsAdding(false);
        toast.success('Grupo criado com sucesso!');
    };

    const handleUpdateGroup = (id: string) => {
        if (!name) {
            toast.error('O nome do grupo é obrigatório');
            return;
        }
        updateGroup(id, {
            name,
            description,
            territoryIds: selectedTerritories,
            memberIds: selectedMembers
        });
        resetForm();
        setEditingId(null);
        toast.success('Grupo atualizado com sucesso!');
    };

    const startEditing = (group: TerritoryGroup) => {
        setEditingId(group.id);
        setName(group.name);
        setDescription(group.description);
        setSelectedTerritories(group.territoryIds);
        setSelectedMembers(group.memberIds || []);
        setIsAdding(false);
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedTerritories([]);
        setSelectedMembers([]);
        setSearchTerm('');
        setMemberSearchTerm('');
    };

    const filteredTerritories = territories.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleTerritory = (id: string) => {
        setSelectedTerritories(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleMember = (uid: string) => {
        if (!permissions.canAssignMembersToGroups) return;
        setSelectedMembers(prev =>
            prev.includes(uid) ? prev.filter(i => i !== uid) : [...prev, uid]
        );
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-blue-600" size={28} />
                        Grupos de Trabalho
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gerencie equipes e seus respectivos territórios.
                    </p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        Novo Grupo
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isAdding ? 'Criar Novo Grupo' : 'Editar Grupo'}
                        </h2>
                        <button
                            onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Grupo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: Grupo Sul, Equipe Alfa..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição (Opcional)</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Breve descrição do grupo..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Territórios ({selectedTerritories.length})</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Buscar território..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                                {filteredTerritories.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => toggleTerritory(t.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${selectedTerritories.includes(t.id)
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                                            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{t.code}</p>
                                            <p className="text-xs truncate opacity-70">{t.name}</p>
                                        </div>
                                        {selectedTerritories.includes(t.id) && <CheckCircle2 size={18} className="text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Selecionar Publicadores para o Grupo ({selectedMembers.length})</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Buscar irmão..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                                {filteredMembers.map(m => (
                                    <button
                                        key={m.uid}
                                        onClick={() => toggleMember(m.uid)}
                                        disabled={!permissions.canAssignMembersToGroups}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedMembers.includes(m.uid)
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                                            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                                            } ${!permissions.canAssignMembersToGroups ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 overflow-hidden">
                                            {m.photoURL ? (
                                                <img src={m.photoURL} alt={m.name} className="w-full h-full object-cover" />
                                            ) : (
                                                m.name.substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm truncate">{m.name}</p>
                                            <p className="text-xs truncate opacity-70 uppercase tracking-tighter">{m.role?.replace('_', ' ')}</p>
                                        </div>
                                        {selectedMembers.includes(m.uid) && <CheckCircle2 size={18} className="text-blue-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
                            <button
                                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                                className="px-6 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => editingId ? handleUpdateGroup(editingId) : handleCreateGroup()}
                                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                            >
                                {editingId ? 'Salvar Alterações' : 'Criar Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {groups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                                    <Users size={24} />
                                </div>
                                <div className="flex gap-2">
                                    {permissions.canManageGroups && (
                                        <>
                                            <button onClick={() => startEditing(group)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => deleteGroup(group.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{group.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">{group.description || 'Sem descrição.'}</p>

                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 border-t dark:border-slate-800 pt-4">
                                <div className="flex items-center gap-1.5">
                                    <Layers size={14} className="text-blue-500" />
                                    <span>{group.territoryIds.length} Territórios</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <User size={14} className="text-emerald-500" />
                                    <span>{group.memberIds?.length || 0} Membros</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {groups.length === 0 && !isAdding && (
                    <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                        <Users className="mx-auto text-gray-300 dark:text-slate-700 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum grupo criado</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Comece criando um grupo para organizar seus planejamentos.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={20} />
                            Criar Meu Primeiro Grupo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Groups;
