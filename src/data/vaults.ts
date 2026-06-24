export interface VaultMember {
  friendId: string;
  name: string;
  avatar: string;
  contribution: number;
  status: 'paid' | 'pending';
}

export interface VaultTransaction {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  foreignAmount?: number;
  foreignCurrency?: string;
  triggeredBy: string;
  date: string;
}

export interface Vault {
  id: string;
  name: string;
  emoji: string;
  destination: string;
  targetAmount: number;
  collectedAmount: number;
  currency: string;
  foreignCurrency?: string;
  exchangeRate?: number;
  members: VaultMember[];
  transactions: VaultTransaction[];
  status: 'active' | 'completed';
  createdDate: string;
}

export const vaults: Vault[] = [
  {
    id: 'vault-1',
    name: 'Bangkok Trip',
    emoji: '🇹🇭',
    destination: 'Bangkok',
    targetAmount: 400,
    collectedAmount: 312,
    currency: 'SGD',
    foreignCurrency: 'THB',
    exchangeRate: 25.5,
    members: [
      { friendId: 'user-sree', name: 'Sree', avatar: 'S', contribution: 112, status: 'paid' },
      { friendId: 'kai', name: 'Kai', avatar: 'K', contribution: 100, status: 'paid' },
      { friendId: 'priya', name: 'Priya', avatar: 'P', contribution: 100, status: 'paid' },
      { friendId: 'wei', name: 'Wei', avatar: 'W', contribution: 0, status: 'pending' },
    ],
    transactions: [
      { id: 'vt-1', merchant: 'Chatuchak Weekend Market', amount: 28.00, currency: 'SGD', foreignAmount: 714, foreignCurrency: 'THB', triggeredBy: 'Sree', date: '2026-06-18' },
      { id: 'vt-2', merchant: 'Terminal 21 Food Court', amount: 15.50, currency: 'SGD', foreignAmount: 395, foreignCurrency: 'THB', triggeredBy: 'Kai', date: '2026-06-17' },
      { id: 'vt-3', merchant: '7-Eleven Sukhumvit', amount: 4.20, currency: 'SGD', foreignAmount: 107, foreignCurrency: 'THB', triggeredBy: 'Sree', date: '2026-06-17' },
      { id: 'vt-4', merchant: 'Grab Bike', amount: 3.80, currency: 'SGD', foreignAmount: 97, foreignCurrency: 'THB', triggeredBy: 'Priya', date: '2026-06-18' },
      { id: 'vt-5', merchant: 'MBK Center', amount: 22.00, currency: 'SGD', foreignAmount: 561, foreignCurrency: 'THB', triggeredBy: 'Kai', date: '2026-06-18' },
    ],
    status: 'active',
    createdDate: '2026-06-10',
  },
  {
    id: 'vault-2',
    name: 'Sentosa Day Trip',
    emoji: '🏝️',
    destination: 'Sentosa',
    targetAmount: 120,
    collectedAmount: 120,
    currency: 'SGD',
    members: [
      { friendId: 'user-sree', name: 'Sree', avatar: 'S', contribution: 40, status: 'paid' },
      { friendId: 'kai', name: 'Kai', avatar: 'K', contribution: 40, status: 'paid' },
      { friendId: 'manoj', name: 'Manoj', avatar: 'M', contribution: 40, status: 'paid' },
    ],
    transactions: [
      { id: 'vt-6', merchant: 'Sentosa Express', amount: 12.00, currency: 'SGD', triggeredBy: 'Sree', date: '2026-06-05' },
      { id: 'vt-7', merchant: 'Coastal Settlement', amount: 45.00, currency: 'SGD', triggeredBy: 'Manoj', date: '2026-06-05' },
      { id: 'vt-8', merchant: 'Beach Station Food', amount: 28.00, currency: 'SGD', triggeredBy: 'Kai', date: '2026-06-05' },
    ],
    status: 'completed',
    createdDate: '2026-06-01',
  },
];

export const getActiveVault = (): Vault | undefined => vaults.find(v => v.status === 'active');
export const getCompletedVaults = (): Vault[] => vaults.filter(v => v.status === 'completed');
