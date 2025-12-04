import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

import { 
  Card, CardContent, CardHeader, CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Eye, 
  EyeOff,
  TrendingUp,
  CreditCard,
  Send,
  Users,
  History,
  Settings,
  LogOut,
  User,
  Lock,
  Menu,
  X,
  HelpCircle
} from 'lucide-react';
import { formatCurrency, formatDate, maskIBAN } from '../utils/mockData';
import { ClientSupportPage } from './ClientSupportPage';
import { BeneficiariesPage } from "./BeneficiariesPage";

// Types
interface Account {
  id_account: number;
  account_number: string;
  iban: string;
  rib: string;
  balance: number;
  account_type: 'courant' | 'épargne';
}

interface Transaction {
  id_transaction: number;
  id_account_from: number;
  id_account_to: number;
  amount: number;
  status: 'en attente' | 'réussie' | 'refusée';
  created_at: string;
}

interface Client {
  id_client: number;
  first_name: string;
  last_name: string;
  address?: string;
  date_of_birth?: string;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

// Composant Paramètres
const SettingsView: React.FC<{ clientInfo: Client | null; token: string | null }> = ({ clientInfo, token }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [formData, setFormData] = useState({
    firstName: clientInfo?.first_name || '',
    lastName: clientInfo?.last_name || '',
    address: clientInfo?.address || '',
    dateOfBirth: clientInfo?.date_of_birth || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const validatePassword = (password: string) => {
  // Regex : min 8, au moins 1 maj, 1 min, 1 chiffre, 1 symbole
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
  if (!regex.test(password)) return "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.";

  // Vérifier qu'il ne contient pas le prénom ou le nom
  const lowerPass = password.toLowerCase();
  if (clientInfo) {
    if (clientInfo.first_name && lowerPass.includes(clientInfo.first_name.toLowerCase()))
      return "Le mot de passe ne doit pas contenir votre prénom.";
    if (clientInfo.last_name && lowerPass.includes(clientInfo.last_name.toLowerCase()))
      return "Le mot de passe ne doit pas contenir votre nom.";
  }

  return null; // mot de passe valide
};

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const response = await axios.put(
        'http://localhost:5000/api/update-profile',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
    }
  };
  

const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage(null);

  // Vérifier que les mots de passe correspondent
  if (passwordData.newPassword !== passwordData.confirmPassword) {
    setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
    return;
  }

  // Validation complète du mot de passe
  const validationError = validatePassword(passwordData.newPassword);
  if (validationError) {
    setMessage({ type: 'error', text: validationError });
    return;
  }

  try {
    const response = await axios.put(
      'http://localhost:5000/api/change-password',
      {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  } catch (err: any) {
    setMessage({ 
      type: 'error', 
      text: err.response?.data?.message || 'Erreur lors du changement de mot de passe' 
    });
  }
};


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-gray-600">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-[#0066CC] border-b-2 border-[#0066CC]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations personnelles
          </div>
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'password'
              ? 'text-[#0066CC] border-b-2 border-[#0066CC]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Mot de passe
          </div>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier mes informations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                />
              </div>
              <Button type="submit" className="bg-[#0066CC] hover:bg-[#0052A3] text-white">
                Enregistrer les modifications
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Changer mon mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordData.newPassword}

                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  required
                  placeholder="Min 8 caractères, 1 maj, 1 min, 1 chiffre, 1 symbole, ne pas inclure prénom/nom"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  required
                />
              </div>
              <Button type="submit" className="bg-[#0066CC] hover:bg-[#0052A3] text-white">
                Changer le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, token, logout } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [showIBAN, setShowIBAN] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'settings' | 'support'|'beneficiaire'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        
        const config = { 
          headers: { Authorization: `Bearer ${token}` },
          baseURL: 'http://localhost:5000'
        };

        const [clientRes, accountsRes, transactionsRes] = await Promise.all([
          axios.get('/api/client-info', config),
          axios.get('/api/accounts', config),
          axios.get('/api/transactions', config),
        ]);

        if (clientRes.data.success) {
          setClientInfo(clientRes.data.client);
        }
        
        setAccounts(accountsRes.data.accounts || []);
        setTransactions(transactionsRes.data.transactions || []);

      } catch (err) {
        console.error('Erreur récupération données client:', err);
        
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            setError('Session expirée. Veuillez vous reconnecter.');
            logout();
          } else {
            setError('Erreur lors du chargement des données.');
          }
        } else {
          setError('Une erreur inattendue est survenue.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user, token, logout]);

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  const mainAccount = accounts?.[0];
  const savingsAccount = accounts?.find(acc => acc.account_type === 'épargne');
  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
  const recentTransactions = transactions?.slice(0, 5) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || user.role !== 'client') {
    return (
      <div>
        <h1 className="mb-6">Tableau de bord</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">Accès non autorisé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec menu */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et nom */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0066CC] flex items-center justify-center text-white font-semibold">
                {clientInfo?.first_name?.[0]}{clientInfo?.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {clientInfo?.first_name} {clientInfo?.last_name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>

            {/* Menu dropdown */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {menuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <TrendingUp className="h-5 w-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Tableau de bord</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('support');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <HelpCircle className="h-5 w-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Support</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('settings');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Settings className="h-5 w-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Paramètres</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-600">Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bonjour, {clientInfo?.first_name} 👋</h1>
              <p className="text-gray-600">Bienvenue sur votre espace bancaire</p>
            </div>

            {/* Total Balance Card */}
            <Card className="bg-gradient-to-br from-[#0066CC] to-[#0052A3] text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-blue-100 mb-2">Solde total</p>
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-white">{showBalance ? formatCurrency(totalBalance) : '••••••'}</h2>
                      <button onClick={() => setShowBalance(!showBalance)} className="text-white hover:text-blue-100">
                        {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Compte Courant</p>
                    <p className="text-xl font-semibold text-white">{mainAccount ? (showBalance ? formatCurrency(mainAccount.balance) : '••••••') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Compte Épargne</p>
                    <p className="text-xl font-semibold text-white">{savingsAccount ? (showBalance ? formatCurrency(savingsAccount.balance) : '••••••') : '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            {accounts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {accounts.map(account => (
                  <Card key={account.id_account}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 capitalize">
                        <CreditCard className="h-5 w-5 text-[#0066CC]" />
                        Compte {account.account_type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Numéro de compte</p>
                        <p className="font-medium text-gray-900">{account.account_number}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-600">IBAN</p>
                          <button onClick={() => setShowIBAN(!showIBAN)} className="text-[#0066CC] hover:text-[#0052A3]">
                            {showIBAN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="font-medium text-gray-900 break-all">{showIBAN ? account.iban : maskIBAN(account.iban)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Solde disponible</p>
                        <p className="text-2xl font-bold text-[#0066CC]">{showBalance ? formatCurrency(account.balance) : '••••••'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">Aucun compte disponible</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => onNavigate('transfer')}>
                    <Send className="h-6 w-6 text-[#0066CC]" />
                    <span>Virement</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => onNavigate('beneficiaries')}>
                    <Users className="h-6 w-6 text-[#0066CC]" />
                    <span>Bénéficiaires</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => onNavigate('transactions')}>
                    <History className="h-6 w-6 text-[#0066CC]" />
                    <span>Historique</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => setActiveView('support')}>
                    <HelpCircle className="h-6 w-6 text-[#0066CC]" />
                    <span>Support</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transactions récentes</CardTitle>
                <Button variant="ghost" onClick={() => onNavigate('transactions')}>Voir tout</Button>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map(tx => (
                      <div key={tx.id_transaction} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'réussie' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tx.status === 'réussie' ? <ArrowDownLeft className="h-5 w-5 text-green-600" /> : <ArrowUpRight className="h-5 w-5 text-red-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Compte {tx.id_account_to}</p>
                            <p className="text-sm text-gray-500">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.status === 'réussie' ? 'text-green-600' : 'text-gray-900'}`}>
                            {tx.status === 'réussie' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                          <p className={`text-xs ${tx.status === 'réussie' ? 'text-green-600' : tx.status === 'en attente' ? 'text-orange-600' : 'text-red-600'}`}>
                            {tx.status === 'réussie' ? 'Complété' : tx.status === 'en attente' ? 'En attente' : 'Échoué'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">Aucune transaction récente</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'support' && (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setActiveView('dashboard')}
              className="mb-4"
            >
              ← Retour au tableau de bord
            </Button>
            <ClientSupportPage />
          </div>
        )}
        


        {activeView === 'settings' && (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setActiveView('dashboard')}
              className="mb-4"
            >
              ← Retour au tableau de bord
            </Button>
            <SettingsView clientInfo={clientInfo} token={token} />
          </div>
        )}
      </main>
    </div>
  );
};