import { Address } from 'viem';

// Contract addresses from deploy.json (BSC Testnet)
export const CONTRACTS = {
  BSC_TESTNET: {
    NST_FINANCE: '0xC146a3798F1234583B01a7D2d11EabB81Ad2c54c' as Address,
    USDT: '0x25cD2009096f95a1d5C6db2aB2De318498B9A446' as Address,
    USDC: '0xade65A4733B7Afbc641e50795196c23717B3DaC3' as Address,
    NST: '0x923a101716680B6Ed6AA5C7287bF6D64a0194CC7' as Address,
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
