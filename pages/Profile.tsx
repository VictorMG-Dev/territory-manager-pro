
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Shield, Bell, Moon, Sun, Camera, Save, Lock, Loader2, Users, Copy, Check, Building2, Plus, UserPlus, LogOut, ChevronDown, BadgeCheck, UserMinus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Congregation, CongregationMember, Role } from '../types';

const Profile = () => {
  const { user, updateProfile, updatePassword, createCongregation, joinCongregation, deleteCongregation, leaveCongregation, switchCongregation } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Congregation state
  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [members, setMembers] = useState<CongregationMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newCongName, setNewCongName] = useState('');
  const [newCongDesc, setNewCongDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoadingCong, setIsLoadingCong] = useState(false);

  // Role Management State
  const [editingMember, setEditingMember] = useState<CongregationMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('publisher');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Remove Member State
  const [removingMember, setRemovingMember] = useState<CongregationMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Delete Congregation State
  const [showDeleteCongModal, setShowDeleteCongModal] = useState(false);
  const [isDeletingCong, setIsDeletingCong] = useState(false);

  // Leave Congregation State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeavingCong, setIsLeavingCong] = useState(false);

  // Switch Congregation State
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchCode, setSwitchCode] = useState('');
  const [isSwitchingCong, setIsSwitchingCong] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.congregationId) {
      loadCongregationData();
    }
  }, [user?.congregationId]);

  const loadCongregationData = async () => {
    try {
      const [congData, membersData] = await Promise.all([
        api.get('/congregations/my'),
        api.get('/congregations/members')
      ]);
      setCongregation(congData);
      setMembers(membersData);
    } catch (error) {
      console.error('Erro ao carregar dados da congregação:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      await updateProfile({ name: displayName, email });
      if (newPassword) {
        await updatePassword(newPassword);
        setNewPassword('');
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande. Máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          await updateProfile({ photoURL: result });
          toast.success('Foto atualizada!');
        } catch (error) {
          toast.error('Erro ao salvar foto.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCongregation = async () => {
    if (!newCongName.trim()) {
      toast.error('Digite um nome para a congregação');
      return;
    }

    setIsLoadingCong(true);
    try {
      const newCong = await createCongregation(newCongName, newCongDesc);
      setCongregation(newCong);
      setShowCreateModal(false);
      setNewCongName('');
      setNewCongDesc('');
      await loadCongregationData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCong(false);
    }
  };

  const handleJoinCongregation = async () => {
    if (!joinCode.trim()) {
      toast.error('Digite o código de convite');
      return;
    }

    setIsLoadingCong(true);
    try {
      await joinCongregation(joinCode);
      setShowJoinModal(false);
      setJoinCode('');
      await loadCongregationData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCong(false);
    }
  };

  const copyInviteCode = () => {
    if (congregation?.inviteCode) {
      navigator.clipboard.writeText(congregation.inviteCode);
      setCopiedCode(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const roleLabels: Record<Role, string> = {
    publisher: 'Publicador',
    territory_servant: 'Servo de Territórios',
    service_overseer: 'Sup. Serviço',
    elder: 'Ancião',
    admin: 'Administrador'
  };

  const roleColors: Record<Role, string> = {
    publisher: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400',
    territory_servant: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    service_overseer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    elder: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
  };

  // Levels for hierarchy check
  const roleLevels: Record<Role, number> = {
    publisher: 1,
    territory_servant: 2,
    service_overseer: 3,
    elder: 4,
    admin: 5
  };

  const canManageRole = (targetRole: Role | undefined) => {
    if (!user?.role) return false;
    // Current user level
    const myLevel = roleLevels[user.role];
    // Target user level
    const targetLevel = roleLevels[targetRole || 'publisher'];

    // Admin can manage anyone
    if (user.role === 'admin') return true;

    // Elder can manage everyone except Admin
    if (user.role === 'elder' && targetRole !== 'admin') return true;

    // Others must be strictly higher rank
    // AND must be at least level 3 (Service Overseer) to manage anyone
    return myLevel >= 3 && myLevel > targetLevel;
  };

  const getAvailableRoles = () => {
    if (!user?.role) return [];

    // Elder can assign any role
    if (user.role === 'elder') {
      return Object.entries(roleLabels);
    }

    const myLevel = roleLevels[user.role];

    // Can only assign roles STRICTLY LOWER than own level
    return Object.entries(roleLabels).filter(([roleKey]) => {
      const roleLevel = roleLevels[roleKey as Role];
      return roleLevel < myLevel;
    });
  };

  const handleUpdateRole = async () => {
    if (!editingMember) return;

    setIsUpdatingRole(true);
    try {
      await api.put(`/congregations/members/${editingMember.uid}/role`, { role: selectedRole });
      toast.success('Cargo atualizado com sucesso!');
      setEditingMember(null);
      await loadCongregationData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar cargo');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const canRemoveMember = (targetRole: Role | undefined) => {
    if (!user?.role) return false;
    const roleLevels: Record<Role, number> = {
      publisher: 1,
      territory_servant: 2,
      service_overseer: 3,
      elder: 4,
      admin: 5
    };

    const myLevel = roleLevels[user.role];
    const targetLevel = roleLevels[targetRole || 'publisher'];

    // Only service overseers, elders and admins can remove members
    if (myLevel < 3) return false;

    // Service overseers cannot remove higher or equal ranks
    if (user.role === 'service_overseer' && targetLevel >= 3) return false;

    // Elders cannot remove other elders or admins
    if (user.role === 'elder' && targetLevel >= 4) return false;

    // Admins can remove anyone except other admins
    if (user.role === 'admin' && targetRole === 'admin' && user.uid !== removingMember?.uid) return false;

    return true;
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    setIsRemovingMember(true);
    try {
      await api.delete(`/congregations/members/${removingMember.uid}`);
      toast.success('Membro removido com sucesso!');
      setRemovingMember(null);
      await loadCongregationData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao remover membro');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleDeleteCongregation = async () => {
    if (!congregation) return;

    setIsDeletingCong(true);
    try {
      await deleteCongregation(congregation.id);
      setShowDeleteCongModal(false);
      setCongregation(null);
      setMembers([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingCong(false);
    }
  };

  const handleLeaveCongregation = async () => {
    setIsLeavingCong(true);
    try {
      await leaveCongregation();
      setShowLeaveModal(false);
      setCongregation(null);
      setMembers([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLeavingCong(false);
    }
  };

  const handleSwitchCongregation = async () => {
    if (!switchCode.trim()) {
      toast.error('Digite o código de convite');
      return;
    }

    setIsSwitchingCong(true);
    try {
      await switchCongregation(switchCode);
      setShowSwitchModal(false);
      setSwitchCode('');
      await loadCongregationData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSwitchingCong(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie suas informações e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center transition-colors">
            <div className="relative mb-6 group">
              <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-slate-800 shadow-xl flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-400 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.substring(0, 2).toUpperCase() || 'AU'
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full border-4 border-white dark:border-slate-800 shadow-lg hover:bg-blue-700 transition-all cursor-pointer z-10"
                title="Alterar foto"
              >
                <Camera size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">{user?.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{user?.email}</p>

            {user?.role && (
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${roleColors[user.role]}`}>
                {roleLabels[user.role]}
              </div>
            )}

            <div className="w-full pt-6 border-t border-gray-50 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                <Mail size={16} className="text-gray-400" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 font-medium">
                <Shield size={16} className="text-gray-400" />
                {roleLabels[user?.role || 'publisher']}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">Preferências</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-gray-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Notificações</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-10 h-6 rounded-full relative transition-all ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-500" />}
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Modo Escuro</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-10 h-6 rounded-full relative transition-all ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Edit Info Section */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-8">Editar Informações</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Exibido</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 outline-none transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 outline-none transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nova Senha (opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="mt-10 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 dark:shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>

          {/* Congregation Section */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="text-blue-600 dark:text-blue-400" size={24} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Congregação</h3>
              </div>
              {!congregation && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Criar
                  </button>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Entrar
                  </button>
                </div>
              )}
            </div>

            {congregation ? (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{congregation.name}</h4>
                      {congregation.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{congregation.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Users size={16} />
                          <span className="font-semibold">{congregation.memberCount || members.length} membros</span>
                        </div>
                      </div>
                    </div>
                    {user?.role === 'elder' && (
                      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-800">
                        ADMIN
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Código de Convite</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 font-mono text-lg font-bold tracking-wider text-center">
                      {congregation.inviteCode}
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      {copiedCode ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">Compartilhe este código com outros membros para que possam entrar na congregação</p>
                </div>

                {members.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Membros ({members.length})</label>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {members.map((member) => (
                        <div key={member.uid} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 overflow-hidden">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white text-sm truncate flex items-center gap-2">
                              {member.name}
                              {member.uid === user?.uid && <span className="text-xs text-gray-400 font-normal">(Você)</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${roleColors[member.role || 'publisher']}`}>
                                {roleLabels[member.role || 'publisher']}
                              </span>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {member.uid !== user?.uid && canManageRole(member.role) && (
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setSelectedRole(member.role || 'publisher');
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Alterar Cargo"
                              >
                                <BadgeCheck size={18} />
                              </button>
                            )}

                            {member.uid !== user?.uid && canRemoveMember(member.role) && (
                              <button
                                onClick={() => setRemovingMember(member)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover Membro"
                              >
                                <UserMinus size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Congregation Management Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  {/* Admin: Delete Congregation */}
                  {congregation.createdBy === user?.uid && (
                    <button
                      onClick={() => setShowDeleteCongModal(true)}
                      className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
                    >
                      <AlertTriangle size={18} />
                      Excluir Congregação
                    </button>
                  )}

                  {/* All Members: Leave and Switch */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      className="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      Sair
                    </button>
                    <button
                      onClick={() => setShowSwitchModal(true)}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Trocar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="mx-auto text-gray-300 dark:text-slate-700 mb-4" size={48} />
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhuma Congregação</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Crie uma nova congregação ou entre em uma existente usando um código de convite
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Editor Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full border border-gray-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Alterar Cargo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Defina o cargo de <span className="font-bold text-gray-900 dark:text-white">{editingMember.name}</span>
            </p>

            <div className="space-y-2">
              {getAvailableRoles().map(([roleKey, label]) => (
                <button
                  key={roleKey}
                  onClick={() => setSelectedRole(roleKey as Role)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${selectedRole === roleKey
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                >
                  <span className={`font-bold ${selectedRole === roleKey ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-slate-300'}`}>
                    {label}
                  </span>
                  {selectedRole === roleKey && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all font-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isUpdatingRole}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdatingRole ? <Loader2 className="animate-spin" size={18} /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Congregation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Criar Congregação</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Nome</label>
                <input
                  type="text"
                  value={newCongName}
                  onChange={(e) => setNewCongName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 outline-none transition-all font-medium"
                  placeholder="Nome da congregação"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Descrição (Opcional)</label>
                <textarea
                  value={newCongDesc}
                  onChange={(e) => setNewCongDesc(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 outline-none transition-all font-medium resize-none"
                  rows={3}
                  placeholder="Informações adicionais"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isLoadingCong}
                className="flex-1 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCongregation}
                disabled={isLoadingCong || !newCongName.trim()}
                className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingCong ? <Loader2 className="animate-spin" size={20} /> : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Congregation Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Entrar na Congregação</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Código de Convite</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 outline-none transition-all font-mono text-lg font-bold tracking-wider text-center uppercase"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowJoinModal(false)}
                disabled={isLoadingCong}
                className="flex-1 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleJoinCongregation}
                disabled={isLoadingCong || !joinCode.trim()}
                className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingCong ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Remover Membro</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja remover <span className="font-bold text-gray-900 dark:text-white">{removingMember.name}</span> da congregação?
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ Esta ação irá remover o membro da congregação e redefinir seu cargo para "Publicador". O membro precisará de um novo convite para retornar.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRemovingMember(null)}
                disabled={isRemovingMember}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={isRemovingMember}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRemovingMember ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Removendo...
                  </>
                ) : (
                  <>
                    <UserMinus size={18} />
                    Remover
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Congregation Modal */}
      {showDeleteCongModal && congregation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Excluir Congregação</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja excluir a congregação <span className="font-bold text-gray-900 dark:text-white">{congregation.name}</span>?
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <p className="text-xs text-red-800 dark:text-red-300 font-medium">
                ⚠️ Esta ação é <strong>IRREVERSÍVEL</strong>. Todos os {members.length} membros serão removidos e perderão acesso aos territórios da congregação.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteCongModal(false)}
                disabled={isDeletingCong}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCongregation}
                disabled={isDeletingCong}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingCong ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Congregation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <LogOut className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sair da Congregação</h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tem certeza que deseja sair da congregação? Você perderá acesso aos territórios e precisará de um novo convite para retornar.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeavingCong}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLeaveCongregation}
                disabled={isLeavingCong}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLeavingCong ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    Sair
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Congregation Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Trocar de Congregação</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Digite o código de convite da nova congregação. Você sairá automaticamente da congregação atual.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Código de Convite</label>
                <input
                  type="text"
                  value={switchCode}
                  onChange={(e) => setSwitchCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 outline-none transition-all font-mono text-lg font-bold tracking-wider text-center uppercase"
                  placeholder="XXXXXXXX"
                  maxLength={8}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  setSwitchCode('');
                }}
                disabled={isSwitchingCong}
                className="flex-1 px-6 py-3.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSwitchCongregation}
                disabled={isSwitchingCong || !switchCode.trim()}
                className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSwitchingCong ? <Loader2 className="animate-spin" size={20} /> : 'Trocar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
