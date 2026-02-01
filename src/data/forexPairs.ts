export interface ForexPair {
    code: string;
    name: string;
    type: string;
    active: boolean;
    finnhubSymbol?: string; // For price tracking
}

export const FOREX_PAIRS: ForexPair[] = [
    // METALS - Only Gold is active
    { code: 'XAUUSD', name: 'Gold vs US Dollar', type: 'Metal', active: true, finnhubSymbol: 'OANDA:XAU_USD' },
    { code: 'XAGUSD', name: 'Silver vs US Dollar', type: 'Metal', active: false },

    // MAJORS
    { code: 'EURUSD', name: 'Euro vs US Dollar', type: 'Major', active: false },
    { code: 'GBPUSD', name: 'Great British Pound vs US Dollar', type: 'Major', active: false },
    { code: 'USDJPY', name: 'US Dollar vs Japanese Yen', type: 'Major', active: false },
    { code: 'USDCHF', name: 'US Dollar vs Swiss Franc', type: 'Major', active: false },
    { code: 'AUDUSD', name: 'Australian Dollar vs US Dollar', type: 'Major', active: false },
    { code: 'USDCAD', name: 'US Dollar vs Canadian Dollar', type: 'Major', active: false },
    { code: 'NZDUSD', name: 'New Zealand Dollar vs US Dollar', type: 'Major', active: false },

    // MINORS
    { code: 'EURGBP', name: 'Euro vs Great British Pound', type: 'Minor', active: false },
    { code: 'EURJPY', name: 'Euro vs Japanese Yen', type: 'Minor', active: false },
    { code: 'GBPJPY', name: 'Great British Pound vs Japanese Yen', type: 'Minor', active: false },
    { code: 'AUDJPY', name: 'Australian Dollar vs Japanese Yen', type: 'Minor', active: false },
    { code: 'EURAUD', name: 'Euro vs Australian Dollar', type: 'Minor', active: false },
    { code: 'GBPCHF', name: 'Great British Pound vs Swiss Franc', type: 'Minor', active: false },
    { code: 'EURCHF', name: 'Euro vs Swiss Franc', type: 'Minor', active: false },

    // EXOTICS
    { code: 'USDTRY', name: 'US Dollar vs Turkish Lira', type: 'Exotic', active: false },
    { code: 'USDZAR', name: 'US Dollar vs South African Rand', type: 'Exotic', active: false },
    { code: 'USDMXN', name: 'US Dollar vs Mexican Peso', type: 'Exotic', active: false },

    // INDICES (CFDs)
    { code: 'NAS100', name: 'Nasdaq 100', type: 'Index', active: false },
    { code: 'US30', name: 'Dow Jones Industrial Average', type: 'Index', active: false },
    { code: 'SPX500', name: 'S&P 500', type: 'Index', active: false },
    { code: 'GER30', name: 'DAX 30', type: 'Index', active: false },
    { code: 'UK100', name: 'FTSE 100', type: 'Index', active: false },

    // CRYPTO
    { code: 'BTCUSD', name: 'Bitcoin vs US Dollar', type: 'Crypto', active: false },
    { code: 'ETHUSD', name: 'Ethereum vs US Dollar', type: 'Crypto', active: false },
    { code: 'XRPUSD', name: 'Ripple vs US Dollar', type: 'Crypto', active: false },
    { code: 'SOLUSD', name: 'Solana vs US Dollar', type: 'Crypto', active: false },
];

// Helper to get active pairs only
export const getActivePairs = () => FOREX_PAIRS.filter(p => p.active);

// Helper to get Finnhub symbol for a pair
export const getFinnhubSymbol = (code: string): string | null => {
    const pair = FOREX_PAIRS.find(p => p.code === code);
    return pair?.finnhubSymbol || null;
};
