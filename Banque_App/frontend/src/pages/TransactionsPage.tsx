import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Search,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface Transaction {
  id: number;
  amount: number;
  currency: string;
  status: 'en attente' | 'réussie' | 'refusée';
  reference: string | null;
  createdAt: string;
  confirmedAt: string | null;
  type: 'sent' | 'received' | 'unknown';
  description: string;
  fromAccount: {
    id: number;
    number: string;
    type: string;
    holder: string | null;
  };
  toAccount: {
    id: number;
    number: string;
    type: string;
    holder: string | null;
  } | null;
  beneficiary: {
    name: string;
    bank: string;
    type: string;
  } | null;
}

interface TransactionStats {
  sent: { count: number; total: number };
  received: { count: number; total: number };
  pending: number;
  completed: number;
  failed: number;
}

interface Account {
  id_account: number;
  account_number: string;
  balance: number;
}
interface TransactionsPageProps {
  onNavigate: (page: string) => void;
}


export const TransactionsPage: React.FC<TransactionsPageProps> = ({ onNavigate }) => {

  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    accountId: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters.type, filters.status, filters.accountId, filters.startDate, filters.endDate]);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Erreur récupération comptes:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.accountId !== 'all') params.append('accountId', filters.accountId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${API_URL}/transactions/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      toast.error('Erreur lors de la récupération des transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions/stats?period=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erreur récupération stats:', error);
    }
  };

  const handleCancelTransaction = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette transaction ?')) return;

    try {
      const response = await axios.post(
        `${API_URL}/transactions/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Transaction annulée avec succès');
        fetchTransactions();
        fetchStats();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  const handleViewDetails = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'réussie':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'en attente':
        return <Clock className="h-4 w-4" />;
      case 'refusée':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'réussie':
        return 'bg-green-100 text-green-800';
      case 'en attente':
        return 'bg-amber-100 text-amber-800';
      case 'refusée':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(t => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      t.description.toLowerCase().includes(search) ||
      t.fromAccount.number.toLowerCase().includes(search) ||
      t.toAccount?.number.toLowerCase().includes(search) ||
      t.beneficiary?.name.toLowerCase().includes(search) ||
      t.reference?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-2">Historique des transactions</h1>
        <p className="text-gray-600">Consultez toutes vos opérations bancaires</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Envoyés</p>
                  <p className="text-2xl font-bold">{stats.sent.count}</p>
                  <p className="text-sm text-gray-500">{stats.sent.total.toFixed(2)} TND</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reçus</p>
                  <p className="text-2xl font-bold">{stats.received.count}</p>
                  <p className="text-sm text-gray-500">{stats.received.total.toFixed(2)} TND</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Réussies</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Refusées</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={filters.type} onValueChange={(v:string) => setFilters({ ...filters, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="sent">Envoyés</SelectItem>
                  <SelectItem value="received">Reçus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={filters.status} onValueChange={(v:string) => setFilters({ ...filters, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="réussie">Réussies</SelectItem>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="refusée">Refusées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compte</Label>
              <Select value={filters.accountId} onValueChange={(v:string) => setFilters({ ...filters, accountId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les comptes</SelectItem>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id_account} value={acc.id_account.toString()}>
                      {acc.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date début</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>


        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
           
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066CC] mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Aucune transaction trouvée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-full ${
                      transaction.type === 'sent' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {transaction.type === 'sent' ? (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">
                          {transaction.fromAccount.number}
                          {transaction.toAccount && ` → ${transaction.toAccount.number}`}
                        </p>
                        {transaction.reference && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {transaction.reference}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'sent' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.type === 'sent' ? '-' : '+'}{transaction.amount.toFixed(2)} {transaction.currency}
                      </p>
                      <Badge className={`${getStatusColor(transaction.status)} gap-1 mt-1`}>
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {transaction.status === 'en attente' && transaction.type === 'sent' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails transaction */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="text-3xl font-bold text-[#0066CC]">
                    {selectedTransaction.amount.toFixed(2)} {selectedTransaction.currency}
                  </p>
                </div>
                <Badge className={`${getStatusColor(selectedTransaction.status)} gap-1`}>
                  {getStatusIcon(selectedTransaction.status)}
                  {selectedTransaction.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Compte source</p>
                  <p className="font-semibold">{selectedTransaction.fromAccount.number}</p>
                  {selectedTransaction.fromAccount.holder && (
                    <p className="text-sm text-gray-500">{selectedTransaction.fromAccount.holder}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Destinataire</p>
                  {selectedTransaction.toAccount ? (
                    <>
                      <p className="font-semibold">{selectedTransaction.toAccount.number}</p>
                      {selectedTransaction.toAccount.holder && (
                        <p className="text-sm text-gray-500">{selectedTransaction.toAccount.holder}</p>
                      )}
                    </>
                  ) : selectedTransaction.beneficiary ? (
                    <>
                      <p className="font-semibold">{selectedTransaction.beneficiary.name}</p>
                      <p className="text-sm text-gray-500">{selectedTransaction.beneficiary.bank}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">{formatDate(selectedTransaction.createdAt)}</p>
                </div>

                {selectedTransaction.confirmedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Date de confirmation</p>
                    <p className="font-medium">{formatDate(selectedTransaction.confirmedAt)}</p>
                  </div>
                )}
              </div>

              {selectedTransaction.reference && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Référence</p>
                  <p className="font-medium">{selectedTransaction.reference}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">ID Transaction</p>
                <p className="font-mono text-sm">{selectedTransaction.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};