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
    friendIds: ['manoj'],
    mood: 'content',
    moodEmoji: '😊',
    memoryLine: 'kaya toast with Manoj at Bugis — old school energy fr',
    isOverseas: false,
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
    friendIds: ['kai', 'manoj', 'priya', 'wei'],
    splitAmount: 3.10,
    mood: 'happy',
    moodEmoji: '😋',
    memoryLine: 'squad lunch at Terminal 21 — split 5 ways, everyone ate well for ฿79 each',
    isOverseas: true,
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
  },
  {
    id: 'txn-9',
    merchant: 'Gong Cha',
    category: 'cafe',
    amount: 5.40,
    currency: 'SGD',
    location: '313@Somerset',
    area: 'Somerset',
    date: '2026-06-15',
    time: '15:20',
    friendIds: ['wei', 'priya'],
    mood: 'happy',
    moodEmoji: '🧋',
    memoryLine: 'bubble tea with Wei & Priya — your 3rd boba this week, no regrets',
    isOverseas: false,
  },
  {
    id: 'txn-10',
    merchant: '7-Eleven Sukhumvit',
    category: 'overseas',
    amount: 4.20,
    currency: 'SGD',
    foreignAmount: 107,
    foreignCurrency: 'THB',
    location: 'Sukhumvit Soi 11',
    area: 'Bangkok',
    date: '2026-06-17',
    time: '22:30',
    friendIds: ['kai'],
    mood: 'chill',
    moodEmoji: '🏪',
    memoryLine: 'late night 7-Eleven run with Kai in Bangkok — Leo beer and onigiri, living',
    isOverseas: true,
  },
  {
    id: 'txn-11',
    merchant: 'Hai Di Lao',
    category: 'restaurant',
    amount: 42.80,
    currency: 'SGD',
    location: 'Clarke Quay Central',
    area: 'Clarke Quay',
    date: '2026-06-14',
    time: '19:30',
    friendIds: ['kai', 'manoj', 'priya', 'wei'],
    splitAmount: 8.56,
    mood: 'hyped',
    moodEmoji: '🔥',
    memoryLine: 'Hai Di Lao with the whole squad — $42.80 split 5 ways, birthday vibes for Priya 🎂',
    isOverseas: false,
  },
  {
    id: 'txn-12',
    merchant: 'Grab Bike',
    category: 'transport',
    amount: 3.80,
    currency: 'SGD',
    foreignAmount: 97,
    foreignCurrency: 'THB',
    location: 'Khao San → Sukhumvit',
    area: 'Bangkok',
    date: '2026-06-18',
    time: '20:10',
    friendIds: [],
    mood: 'adventurous',
    moodEmoji: '🛵',
    memoryLine: 'solo Grab bike across Bangkok — main character energy activated',
    isOverseas: true,
  },
  {
    id: 'txn-13',
    merchant: 'Don Don Donki',
    category: 'shopping',
    amount: 18.90,
    currency: 'SGD',
    location: 'Orchard Central',
    area: 'Orchard',
    date: '2026-06-13',
    time: '21:00',
    friendIds: ['wei'],
    mood: 'impulsive',
    moodEmoji: '🛒',
    memoryLine: 'Donki run with Wei — you didn\'t need those snacks but here we are',
    isOverseas: false,
  },
  {
    id: 'txn-14',
    merchant: 'Lau Pa Sat',
    category: 'hawker',
    amount: 7.50,
    currency: 'SGD',
    location: 'Lau Pa Sat',
    area: 'CBD',
    date: '2026-06-12',
    time: '12:00',
    friendIds: ['manoj', 'priya'],
    mood: 'satisfied',
    moodEmoji: '🍢',
    memoryLine: 'satay lunch at Lau Pa Sat with Manoj & Priya — the smoke hits different on a Thursday',
    isOverseas: false,
  },
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
