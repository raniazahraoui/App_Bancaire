import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Users, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { mockBeneficiaries, Beneficiary } from '../utils/mockData';
import { toast } from 'sonner@2.0.3';

export const BeneficiariesPage: React.FC = () => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(mockBeneficiaries);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    iban: '',
    type: 'same_bank' as 'same_bank' | 'national' | 'international'
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', bank: '', iban: '', type: 'same_bank' });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.bank || !formData.iban) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // Validate IBAN format (basic validation)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    const cleanedIban = formData.iban.replace(/\s/g, '');
    if (!ibanRegex.test(cleanedIban)) {
      toast.error('Format IBAN invalide');
      return;
    }

    if (editingBeneficiary) {
      // Edit existing beneficiary
      setBeneficiaries(beneficiaries.map(b =>
        b.id === editingBeneficiary.id
          ? { ...b, ...formData }
          : b
      ));
      toast.success('Bénéficiaire modifié avec succès');
    } else {
      // Add new beneficiary
      const newBeneficiary: Beneficiary = {
        id: `ben${beneficiaries.length + 1}`,
        ...formData
      };
      setBeneficiaries([...beneficiaries, newBeneficiary]);
      toast.success('Bénéficiaire ajouté avec succès');
    }

    setShowAddDialog(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      setBeneficiaries(beneficiaries.filter(b => b.id !== id));
      toast.success('Bénéficiaire supprimé avec succès');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'same_bank':
        return 'Même banque';
      case 'national':
        return 'National';
      case 'international':
        return 'International';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'same_bank':
        return 'default';
      case 'national':
        return 'secondary';
      case 'international':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
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

      {beneficiaries.length === 0 && (
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
                  <SelectItem value="same_bank">Même banque</SelectItem>
                  <SelectItem value="national">Banque nationale</SelectItem>
                  <SelectItem value="international">Banque internationale</SelectItem>
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
                placeholder="Ex: FR76 1234 5678 9012 3456 7890 123"
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
              >
                {editingBeneficiary ? 'Modifier' : 'Ajouter'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
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
