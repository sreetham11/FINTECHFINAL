export interface CountryInfo {
  name: string;
  currency: string;
  currencySymbol: string;
  sgdRate: number; // 1 SGD = X foreign currency
  tipCulture: string;
  paymentMethods: string[];
  netsAcceptance: 'HIGH' | 'MEDIUM' | 'LOW';
  scamWarnings: string[];
  commonPhrases?: Record<string, string>; // payment-related local phrases
}

export const OVERSEAS_COUNTRIES: Record<string, CountryInfo> = {
  MY: {
    name: 'Malaysia',
    currency: 'MYR',
    currencySymbol: 'RM',
    sgdRate: 3.48,
    tipCulture: 'Tipping is not customary in Malaysia. Service charge (10%) is often added automatically at restaurants. At hawker stalls, no tip expected.',
    paymentMethods: ['DuitNow QR (scan-to-pay)', 'Touch \'n Go eWallet', 'Maybank QR', 'Cash (MYR)', 'Visa/Mastercard at malls'],
    netsAcceptance: 'HIGH',
    scamWarnings: [
      'Unofficial money changers at borders may give bad rates — use banks or licensed changers',
      'Taxi drivers at KLIA may try to negotiate fixed rates above meter — always insist on meter',
      'At tourist areas, unsolicited "guides" may lead you to shops where they earn commission',
    ],
    commonPhrases: {
      'How much?': 'Berapa harga?',
      'Can pay by card?': 'Boleh bayar dengan kad?',
      'Give me receipt': 'Bagi saya resit',
    },
  },
  TH: {
    name: 'Thailand',
    currency: 'THB',
    currencySymbol: '฿',
    sgdRate: 25.5,
    tipCulture: 'Tipping appreciated but not mandatory. ฿20-50 at restaurants is generous. Massage places: ฿50-100 per person. Street food: no tip expected.',
    paymentMethods: ['PromptPay QR (widely accepted)', 'NETS QR at major merchants', 'Cash (THB preferred for street food)', 'Visa/Mastercard at malls and hotels'],
    netsAcceptance: 'HIGH',
    scamWarnings: [
      'The "temple is closed today" scam — tuk-tuk drivers claim temples are closed to detour you to gem shops',
      'Gem scams near Grand Palace — locals claim you can resell gems at a profit in Singapore',
      'Taxi drivers may claim meter is broken — only use GrabTH or insist on meter',
      'Money changers on Khao San Road may shortchange — count your notes carefully',
    ],
    commonPhrases: {
      'How much?': 'Tao rai?',
      'Too expensive': 'Phaeng pai',
      'Do you accept card?': 'Rap bat credit mai?',
    },
  },
  JP: {
    name: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    sgdRate: 111.5,
    tipCulture: 'NEVER tip in Japan — it is considered rude or even insulting. Staff take pride in their work without expecting extra payment. Service charge is always included.',
    paymentMethods: ['IC Cards (Suica/Pasmo) for transit and convenience stores', 'Cash (JPY) widely preferred — many small restaurants are cash-only', 'PayPay QR at some merchants', 'Visa/Mastercard at department stores and hotels', 'NETS acceptance is limited'],
    netsAcceptance: 'MEDIUM',
    scamWarnings: [
      'Japan is extremely safe — scams are rare. Main risk is tourist pricing at some souvenir shops near Asakusa',
      'Nightclubs and bars in Roppongi sometimes add surprise "cover charges" — confirm prices before entering',
      'Some currency exchange machines at airports give slightly worse rates than in-city banks',
    ],
    commonPhrases: {
      'How much?': 'Ikura desu ka?',
      'Cash only?': 'Genkin dake desu ka?',
      'Do you take card?': 'Kaado wa tsukaemasu ka?',
    },
  },
  ID: {
    name: 'Indonesia',
    currency: 'IDR',
    currencySymbol: 'Rp',
    sgdRate: 11200,
    tipCulture: '10% service charge is common at restaurants. Tipping guides and drivers Rp50,000-100,000 for good service is appreciated. Warung (local eateries): no tip needed.',
    paymentMethods: ['QRIS QR (universal — works across all Indonesian e-wallets)', 'GoPay / OVO / Dana eWallets', 'Cash (IDR) essential for markets and small shops', 'Visa/Mastercard at malls in Jakarta/Bali', 'NETS QR at some tourist merchants in Bali'],
    netsAcceptance: 'MEDIUM',
    scamWarnings: [
      'Airport taxi touts in Bali will quote 3-5x actual rates — use Grab or official metered taxis only',
      'Currency exchange: avoid Dynamic Currency Conversion (DCC) on cards — always choose to pay in IDR',
      'Fake "fixed price" art shops at tourist sites — items are typically 10x negotiable',
      'Beware of petrol sold in bottles by roadside in Bali — some is diluted',
    ],
  },
  VN: {
    name: 'Vietnam',
    currency: 'VND',
    currencySymbol: '₫',
    sgdRate: 17500,
    tipCulture: 'Tipping is becoming more accepted in tourist areas. At restaurants: 10% if no service charge. Guides and drivers: 50,000-100,000 VND per person per day. Street food: no tip.',
    paymentMethods: ['Cash (VND) preferred — many small shops and street food vendors are cash-only', 'Grab for transport', 'VNPay QR at some restaurants and pharmacies', 'Visa/Mastercard at hotels and malls in HCMC/Hanoi'],
    netsAcceptance: 'LOW',
    scamWarnings: [
      'Cyclo (rickshaw) drivers often quote in USD and demand much more on arrival — agree price in VND upfront',
      'Shoe shiners in tourist areas may start polishing without asking, then demand high payment',
      '"Free" bracelet sellers near temples — it is not free',
      'Always count your VND carefully — large denominations look similar',
    ],
  },
  AU: {
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    sgdRate: 1.13,
    tipCulture: 'Tipping is optional but appreciated. 10% at sit-down restaurants is generous. Cafes: round up or $1-2. No expectation for fast food, takeaway, or taxis. Card terminals often prompt for tip.',
    paymentMethods: ['Tap-and-go (contactless card) accepted almost universally', 'Apple Pay / Google Pay widely used', 'Cash less common but accepted everywhere', 'EFTPOS (local debit) at all merchants', 'NETS not accepted — use Visa/Mastercard'],
    netsAcceptance: 'LOW',
    scamWarnings: [
      'Petrol station scams are rare — Australia has strong consumer protection',
      'Sunscreen is essential — UV index is extreme even on cloudy days',
      'Riptides at beaches — swim between the flags only, never ignore beach safety signage',
    ],
  },
  GB: {
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    sgdRate: 0.59,
    tipCulture: '10-15% at sit-down restaurants if service charge not included (check the bill). Pubs: no tipping expected for drinks at the bar. Taxis: round up or 10% for good service.',
    paymentMethods: ['Contactless card up to £100 per transaction', 'Apple Pay / Google Pay widely used', 'Cash accepted everywhere but less common', 'Chip and PIN for larger amounts', 'NETS not accepted — use Visa/Mastercard'],
    netsAcceptance: 'LOW',
    scamWarnings: [
      'Pickpockets at major tourist sites (Tower of London, Oxford Street) — keep bags in front',
      '"Friendship bracelet" scam near tourist areas — walk away immediately',
      'Fake charity collectors — licensed UK charities carry official ID',
      'Unlicensed minicabs at airports/clubs — only use official black cabs or Uber',
    ],
  },
  US: {
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    sgdRate: 0.74,
    tipCulture: 'Tipping is not optional in the US — it is expected. Restaurants: 18-20% minimum. Bars: $1-2 per drink. Hotels: $2-5 per bag for porter, $2-5 per night for housekeeping. Taxis/Uber: 15-20%. Salon/spa: 20%.',
    paymentMethods: ['Credit/debit card accepted virtually everywhere', 'Apple Pay / Google Pay at contactless terminals', 'Cash accepted everywhere', 'Venmo / Zelle for person-to-person', 'NETS not accepted — use Visa/Mastercard'],
    netsAcceptance: 'LOW',
    scamWarnings: [
      'Credit card skimmers at gas station pumps — use the pump closest to the cashier or pay inside',
      'Street vendors in NYC selling "discounted" electronics — products are often fake or empty boxes',
      'Fake police officers demanding to see your wallet — real officers never ask to hold your cash',
      'Overpriced taxis to/from airports in NYC — always use metered Yellow Cab or Uber',
    ],
  },
};

export function getCountryInfo(countryCode: string): CountryInfo | null {
  return OVERSEAS_COUNTRIES[countryCode.toUpperCase()] ?? null;
}

export function getAllCountryCodes(): string[] {
  return Object.keys(OVERSEAS_COUNTRIES);
}
