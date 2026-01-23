import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map as MapIcon,
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
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Territories from './pages/Territories';
import TerritoryDetail from './pages/TerritoryDetail';
import MapPage from './pages/MapPage';
import Reports from './pages/Reports';
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-r border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl z-50 transform transition-all duration-500 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex flex-col items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 group-hover:scale-110 transition-transform duration-500 ease-out">
                <Layers className="text-white transition-transform duration-500 group-hover:rotate-12" size={32} />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">Territory<span className="text-blue-600 dark:text-blue-400">Pro</span></span>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
            {menuItems.map((item: any) => {
              if (item.children) {
                const isOpen = openMenus.includes(item.label);
                const isActive = item.children.some((child: any) => location.pathname === child.path);

                return (
                  <div key={item.label} className="space-y-1" style={{ animation: 'fadeInUp 0.4s ease-out both' }}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                        ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-600 dark:text-blue-400 font-semibold shadow-lg shadow-blue-500/10'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:shadow-md'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          <item.icon size={20} strokeWidth={2.5} />
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} />
                      </div>
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="pl-4 space-y-1 py-1">
                        {item.children.map((child: any) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 text-sm group ${isChildActive
                                ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-600 dark:text-blue-400 font-semibold shadow-md shadow-blue-500/10'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                                }`}
                            >
                              <div className={`transition-transform duration-300 ${isChildActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                <child.icon size={18} strokeWidth={2.5} />
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
                  style={{ animation: 'fadeInUp 0.4s ease-out both' }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-600 dark:text-blue-400 font-semibold shadow-lg shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white hover:shadow-md'
                    }`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <item.icon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-transparent to-slate-100/50 dark:to-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-slate-800 overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.substring(0, 2).toUpperCase() || 'US'
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all duration-300 font-medium group hover:shadow-lg hover:shadow-rose-500/10"
            >
              <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                <LogOut size={20} strokeWidth={2.5} />
              </div>
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
    <header className="sticky top-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 z-30 px-4 flex items-center justify-between lg:px-8 transition-colors">
      <div className="flex items-center gap-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 hidden sm:block">Gerenciamento de Territórios</h2>
      </div>

      <div className="flex items-center gap-4">
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
  if (loading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

const RoleProtectedRoute = ({ children, requiredPermission }: { children?: React.ReactNode, requiredPermission: string }) => {
  const { user, loading } = useAuth();
  const { canAccess } = usePermissions();

  if (loading) return <div>Carregando...</div>;
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
