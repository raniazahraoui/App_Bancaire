import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  History
} from 'lucide-react';
import { mockTransactions, formatCurrency, formatDate, maskIBAN } from '../utils/mockData';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = React.useState(true);
  const [showIBAN, setShowIBAN] = React.useState(false);

  if (!user || user.role !== 'client') {
    return (
      <div>
        <h1 className="mb-6">Tableau de bord</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">
              {user?.role === 'support' 
                ? 'Accédez à la section Support pour gérer les tickets clients.'
                : user?.role === 'admin'
                ? 'Accédez à la section Administration pour gérer la plateforme.'
                : 'Accès non autorisé'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainAccount = user.accounts[0];
  const savingsAccount = user.accounts[1];
  const totalBalance = user.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Bonjour, {user.name} 👋</h1>
        <p className="text-gray-600">Bienvenue sur votre espace bancaire</p>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-[#0066CC] to-[#0052A3] text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-blue-100 mb-2">Solde total</p>
              <div className="flex items-center gap-3">
                <h2 className="text-white">
                  {showBalance ? formatCurrency(totalBalance) : '••••••'}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:text-blue-100"
                >
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
              <p className="text-white">{showBalance ? formatCurrency(mainAccount.balance) : '••••••'}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Compte Épargne</p>
              <p className="text-white">{showBalance ? formatCurrency(savingsAccount.balance) : '••••••'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user.accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#0066CC]" />
                {account.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-600 mb-1">Numéro de compte</p>
                <p className="text-gray-900">{account.accountNumber}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-gray-600">IBAN</p>
                  <button
                    onClick={() => setShowIBAN(!showIBAN)}
                    className="text-[#0066CC] hover:text-[#0052A3]"
                  >
                    {showIBAN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-gray-900 break-all">
                  {showIBAN ? account.iban : maskIBAN(account.iban)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Solde disponible</p>
                <p className="text-[#0066CC]">
                  {showBalance ? formatCurrency(account.balance) : '••••••'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('transfer')}
            >
              <Send className="h-6 w-6 text-[#0066CC]" />
              <span>Virement</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('beneficiaries')}
            >
              <Users className="h-6 w-6 text-[#0066CC]" />
              <span>Bénéficiaires</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('transactions')}
            >
              <History className="h-6 w-6 text-[#0066CC]" />
              <span>Historique</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              onClick={() => onNavigate('support')}
            >
              <ArrowUpRight className="h-6 w-6 text-[#0066CC]" />
              <span>Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions récentes</CardTitle>
          <Button variant="ghost" onClick={() => onNavigate('transactions')}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}
                  `}>
                    {transaction.type === 'credit' ? (
                      <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-900">{transaction.recipient}</p>
                    <p className="text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`
                    ${transaction.type === 'credit' ? 'text-green-600' : 'text-gray-900'}
                  `}>
                    {transaction.type === 'credit' ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                  <p className={`
                    text-xs
                    ${transaction.status === 'completed' ? 'text-green-600' : 
                      transaction.status === 'pending' ? 'text-orange-600' : 'text-red-600'}
                  `}>
                    {transaction.status === 'completed' ? 'Complété' :
                     transaction.status === 'pending' ? 'En attente' : 'Échoué'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
