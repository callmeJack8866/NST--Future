import { Address } from 'viem';

// Contract addresses from deploy.json (BSC Testnet)
export const CONTRACTS = {
  BSC_TESTNET: {
    NST_FINANCE: '0x27002F72621035FF173d4da96e3c9e9b8D055DAF' as Address,
    USDT: '0x4E1747DFd6c3C4c316E4a6DBd462668e2223d83F' as Address,
    USDC: '0xb1Dc6F7d9248063CF2d8975500022602E3653663' as Address,
    NST: '0x0655150EBD95FAC2c7322ef463356dAfff51496B' as Address,
  },
  BSC_MAINNET: {
    NST_FINANCE: '0x1234567890123456789012345678901234567890' as Address, // Update when deployed
    USDT: '0x55d398326f99059fF775485246999027B3197955' as Address,
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address,
    NST: '0x0000000000000000000000000000000000000000' as Address, // Update when deployed
  },
};

// Get contracts based on chain ID
export function getContracts(chainId: number) {
  if (chainId === 97) return CONTRACTS.BSC_TESTNET;
  if (chainId === 56) return CONTRACTS.BSC_MAINNET;
  return CONTRACTS.BSC_TESTNET; // Default to testnet for testing
}
