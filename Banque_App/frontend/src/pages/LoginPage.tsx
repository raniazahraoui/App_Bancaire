import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { setUser, needsOTP, setNeedsOTP,setToken } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Login normal
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Erreur de connexion');
        toast.error(data.message || 'Erreur de connexion');
      } else {
        // Stocker le token
        if (data.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token); // mettre à jour le contexte
          
        }

        // Stocker les données utilisateur
        if (data.user) {
          setUser(data.user);
          setUserId(data.user.id_user);
        }

        // Gérer l'OTP
        if (data.needsOTP) {
          setNeedsOTP(true);
          toast.success('Code OTP envoyé par email');
        } else {
          setNeedsOTP(false);
          toast.success('Connexion réussie !');
          // Redirection vers le dashboard
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Erreur login:', err);
      setError('Une erreur est survenue lors de la connexion');
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };
  

  // Vérification OTP
  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!userId) {
      setError('Session expirée, veuillez vous reconnecter');
      toast.error('Session expirée');
      setNeedsOTP(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ otp, userId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Code OTP invalide');
        toast.error(data.message || 'Code OTP invalide');
      } else {
        toast.success('Connexion réussie !');
        setNeedsOTP(false);
        // Redirection vers le dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Erreur vérification OTP:', err);
      setError('Erreur serveur');
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  // Renvoyer l'OTP
  const handleResendOTP = async () => {
    if (!userId) {
      toast.error('Session expirée, veuillez vous reconnecter');
      setNeedsOTP(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/resend-otp', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Nouveau code OTP envoyé !');
      } else {
        toast.error(data.message || 'Impossible de renvoyer le code');
      }
    } catch (err) {
      console.error('Erreur renvoi OTP:', err);
      toast.error('Erreur serveur lors du renvoi du code OTP');
    }
  };

  // Mot de passe oublié
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Un email de réinitialisation a été envoyé à ${resetEmail}`);
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        toast.error(data.message || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Erreur mot de passe oublié:', err);
      toast.error('Erreur serveur');
    }
  };

  // Affichage mot de passe oublié
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle>Mot de passe oublié</CardTitle>
            <CardDescription>Entrez votre email pour recevoir un lien de réinitialisation</CardDescription>
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
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#0066CC] hover:bg-[#0052A3]">
                Envoyer le lien
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setShowForgotPassword(false)}
              >
                Retour
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage OTP
  if (needsOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-[#0066CC] rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Authentification à deux facteurs</CardTitle>
            <CardDescription>Un code  a été envoyé par email</CardDescription>
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
                  placeholder=""
                  value={otp}
                  onChange={e => setOtp(e.target.value.slice(0, 8))}
                  className="text-center tracking-widest text-lg font-semibold"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#0066CC] hover:bg-[#0052A3]" 
                disabled={otp.length !== 8 || loading}
              >
                {loading ? 'Vérification...' : 'Vérifier'}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-[#0066CC] hover:underline text-sm"
                  onClick={handleResendOTP}
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

  // Login normal
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-[#0066CC] rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <CardTitle>Bienvenue sur Ma Banque</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre espace personnel</CardDescription>
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
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
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
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)} 
                className="text-sm text-[#0066CC] hover:underline"
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
            <div className="text-center mt-4">
              <span className="text-gray-600 text-sm">Pas encore de compte ? </span>
              <Link to="/signup" className="text-[#0066CC] hover:underline font-medium text-sm">
                Créer un compte
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};