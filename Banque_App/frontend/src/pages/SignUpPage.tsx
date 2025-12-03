import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Lock, Mail, AlertCircle, User, Phone, MapPin, Calendar } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    dateOfBirth: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  const { password, confirmPassword, firstName, lastName } = formData;

  // Vérifier correspondance des mots de passe
  if (password !== confirmPassword) {
    setError('Les mots de passe ne correspondent pas');
    return;
  }

  // Vérifier longueur minimum
  if (password.length < 8) {
    setError('Le mot de passe doit contenir au moins 8 caractères');
    return;
  }

  // Vérifier qu'il contient majuscule, minuscule, chiffre et symbole
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    setError('Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un symbole spécial');
    return;
  }

  // Vérifier qu'il ne contient pas le prénom ou nom
  const lowerPassword = password.toLowerCase();
  if (firstName && lowerPassword.includes(firstName.toLowerCase())) {
    setError('Le mot de passe ne doit pas contenir votre prénom');
    return;
  }
  if (lastName && lowerPassword.includes(lastName.toLowerCase())) {
    setError('Le mot de passe ne doit pas contenir votre nom');
    return;
  }

  // Vérification de la date de naissance
  if (formData.dateOfBirth) {
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      setError('Vous devez avoir au moins 18 ans pour créer un compte');
      return;
    }
  }

  // Si tout est ok, envoyer la requête signup
  setLoading(true);
  try {
    const response = await fetch('http://localhost:5000/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message);
    } else {
      localStorage.setItem('token', data.token);
      setSuccess(data.message || 'Inscription réussie ! Vous êtes maintenant connecté.');
      setTimeout(() => window.location.href = '/dashboard', 2000);
    }
  } catch (err) {
    console.error(err);
    setError('Une erreur est survenue lors de l\'inscription');
  } finally {
    setLoading(false);
  }
};


  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Redirection vers la connexion...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0066CC] to-[#0052A3] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-[#0066CC] rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>Rejoignez Ma Banque et gérez vos finances en toute sécurité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+216 12 345 678"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="pl-10"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="123 Avenue Habib Bourguiba, Tunis"
                  value={formData.address}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">Minimum 8 caractères</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSignup}
              className="w-full bg-[#0066CC] hover:bg-[#0052A3]" 
              disabled={loading || success}
            >
              {loading ? 'Inscription en cours...' : success ? '✓ Inscription réussie' : 'S\'inscrire'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Vous avez déjà un compte ? </span>
              <button 
                type="button" 
                onClick={() => setShowLogin(true)} 
                className="text-[#0066CC] hover:underline font-medium"
              >
                Se connecter
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}