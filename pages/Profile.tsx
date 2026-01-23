
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Shield, Bell, Moon, Sun, Camera, Save, Lock, Loader2, Users, Copy, Check, Building2, Plus, UserPlus, LogOut, ChevronDown, BadgeCheck, UserMinus, AlertTriangle, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Congregation, CongregationMember, Role, ServiceRole } from '../types';

const Profile = () => {
  const { user, updateProfile, updatePassword, createCongregation, joinCongregation, deleteCongregation, leaveCongregation, switchCongregation } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [serviceRole, setServiceRole] = useState<ServiceRole>(user?.serviceRole || 'publisher');
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
      await updateProfile({ name: displayName, email, serviceRole });
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
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* Premium Banner */}
      <div className="relative h-64 rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-xl overflow-hidden mb-[-120px] mx-4 md:mx-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>

        <div className="absolute bottom-4 left-8 text-white/80 text-sm font-medium tracking-wider uppercase">
          Membro Oficial
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-8 pt-8">
        {/* Left Column: Identity & Preferences */}
        <div className="lg:col-span-4 space-y-6 pt-16 lg:pt-0">
          {/* Identity Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-slate-800 text-center relative z-10 flex flex-col items-center group">
            <div className="relative -mt-24 mb-6">
              <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-2xl">
                <div className="w-full h-full rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden relative">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {user?.name?.substring(0, 2).toUpperCase() || 'AU'}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-full border-4 border-white dark:border-slate-800 shadow-lg hover:bg-blue-700 transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="Alterar foto"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user?.name}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-slate-800/50 py-1 px-3 rounded-full">
              <Mail size={14} /> {user?.email}
            </p>

            <div className={`px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider mb-8 flex items-center gap-2 ${roleColors[user?.role || 'publisher']} bg-opacity-10 border border-current border-opacity-20`}>
              <Shield size={16} />
              {roleLabels[user?.role || 'publisher']}
            </div>

            {/* Personal Stats Mockup */}
            <div className="grid grid-cols-3 gap-2 w-full pt-6 border-t border-gray-100 dark:border-slate-800">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">Meses</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">850</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">Horas</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Active</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">Status</p>
              </div>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm relative z-0">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 ml-2">Configurações</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                    <Bell size={18} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-white">Notificações</span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-11 h-6 rounded-full relative transition-all ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-xl">
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-white">Modo Escuro</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-11 h-6 rounded-full relative transition-all ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms & Data */}
        <div className="lg:col-span-8 space-y-6 pt-0 lg:pt-14">

          {/* Edit Profile */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <User size={120} />
            </div>

            <div className="flex items-center gap-4 mb-8 relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dados da Conta</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mantenha suas informações atualizadas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome Completo</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none font-medium text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Endereço de E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none font-medium text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Alterar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-none font-medium text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>

          {/* Ministry Data */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dados de Ministério</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Defina seu papel para ajustar as metas</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Papel de Campo</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'publisher', label: 'Publicador', goal: 'Sem meta de horas' },
                  { id: 'auxiliary_pioneer', label: 'Pioneiro Auxiliar', goal: '30h / 15h' },
                  { id: 'regular_pioneer', label: 'Pioneiro Regular', goal: '50h / 600h Anual' },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setServiceRole(role.id as ServiceRole)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${serviceRole === role.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-transparent bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{role.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{role.goal}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Congregation Management */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Congregação</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie sua afiliação e membros</p>
                </div>
              </div>
              {!congregation && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    <Plus size={16} /> Criar
                  </button>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                  >
                    <UserPlus size={16} /> Entrar
                  </button>
                </div>
              )}
            </div>

            {congregation ? (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{congregation.name}</h4>
                      {congregation.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{congregation.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm mt-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full shadow-sm">
                          <Users size={14} />
                          <span className="font-bold">{congregation.memberCount || members.length} membros</span>
                        </div>
                      </div>
                    </div>
                    {user?.role === 'elder' && (
                      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800 flex flex-col items-center gap-1">
                        <Shield size={16} />
                        ADMIN
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Código de Convite</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 font-mono text-xl font-bold tracking-widest text-center border-dashed border-2">
                      {congregation.inviteCode}
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      {copiedCode ? <Check size={24} /> : <Copy size={24} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">Compartilhe este código com o equipamento de anciãos.</p>
                </div>

                {members.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                      <span>Lista de Membros</span>
                      <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">{members.length}</span>
                    </label>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1 customize-scrollbar">
                      {members.map((member) => (
                        <div key={member.uid} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 overflow-hidden shadow-sm">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white text-base truncate flex items-center gap-2">
                              {member.name}
                              {member.uid === user?.uid && <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">VOCÊ</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${roleColors[member.role || 'publisher'].replace('bg-', 'border-').replace('text-', 'text-')}`}>
                                {roleLabels[member.role || 'publisher']}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {member.uid !== user?.uid && canManageRole(member.role) && (
                              <button
                                onClick={() => {
                                  setEditingMember(member);
                                  setSelectedRole(member.role || 'publisher');
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                                title="Alterar Cargo"
                              >
                                <BadgeCheck size={20} />
                              </button>
                            )}

                            {member.uid !== user?.uid && canRemoveMember(member.role) && (
                              <button
                                onClick={() => setRemovingMember(member)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                title="Remover Membro"
                              >
                                <UserMinus size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Congregation Management Buttons */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  {/* Admin: Delete Congregation */}
                  {congregation.createdBy === user?.uid && (
                    <button
                      onClick={() => setShowDeleteCongModal(true)}
                      className="w-full px-4 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30"
                    >
                      <AlertTriangle size={18} />
                      Excluir Congregação Permanentemente
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowLeaveModal(true)}
                      className="px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      Sair
                    </button>
                    <button
                      onClick={() => setShowSwitchModal(true)}
                      className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Trocar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mx-auto mb-6 text-gray-300">
                  <Building2 size={40} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhuma Congregação</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
                  Junte-se a uma congregação existente ou crie uma nova para começar a gerenciar territórios.
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
