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
    CheckCircle2,
    MessageCircle,
    Target,
    Calendar,
    ChevronRight,
    Users2
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
    const [viewingGroup, setViewingGroup] = useState<TerritoryGroup | null>(null);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                            <Users2 className="text-white" size={24} />
                        </div>
                        Grupos Congregacionais
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                        Gerencie grupos e seus respectivos territórios.
                    </p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/25 active:scale-95"
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
                {groups.map((group, index) => (
                    <div
                        key={group.id}
                        className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Gradient Header */}
                        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                            <div className="absolute top-4 right-4 flex gap-2">
                                {permissions.canManageGroups && (
                                    <>
                                        <button onClick={() => startEditing(group)} className="p-2 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-white/20 transition-all">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deleteGroup(group.id)} className="p-2 bg-white/10 backdrop-blur-md text-white rounded-xl hover:bg-rose-500/80 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-6 pt-0 relative">
                            {/* Icon Badge */}
                            <div className="w-16 h-16 -mt-8 bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-lg mb-4 inline-block">
                                <div className="w-full h-full bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Users size={28} />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{group.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                                {group.description || 'Sem descrição definida para este grupo.'}
                            </p>

                            {/* Goals / Progress (Simulated) */}
                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                                    <span>Meta de Territórios</span>
                                    <span>75%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-3/4 rounded-full" />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Layers size={14} className="text-blue-500" />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Territórios</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{group.territoryIds.length}</span>
                                </div>
                                <div
                                    onClick={() => setViewingGroup(group)}
                                    className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800/50 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group/members"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <User size={14} className="text-emerald-500" />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Membros</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{group.memberIds?.length || 0}</span>
                                        <ChevronRight size={14} className="text-gray-400 group-hover/members:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">
                                    <MessageCircle size={16} />
                                    WhatsApp
                                </button>
                                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                                    <Calendar size={16} />
                                    Agenda
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {groups.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                            <Users2 size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum grupo encontrado</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">Comece criando um grupo congregacional para organizar melhor as saídas de campo.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/25"
                        >
                            <Plus size={20} />
                            Criar Primeiro Grupo
                        </button>
                    </div>
                )}
            </div>

            {/* View Members Modal */}
            {viewingGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900 sticky top-0 rounded-t-3xl backdrop-blur-xl z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <User size={20} className="text-blue-500" />
                                    Membros do Grupo
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{viewingGroup.name}</p>
                            </div>
                            <button onClick={() => setViewingGroup(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            {viewingGroup.memberIds && viewingGroup.memberIds.length > 0 ? (
                                members.filter(m => viewingGroup.memberIds?.includes(m.uid)).map(member => (
                                    <div key={member.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 p-0.5 shadow-sm">
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                                {member.photoURL ? (
                                                    <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 dark:text-white truncate">{member.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${member.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }`}>
                                                    {member.role?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                        >
                                            <MessageCircle size={20} />
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <User size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nenhum membro atribuído a este grupo.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
