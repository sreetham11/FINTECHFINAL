export interface Transaction {
  id: string;
  merchant: string;
  category: 'hawker' | 'cafe' | 'transport' | 'overseas' | 'restaurant' | 'shopping';
  amount: number;
  currency: string;
  foreignAmount?: number;
  foreignCurrency?: string;
  location: string;
  area: string;
  date: string;
  time: string;
  friendIds: string[];
  splitAmount?: number;
  mood: string;
  moodEmoji: string;
  memoryLine: string;
  isOverseas: boolean;
  isMemory?: boolean;

  // ── Memory system (optional; populated for simulated payments) ──
  /** Spend-context chip chosen on the post-payment sheet. */
  spendContext?: import('@/lib/memory').SpendContext;
  /** Optional short note the user typed. */
  note?: string;
  /** First visit to this merchant. */
  isNewDiscovery?: boolean;
  /** Total visits to this merchant, including this one. */
  visitCount?: number;
  /** Time-of-day bucket derived from the timestamp. */
  timeOfDay?: import('@/lib/memory').TimeOfDay;
  /** NETS Miles this specific payment earned. */
  milesEarned?: number;
}

export const transactions: Transaction[] = [
  {
    id: 'txn-1',
    merchant: 'Tian Tian Chicken Rice',
    category: 'hawker',
    amount: 5.50,
    currency: 'SGD',
    location: 'Maxwell Food Centre',
    area: 'Chinatown',
    date: '2026-06-23',
    time: '12:34',
    friendIds: ['kai'],
    mood: 'satisfied',
    moodEmoji: '😋',
    memoryLine: 'you and Kai crushed chicken rice at Maxwell — your 4th hawker run together this month',
    isOverseas: false,
    isMemory: true,
  },
  {
    id: 'txn-2',
    merchant: 'Starbucks Raffles Place',
    category: 'cafe',
    amount: 8.90,
    currency: 'SGD',
    location: 'Raffles Place MRT',
    area: 'CBD',
    date: '2026-06-22',
    time: '08:15',
    friendIds: [],
    mood: 'focused',
    moodEmoji: '☕',
    memoryLine: 'solo morning coffee at Raffles — you do this every Thursday huh',
    isOverseas: false,
    isMemory: false,
  },
  {
    id: 'txn-3',
    merchant: 'GrabCar',
    category: 'transport',
    amount: 12.40,
    currency: 'SGD',
    location: 'Orchard → Tampines',
    area: 'Island-wide',
    date: '2026-06-21',
    time: '23:47',
    friendIds: [],
    mood: 'tired',
    moodEmoji: '😴',
    memoryLine: 'late night Grab home — you spent that fast 💀',
    isOverseas: false,
    isMemory: false,
  },
  {
    id: 'txn-4',
    merchant: 'Chatuchak Weekend Market',
    category: 'overseas',
    amount: 28.00,
    currency: 'SGD',
    foreignAmount: 714,
    foreignCurrency: 'THB',
    location: 'Chatuchak',
    area: 'Bangkok',
    date: '2026-06-18',
    time: '14:22',
    friendIds: ['kai', 'priya'],
    mood: 'excited',
    moodEmoji: '🤩',
    memoryLine: 'you, Kai & Priya went OFF at Chatuchak — ฿714 on vibes and vintage tees',
    isOverseas: true,
    isMemory: true,
  },
  {
    id: 'txn-5',
    merchant: 'Ya Kun Kaya Toast',
    category: 'cafe',
    amount: 6.20,
    currency: 'SGD',
    location: 'Bugis Junction',
    area: 'Bugis',
    date: '2026-06-20',
    time: '09:30',
    friendIds: [],
    mood: 'content',
    moodEmoji: '😊',
    memoryLine: 'kaya toast at Bugis — old school energy fr',
    isOverseas: false,
    isMemory: false,
  },
  {
    id: 'txn-6',
    merchant: 'Chinatown Complex Food Centre',
    category: 'hawker',
    amount: 4.80,
    currency: 'SGD',
    location: 'Chinatown Complex',
    area: 'Chinatown',
    date: '2026-06-19',
    time: '19:15',
    friendIds: ['kai'],
    mood: 'happy',
    moodEmoji: '🍜',
    memoryLine: 'another hawker run with Kai, classic — char kway teow hits different at night',
    isOverseas: false,
    isMemory: true,
  },
  {
    id: 'txn-7',
    merchant: 'Terminal 21 Food Court',
    category: 'overseas',
    amount: 15.50,
    currency: 'SGD',
    foreignAmount: 395,
    foreignCurrency: 'THB',
    location: 'Terminal 21',
    area: 'Bangkok',
    date: '2026-06-17',
    time: '13:00',
    friendIds: [],
    splitAmount: 3.10,
    mood: 'chill',
    moodEmoji: '😌',
    memoryLine: 'lunch at Terminal 21 — everyone ate well for ฿79 each',
    isOverseas: true,
    isMemory: false,
  },
  {
    id: 'txn-8',
    merchant: 'Old Chang Kee',
    category: 'hawker',
    amount: 3.60,
    currency: 'SGD',
    location: 'Tampines Mall',
    area: 'Tampines',
    date: '2026-06-16',
    time: '16:45',
    friendIds: [],
    mood: 'chill',
    moodEmoji: '😌',
    memoryLine: 'solo curry puff at Tampines — comfort snack unlocked',
    isOverseas: false,
    isMemory: false,
  }
];

export const getTransactionsByFilter = (filter: 'all' | 'friends' | 'solo' | 'overseas'): Transaction[] => {
  switch (filter) {
    case 'friends':
      return transactions.filter(t => t.friendIds.length > 0 && !t.isOverseas);
    case 'solo':
      return transactions.filter(t => t.friendIds.length === 0);
    case 'overseas':
      return transactions.filter(t => t.isOverseas);
    default:
      return transactions;
  }
};

export const getLatestTransaction = (): Transaction => transactions[0];

export const getMonthlyStats = () => {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const hawkerCount = transactions.filter(t => t.category === 'hawker').length;
  const cafeCount = transactions.filter(t => t.category === 'cafe').length;
  const overseasCount = transactions.filter(t => t.isOverseas).length;
  
  return {
    totalSpent: total,
    transactionCount: transactions.length,
    hawkerPercentage: Math.round((hawkerCount / transactions.length) * 100),
    cafePercentage: Math.round((cafeCount / transactions.length) * 100),
    overseasPercentage: Math.round((overseasCount / transactions.length) * 100),
    topCategory: 'Hawkers',
    topCategoryPercent: 42,
    peakTime: 'Thursday evenings',
    moodPattern: 'happy after food, anxious after shopping',
  };
};
