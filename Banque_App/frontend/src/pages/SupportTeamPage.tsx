import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  HelpCircle, 
  MessageCircle, 
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Loader2,
  User,
  Settings,
  LogOut,
  Lock,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface TicketResponse {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  responses: TicketResponse[];
}

const API_URL = 'http://localhost:5000/api';

// Composant Paramètres pour l'équipe Support
const SupportSettingsView: React.FC<{ token: string | null; onBack: () => void }> = ({ token, onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    dateOfBirth: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/client-info`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.client) {
          const client = response.data.client;
          setFormData({
            firstName: client.first_name || '',
            lastName: client.last_name || '',
            address: client.address || '',
            dateOfBirth: client.date_of_birth || ''
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const response = await axios.put(
        `${API_URL}/update-profile`,
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

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/change-password`,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
        >
          ← Retour aux tickets
        </Button>
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

export const SupportTeamPage: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'tickets' | 'settings'>('tickets');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  // Charger les tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API_URL}/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });

      const ticketsData = response.data;
      setTickets(ticketsData);

      // Calculer les stats
      setStats({
        total: ticketsData.length,
        open: ticketsData.filter((t: Ticket) => t.status === 'open').length,
        inProgress: ticketsData.filter((t: Ticket) => t.status === 'in_progress').length,
        resolved: ticketsData.filter((t: Ticket) => t.status === 'resolved').length
      });
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      toast.error('Impossible de charger les tickets');
    } finally {
      setLoading(false);
    }
  };

  // Charger un ticket avec ses réponses
  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await axios.get(`${API_URL}/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
      setSelectedTicket(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du ticket:', error);
      toast.error('Impossible de charger les détails du ticket');
    }
  };

  useEffect(() => {
    if (user && activeView === 'tickets') {
      fetchTickets();
    }
  }, [filterStatus, searchQuery, user, activeView]);

  const handleReply = async (ticketId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Veuillez entrer un message');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_URL}/tickets/${ticketId}/responses`,
        { message: replyMessage },
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true 
        }
      );

      toast.success('Réponse ajoutée avec succès');
      setReplyMessage('');
      
      await fetchTicketDetails(ticketId);
      await fetchTickets();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de la réponse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await axios.patch(
        `${API_URL}/tickets/${ticketId}/resolve`,
        {},
        { 
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true 
        }
      );

      toast.success('Ticket marqué comme résolu');
      setSelectedTicket(null);
      await fetchTickets();
    } catch (error: any) {
      console.error('Erreur lors de la résolution du ticket:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la résolution du ticket');
    }
  };

  const handleTicketClick = async (ticket: Ticket) => {
    await fetchTicketDetails(ticket.id);
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityVariant = (priority: string): "default" | "secondary" | "outline" => {
    switch (priority) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrer par priorité (côté client)
  const filteredTickets = filterPriority === 'all' 
    ? tickets 
    : tickets.filter(t => t.priority === filterPriority);

  if (loading && activeView === 'tickets') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec menu */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et info utilisateur */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0066CC] flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div>
                <p className="font-semibold text-gray-900">Équipe Support</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
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
                      setActiveView('tickets');
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <MessageCircle className="h-5 w-5 text-gray-700" />
                    <span className="font-medium text-gray-700">Tickets</span>
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
        {activeView === 'settings' ? (
          <SupportSettingsView 
            token={token} 
            onBack={() => setActiveView('tickets')} 
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2">Gestion des tickets</h1>
                <p className="text-gray-600">
                  Gérez les demandes d'assistance des clients
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ouverts</p>
                      <p className="text-2xl font-bold text-red-600">{stats.open}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">En cours</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Résolus</p>
                      <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-tickets">Rechercher</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search-tickets"
                        placeholder="Rechercher un ticket..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-status">Statut</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger id="filter-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="open">Ouvert</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="resolved">Résolu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filter-priority">Priorité</Label>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger id="filter-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les priorités</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTickets.length === 0 ? (
                <Card className="lg:col-span-2 xl:col-span-3">
                  <CardContent className="p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun ticket trouvé</p>
                  </CardContent>
                </Card>
              ) : (
                filteredTickets.map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => handleTicketClick(ticket)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">{ticket.subject}</CardTitle>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <User className="h-3 w-3 mr-1" />
                            {ticket.userName}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={getStatusVariant(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{getStatusLabel(ticket.status)}</span>
                        </Badge>
                        <Badge variant={getPriorityVariant(ticket.priority)}>
                          {ticket.priority === 'high' ? 'Haute' :
                           ticket.priority === 'medium' ? 'Moyenne' : 'Basse'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{ticket.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDateTime(ticket.createdAt)}</span>
                        <span>{ticket.responses?.length || 0} réponse(s)</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                {selectedTicket && (
                  <>
                    <DialogHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <DialogTitle>{selectedTicket.subject}</DialogTitle>
                          <DialogDescription>
                            Par : {selectedTicket.userName} • Créé le {formatDateTime(selectedTicket.createdAt)}
                          </DialogDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getStatusVariant(selectedTicket.status)}>
                            {getStatusLabel(selectedTicket.status)}
                          </Badge>
                          <Badge variant={getPriorityVariant(selectedTicket.priority)}>
                            {selectedTicket.priority === 'high' ? 'Haute' :
                             selectedTicket.priority === 'medium' ? 'Moyenne' : 'Basse'}
                          </Badge>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Original Message */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-1 font-medium">Message initial</p>
                        <p className="text-gray-900">{selectedTicket.message}</p>
                      </div>

                      {/* Responses */}
                      {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-gray-600 font-medium">Réponses ({selectedTicket.responses.length})</p>
                          {selectedTicket.responses.map((response) => (
                            <div key={response.id} className="p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-900 font-medium">{response.userName}</p>
                                <p className="text-gray-500 text-sm">{formatDateTime(response.createdAt)}</p>
                              </div>
                              <p className="text-gray-700">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Form */}
                      {selectedTicket.status !== 'resolved' && (
                        <div className="space-y-2">
                          <Label htmlFor="reply">Votre réponse</Label>
                          <Textarea
                            id="reply"
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReply(selectedTicket.id)}
                              className="bg-[#0066CC] hover:bg-[#0052A3]"
                              disabled={submitting}
                            >
                              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                              Envoyer
                            </Button>
                            <Button
                              onClick={() => handleResolveTicket(selectedTicket.id)}
                              variant="outline"
                              disabled={submitting}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marquer comme résolu
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedTicket.status === 'resolved' && (
                        <div className="p-4 bg-green-50 rounded-lg text-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="text-green-600 font-medium">Ce ticket a été résolu</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
};