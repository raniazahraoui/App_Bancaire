import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export const LoginPage: React.FC = () => {
  const { login, verifyOTP, needsOTP } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Email ou mot de passe incorrect');
      } else {
        toast.success('Code OTP envoyé par SMS');
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = verifyOTP(otp);
    if (!success) {
      setError('Code OTP invalide');
      toast.error('Code OTP invalide');
    } else {
      toast.success('Connexion réussie !');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Un email de réinitialisation a été envoyé');
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle>Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="votre@email.fr"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Button type="submit" className="w-full bg-[#0066CC] hover:bg-[#0052A3]">
                  Envoyer le lien
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Retour à la connexion
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-[#0066CC] rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Authentification à deux facteurs</CardTitle>
            <CardDescription>
              Un code à 6 chiffres a été envoyé par SMS à votre numéro de téléphone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOTPVerification} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="otp">Code OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 text-center">
                  Code de test : 123456
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
                disabled={otp.length !== 6}
              >
                Vérifier et se connecter
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-[#0066CC] hover:underline"
                  onClick={() => toast.success('Un nouveau code a été envoyé')}
                >
                  Renvoyer le code
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-[#0066CC] rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl">B</span>
          </div>
          <CardTitle>Bienvenue sur Ma Banque</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à votre espace personnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-[#0066CC] hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#0066CC] hover:bg-[#0052A3]"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Comptes de test :</p>
              <p className="text-xs text-gray-800">Client : client@banque.fr</p>
              <p className="text-xs text-gray-800">Support : support@banque.fr</p>
              <p className="text-xs text-gray-800">Admin : admin@banque.fr</p>
              <p className="text-xs text-gray-600 mt-2">Mot de passe : (n'importe lequel)</p>
              <p className="text-xs text-gray-600">Code OTP : 123456</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
