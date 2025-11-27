import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  UserCheck,
  Lock
} from 'lucide-react';
import { mockUsers, mockTransactions, mockTickets, formatCurrency, formatDateTime } from '../utils/mockData';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'logs' | 'security'>('overview');

  if (!user || user.role !== 'admin') {
    return (
      <div>
        <h1 className="mb-6">Administration</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">Accès non autorisé. Cette page est réservée aux administrateurs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalUsers = mockUsers.length;
  const clientUsers = mockUsers.filter(u => u.role === 'client').length;
  const supportUsers = mockUsers.filter(u => u.role === 'support').length;
  const totalTransactions = mockTransactions.length;
  const openTickets = mockTickets.filter(t => t.status === 'open').length;
  
  const totalVolume = mockTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Mock security logs
  const securityLogs = [
    {
      id: 'log1',
      type: 'login_success',
      user: 'Jean Dupont',
      ip: '192.168.1.100',
      timestamp: '2025-11-26T10:30:00',
      severity: 'info'
    },
    {
      id: 'log2',
      type: 'failed_login',
      user: 'unknown@test.fr',
      ip: '45.123.45.67',
      timestamp: '2025-11-26T09:15:00',
      severity: 'warning'
    },
    {
      id: 'log3',
      type: 'password_change',
      user: 'Marie Martin',
      ip: '192.168.1.101',
      timestamp: '2025-11-25T16:45:00',
      severity: 'info'
    },
    {
      id: 'log4',
      type: 'multiple_failed_attempts',
      user: 'admin@banque.fr',
      ip: '23.45.67.89',
      timestamp: '2025-11-25T14:20:00',
      severity: 'critical'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Utilisateurs totaux</p>
                <h2 className="text-[#0066CC]">{totalUsers}</h2>
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
                <p className="text-gray-600 mb-1">Transactions</p>
                <h2 className="text-[#0066CC]">{totalTransactions}</h2>
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
                <p className="text-gray-600 mb-1">Volume total</p>
                <h2 className="text-[#0066CC]">{formatCurrency(totalVolume)}</h2>
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
                <p className="text-gray-600 mb-1">Tickets ouverts</p>
                <h2 className="text-orange-600">{openTickets}</h2>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-900">{transaction.recipient}</p>
                  <p className="text-gray-500 text-sm">{formatDateTime(transaction.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">{formatCurrency(transaction.amount)}</p>
                  <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-[#0066CC]" />
                </div>
                <div>
                  <p className="text-gray-900">{u.name}</p>
                  <p className="text-gray-500 text-sm">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                  {u.role === 'client' ? 'Client' : u.role === 'support' ? 'Support' : 'Admin'}
                </Badge>
                <Button variant="outline" size="sm">
                  Gérer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderLogs = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#0066CC]" />
          Logs système
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {securityLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={
                    log.severity === 'critical' ? 'default' :
                    log.severity === 'warning' ? 'secondary' : 'outline'
                  }>
                    {log.severity}
                  </Badge>
                  <p className="text-gray-900">{log.type.replace(/_/g, ' ')}</p>
                </div>
                <p className="text-gray-600 text-sm">
                  Utilisateur: {log.user} • IP: {log.ip}
                </p>
              </div>
              <p className="text-gray-500 text-sm">{formatDateTime(log.timestamp)}</p>
            </div>
          ))}
        </div>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-900">Tentatives de connexion suspectes</p>
                  <p className="text-red-700 text-sm mt-1">
                    5 tentatives de connexion échouées depuis l'IP 23.45.67.89
                  </p>
                  <p className="text-red-600 text-xs mt-2">{formatDateTime('2025-11-26T08:30:00')}</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600">
                  Bloquer IP
                </Button>
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-orange-900">Transaction inhabituelle détectée</p>
                  <p className="text-orange-700 text-sm mt-1">
                    Virement de 5000€ vers un nouveau bénéficiaire
                  </p>
                  <p className="text-orange-600 text-xs mt-2">{formatDateTime('2025-11-25T22:15:00')}</p>
                </div>
                <Button variant="outline" size="sm" className="text-orange-600">
                  Vérifier
                </Button>
              </div>
            </div>
          </div>
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
              <p className="text-gray-900">Authentification à deux facteurs obligatoire</p>
              <p className="text-gray-600 text-sm">Forcer l'A2F pour tous les utilisateurs</p>
            </div>
            <Badge variant="default" className="bg-green-600">Activé</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900">Blocage automatique après échecs</p>
              <p className="text-gray-600 text-sm">Bloquer après 5 tentatives échouées</p>
            </div>
            <Badge variant="default" className="bg-green-600">Activé</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900">Surveillance des transactions</p>
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
        <h1 className="mb-2">Administration</h1>
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
