# NST Finance - Smart Contracts

> Decentralized donation and node-based reward system on BNB Smart Chain

## Overview

NST Finance v1.1 - A transparent blockchain platform for donations, node ownership, referral rewards, and gamified points system.

**Network:** BNB Smart Chain (BSC)  
**Solidity:** 0.8.24  

## Features

- 💰 **Donations**: Minimum 100 USD (USDT/USDC)
- 🔷 **Nodes**: 2000 USD each, max 5 per user, 100 total supply
- 👥 **Referrals**: Earn NST tokens for referring users
- ⭐ **Points System**: Earn points for donations (2x for node holders)
- 🎁 **Airdrops**: Monthly rewards for top contributors

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:

```bash
PRIVATE_KEY=your_private_key_without_0x
TREASURY_ADDRESS=0xYourTreasuryAddress
BSCSCAN_API_KEY=your_bscscan_api_key
```

### Compile

```bash
npm run compile
```

### Test

```bash
npm test
```

### Deploy

```bash
# Local testing
npm run deploy:local

# BSC Testnet
npm run deploy:testnet

# BSC Mainnet
npm run deploy:mainnet
```

After deployment, check `deploy.json` for contract addresses.

### Verify

```bash
npm run verify:testnet
# or
npm run verify:mainnet
```

## Contract Structure

```
contracts/
├── NSTFinance.sol           # Main contract
├── interfaces/              # Contract interfaces
└── mocks/                   # Test tokens (USDT, USDC, NST)
```

## Key Constants

| Parameter | Value |
|-----------|-------|
| Min Donation | 100 USD |
| Node Price | 2000 USD |
| Max Nodes/User | 5 |
| Total Nodes | 120 |
| Public Nodes | 100 |
| Team Reserved | 20 |
| Team Lock | 2 years |
| Points/USD | 1 point |
| Node Holder Bonus | 2x points |

## Main Functions

### User Functions

```solidity
donate(token, amount, referrerHint)      // Make donation
buyNode(token, nodeCount, referrerHint)  // Purchase nodes
claimNST()                                // Claim rewards
claimAirdrop(round)                       // Claim airdrop
```

### View Functions

```solidity
getUserInfo(address)          // Get user data
getGlobalStats()              // Get platform stats
checkAirdropEligibility()     // Check airdrop status
```

### Admin Functions

```solidity
setNSTToken(address)          // Set NST token
setClaimEnabled(bool)         // Enable/disable claims
takeSnapshot()                // Take monthly snapshot
createAirdropRound()          // Create airdrop round
```

## Deployment Checklist

1. ✅ Configure `.env` file
2. ✅ Fund wallet with BNB for gas
3. ✅ Compile contracts: `npm run compile`
4. ✅ Run tests: `npm test`
5. ✅ Deploy: `npm run deploy:testnet`
6. ✅ Verify: `npm run verify:testnet`
7. ✅ Check `deploy.json` for addresses

## Post-Deployment Setup

After deploying to testnet/mainnet:

1. Deploy NST Token (ERC20)
2. Set NST token: `setNSTToken(nstAddress)`
3. Transfer NST to contract for rewards
4. Enable claims: `setClaimEnabled(true)`
5. Setup monthly snapshots (10th & 20th)
6. Allocate team nodes (if needed)

## Team Node System 

NST Finance reserves 20 nodes for the team:

- **Total Nodes**: 120 (100 public + 20 team)
- **Team Allocation**: Owner-controlled via `allocateTeamNodes()`
- **Lock Period**: 2 years from deployment
- **Benefits**: Team nodes earn all rewards (points, NST, referrals)
- **Restriction**: Cannot be transferred (locked in contract)
- **Transparency**: All allocations visible on-chain

### Allocate Team Nodes

```bash
# Set team addresses in .env
TEAM_ADDRESSES=0xAddress1:5,0xAddress2:10,0xAddress3:5

# Run configuration
npm run configure:testnet
```

## Security

- ✅ ReentrancyGuard
- ✅ SafeERC20
- ✅ Ownable (Access control)
- ⚠️ Not audited - audit before mainnet

## Gas Estimates

| Function | Gas Cost |
|----------|----------|
| donate() | ~80k - 120k |
| buyNode() | ~100k - 150k |
| claimNST() | ~50k - 70k |
| claimAirdrop() | ~60k - 80k |

## Support

- **Issues**: [GitHub Issues](https://github.com/nstfinance/contracts/issues)
- **Docs**: [docs.nst.finance](https://docs.nst.finance)
- **Website**: [nst.finance](https://www.nst.finance/)

## License

MIT

