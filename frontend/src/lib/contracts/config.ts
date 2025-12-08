import { Address } from 'viem';

// Contract addresses from deploy.json (BSC Testnet)
export const CONTRACTS = {
  BSC_TESTNET: {
    NST_FINANCE: '0x2025cF1312D5692E77FcF8bb5ffAE6621C106E39' as Address,
    USDT: '0xaB8729c64385E202750c1A08Ac25cA3410E5201d' as Address,
    USDC: '0x1e7FC218ef637705Ec3aFfEDee9C6CfE31368CBf' as Address,
    NST: '0x73E3ef5e243133dfd14E4dAc31bdF7c8a36eE7Bc' as Address,
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
