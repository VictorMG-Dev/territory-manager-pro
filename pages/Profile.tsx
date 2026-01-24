
import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Shield, Bell, Moon, Sun, Camera, Save, Lock, Loader2, Users, Copy, Check, Building2, Plus, UserPlus, LogOut, ChevronDown, ChevronRight, BadgeCheck, UserMinus, AlertTriangle, BookOpen, Clock, Star, CheckCircle2, Search, Filter, Megaphone, Calendar } from 'lucide-react';

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
  const [banner, setBanner] = useState(user?.banner || 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600');
  const [showBannerEditor, setShowBannerEditor] = useState(false);

  // Sync state with user data when it loads/updates
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setEmail(user.email || '');
      if (user.serviceRole) {
        setServiceRole(user.serviceRole);
      }
      if (user.banner) {
        setBanner(user.banner);
      }
    }
  }, [user]);
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

  // New Features State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnnouncements, setShowAnnouncements] = useState(true);

  // Profile Redesign State
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'ministry' | 'congregation'>('overview');

  const recentActivity = [
    { id: 1, type: 'report', title: 'Relatório Mensal Enviado', date: 'Há 2 dias', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
    { id: 2, type: 'territory', title: 'Território Comercial Concluído', date: 'Há 5 dias', icon: Building2, color: 'text-blue-500 bg-blue-50' },
    { id: 3, type: 'role', title: 'Designado Servo Ministerial', date: 'Há 1 mês', icon: Shield, color: 'text-amber-500 bg-amber-50' },
  ];

  const calculateProfileCompletion = () => {
    let score = 0;
    let total = 6; // Name, Email, Photo, Banner, Role, Congregation

    if (user?.name) score++;
    if (user?.email) score++;
    if (user?.photoURL) score++;
    if (user?.banner && !user.banner.startsWith('bg-')) score++; // Custom banner counts
    if (user?.serviceRole) score++;
    if (user?.congregationId) score++;

    return Math.round((score / total) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const bannerPresets = [
    { name: 'Aurora Borealis', class: 'bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600' },
    { name: 'Sunset Mesh', class: 'bg-gradient-to-tr from-orange-400 via-rose-500 to-purple-600' },
    { name: 'Deep Space', class: 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900' },
    { name: 'Oceanic Drift', class: 'bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500' },
    { name: 'Midnight Neon', class: 'bg-gradient-to-br from-fuchsia-600 via-purple-700 to-indigo-800' },
    { name: 'Desert Sand', class: 'bg-gradient-to-tr from-amber-200 via-orange-300 to-rose-400' },
    { name: 'Glassy Frost', class: 'bg-gradient-to-br from-blue-100 via-indigo-200 to-blue-300' },
    { name: 'Modern Dark', class: 'bg-slate-900' },
  ];

  const [bannerEditorTab, setBannerEditorTab] = useState<'presets' | 'upload'>('presets');

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

  const handleServiceRoleChange = async (newRole: ServiceRole) => {
    setServiceRole(newRole);
    try {
      await updateProfile({ serviceRole: newRole });
      toast.success('Papel de campo atualizado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar papel de campo.');
      // Revert on error
      setServiceRole(user?.serviceRole || 'publisher');
    }
  };

  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const originalResult = reader.result as string;
          // Most profile photos don't need to be huge
          const compressedResult = await compressImage(originalResult, 800, 800, 0.8);
          await updateProfile({ photoURL: compressedResult });
          toast.success('Foto atualizada!');
        } catch (error) {
          console.error('Erro ao processar foto:', error);
          toast.error('Erro ao salvar foto.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const originalResult = reader.result as string;
          // Banners can be wider
          const compressedResult = await compressImage(originalResult, 1600, 900, 0.7);
          setBanner(compressedResult);
          await updateProfile({ banner: compressedResult });
          toast.success('Banner personalizado atualizado!');
        } catch (error) {
          console.error('Erro ao processar banner:', error);
          toast.error('Erro ao salvar banner.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectBannerPreset = async (presetClass: string) => {
    setBanner(presetClass);
    try {
      await updateProfile({ banner: presetClass });
      toast.success('Estilo do banner atualizado!');
    } catch (error) {
      toast.error('Erro ao salvar banner.');
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
      <div className="relative h-80 w-full overflow-hidden group">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: banner.startsWith('data:') || banner.startsWith('http') ? `url(${banner})` : undefined }}
        >
          {(!banner.startsWith('data:') && !banner.startsWith('http')) && (
            <div className={`w-full h-full ${banner}`} />
          )}
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-black/30 dark:from-slate-950 dark:via-transparent dark:to-black/50" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

        {/* Edit Banner Button */}
        <button
          onClick={() => setShowBannerEditor(!showBannerEditor)}
          className="absolute top-6 right-6 p-3 bg-black/20 backdrop-blur-md text-white rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 flex items-center gap-2 font-bold text-sm shadow-lg transform translate-y-[-10px] group-hover:translate-y-0 duration-300"
        >
          <Camera size={18} />
          <span className="hidden sm:inline">Personalizar Banner</span>
        </button>

        {showBannerEditor && (
          <div className="absolute inset-x-0 bottom-0 p-6 bg-black/60 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-bottom duration-300 z-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 overflow-x-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-6 py-2.5 bg-white text-indigo-900 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                  <Plus size={18} />
                  Da Galeria
                </button>
                <input
                  type="file"
                  ref={bannerInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleBannerUpload}
                />
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 px-2 scrollbar-hide">
                {bannerPresets.map((p) => (
                  <button
                    key={p.class}
                    onClick={() => selectBannerPreset(p.class)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${banner === p.class ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'} ${p.class}`}
                    title={p.name}
                  />
                ))}
              </div>

              <button
                onClick={() => setShowBannerEditor(false)}
                className="text-white font-bold text-sm opacity-60 hover:opacity-100"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-8 relative z-10 -mt-24">
        {/* Left Column: Identity & Menu */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-white/20 dark:border-slate-800 text-center relative overflow-hidden backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90">
            {/* Completion Ring */}
            <div className="relative mb-6 inline-block">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-100 dark:text-slate-800"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * completionPercentage) / 100}
                  className="text-indigo-500 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-inner">
                  <div className="w-full h-full rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {user?.name?.substring(0, 2).toUpperCase() || 'AU'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {completionPercentage}% Completo
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{user?.name}</h2>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 flex items-center justify-center gap-1.5 ">
              <Mail size={14} /> {user?.email}
            </p>

            <div className={`inline-flex px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider mb-8 items-center gap-2 ${roleColors[user?.role || 'publisher']} bg-opacity-10 border border-current border-opacity-20`}>
              <Shield size={14} />
              {roleLabels[user?.role || 'publisher']}
            </div>

            {/* Navigation Menu */}
            <div className="space-y-2 text-left pt-6 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium'}`}
              >
                <span className="flex items-center gap-3"><span className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm"><User size={16} /></span> Visão Geral</span>
                {activeTab === 'overview' && <ChevronRight size={16} />}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium'}`}
              >
                <span className="flex items-center gap-3"><span className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm"><Lock size={16} /></span> Conta e Segurança</span>
                {activeTab === 'settings' && <ChevronRight size={16} />}
              </button>

              <button
                onClick={() => setActiveTab('ministry')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'ministry' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium'}`}
              >
                <span className="flex items-center gap-3"><span className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm"><BookOpen size={16} /></span> Ministério</span>
                {activeTab === 'ministry' && <ChevronRight size={16} />}
              </button>

              <button
                onClick={() => setActiveTab('congregation')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'congregation' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium'}`}
              >
                <span className="flex items-center gap-3"><span className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm"><Building2 size={16} /></span> Congregação</span>
                {activeTab === 'congregation' && <ChevronRight size={16} />}
              </button>
            </div>
          </div>

          {/* Theme & Notifications Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                  <Moon size={18} /> Modo Escuro
                </div>
                <button onClick={toggleTheme} className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                  <Bell size={18} /> Notificações
                </div>
                <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`w-12 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms & Data */}
        <div className="lg:col-span-8 space-y-6">

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500 fade-in">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Star size={150} />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">Bem vindo de volta, {user?.name?.split(' ')[0]}!</h2>
                  <p className="text-indigo-100 mb-6 max-w-md">Seu perfil está {completionPercentage}% completo. Mantenha seus dados atualizados para aproveitar ao máximo.</p>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setActiveTab('ministry')} className="px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-xl font-bold text-sm hover:bg-white/30 transition-all border border-white/20 flex items-center gap-2">
                      <BookOpen size={16} /> Ver Ministério
                    </button>
                    {!user?.congregationId && (
                      <button onClick={() => setActiveTab('congregation')} className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg">
                        <Building2 size={16} /> Encontrar Congregação
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-gray-400" />
                  Atividade Recente
                </h3>
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4 items-start relative pb-6 last:pb-0">
                      {index !== recentActivity.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-100 dark:bg-slate-800"></div>
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${activity.color} bg-opacity-20`}>
                        <activity.icon size={18} className={activity.color.split(' ')[0]} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{activity.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS (Edit Profile) */}
          {activeTab === 'settings' && (

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

          )}

          {/* TAB: MINISTRY */}
          {activeTab === 'ministry' && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden animate-in slide-in-from-right duration-500 fade-in">
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
                    { id: 'publisher', label: 'Publicador', icon: User, goal: 'Sem meta' },
                    { id: 'auxiliary_pioneer', label: 'P. Auxiliar', icon: Clock, goal: '30h / 15h' },
                    { id: 'regular_pioneer', label: 'P. Regular', icon: Star, goal: '50h / 600h' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleServiceRoleChange(role.id as ServiceRole)}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${serviceRole === role.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-md shadow-indigo-500/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                    >
                      {serviceRole === role.id && (
                        <div className="absolute top-2 right-2 text-indigo-600 animate-in zoom-in spin-in-90 duration-300">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      <role.icon size={28} className={serviceRole === role.id ? 'text-indigo-600' : 'text-slate-400'} />
                      <span className="font-bold text-sm">{role.label}</span>
                      <span className="text-[10px] font-medium opacity-70">{role.goal}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          )}

          {/* TAB: CONGREGATION */}
{
    activeTab === 'congregation' && (
        <div className="space-y-8 animate-in slide-in-from-right duration-500 fade-in">
            {congregation ? (
                <>
                    {/* Premium Header Card */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-2xl border border-white/10 p-8 sm:p-10 group">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 p-12 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                            <Building2 size={300} />
                        </div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                            Congregação Verificada
                                        </span>
                                        <span className="text-slate-400 text-sm flex items-center gap-1">
                                            <Users size={14} /> {members.length} membros
                                        </span>
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                                        {congregation.name}
                                    </h2>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/code"
                                            onClick={() => {
                                                navigator.clipboard.writeText(congregation.code);
                                                setCopiedCode(true);
                                                setTimeout(() => setCopiedCode(false), 2000);
                                                toast.success('Código copiado!');
                                            }}
                                        >
                                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">ID</div>
                                            <code className="font-mono text-lg font-bold text-blue-200">{congregation.code}</code>
                                            {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-slate-400 group-hover/code:text-white transition-colors" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-3">
                                    {congregation.createdBy === user?.uid && (
                                        <button
                                            onClick={() => setShowDeleteCongModal(true)}
                                            className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-2xl transition-all shadow-lg backdrop-blur-sm"
                                            title="Configurações da Congregação"
                                        >
                                            <AlertTriangle size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowLeaveModal(true)}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl transition-all shadow-lg backdrop-blur-sm"
                                        title="Sair da Congregação"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-blue-500/30 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Users size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total de Membros</p>
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</h4>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Building2 size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Territórios Ativos</p>
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">12</h4>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-amber-500/30 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Calendar size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Relatórios (Mês)</p>
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">8</h4>
                            </div>
                        </div>
                    </div>

                    {/* Announcements Section */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-8 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                                    <Megaphone size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quadro de Avisos</h3>
                            </div>
                            <button
                                onClick={() => setShowAnnouncements(!showAnnouncements)}
                                className="text-amber-600 font-medium text-sm hover:underline"
                            >
                                {showAnnouncements ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>

                        {showAnnouncements && (
                            <div className="space-y-4 relative z-10 animate-in slide-in-from-top-4 duration-300">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 shadow-sm flex gap-4">
                                    <div className="w-1 bg-amber-500 rounded-full h-full shrink-0"></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Reunião para o Serviço de Campo</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Sábado às 09:00 - Grupo 1 (Local: Salão do Reino)</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Members Section */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Membros</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie as permissões da congregação</p>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar membro..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-xl outline-none text-sm transition-all w-full sm:w-64"
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {members
                                .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((member) => (
                                    <div key={member.uid} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-gray-100 dark:hover:border-slate-800 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg shadow-inner">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${member.role === 'admin' ? 'bg-amber-500 text-white' :
                                                        member.role === 'elder' ? 'bg-indigo-500 text-white' :
                                                            member.role === 'servant' ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                                                    }`}>
                                                    {member.role === 'admin' ? <Star size={10} fill="currentColor" /> :
                                                        member.role === 'elder' ? <Shield size={10} fill="currentColor" /> :
                                                            member.role === 'servant' ? <CheckCircle2 size={10} /> : <User size={10} />}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-white">{member.name}</span>
                                                    {member.uid === user?.uid && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">VOCÊ</span>}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{roleLabels[member.role || 'publisher']}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                            {member.uid !== user?.uid && canManageRole(member.role) && (
                                                <button
                                                    onClick={() => {
                                                        setEditingMember(member);
                                                        setSelectedRole(member.role || 'publisher');
                                                    }}
                                                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                                    title="Alterar Cargo"
                                                >
                                                    <BadgeCheck size={18} />
                                                </button>
                                            )}

                                            {member.uid !== user?.uid && canRemoveMember(member.role) && (
                                                <button
                                                    onClick={() => setRemovingMember(member)}
                                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    title="Remover Membro"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                            {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                        <Search size={24} />
                                    </div>
                                    <p className="text-gray-500 font-medium">Nenhum membro encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    <div className="relative z-10 max-w-md mx-auto px-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-8 transform rotate-3">
                            <Building2 size={48} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Nenhuma Congregação</h4>
                        <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                            Junte-se a uma congregação existente para colaborar nos territórios ou crie uma nova para começar a gerenciar.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95"
                            >
                                <Plus size={18} /> Criar Nova
                            </button>
                            <button
                                onClick={() => setShowJoinModal(true)}
                                className="px-8 py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl font-bold text-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                            >
                                <UserPlus size={18} /> Entrar com Código
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

        </div>

        {/* Role Editor Modal */}
        {
          editingMember && (
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
          )
        }

        {/* Create Congregation Modal */}
        {
          showCreateModal && (
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
          )
        }

        {/* Join Congregation Modal */}
        {
          showJoinModal && (
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
          )
        }



        {/* Remove Member Confirmation Modal */}
        {
          removingMember && (
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
          )
        }

        {/* Delete Congregation Modal */}
        {
          showDeleteCongModal && congregation && (
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
          )
        }

        {/* Leave Congregation Modal */}
        {
          showLeaveModal && (
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
          )
        }

        {/* Switch Congregation Modal */}
        {
          showSwitchModal && (
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
          )
        }
      </div>
    </div>
  );
};

export default Profile;
