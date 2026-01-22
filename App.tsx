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
        // { icon: Calendar, label: 'Meu Histórico', path: '/tracking/history', permission: 'canAccessTrackingHistory' },
        // { icon: FileText, label: 'Aprov. de Relatórios', path: '/tracking/admin', permission: 'canAccessTrackingAdmin' },
        { icon: User, label: 'Teste de Menu', path: '/profile', permission: 'canAccessProfile' },
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

      <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Territory<span className="text-blue-600">Pro</span></span>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
            {menuItems.map((item: any) => {
              if (item.children) {
                const isOpen = openMenus.includes(item.label);
                const isActive = item.children.some((child: any) => location.pathname === child.path);

                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive
                        ? 'text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </div>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {isOpen && (
                      <div className="pl-4 space-y-1">
                        {item.children.map((child: any) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${isChildActive
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                              <child.icon size={18} />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs ring-2 ring-white dark:ring-slate-800 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.substring(0, 2).toUpperCase() || 'US'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all font-medium"
            >
              <LogOut size={20} />
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
