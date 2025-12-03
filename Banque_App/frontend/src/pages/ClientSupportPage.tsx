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
  Plus, 
  MessageCircle, 
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Loader2
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

export const ClientSupportPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const [replyMessage, setReplyMessage] = useState('');

  // Charger les tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });

      setTickets(response.data);
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
      const token = localStorage.getItem('token');
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
    if (user) {
      fetchTickets();
    }
  }, [filterStatus, searchQuery, user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTicketForm.subject.trim() || !newTicketForm.message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/tickets`, newTicketForm, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });

      setTickets([response.data, ...tickets]);
      toast.success('Ticket créé avec succès');
      setShowNewTicket(false);
      setNewTicketForm({ subject: '', message: '', priority: 'medium' });
    } catch (error: any) {
      console.error('Erreur lors de la création du ticket:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création du ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Veuillez entrer un message');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
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

  const handleTicketClick = async (ticket: Ticket) => {
    await fetchTicketDetails(ticket.id);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Support client</h1>
          <p className="text-gray-600">
            Obtenez de l'aide pour vos questions
          </p>
        </div>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="bg-[#0066CC] hover:bg-[#0052A3]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau ticket
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tickets.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="p-12 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucun ticket trouvé</p>
              <Button
                onClick={() => setShowNewTicket(true)}
                className="bg-[#0066CC] hover:bg-[#0052A3]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => handleTicketClick(ticket)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{ticket.subject}</CardTitle>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-2 mb-2">{ticket.message}</p>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-500">{formatDateTime(ticket.createdAt)}</p>
                  <p className="text-gray-500">{ticket.responses?.length || 0} réponse(s)</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un nouveau ticket</DialogTitle>
            <DialogDescription>
              Décrivez votre problème et notre équipe vous répondra rapidement
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet *</Label>
              <Input
                id="subject"
                value={newTicketForm.subject}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                placeholder="Ex: Problème de connexion"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={newTicketForm.priority}
                onValueChange={(value: any) => setNewTicketForm({ ...newTicketForm, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={newTicketForm.message}
                onChange={(e) => setNewTicketForm({ ...newTicketForm, message: e.target.value })}
                placeholder="Décrivez votre problème en détail..."
                rows={5}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 bg-[#0066CC] hover:bg-[#0052A3]"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Créer le ticket
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewTicket(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                      Créé le {formatDateTime(selectedTicket.createdAt)}
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
                  <p className="text-gray-600 mb-1">Message initial</p>
                  <p className="text-gray-900">{selectedTicket.message}</p>
                </div>

                {/* Responses */}
                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-gray-600">Réponses</p>
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
                    <Button
                      onClick={() => handleReply(selectedTicket.id)}
                      className="bg-[#0066CC] hover:bg-[#0052A3]"
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Envoyer
                    </Button>
                  </div>
                )}

                {selectedTicket.status === 'resolved' && (
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-600">Ce ticket a été résolu</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};