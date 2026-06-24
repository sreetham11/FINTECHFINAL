export const formatCurrency = (amount: number, currency: string = 'SGD'): string => {
  const symbols: Record<string, string> = {
    SGD: '$',
    THB: '฿',
    JPY: '¥',
    MYR: 'RM',
    IDR: 'Rp',
  };
  const symbol = symbols[currency] || '$';
  return `${symbol}${amount.toFixed(2)}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
};

export const formatTime = (time: string): string => {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

export const convertCurrency = (amount: number, rate: number): number => {
  return Math.round(amount * rate * 100) / 100;
};

export const getRandomRotation = (index: number): number => {
  const rotations = [-2.5, 1.2, -1.8, 2.1, -0.8, 1.5, -2.2, 0.9, -1.3, 2.8, -0.5, 1.8, -2.0, 0.6];
  return rotations[index % rotations.length];
};

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    hawker: '#C0001F',
    cafe: '#F5C800',
    transport: '#0033A0',
    overseas: '#FF2D87',
    restaurant: '#C0001F',
    shopping: '#0033A0',
  };
  return colors[category] || '#1A1A1A';
};
