import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Send, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { mockBeneficiaries, formatCurrency } from '../utils/mockData';
import { toast } from 'sonner@2.0.3';

interface TransferPageProps {
  onNavigate: (page: string) => void;
}

export const TransferPage: React.FC<TransferPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [sourceAccount, setSourceAccount] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [reference, setReference] = useState('');
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  if (!user || user.role !== 'client') {
    return <div>Accès non autorisé</div>;
  }

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceAccount || !beneficiary || !amount) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setShowOTPDialog(true);
  };

  const handleVerifyOTP = () => {
    if (otp === '123456') {
      setShowOTPDialog(false);
      setShowSuccessDialog(true);
      
      // Send notifications
      setTimeout(() => {
        toast.success('Email de confirmation envoyé');
      }, 500);
      
      setTimeout(() => {
        toast.success('SMS de confirmation envoyé');
      }, 1000);
    } else {
      toast.error('Code OTP invalide');
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDialog(false);
    // Reset form
    setSourceAccount('');
    setBeneficiary('');
    setAmount('');
    setReference('');
    setOtp('');
  };

  const selectedBeneficiary = mockBeneficiaries.find(b => b.id === beneficiary);
  const selectedAccount = user.accounts.find(a => a.id === sourceAccount);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="mb-2">Nouveau virement</h1>
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
                  {user.accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.type} - {formatCurrency(account.balance)} - {account.accountNumber}
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
                  onClick={() => onNavigate('beneficiaries')}
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
                  {mockBeneficiaries.map((ben) => (
                    <SelectItem key={ben.id} value={ben.id}>
                      {ben.name} - {ben.bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedBeneficiary && (
                <div className="p-3 bg-blue-50 rounded-lg space-y-1">
                  <p className="text-xs text-gray-600">IBAN du bénéficiaire</p>
                  <p className="text-gray-900">{selectedBeneficiary.iban}</p>
                  <p className="text-xs text-gray-600 mt-2">Type</p>
                  <p className="text-gray-900">
                    {selectedBeneficiary.type === 'same_bank' ? 'Même banque (instantané)' :
                     selectedBeneficiary.type === 'national' ? 'Banque nationale (1-2 jours)' :
                     'Banque internationale (3-5 jours)'}
                  </p>
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
                <p className="text-gray-900">Récapitulatif</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">De :</span>
                    <span className="text-gray-900">{selectedAccount?.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vers :</span>
                    <span className="text-gray-900">{selectedBeneficiary?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant :</span>
                    <span className="text-[#0066CC]">{formatCurrency(parseFloat(amount), currency)}</span>
                  </div>
                  {selectedBeneficiary?.type === 'international' && currency !== 'EUR' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frais :</span>
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
                disabled={!sourceAccount || !beneficiary || !amount || 
                         (selectedAccount && parseFloat(amount) > selectedAccount.balance)}
              >
                Confirmer le virement
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

      {/* OTP Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation par OTP</DialogTitle>
            <DialogDescription>
              Entrez le code à 6 chiffres envoyé par SMS pour confirmer le virement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-verify">Code OTP</Label>
              <Input
                id="otp-verify"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 text-center">Code de test : 123456</p>
            </div>
            <Button
              onClick={handleVerifyOTP}
              className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
              disabled={otp.length !== 6}
            >
              Confirmer
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
              Votre virement de {formatCurrency(parseFloat(amount || '0'), currency)} vers{' '}
              {selectedBeneficiary?.name} a été effectué avec succès.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg space-y-2 text-sm">
              <p className="text-gray-600">Des notifications ont été envoyées :</p>
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
