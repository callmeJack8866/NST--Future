import { Address } from 'viem';

// Contract addresses from deploy.json (BSC Testnet)
export const CONTRACTS = {
  BSC_TESTNET: {
    NST_FINANCE: '0x7afd3415E2aFFf6FC63f5D3d491d425274B77592' as Address,
    USDT: '0x0D2bD51872384C5c1Dc169581a2A8Aa9Df701Db7' as Address,
    USDC: '0x3c1b8f4712B6282d4ace3361EC618A4cAA2D3A2b' as Address,
    NST: '0xCDc3c52D3Bca569bD6cbe5C87510c91C541C2Bb7' as Address,
  },
  BSC_MAINNET: {
    NST_FINANCE: '0x1234567890123456789012345678901234567890' as Address, // Update when deployed
    USDT: '0x55d398326f99059fF775485246999027B3197955' as Address,
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address,
    NST: '0x0000000000000000000000000000000000000000' as Address, // Update when deployed
  },
};

// Get contracts based on chain IDs
export function getContracts(chainId: number) {
  if (chainId === 97) return CONTRACTS.BSC_TESTNET;
  if (chainId === 56) return CONTRACTS.BSC_MAINNET;
  return CONTRACTS.BSC_TESTNET; // Default to testnet for testing
}
