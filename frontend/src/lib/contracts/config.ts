import { Address } from 'viem';

// Contract addresses from deploy.json (BSC Testnet)
export const CONTRACTS = {
  BSC_TESTNET: {
    NST_FINANCE: '0x2Ade89fCce1225dDD85b99e413C59ff11949eEF0' as Address,
    USDT: '0x641E82Bbc15fd511B6231B00c8582390F5bAc3b4' as Address,
    USDC: '0x2313213281BB93B085Af40809DddACFd496965E1' as Address,
    NST: '0x1c173fDBa3d93e74e26647918144B045A65e3081' as Address,
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
