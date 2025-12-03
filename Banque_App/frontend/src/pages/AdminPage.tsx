import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  UserCheck,
  Lock,
  RefreshCw,
  Ban,
  Unlock,
  Trash2
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

interface Stats {
  users: {
    total_users: number;
    client_users: number;
    support_users: number;
    admin_users: number;
  };
  transactions: {
    total_transactions: number;
    total_volume: number;
    pending_transactions: number;
    completed_transactions: number;
    failed_transactions: number;
  };
  tickets: {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    resolved_tickets: number;
  };
}

interface User {
  id: number;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  phoneNumber?: string;
  createdAt: string;
  lastLogin?: string;
  failedAttempts: number;
  isLocked: boolean;
  lockUntil?: string;
}

interface Transaction {
  id: number;
  fromAccount: string;
  toAccount: string;
  fromName: string;
  toName: string;
  recipient: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
}

interface SecurityLog {
  id: number;
  userId: number;
  user: string;
  email: string;
  action: string;
  type: string;
  ipAddress: string;
  status: string;
  severity: string;
  timestamp: string;
}

interface SecurityAlert {
  type: string;
  severity: string;
  message: string;
  ipAddress?: string;
  attemptCount?: number;
  amount?: number;
  createdAt?: string;
}

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'logs' | 'security'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };
  // Changer le rôle d'un utilisateur
