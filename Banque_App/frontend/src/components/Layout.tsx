import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Send, 
  Users, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Tableau de bord', icon: LayoutDashboard, page: 'dashboard', roles: ['client', 'support', 'admin'] },
    { name: 'Virement', icon: Send, page: 'transfer', roles: ['client'] },
    { name: 'Bénéficiaires', icon: Users, page: 'beneficiaries', roles: ['client'] },
    { name: 'Historique', icon: History, page: 'transactions', roles: ['client'] },
    { name: 'Paramètres', icon: Settings, page: 'settings', roles: ['client', 'support', 'admin'] },
    { name: 'Support', icon: HelpCircle, page: 'support', roles: ['client', 'support'] },
    { name: 'Administration', icon: Shield, page: 'admin', roles: ['admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || 'client')
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0066CC] rounded-lg flex items-center justify-center">
              <span className="text-white">B</span>
            </div>
            <span className="text-[#0066CC]">Ma Banque</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-3 p-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-[#0066CC] rounded-xl flex items-center justify-center">
              <span className="text-white">B</span>
            </div>
            <span className="text-[#0066CC]">Ma Banque</span>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 mt-16 lg:mt-0">
            <p className="text-gray-900">{user?.name}</p>
            <p className="text-gray-500">{user?.email}</p>
            <div className="mt-2 inline-block px-2 py-1 bg-blue-100 text-[#0066CC] rounded text-xs">
              {user?.role === 'client' ? 'Client' : user?.role === 'support' ? 'Support' : 'Admin'}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-[#0066CC] text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        <main className="p-4 lg:p-8 mt-16 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};
