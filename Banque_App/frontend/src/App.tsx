import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { Dashboard } from './pages/DashboardPage';
import { ClientSupportPage } from './pages/ClientSupportPage';
import { SupportTeamPage } from './pages/SupportTeamPage';
import { AdminPage } from './pages/AdminPage';
import { TransferPage } from './pages/TransferPage';
import { BeneficiariesPage } from "./pages/BeneficiariesPage";


import { Toaster } from './components/ui/sonner';


type AuthScreen =
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'transfer'
  | 'support'
  | 'admin'
  | 'beneficiaries';


const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');

  const handleNavigate = (page: AuthScreen) => {
    setCurrentScreen(page);
  };
  

  // Redirection automatique après authentification
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'client':
          setCurrentScreen('dashboard');
          break;
        case 'support':
          setCurrentScreen('support');
          break;
        case 'admin':
          setCurrentScreen('admin');
          break;
        default:
          setCurrentScreen('login');
      }
    }
  }, [isAuthenticated, user]);

  if (isAuthenticated && user) {
    switch (currentScreen) {
      case 'dashboard':
        return user.role === 'client' ? (
          <Dashboard onNavigate={handleNavigate as (page: string) => void} />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <p className="text-red-600 text-lg">Accès non autorisé</p>
          </div>
        );

      case 'support':
        if (user.role === 'client') {
          return <ClientSupportPage />;
        } else if (user.role === 'support') {
          return <SupportTeamPage />;
        } else {
          return (
            <div className="flex items-center justify-center h-screen">
              <p className="text-red-600 text-lg">Accès non autorisé</p>
            </div>
          );
        }


      case 'admin':
        return user.role === 'admin' ? (
          <AdminPage />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <p className="text-red-600 text-lg">Accès non autorisé</p>
          </div>
        );
       case 'beneficiaries':
        return user.role === 'client' ? (
          <BeneficiariesPage  onNavigate={handleNavigate as (page: string) => void} />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <p className="text-red-600 text-lg">Accès non autorisé</p>
          </div>
        );
      case 'transfer':
        return user.role === 'client' ? (
          <TransferPage onNavigate={handleNavigate as (page: string) => void} />
        ) : (
          <div className="flex items-center justify-center h-screen">
            <p className="text-red-600 text-lg">Accès non autorisé</p>
          </div>
        );


      default:
        return <LoginPage />;
    }
  }

  // Si non connecté
  switch (currentScreen) {
    case 'login':
      return <LoginPage />;
    case 'signup':
      return <SignUpPage />;
    default:
      return <LoginPage />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
};

export default App;
