// src/utils/helpers.ts

/**
 * Formate un nombre en devise (€)
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

/**
 * Formate une date en format jour/mois/année
 */
export const formatDate = (dateString: string | Date) => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Masque un IBAN sauf les 4 derniers caractères
 */
export const maskIBAN = (iban: string) => {
  if (!iban) return '';
  const visible = iban.slice(-4);
  const masked = '*'.repeat(iban.length - 4);
  return `${masked}${visible}`;
};
