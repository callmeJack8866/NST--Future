export const CONTRACTS = {
  BSC: {
    NST_FINANCE: "0x1234567890123456789012345678901234567890",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
}

export const CHAINS = {
  BSC: {
    id: 56,
    name: "BNB Smart Chain",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    explorer: "https://bscscan.com",
  },
}

export const NODE_PRICE = 2000 // USD
export const MIN_DONATION = 100 // USD
export const MAX_NODES_PER_USER = 5
export const GLOBAL_NODE_SUPPLY = 100
export const AUTO_UPGRADE_THRESHOLD = 2000 // USD donation for free node
export const NODE_REFERRAL_REWARD = 500 // NST
export const DONATION_REFERRAL_REWARD = 100 // NST per 1000 USD
export const FREE_NODE_REFERRAL_COUNT = 10 // referrals for free node

export const SUPPORTED_TOKENS = [
  { symbol: "USDT", name: "Tether USD", decimals: 18, icon: "💵" },
  { symbol: "USDC", name: "USD Coin", decimals: 18, icon: "💰" },
]
