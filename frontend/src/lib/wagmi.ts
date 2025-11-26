import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc, bscTestnet } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const config = getDefaultConfig({
  appName: 'NST Finance',
  projectId,
  chains: process.env.NEXT_PUBLIC_CHAIN_ID === '56' ? [bsc] : [bscTestnet],
  ssr: true,
});