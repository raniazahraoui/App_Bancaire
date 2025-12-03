import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Send, AlertCircle, CheckCircle, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface TransferPageProps {
  onNavigate: (page: string) => void;
}

interface Account {
  id: string;
  id_account: number;
  account_number: string;
  balance: number;
  account_type: string;
  iban: string;
  rib: string;
}

interface Beneficiary {
  id: string;
  name: string;
  bank: string;
  accountNumber?: string;
  rib?: string;
  iban: string;
  type: 'meme banque' | 'autre banque nationale' | 'banque etrangere';
  createdAt: string;
}

export const TransferPage: React.FC<TransferPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [sourceAccount, setSourceAccount] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [reference, setReference] = useState('');
  
  // Dialog states
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  
  // Add beneficiary states
  const [showAddBeneficiaryDialog, setShowAddBeneficiaryDialog] = useState(false);
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    bankName: '',
    iban: '',
    rib: '',
    accountNumber: '',
    type: 'autre banque nationale' as const
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    if (user && user.role === 'client') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Charger les comptes
      const accountsRes = await axios.get(`${API_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (accountsRes.data.success) {
        const formattedAccounts = accountsRes.data.accounts.map((acc: any) => ({
          id: acc.id_account.toString(),
          id_account: acc.id_account,
          account_number: acc.account_number,
          balance: parseFloat(acc.balance),
          account_type: acc.account_type,
          iban: acc.iban,
          rib: acc.rib
        }));
        setAccounts(formattedAccounts);
      }
      
      // Charger les bénéficiaires
      const beneficiariesRes = await axios.get(`${API_URL}/beneficiaries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (beneficiariesRes.data.success) {
        setBeneficiaries(beneficiariesRes.data.beneficiaries);
      }
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async () => {
    try {
      if (!newBeneficiary.name || !newBeneficiary.bankName || !newBeneficiary.iban) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/beneficiaries`,
        newBeneficiary,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Bénéficiaire ajouté avec succès');
        setBeneficiaries([...beneficiaries, response.data.beneficiary]);
        setShowAddBeneficiaryDialog(false);
        setNewBeneficiary({
          name: '',
          bankName: '',
          iban: '',
          rib: '',
          accountNumber: '',
          type: 'autre banque nationale'
        });
      }
    } catch (error: any) {
      console.error('Erreur ajout bénéficiaire:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout du bénéficiaire');
    }
  };

  const handleDeleteBeneficiary = async (beneficiaryId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_URL}/beneficiaries/${beneficiaryId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Bénéficiaire supprimé avec succès');
        setBeneficiaries(beneficiaries.filter(b => b.id !== beneficiaryId));
        if (beneficiary === beneficiaryId) {
          setBeneficiary('');
        }
      }
    } catch (error: any) {
      console.error('Erreur suppression bénéficiaire:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceAccount || !beneficiary || !amount) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const selectedAccount = accounts.find(a => a.id === sourceAccount);
    if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      toast.error('Solde insuffisant');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/transfer/initiate`,
        {
          sourceAccountId: sourceAccount,
          beneficiaryId: beneficiary,
          amount: parseFloat(amount),
          currency,
          reference
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Code OTP envoyé par email');
        setShowOTPDialog(true);
      }
    } catch (error: any) {
      console.error('Erreur initiation transfert:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'initiation du transfert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Veuillez entrer un code OTP valide');
      return;
    }

    try {
      setOtpLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/transfer/confirm`,
        { otp },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setShowOTPDialog(false);
        setTransactionDetails(response.data.transaction);
        setShowSuccessDialog(true);
        
        // Recharger les comptes pour mettre à jour les soldes
        loadData();
        
        // Message selon le type de transfert
        if (response.data.transaction.transferType === 'meme banque') {
          toast.success('Transfert instantané réussi !');
        } else if (response.data.transaction.transferType === 'autre banque nationale') {
          toast.success('Transfert en cours de traitement (1-2 jours)');
        } else if (response.data.transaction.transferType === 'banque etrangere') {
          toast.success('Transfert international en cours (3-5 jours)');
        }
        
        // Notifications
        setTimeout(() => {
          toast.success('Email de confirmation envoyé');
        }, 500);
        
        setTimeout(() => {
          toast.success('SMS de confirmation envoyé');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Erreur vérification OTP:', error);
      toast.error(error.response?.data?.message || 'Code OTP invalide');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    setTransactionDetails(null);
    // Reset form
    setSourceAccount('');
    setBeneficiary('');
    setAmount('');
    setReference('');
    setOtp('');
  };

  const formatCurrency = (value: number, curr: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: curr
    }).format(value);
  };

  const getBeneficiaryTypeLabel = (type: string) => {
    switch (type) {
      case 'meme banque':
        return 'Même banque (instantané)';
      case 'autre banque nationale':
        return 'Banque nationale (1-2 jours)';
      case 'banque etrangere':
        return 'Banque internationale (3-5 jours)';
      default:
        return type;
    }
  };

  if (!user || user.role !== 'client') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Accès non autorisé</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
      </div>
    );
  }

  const selectedBeneficiary = beneficiaries.find(b => b.id === beneficiary);
  const selectedAccount = accounts.find(a => a.id === sourceAccount);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Nouveau virement</h1>
        <p className="text-gray-600">Effectuez un virement vers un bénéficiaire</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#0066CC]" />
            Détails du virement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTransfer} className="space-y-6">
            {/* Source Account */}
            <div className="space-y-2">
              <Label htmlFor="source-account">Compte source *</Label>
              <Select value={sourceAccount} onValueChange={setSourceAccount}>
                <SelectTrigger id="source-account">
                  <SelectValue placeholder="Sélectionnez un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_type} - {formatCurrency(account.balance)} - {account.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Beneficiary Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="beneficiary">Bénéficiaire *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddBeneficiaryDialog(true)}
                  className="text-[#0066CC]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un bénéficiaire
                </Button>
              </div>
<Select value={beneficiary} onValueChange={setBeneficiary}>
  <SelectTrigger id="beneficiary">
    <SelectValue placeholder="Sélectionnez un bénéficiaire" />
  </SelectTrigger>
  <SelectContent>
    {beneficiaries.length === 0 ? (
      <div className="p-4 text-center text-gray-500 text-sm">
        Aucun bénéficiaire. Ajoutez-en un pour continuer.
      </div>
    ) : (
      beneficiaries.map((ben) => (
        <SelectItem key={ben.id} value={ben.id.toString()}>
          {ben.name} - {ben.bank}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>

              
              {selectedBeneficiary && (
                <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">IBAN du bénéficiaire</p>
                      <p className="text-sm text-gray-900 font-mono">{selectedBeneficiary.iban}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBeneficiary(selectedBeneficiary.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Type</p>
                    <p className="text-sm text-gray-900">
                      {getBeneficiaryTypeLabel(selectedBeneficiary.type)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {selectedAccount && amount && parseFloat(amount) > selectedAccount.balance && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Solde insuffisant. Solde disponible : {formatCurrency(selectedAccount.balance)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar américain</SelectItem>
                  <SelectItem value="GBP">GBP - Livre sterling</SelectItem>
                  <SelectItem value="CHF">CHF - Franc suisse</SelectItem>
                  <SelectItem value="TND">TND - Dinar tunisien</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Référence (optionnel)</Label>
              <Input
                id="reference"
                type="text"
                placeholder="Ex: Loyer, Remboursement, etc."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Summary */}
            {sourceAccount && beneficiary && amount && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900">Récapitulatif</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">De :</span>
                    <span className="text-gray-900">{selectedAccount?.account_type} ({selectedAccount?.account_number})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vers :</span>
                    <span className="text-gray-900">{selectedBeneficiary?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banque :</span>
                    <span className="text-gray-900">{selectedBeneficiary?.bank}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-600">Montant :</span>
                    <span className="text-[#0066CC]">{formatCurrency(parseFloat(amount), currency)}</span>
                  </div>
                  {selectedBeneficiary?.type === 'banque etrangere' && currency !== 'EUR' && (
                    <div className="flex justify-between text-xs border-t pt-1 mt-2">
                      <span className="text-gray-600">Frais estimés :</span>
                      <span className="text-gray-900">5.00 EUR</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-[#0066CC] hover:bg-[#0052A3]"
                disabled={
                  submitting ||
                  !sourceAccount || 
                  !beneficiary || 
                  !amount || 
                  (selectedAccount && parseFloat(amount) > selectedAccount.balance)
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Confirmer le virement'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('dashboard')}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add Beneficiary Dialog */}
      <Dialog open={showAddBeneficiaryDialog} onOpenChange={setShowAddBeneficiaryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau bénéficiaire pour vos virements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nom *</Label>
              <Input
                id="new-name"
                value={newBeneficiary.name}
                onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
                placeholder="Nom du bénéficiaire"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-bank">Banque *</Label>
              <Input
                id="new-bank"
                value={newBeneficiary.bankName}
                onChange={(e) => setNewBeneficiary({...newBeneficiary, bankName: e.target.value})}
                placeholder="Nom de la banque"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-iban">IBAN *</Label>
              <Input
                id="new-iban"
                value={newBeneficiary.iban}
                onChange={(e) => setNewBeneficiary({...newBeneficiary, iban: e.target.value.toUpperCase()})}
                placeholder="TN59XXXXXXXXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-rib">RIB (optionnel)</Label>
              <Input
                id="new-rib"
                value={newBeneficiary.rib}
                onChange={(e) => setNewBeneficiary({...newBeneficiary, rib: e.target.value})}
                placeholder="RIB"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-type">Type *</Label>
              <Select 
                value={newBeneficiary.type} 
                onValueChange={(value: any) => setNewBeneficiary({...newBeneficiary, type: value})}
              >
                <SelectTrigger id="new-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meme banque">Même banque</SelectItem>
                  <SelectItem value="autre banque nationale">Autre banque nationale</SelectItem>
                  <SelectItem value="banque etrangere">Banque étrangère</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddBeneficiary}
              className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
            >
              Ajouter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation par OTP</DialogTitle>
            <DialogDescription>
              Entrez le code à 6 caractères envoyé par email pour confirmer le virement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-verify">Code OTP</Label>
              <Input
                id="otp-verify"
                type="text"
                placeholder="A1B2C3"
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase().slice(0, 6))}
                className="text-center tracking-widest text-lg font-mono"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 text-center">
                Vérifiez votre email pour le code OTP
              </p>
            </div>
            <Button
              onClick={handleVerifyOTP}
              className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
              disabled={otp.length !== 6 || otpLoading}
            >
              {otpLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Virement effectué avec succès !</DialogTitle>
            <DialogDescription className="text-center">
              {transactionDetails?.transferType === 'meme banque' && (
                <>
                  Votre virement de {transactionDetails && formatCurrency(transactionDetails.amount, transactionDetails.currency)} vers{' '}
                  {transactionDetails?.beneficiary} a été effectué <strong>instantanément</strong>.
                </>
              )}
              {transactionDetails?.transferType === 'autre banque nationale' && (
                <>
                  Votre virement de {transactionDetails && formatCurrency(transactionDetails.amount, transactionDetails.currency)} vers{' '}
                  {transactionDetails?.beneficiary} est <strong>en cours de traitement</strong>. Le bénéficiaire recevra les fonds sous 1-2 jours ouvrés.
                </>
              )}
              {transactionDetails?.transferType === 'banque etrangere' && (
                <>
                  Votre virement international de {transactionDetails && formatCurrency(transactionDetails.amount, transactionDetails.currency)} vers{' '}
                  {transactionDetails?.beneficiary} est <strong>en cours de traitement</strong>. Le bénéficiaire recevra les fonds sous 3-5 jours ouvrés.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {transactionDetails && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">N° de transaction :</span>
                  <span className="font-mono text-gray-900">#{transactionDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bénéficiaire :</span>
                  <span className="text-gray-900">{transactionDetails.beneficiary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Banque :</span>
                  <span className="text-gray-900">{transactionDetails.beneficiaryBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type de transfert :</span>
                  <span className="text-gray-900">{getBeneficiaryTypeLabel(transactionDetails.transferType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut :</span>
                  {transactionDetails.status === 'réussie' ? (
                    <span className="text-green-600 font-semibold">✓ Réussi (Instantané)</span>
                  ) : (
                    <span className="text-orange-600 font-semibold">⏳ En attente</span>
                  )}
                </div>
                {transactionDetails.reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Référence :</span>
                    <span className="text-gray-900">{transactionDetails.reference}</span>
                  </div>
                )}
              </div>
            )}
            <div className="p-4 bg-blue-50 rounded-lg space-y-2 text-sm">
              <p className="text-gray-600 font-medium">Notifications envoyées :</p>
              <ul className="space-y-1 ml-4 list-disc text-gray-900">
                <li>Email de confirmation</li>
                <li>SMS de confirmation</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCloseSuccess}
                className="flex-1 bg-[#0066CC] hover:bg-[#0052A3]"
              >
                Nouveau virement
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleCloseSuccess();
                  onNavigate('transactions');
                }}
              >
                Voir l'historique
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};