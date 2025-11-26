export const CONSTANTS = {
    // Contract Constants
    MINIMUM_DONATION: 100,
    NODE_PRICE: 2000,
    MAX_NODES_PER_USER: 5,
    MAX_PUBLIC_NODES: 100,
    TEAM_RESERVED_NODES: 20,
    TOTAL_NODES: 120,
    
    // Rewards
    NODE_REFERRAL_REWARD: 500,
    DONATION_REFERRAL_REWARD_PER_1000: 100,
    FREE_NODE_REFERRAL_THRESHOLD: 10,
    
    // Points
    POINTS_PER_USD: 1,
    NODE_HOLDER_MULTIPLIER: 2,
    
    // Timeframes
    TEAM_LOCK_DURATION_DAYS: 730, // 2 years
    SNAPSHOT_DAYS: [10, 20], // Monthly snapshots
    
    // URLs
    DOCS_URL: 'https://docs.nst.finance',
    TWITTER_URL: 'https://twitter.com/nstfinance',
    TELEGRAM_URL: 'https://t.me/nstfinance',
    GITHUB_URL: 'https://github.com/nstfinance',
    
    // Blockchain
    BLOCK_EXPLORER_URL: 'https://bscscan.com',
    CHAIN_NAME: 'BNB Smart Chain',
  } as const;
  
  export const ROUTES = {
    HOME: '/',
    DONATE: '/donate',
    NODES: '/nodes',
    DASHBOARD: '/dashboard',
    LEADERBOARD: '/leaderboard',
    REFERRAL: '/referral',
  } as const;
  
  export const FEATURE_FLAGS = {
    ENABLE_AIRDROPS: true,
    ENABLE_TEAM_NODES: true,
    ENABLE_POINTS: true,
    ENABLE_LEADERBOARD: true,
  } as const;