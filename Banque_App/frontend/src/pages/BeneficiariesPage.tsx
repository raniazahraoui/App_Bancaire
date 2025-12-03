import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Users, Plus, Edit, Trash2, Building2, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Beneficiary {
  id: number;
  name: string;
  bank: string;
  accountNumber?: string;
  rib?: string;
  iban: string;
  type: 'meme banque' | 'autre banque nationale' | 'banque etrangere';
  createdAt: string;
}
interface BeneficiariesPageProps {
  onNavigate: (view: string) => void;
}

export const BeneficiariesPage: React.FC<BeneficiariesPageProps> = ({ onNavigate }) => {

  const navigate = useNavigate();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    iban: '',
    type: 'meme banque' as 'meme banque' | 'autre banque nationale' | 'banque etrangere'
  });

  // Récupérer le token depuis localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Charger les bénéficiaires au montage du composant
  useEffect(() => {
    fetchBeneficiaries();
  }, []);
  
  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch('http://localhost:5000/api/beneficiaries', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des bénéficiaires');
      }

      const data = await response.json();
      
      if (data.success) {
        setBeneficiaries(data.beneficiaries);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les bénéficiaires');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', bank: '', iban: '', type: 'meme banque' });
    setEditingBeneficiary(null);
    setShowAddDialog(true);
  };

  const handleOpenEdit = (beneficiary: Beneficiary) => {
    setFormData({
      name: beneficiary.name,
      bank: beneficiary.bank,
      iban: beneficiary.iban,
      type: beneficiary.type
    });
    setEditingBeneficiary(beneficiary);
    setShowAddDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.bank || !formData.iban) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // Validation IBAN format (basic validation)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    const cleanedIban = formData.iban.replace(/\s/g, '');
    if (!ibanRegex.test(cleanedIban)) {
      toast.error('Format IBAN invalide');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const url = editingBeneficiary
        ? `http://localhost:5000/api/beneficiaries/${editingBeneficiary.id}`
        : 'http://localhost:5000/api/beneficiaries';
      
      const method = editingBeneficiary ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          bankName: formData.bank,
          iban: cleanedIban,
          type: formData.type
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }

      if (data.success) {
        toast.success(data.message || (editingBeneficiary ? 'Bénéficiaire modifié avec succès' : 'Bénéficiaire ajouté avec succès'));
        setShowAddDialog(false);
        fetchBeneficiaries(); // Recharger la liste
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      return;
    }

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Session expirée, veuillez vous reconnecter');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/beneficiaries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      if (data.success) {
        toast.success('Bénéficiaire supprimé avec succès');
        fetchBeneficiaries(); // Recharger la liste
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meme banque':
        return 'Même banque';
      case 'autre banque nationale':
        return 'Banque nationale';
      case 'banque etrangere':
        return 'Banque étrangère';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'meme banque':
        return 'default';
      case 'autre banque nationale':
        return 'secondary';
      case 'banque etrangere':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
<Button
  variant="outline"
  size="icon"
  onClick={() => onNavigate("dashboard")}
  className="hover:bg-gray-100"
>
  <ArrowLeft className="h-5 w-5" />
</Button>



        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="mb-2">Gestion des bénéficiaires</h1>
            <p className="text-gray-600">Ajoutez et gérez vos bénéficiaires de virements</p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-[#0066CC] hover:bg-[#0052A3]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un bénéficiaire
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beneficiaries.map((beneficiary) => (
          <Card key={beneficiary.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#0066CC]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{beneficiary.name}</CardTitle>
                    <Badge variant={getTypeBadgeVariant(beneficiary.type)} className="mt-1">
                      {getTypeLabel(beneficiary.type)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-gray-600 flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4" />
                  Banque
                </p>
                <p className="text-gray-900">{beneficiary.bank}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">IBAN</p>
                <p className="text-gray-900 break-all">{beneficiary.iban}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenEdit(beneficiary)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(beneficiary.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {beneficiaries.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucun bénéficiaire enregistré</p>
            <Button
              onClick={handleOpenAdd}
              className="bg-[#0066CC] hover:bg-[#0052A3]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter votre premier bénéficiaire
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBeneficiary ? 'Modifier le bénéficiaire' : 'Ajouter un bénéficiaire'}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du bénéficiaire
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sophie Laurent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de bénéficiaire *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meme banque">Même banque</SelectItem>
                  <SelectItem value="autre banque nationale">Banque nationale</SelectItem>
                  <SelectItem value="banque etrangere">Banque étrangère</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Nom de la banque *</Label>
              <Input
                id="bank"
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                placeholder="Ex: BNP Paribas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                placeholder="Ex : TN59 0100 4230 0000 0000 1234"

                required
              />
              <p className="text-xs text-gray-500">
                Format : 2 lettres pays + 2 chiffres + code banque
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-[#0066CC] hover:bg-[#0052A3]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingBeneficiary ? 'Modification...' : 'Ajout...'}
                  </>
                ) : (
                  editingBeneficiary ? 'Modifier' : 'Ajouter'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};