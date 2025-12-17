# 🏦 Application Bancaire Complète

> Plateforme bancaire moderne et sécurisée avec interface web React et API REST Node.js

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture](#-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du projet](#-structure-du-projet)
- [Documentation API](#-documentation-api)
- [Sécurité](#-sécurité)
- [Licence](#-licence)

---

## 🎯 Vue d'ensemble

Application bancaire full-stack complète offrant une expérience utilisateur moderne pour la gestion de comptes, virements, bénéficiaires et support client. 
Le système combine une API REST robuste avec une interface utilisateur intuitive et responsive.

### Caractéristiques principales

#### 🔐 Sécurité renforcée
- Authentification JWT avec tokens à expiration (15 min)
- Double authentification par OTP (8 caractères alphanumériques)
- Système de verrouillage après tentatives échouées
- Refresh automatique des tokens
- Logs de sécurité détaillés
- Protection Helmet contre les vulnérabilités web

#### 💰 Gestion bancaire complète
- Comptes multiples (courant, épargne)
- Trois types de virements (instantané, national, international)
- Gestion des bénéficiaires
- Historique des transactions avec filtres avancés
- Statistiques et graphiques

#### 🎫 Support client intégré
- Système de tickets avec priorités
- Conversations en temps réel
- Interface dédiée pour l'équipe support
- Assignation et résolution de tickets

#### 👨‍💼 Administration complète
- Dashboard avec statistiques système
- Gestion des utilisateurs (CRUD)
- Changement de rôles dynamique
- Alertes de sécurité automatiques
- Blocage d'IP et déblocage de comptes

---

## 🏗 Architecture

### Diagramme global

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Dashboard  │  │   Virements  │  │   Support    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Bénéficiaires │  │  Historique  │  │    Admin     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
                         │ JWT + OTP
┌────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API REST Endpoints                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • Auth (login, signup, OTP)                         │  │
│  │  • Comptes & Transactions                            │  │
│  │  • Bénéficiaires & Virements                         │  │
│  │  • Support (tickets)                                 │  │
│  │  • Admin (users, logs, stats)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Middleware & Services                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • JWT Authentication                                 │  │
│  │  • OTP Generation & Validation                        │  │
│  │  • Email Service (Nodemailer)                         │  │
│  │  • Security Logs                                      │  │
│  │  • Session Refresh                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ MySQL Connection Pool
┌────────────────────────▼────────────────────────────────────┐
│                   DATABASE (MySQL)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    users     │  │   clients    │  │   accounts   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │beneficiaries │  │ transactions │  │   tickets    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │logs_security │  │ticket_resp.  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Stack technique

**Frontend**
- React 18.3.1 + TypeScript 5.6.2
- Vite 6.0.1 (build tool)
- Tailwind CSS 4.1.3 + shadcn/ui
- React Router 7.0.2
- Axios (HTTP client)

**Backend**
- Node.js 18+ + Express 5.1.0
- MySQL2 (connexion base de données)
- JWT (jsonwebtoken 9.0.2)
- Bcrypt 6.0.0 (hashage)
- Nodemailer 7.0.11 (emails)
- Helmet 8.1.0 (sécurité)

**Base de données**
- MySQL 5.7+
- 8 tables relationnelles
- Transactions ACID
- Foreign keys et cascades

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité

#### Inscription
- Formulaire avec validation
- Création automatique de compte courant
- Hashage bcrypt (10 rounds)
- Logs de sécurité

#### Connexion
- Email + mot de passe
- Génération OTP (8 caractères alphanumériques)
- Envoi email automatique
- Limite de 3 tentatives
- Verrouillage 10 minutes après échec
- Token JWT 15 minutes

#### Protection
- Auto-déconnexion après 10 min d'inactivité
- Refresh token automatique (< 5 min avant expiration)
- Validation des entrées
- Protection CSRF
- Headers sécurisés (Helmet)

### 💳 Gestion des comptes

#### Dashboard
- Vue d'ensemble multi-comptes
- Solde total masquable
- Transactions récentes (5 dernières)
- Actions rapides
- Statistiques visuelles

#### Comptes
- Types : Courant, Épargne
- Informations : Numéro, IBAN, RIB
- Solde en temps réel
- Historique complet

### 💸 Virements & Transferts

#### Trois types de virements

**1. Même banque** ⚡
- Transfert instantané
- Vérification solde
- Confirmation OTP
- Débit/crédit immédiat

**2. Banque nationale** 📅
- Délai : 1-2 jours ouvrés
- Statut "en attente"
- Notifications email/SMS
- Possibilité d'annulation

**3. Banque internationale** 🌍
- Délai : 3-5 jours ouvrés
- Support multi-devises
- Frais affichés
- Suivi détaillé

#### Processus sécurisé
1. Sélection compte source
2. Choix bénéficiaire
3. Montant + référence
4. Génération OTP
5. Validation OTP
6. Exécution transaction
7. Notifications

### 👥 Bénéficiaires

#### Gestion
- Ajout avec validation IBAN
- Modification des informations
- Suppression avec confirmation
- Catégorisation par type

#### Informations
- Nom complet
- Banque
- IBAN/RIB
- Type de transfert
- Date d'ajout

### 📊 Historique & Statistiques

#### Filtres avancés
- Par type (envoyé/reçu)
- Par statut
- Par compte
- Par période
- Recherche textuelle

#### Statistiques
- Montants totaux
- Nombre de transactions
- Graphiques temporels
- Répartition par type
- Export possible

### 🎫 Support Client

#### Interface Client
- Création de tickets
- Niveaux de priorité (low, medium, high)
- Conversation avec support
- Suivi du statut
- Recherche et filtres

#### Interface Support
- Vue tous tickets
- Assignation automatique
- Réponses en temps réel
- Résolution de tickets
- Statistiques équipe

### 👨‍💼 Administration

#### Gestion utilisateurs
- Liste complète avec filtres
- Détails et historique
- Modification des informations
- Changement de rôles
- Déblocage de comptes
- Réinitialisation mot de passe
- Suppression

#### Sécurité
- Logs détaillés
- Alertes automatiques :
  - Tentatives de connexion suspectes
  - Transactions inhabituelles
  - Comptes verrouillés
- Blocage d'IP
- Monitoring en temps réel

#### Statistiques système
- Nombre d'utilisateurs par rôle
- Transactions (volume, statuts)
- Tickets (ouverts, résolus)
- Graphiques de tendances

---

## 🛠 Technologies

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.6.2 | Typage statique |
| Vite | 6.0.1 | Build tool |
| Tailwind CSS | 4.1.3 | Styling |
| shadcn/ui | latest | Composants UI |
| Radix UI | latest | Primitives accessibles |
| React Router | 7.0.2 | Routing |
| Axios | latest | HTTP client |
| Lucide React | 0.487.0 | Icônes |
| Sonner | 2.0.3 | Notifications |

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| Node.js | 18+ | Runtime |
| Express | 5.1.0 | Framework web |
| MySQL2 | 3.15.3 | Driver MySQL |
| JWT | 9.0.2 | Authentification |
| Bcrypt | 6.0.0 | Hashage |
| Nodemailer | 7.0.11 | Emails |
| Helmet | 8.1.0 | Sécurité HTTP |
| CORS | 2.8.5 | Cross-Origin |
| Crypto-js | 4.2.0 | Chiffrement |
| Validator | 13.15.23 | Validation |
| Dotenv | 17.2.3 | Variables env |

---

## 📦 Prérequis

### Logiciels requis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **MySQL** >= 5.7
- **Git** (pour cloner le projet)

### Comptes externes

- **Gmail** : Pour l'envoi d'emails (créer un mot de passe d'application)
- *Optionnel* : **Twilio** pour SMS (non implémenté mais prévu)

### Vérification

```bash
node --version   # v18.0.0 ou supérieur
npm --version    # 9.0.0 ou supérieur
mysql --version  # 5.7 ou supérieur
```

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd Banque_App
```

### 2. Installation Backend

```bash
cd backend
npm install
```

**Dépendances installées** :
- express, cors, helmet
- mysql2
- bcrypt, jsonwebtoken, crypto-js
- nodemailer
- dotenv
- validator

### 3. Installation Frontend

```bash
cd ../frontend
npm install
```

**Dépendances installées** :
- react, react-dom
- typescript
- vite
- tailwindcss
- @radix-ui/* (composants)
- axios
- react-router-dom
- lucide-react, sonner

---

## ⚙️ Configuration

### Backend (.env)

Créer un fichier `.env` dans `backend/` :

```env
# Serveur
PORT=5000

# Base de données MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=banque_app

# JWT Secret (générer une clé forte)
JWT_SECRET=votre_secret_jwt_tres_securise_min_32_caracteres

# Email (Gmail)
GMAIL_USER=votre_email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# SMS (Twilio - optionnel)
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
```

### Frontend (.env)

Créer un fichier `.env` dans `frontend/` :

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Ma Banque
```

### Configuration Gmail

Pour obtenir un mot de passe d'application Gmail :

1. Accéder à [Google Account](https://myaccount.google.com/)
2. Sécurité → Validation en deux étapes (activer)
3. Mots de passe des applications
4. Sélectionner "Application" → "Autre"
5. Copier le mot de passe généré (16 caractères)
6. Utiliser dans `GMAIL_APP_PASSWORD`

### Base de données

#### 1. Créer la base de données

```bash
mysql -u root -p
```

```sql
CREATE DATABASE banque_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE banque_app;
```

#### 2. Créer les tables

```sql
-- Table users
CREATE TABLE users (
  id_user INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('client', 'support', 'admin') DEFAULT 'client',
  phone_number VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  failed_attempts INT DEFAULT 0,
  lock_until DATETIME,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- Table clients
CREATE TABLE clients (
  id_client INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  address TEXT,
  date_of_birth DATE,
  FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
  INDEX idx_user (id_user)
) ENGINE=InnoDB;

-- Table accounts
CREATE TABLE accounts (
  id_account INT AUTO_INCREMENT PRIMARY KEY,
  id_client INT NOT NULL,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  rib VARCHAR(20),
  iban VARCHAR(34) UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0,
  account_type ENUM('courant', 'epargne') DEFAULT 'courant',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE CASCADE,
  INDEX idx_client (id_client),
  INDEX idx_account_number (account_number)
) ENGINE=InnoDB;

-- Table beneficiaries
CREATE TABLE beneficiaries (
  id_beneficiary INT AUTO_INCREMENT PRIMARY KEY,
  id_client INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  rib VARCHAR(20),
  iban VARCHAR(34) NOT NULL,
  type ENUM('meme banque', 'autre banque nationale', 'banque etrangere'),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE CASCADE,
  INDEX idx_client (id_client),
  INDEX idx_iban (iban)
) ENGINE=InnoDB;

-- Table transactions
CREATE TABLE transactions (
  id_transaction INT AUTO_INCREMENT PRIMARY KEY,
  id_account_from INT NOT NULL,
  id_account_to INT,
  id_beneficiary INT,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'TND',
  status ENUM('en attente', 'réussie', 'refusée') DEFAULT 'en attente',
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  FOREIGN KEY (id_account_from) REFERENCES accounts(id_account),
  FOREIGN KEY (id_account_to) REFERENCES accounts(id_account),
  FOREIGN KEY (id_beneficiary) REFERENCES beneficiaries(id_beneficiary),
  INDEX idx_account_from (id_account_from),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Table tickets
CREATE TABLE tickets (
  id_ticket INT AUTO_INCREMENT PRIMARY KEY,
  id_client INT NOT NULL,
  id_support INT,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_client) REFERENCES clients(id_client) ON DELETE CASCADE,
  FOREIGN KEY (id_support) REFERENCES users(id_user),
  INDEX idx_status (status),
  INDEX idx_client (id_client)
) ENGINE=InnoDB;

-- Table ticket_responses
CREATE TABLE ticket_responses (
  id_response INT AUTO_INCREMENT PRIMARY KEY,
  id_ticket INT NOT NULL,
  id_user INT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket) ON DELETE CASCADE,
  FOREIGN KEY (id_user) REFERENCES users(id_user),
  INDEX idx_ticket (id_ticket)
) ENGINE=InnoDB;

-- Table logs_security
CREATE TABLE logs_security (
  id_log INT AUTO_INCREMENT PRIMARY KEY,
  id_user INT,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id_user),
  INDEX idx_user (id_user),
  INDEX idx_created (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB;
```

#### 3. Créer un compte administrateur

```bash
cd backend
node test.js
```

Cela créera un compte avec :
- **Email** : `admin@example.com`
- **Mot de passe** : `MotDePasseSecurise123!`
- **Rôle** : admin

---

## 🏃 Démarrage

### 1. Démarrer le backend

```bash
cd backend
npm start
# Ou en mode développement avec nodemon :
npm run dev
```

Le backend démarre sur `http://localhost:5000`

**Console attendue** :
```
✅ Server running on port 5000
```

### 2. Démarrer le frontend

```bash
cd frontend
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

**Console attendue** :
```
VITE v6.0.1  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Accéder à l'application

Ouvrir `http://localhost:5173` dans le navigateur.

**Connexion admin** :
- Email : `admin@example.com`
- Mot de passe : `MotDePasseSecurise123!`
- OTP : Vérifier l'email ou les logs backend

---

## 📁 Structure du projet

```
Banque_App/
│
├── backend/
│   ├── node_modules/
│   ├── db.js                    # Connexion MySQL
│   ├── emailService.js          # Service email
│   ├── index.js                 # Point d'entrée API
│   ├── dashboard.js             # Routes dashboard
│   ├── test.js                  # Script création admin
│   ├── package.json
│   ├── .env
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Composants shadcn/ui
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...
│   │   │   └── Layout.tsx      # Layout principal
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Context authentification
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TransferPage.tsx
│   │   │   ├── BeneficiariesPage.tsx
│   │   │   ├── TransactionsPage.tsx
│   │   │   ├── ClientSupportPage.tsx
│   │   │   ├── SupportTeamPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── utils/
│   │   │   ├── helpers.ts
│   │   │   └── mockData.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── .env
│   └── README.md
│
└── README.md                    # Ce fichier
```

---

## 📚 Documentation API

### Base URL

```
http://localhost:5000/api
```

### Authentification

Toutes les routes protégées nécessitent un header :
```
Authorization: Bearer <jwt_token>
```

### Routes principales

#### 🔐 Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/signup` | Inscription nouveau client | Non |
| POST | `/login` | Connexion + envoi OTP | Non |
| POST | `/verify-otp` | Vérification code OTP | Non |
| POST | `/resend-otp` | Renvoyer OTP | Non |
| GET | `/check-session` | Vérifier session | Non |

#### 👤 Gestion utilisateur

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/client-info` | Infos client connecté | Oui |
| PUT | `/update-profile` | Modifier profil | Oui |
| PUT | `/change-password` | Changer mot de passe | Oui |

#### 💰 Opérations bancaires

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/accounts` | Liste des comptes | Oui |
| GET | `/beneficiaries` | Liste bénéficiaires | Oui |
| POST | `/beneficiaries` | Ajouter bénéficiaire | Oui |
| PUT | `/beneficiaries/:id` | Modifier bénéficiaire | Oui |
| DELETE | `/beneficiaries/:id` | Supprimer bénéficiaire | Oui |
| POST | `/transfer/initiate` | Initier virement (OTP) | Oui |
| POST | `/transfer/confirm` | Confirmer virement | Oui |
| GET | `/transactions/history` | Historique transactions | Oui |
| GET | `/transactions/stats` | Statistiques | Oui |
| GET | `/transactions/:id` | Détails transaction | Oui |
| POST | `/transactions/:id/cancel` | Annuler transaction | Oui |

#### 🎫 Support

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/tickets` | Liste tickets | Oui |
| POST | `/tickets` | Créer ticket | Oui |
| GET | `/tickets/:id` | Détails ticket | Oui |
| POST | `/tickets/:id/responses` | Ajouter réponse | Oui |
| PATCH | `/tickets/:id/resolve` | Résoudre ticket | Oui (support) |

#### 👨‍💼 Administration

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/admin/stats` | Statistiques système | Admin |
| GET | `/admin/users` | Liste utilisateurs | Admin |
| GET | `/admin/users/:id` | Détails utilisateur | Admin |
| PUT | `/admin/users/:id` | Modifier utilisateur | Admin |
| DELETE | `/admin/users/:id` | Supprimer utilisateur | Admin |
| POST | `/admin/users/:id/unlock` | Débloquer compte | Admin |
| PATCH | `/admin/users/:id/change-role` | Changer rôle | Admin |
| POST | `/admin/users/:id/reset-password` | Reset mot de passe | Admin |
| GET | `/admin/logs` | Logs sécurité | Admin |
| GET | `/admin/transactions` | Toutes transactions | Admin |
| GET | `/admin/tickets` | Tous tickets | Admin |
| PATCH | `/admin/tickets/:id/assign` | Assigner ticket | Admin |
| GET | `/admin/security/alerts` | Alertes sécurité | Admin |
| POST | `/admin/security/block-ip` | Bloquer IP | Admin |

### Exemples de requêtes

#### Inscription

```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "MotDePasse123!",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+21612345678",
    "address": "123 Rue Example",
    "dateOfBirth": "1990-01-01"
  }'
```

#### Connexion

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "password": "MotDePasse123!"
  }'
```

**Response** :
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id_user": 1,
    "email": "client@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "client"
  },
  "needsOTP": true
}
```

#### Vérifier OTP

```bash
curl -X POST http://localhost:5000/api/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "otp": "A7F3D9C1"
  }'
```

#### Récupérer les comptes

```bash
curl -X GET http://localhost:5000/api/accounts \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

#### Initier un virement

```bash
curl -X POST http://localhost:5000/api/transfer/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": 1,
    "beneficiaryId": 2,
    "amount": 150.00,
    "currency": "TND",
    "reference": "Paiement facture"
  }'
```

---

## 🔒 Sécurité

### Mesures implémentées

#### Backend

1. **Authentification**
   - JWT avec expiration courte (15 min)
   - Refresh automatique des tokens (< 5 min)
   - Double authentification OTP (8 caractères)
   - Hashage bcrypt des mots de passe (10 rounds)

2. **Protection des comptes**
   - Limite de 3 tentatives de connexion
   - Verrouillage automatique (10 minutes)
   - Logs de toutes les tentatives
   - Déblocage manuel par admin

3. **Transferts**
   - Validation OTP obligatoire
   - Vérification du solde en temps réel
   - Transactions atomiques (ACID)
   - Logs détaillés

4. **Headers sécurisés**
   - Helmet (XSS, clickjacking, etc.)
   - CORS configuré (origin whitelist)
   - Content Security Policy

5. **Validation des données**
   - Nettoyage des entrées (sanitization)
   - Validation des formats (email, IBAN, phone)
   - Protection contre SQL injection (prepared statements)
   - Prévention NoSQL injection

6. **Logs de sécurité**
   - Toutes les actions sensibles loguées
   - IP et user-agent enregistrés
   - Alertes automatiques
   - Monitoring des anomalies

#### Frontend

1. **Authentification**
   - Token stocké en localStorage (JWT uniquement)
   - Auto-déconnexion après 10 min d'inactivité
   - Vérification session au chargement
   - Protection des routes selon rôle

2. **Sécurité des données**
   - Pas de données sensibles en localStorage
   - Validation côté client
   - Sanitization des inputs
   - Protection XSS

3. **Communication**
   - HTTPS uniquement en production
   - Token dans headers (pas dans URL)
   - Gestion d'erreurs sécurisée
   - Pas d'exposition d'infos sensibles

---

## 🧪 Tests

### Tests manuels

#### Scénario complet : Virement

1. **Inscription**
   - Accéder à `/signup`
   - Remplir le formulaire
   - Vérifier création compte courant
   - Vérifier connexion automatique

2. **Connexion**
   - Se déconnecter
   - Se reconnecter avec email/mot de passe
   - Vérifier réception OTP email
   - Valider OTP
   - Vérifier redirection dashboard

3. **Ajouter bénéficiaire**
   - Aller dans Bénéficiaires
   - Cliquer "Ajouter"
   - Remplir informations
   - Vérifier validation IBAN
   - Confirmer ajout

4. **Effectuer virement**
   - Aller dans Virements
   - Sélectionner compte source
   - Choisir bénéficiaire
   - Entrer montant
   - Ajouter référence
   - Confirmer
   - Valider OTP
   - Vérifier notification succès

5. **Consulter historique**
   - Aller dans Historique
   - Vérifier transaction présente
   - Tester filtres
   - Vérifier détails transaction

---

## 📄 Licence

ISC License

Copyright (c) 2025 Banque App

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

---

## 🎓 Ressources

### Documentation externe

- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [MySQL](https://dev.mysql.com/doc/)
- [JWT](https://jwt.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## ⭐ Remerciements

Merci à tous les contributeurs et aux technologies open-source utilisées dans ce projet.

**Stars ⭐** : N'oubliez pas de star le projet si vous le trouvez utile !

---

**Développé avec ❤️ pour l'éducation bancaire**

*Note : Cette application est développée à des fins éducatives. Pour une utilisation en production réelle, des audits de sécurité approfondis et des certifications sont nécessaires.*
