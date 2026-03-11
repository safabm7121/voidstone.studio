export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,  // TND often uses 3 decimals
    maximumFractionDigits: 3
  }).format(amount).replace('TND', 'DT'); // Replace TND symbol with DT
};

export const formatCurrencySimple = (amount: number): string => {
  return `${amount.toFixed(3)} DT`;  
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-TN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};