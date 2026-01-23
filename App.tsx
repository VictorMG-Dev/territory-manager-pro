import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map as MapIcon,
  // ... (omitting irrelevant imports for brevity in context, but keeping file structure valid if I were rewriting whole file. Since I am replacing chunks, I will target specific lines)

  // ACTUALLY, I need to be careful with replace_file_content.
  // I will split this into two replacements if needed or one large block if contiguous.
  // App.tsx imports are at top. Sidebar is further down.
  // I will use multi_replace.

  Layers,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  Calendar,
  Users,
  Navigation,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Territories from './pages/Territories';
import TerritoryDetail from './pages/TerritoryDetail';
import MapPage from './pages/MapPage';
import Reports from './pages/Reports';
import ServiceReportPage from './pages/ServiceReport';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import WeeklyPlanning from './pages/WeeklyPlanning';
import Groups from './pages/Groups';
import AccessDenied from './pages/AccessDenied';
import Tracking from './pages/Tracking';
import TrackingHistory from './pages/TrackingHistory';
import TrackingAdmin from './pages/TrackingAdmin';
import ChatBot from './components/ChatBot';
import LoadingScreen from './components/LoadingScreen';
import { usePermissions } from './hooks/usePermissions';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { permissions } = usePermissions();
  const [openMenus, setOpenMenus] = useState<string[]>(['Controle ADM']);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'canAccessDashboard' },
    { icon: Layers, label: 'Territórios', path: '/territories', permission: 'canAccessTerritories' },
    { icon: Users, label: 'Grupos', path: '/groups', permission: 'canAccessGroups' },
    { icon: MapIcon, label: 'Mapa Global', path: '/map', permission: 'canAccessMap' },
    { icon: Calendar, label: 'Planejamento', path: '/planning', permission: 'canAccessPlanning' },
    { icon: Navigation, label: 'Iniciar Ministério', path: '/tracking', permission: 'canAccessTracking' },
    { icon: Clock, label: 'Meu Relatório', path: '/service-report', permission: 'canAccessReports' },
    {
      icon: Shield,
      label: 'Controle ADM',
      children: [
        { icon: Calendar, label: 'Meu Histórico', path: '/tracking/history', permission: 'canAccessTrackingHistory' },
        { icon: FileText, label: 'Aprov. de Relatórios', path: '/tracking/admin', permission: 'canAccessTrackingAdmin' },
      ]
    },
    { icon: FileText, label: 'Relatórios', path: '/reports', permission: 'canAccessReports' },
    { icon: User, label: 'Perfil', path: '/profile', permission: 'canAccessProfile' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.reduce((acc: any[], item: any) => {
    if (item.children) {
      const visibleChildren = item.children.filter((child: any) =>
        permissions[child.permission as keyof typeof permissions] || user?.role === 'admin'
      );
      if (visibleChildren.length > 0) {
        acc.push({ ...item, children: visibleChildren });
      }
    } else if (permissions[item.permission as keyof typeof permissions] || user?.role === 'admin') {
      acc.push(item);
    }
    return acc;
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none z-50 transform transition-all duration-300 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex flex-col items-center gap-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 dark:shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500 ease-out border border-white/20 dark:border-white/10">
                <Layers className="text-white transition-transform duration-500 group-hover:rotate-12" size={32} />
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Territory<span className="text-blue-600 dark:text-blue-400">Pro</span></span>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
            {menuItems.map((item: any) => {
              if (item.children) {
                const isOpen = openMenus.includes(item.label);
                const isActive = item.children.some((child: any) => location.pathname === child.path);

                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group border border-transparent ${isActive
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                          <item.icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <div className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} />
                      </div>
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-4 space-y-1 py-1 relative">
                        {/* Connecting line for submenus */}
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"></div>

                        {item.children.map((child: any) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm group relative z-10 ${isChildActive
                                ? 'bg-white dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 font-semibold shadow-sm border border-slate-200 dark:border-slate-700/50'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                              <div className={`transition-transform duration-300 ${isChildActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                <child.icon size={18} strokeWidth={isChildActive ? 2.5 : 2} />
                              </div>
                              <span className="font-medium">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border border-transparent ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium active:scale-[0.98]'
                    }`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'} />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none transition-all duration-300 group hover:border-blue-200 dark:hover:border-blue-500/30">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-slate-700 overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-300">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.substring(0, 2).toUpperCase() || 'US'
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all duration-200 font-medium text-sm group"
            >
              <LogOut size={18} strokeWidth={2} className="group-hover:stroke-rose-600 dark:group-hover:stroke-rose-400 transition-colors" />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) => {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 z-30 px-4 flex items-center justify-between lg:px-8 transition-colors shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white hidden sm:block tracking-tight">Gerenciamento de Territórios</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Header Actions can go here */}
      </div>
    </header>
  );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 lg:ml-64 flex flex-col transition-all">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
      <ChatBot />
      <Toaster position="top-right" />
    </div>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const RoleProtectedRoute = ({ children, requiredPermission }: { children?: React.ReactNode, requiredPermission: string }) => {
  const { user, loading } = useAuth();
  const { canAccess } = usePermissions();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  if (!canAccess(requiredPermission as any)) {
    return <Navigate to="/access-denied" />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/access-denied" element={<ProtectedRoute><AccessDenied /></ProtectedRoute>} />
              <Route path="/" element={<RoleProtectedRoute requiredPermission="canAccessDashboard"><Dashboard /></RoleProtectedRoute>} />
              <Route path="/territories" element={<RoleProtectedRoute requiredPermission="canAccessTerritories"><Territories /></RoleProtectedRoute>} />
              <Route path="/territory/:id" element={<RoleProtectedRoute requiredPermission="canAccessTerritories"><TerritoryDetail /></RoleProtectedRoute>} />
              <Route path="/groups" element={<RoleProtectedRoute requiredPermission="canAccessGroups"><Groups /></RoleProtectedRoute>} />
              <Route path="/map" element={<RoleProtectedRoute requiredPermission="canAccessMap"><MapPage /></RoleProtectedRoute>} />
              <Route path="/planning" element={<RoleProtectedRoute requiredPermission="canAccessPlanning"><WeeklyPlanning /></RoleProtectedRoute>} />
              <Route path="/service-report" element={<RoleProtectedRoute requiredPermission="canAccessReports"><ServiceReportPage /></RoleProtectedRoute>} />
              <Route path="/reports" element={<RoleProtectedRoute requiredPermission="canAccessReports"><Reports /></RoleProtectedRoute>} />
              <Route path="/profile" element={<RoleProtectedRoute requiredPermission="canAccessProfile"><Profile /></RoleProtectedRoute>} />
              <Route path="/tracking" element={<RoleProtectedRoute requiredPermission="canAccessTracking"><Tracking /></RoleProtectedRoute>} />
              <Route path="/tracking/history" element={<RoleProtectedRoute requiredPermission="canAccessTrackingHistory"><TrackingHistory /></RoleProtectedRoute>} />
              <Route path="/tracking/admin" element={<RoleProtectedRoute requiredPermission="canAccessTrackingAdmin"><TrackingAdmin /></RoleProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