const changeUserRole = async (userId: number, currentRole: string) => {
  const roles = ['client', 'support', 'admin'] as const;
  type Role = typeof roles[number];

  // Sécurise currentRole en Role (évite les erreurs TS)
  const safeCurrentRole = currentRole as Role;

  const roleLabels: Record<Role, string> = {
    client: 'Client',
    support: 'Support',
    admin: 'Administrateur'
  };

  const options = roles
    .filter((r) => r !== safeCurrentRole)
    .map((r) => `${r}: ${roleLabels[r]}`)
    .join('\n');

  const newRole = prompt(
    `Changer le rôle de l'utilisateur:\n\n${options}\n\nEntrez le nouveau rôle (client, support, admin):`
  );

  if (!newRole) return;

  const selected = newRole.toLowerCase() as Role;

  if (!roles.includes(selected)) {
    alert('Rôle invalide. Veuillez choisir: client, support ou admin');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/change-role`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newRole: selected })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Rôle changé avec succès: ${data.oldRole} → ${data.newRole}`);
      loadUsers(); // Recharge la liste
    } else {
      alert(data.message || 'Erreur lors du changement de rôle');
    }
  } catch (error) {
    console.error('Erreur lors du changement de rôle:', error);
    alert('Erreur lors du changement de rôle');
  }
};


  const formatDateTime = (date: string) => {
    return new Intl.DateTimeFormat('fr-TN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // Charger les statistiques
  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les utilisateurs
  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      });
      const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les transactions
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/transactions?limit=10`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les logs
  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/logs?limit=20`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les alertes de sécurité
  const loadSecurityAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/security/alerts`, {
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        const allAlerts = [
          ...data.alerts.suspiciousLogins,
          ...data.alerts.unusualTransactions,
          ...data.alerts.lockedAccounts
        ];
        setAlerts(allAlerts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Débloquer un utilisateur
  const unlockUser = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/unlock`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        alert('Utilisateur débloqué avec succès');
        loadUsers();
      } else {
        alert(data.message || 'Erreur lors du déblocage');
      }
    } catch (error) {
      console.error('Erreur lors du déblocage:', error);
      alert('Erreur lors du déblocage de l\'utilisateur');
    }
  };

  // Bloquer une IP
  const blockIP = async (ipAddress: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/security/block-ip`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ 
          ipAddress, 
          reason: 'Tentatives de connexion suspectes' 
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`IP ${ipAddress} bloquée avec succès`);
        loadSecurityAlerts();
      } else {
        alert(data.message || 'Erreur lors du blocage de l\'IP');
      }
    } catch (error) {
      console.error('Erreur lors du blocage de l\'IP:', error);
      alert('Erreur lors du blocage de l\'IP');
    }
  };

  // Supprimer un utilisateur
  const deleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      const data = await response.json();
      if (data.success) {
        alert('Utilisateur supprimé avec succès');
        loadUsers();
      } else {
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  useEffect(() => {
    if (selectedTab === 'overview') {
      loadStats();
      loadTransactions();
    } else if (selectedTab === 'users') {
      loadUsers();
    } else if (selectedTab === 'logs') {
      loadLogs();
    } else if (selectedTab === 'security') {
      loadSecurityAlerts();
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === 'users') {
      const timeoutId = setTimeout(() => {
        loadUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [roleFilter, searchTerm]);

  if (!user || user.role !== 'admin') {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Administration</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">Accès non autorisé. Cette page est réservée aux administrateurs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1 text-sm">Utilisateurs totaux</p>
                <h2 className="text-3xl font-bold text-[#0066CC]">
                  {stats?.users.total_users || 0}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.users.client_users || 0} clients • {stats?.users.support_users || 0} support
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1 text-sm">Transactions</p>
                <h2 className="text-3xl font-bold text-[#0066CC]">
                  {stats?.transactions.total_transactions || 0}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.transactions.completed_transactions || 0} réussies
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1 text-sm">Volume total</p>
                <h2 className="text-2xl font-bold text-[#0066CC]">
                  {formatCurrency(stats?.transactions.total_volume || 0)}
                </h2>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1 text-sm">Tickets ouverts</p>
                <h2 className="text-3xl font-bold text-orange-600">
                  {stats?.tickets.open_tickets || 0}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.tickets.in_progress_tickets || 0} en cours
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#0066CC]" />
            Activité récente
            <Button
              variant="ghost"
              size="sm"
              onClick={loadTransactions}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Chargement...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucune transaction récente</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-gray-900 font-medium">{transaction.recipient}</p>
                    <p className="text-gray-500 text-sm">{formatDateTime(transaction.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-semibold">{formatCurrency(transaction.amount)}</p>
                    <Badge variant={transaction.status === 'réussie' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

const renderUsers = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-[#0066CC]" />
        Gestion des utilisateurs
        <Button
          variant="ghost"
          size="sm"
          onClick={loadUsers}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardTitle>
      <div className="flex gap-4 mt-4">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">Tous les rôles</option>
          <option value="client">Clients</option>
          <option value="support">Support</option>
          <option value="admin">Administrateurs</option>
        </select>
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <p className="text-center text-gray-500 py-4">Chargement...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Aucun utilisateur trouvé</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-[#0066CC]" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">{u.name}</p>
                  <p className="text-gray-500 text-sm">{u.email}</p>
                  {u.isLocked && (
                    <p className="text-red-600 text-xs mt-1">
                      🔒 Compte verrouillé ({u.failedAttempts} tentatives)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                  {u.role === 'client' ? 'Client' : u.role === 'support' ? 'Support' : 'Admin'}
                </Badge>
                
                {/* Bouton Changer le rôle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeUserRole(u.id, u.role)}
                  className="text-blue-600"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Changer rôle
                </Button>

                {u.isLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unlockUser(u.id)}
                    className="text-green-600"
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Débloquer
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteUser(u.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
  const renderLogs = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#0066CC]" />
          Logs système
          <Button
            variant="ghost"
            size="sm"
            onClick={loadLogs}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-gray-500 py-4">Chargement...</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Aucun log disponible</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={
                      log.status === 'échouée' ? 'default' : 'outline'
                    }>
                      {log.severity}
                    </Badge>
                    <p className="text-gray-900">{log.action}</p>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Utilisateur: {log.user} • IP: {log.ipAddress}
                  </p>
                </div>
                <p className="text-gray-500 text-sm">{formatDateTime(log.timestamp)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Alertes de sécurité
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSecurityAlerts}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Chargement...</p>
          ) : alerts.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucune alerte de sécurité</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    alert.severity === 'warning' ? 'bg-orange-50 border-orange-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'warning' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        alert.severity === 'critical' ? 'text-red-900' :
                        alert.severity === 'warning' ? 'text-orange-900' :
                        'text-blue-900'
                      }`}>
                        {alert.type === 'suspicious_login' ? 'Tentatives de connexion suspectes' :
                         alert.type === 'unusual_transaction' ? 'Transaction inhabituelle détectée' :
                         'Compte verrouillé'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        alert.severity === 'critical' ? 'text-red-700' :
                        alert.severity === 'warning' ? 'text-orange-700' :
                        'text-blue-700'
                      }`}>
                        {alert.message}
                      </p>
                      {alert.createdAt && (
                        <p className={`text-xs mt-2 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          {formatDateTime(alert.createdAt)}
                        </p>
                      )}
                    </div>
                    {alert.type === 'suspicious_login' && alert.ipAddress && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => blockIP(alert.ipAddress!)}
                        className="text-red-600"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Bloquer IP
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#0066CC]" />
            Paramètres de sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900 font-medium">Authentification à deux facteurs obligatoire</p>
              <p className="text-gray-600 text-sm">Forcer l'A2F pour tous les utilisateurs</p>
            </div>
            <Badge variant="default" className="bg-green-600">Activé</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900 font-medium">Blocage automatique après échecs</p>
              <p className="text-gray-600 text-sm">Bloquer après 5 tentatives échouées</p>
            </div>
            <Badge variant="default" className="bg-green-600">Activé</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900 font-medium">Surveillance des transactions</p>
              <p className="text-gray-600 text-sm">Alertes pour transactions suspectes</p>
            </div>
            <Badge variant="default" className="bg-green-600">Activé</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Administration</h1>
        <p className="text-gray-600">Supervision et gestion de la plateforme</p>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-2">
          <div className="flex gap-2">
            <Button
              variant={selectedTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('overview')}
              className={selectedTab === 'overview' ? 'bg-[#0066CC]' : ''}
            >
              <Activity className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </Button>
            <Button
              variant={selectedTab === 'users' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('users')}
              className={selectedTab === 'users' ? 'bg-[#0066CC]' : ''}
            >
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </Button>
            <Button
              variant={selectedTab === 'logs' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('logs')}
              className={selectedTab === 'logs' ? 'bg-[#0066CC]' : ''}
            >
              <Activity className="h-4 w-4 mr-2" />
              Logs
            </Button>
            <Button
              variant={selectedTab === 'security' ? 'default' : 'ghost'}
              onClick={() => setSelectedTab('security')}
              className={selectedTab === 'security' ? 'bg-[#0066CC]' : ''}
            >
              <Shield className="h-4 w-4 mr-2" />
              Sécurité
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'users' && renderUsers()}
      {selectedTab === 'logs' && renderLogs()}
      {selectedTab === 'security' && renderSecurity()}
    </div>
  );
};