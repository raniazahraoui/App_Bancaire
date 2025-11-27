// Mock data for the banking application prototype

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'support' | 'admin';
  phone: string;
  accounts: Account[];
}

export interface Account {
  id: string;
  accountNumber: string;
  iban: string;
  balance: number;
  currency: string;
  type: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  bank: string;
  iban: string;
  type: 'same_bank' | 'national' | 'international';
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  recipient: string;
  type: 'debit' | 'credit';
  status: 'completed' | 'pending' | 'failed';
  category: string;
}

export interface Ticket {
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

export interface TicketResponse {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'client@banque.fr',
    name: 'Jean Dupont',
    role: 'client',
    phone: '+33 6 12 34 56 78',
    accounts: [
      {
        id: 'acc1',
        accountNumber: '12345678901',
        iban: 'FR76 1234 5678 9012 3456 7890 123',
        balance: 15420.50,
        currency: 'EUR',
        type: 'Compte Courant'
      },
      {
        id: 'acc2',
        accountNumber: '12345678902',
        iban: 'FR76 1234 5678 9012 3456 7890 124',
        balance: 25000.00,
        currency: 'EUR',
        type: 'Compte Épargne'
      }
    ]
  },
  {
    id: '2',
    email: 'support@banque.fr',
    name: 'Marie Martin',
    role: 'support',
    phone: '+33 6 98 76 54 32',
    accounts: []
  },
  {
    id: '3',
    email: 'admin@banque.fr',
    name: 'Pierre Bernard',
    role: 'admin',
    phone: '+33 6 11 22 33 44',
    accounts: []
  }
];

// Mock beneficiaries
export const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'ben1',
    name: 'Sophie Laurent',
    bank: 'Même Banque',
    iban: 'FR76 1234 5678 9012 3456 7890 125',
    type: 'same_bank'
  },
  {
    id: 'ben2',
    name: 'Thomas Petit',
    bank: 'BNP Paribas',
    iban: 'FR76 3000 4012 3456 7890 1234 567',
    type: 'national'
  },
  {
    id: 'ben3',
    name: 'Emma Schmidt',
    bank: 'Deutsche Bank',
    iban: 'DE89 3704 0044 0532 0130 00',
    type: 'international'
  }
];

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    date: '2025-11-26',
    amount: -125.50,
    currency: 'EUR',
    recipient: 'Amazon',
    type: 'debit',
    status: 'completed',
    category: 'Shopping'
  },
  {
    id: 'tx2',
    date: '2025-11-25',
    amount: 2500.00,
    currency: 'EUR',
    recipient: 'Salaire Entreprise ABC',
    type: 'credit',
    status: 'completed',
    category: 'Salaire'
  },
  {
    id: 'tx3',
    date: '2025-11-24',
    amount: -850.00,
    currency: 'EUR',
    recipient: 'Loyer Propriétaire',
    type: 'debit',
    status: 'completed',
    category: 'Logement'
  },
  {
    id: 'tx4',
    date: '2025-11-23',
    amount: -45.30,
    currency: 'EUR',
    recipient: 'Carrefour',
    type: 'debit',
    status: 'completed',
    category: 'Alimentation'
  },
  {
    id: 'tx5',
    date: '2025-11-22',
    amount: -15.00,
    currency: 'EUR',
    recipient: 'Netflix',
    type: 'debit',
    status: 'completed',
    category: 'Abonnements'
  },
  {
    id: 'tx6',
    date: '2025-11-21',
    amount: -65.00,
    currency: 'EUR',
    recipient: 'Station Service',
    type: 'debit',
    status: 'completed',
    category: 'Transport'
  },
  {
    id: 'tx7',
    date: '2025-11-20',
    amount: 200.00,
    currency: 'EUR',
    recipient: 'Virement Sophie Laurent',
    type: 'credit',
    status: 'completed',
    category: 'Virement'
  },
  {
    id: 'tx8',
    date: '2025-11-20',
    amount: -50.00,
    currency: 'EUR',
    recipient: 'Virement Thomas Petit',
    type: 'debit',
    status: 'pending',
    category: 'Virement'
  }
];

// Mock tickets
export const mockTickets: Ticket[] = [
  {
    id: 'tick1',
    userId: '1',
    userName: 'Jean Dupont',
    subject: 'Problème de connexion',
    message: "Je n'arrive pas à me connecter depuis ce matin. J'ai essayé de réinitialiser mon mot de passe mais je ne reçois pas l'email.",
    status: 'open',
    priority: 'high',
    createdAt: '2025-11-26T09:30:00',
    updatedAt: '2025-11-26T09:30:00',
    responses: []
  },
  {
    id: 'tick2',
    userId: '1',
    userName: 'Jean Dupont',
    subject: 'Question sur les frais',
    message: 'Pouvez-vous m\'expliquer les frais de 5€ sur mon compte du 15 novembre ?',
    status: 'resolved',
    priority: 'low',
    createdAt: '2025-11-15T14:20:00',
    updatedAt: '2025-11-16T10:15:00',
    responses: [
      {
        id: 'resp1',
        userId: '2',
        userName: 'Service Support',
        message: 'Bonjour, ces frais correspondent à votre abonnement mensuel pour la carte bancaire premium. Cordialement.',
        createdAt: '2025-11-16T10:15:00'
      }
    ]
  }
];

// Utility functions
export const maskIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length < 8) return iban;
  return `${cleaned.slice(0, 4)} **** **** **** **** ${cleaned.slice(-4)}`;
};

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
