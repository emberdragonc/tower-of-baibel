# Tower of Baibel Smart Contracts

Document collection registry with attestation (rating) and staking system.

## Contracts

### BaibelRegistry.sol
Collection registration and rating system (PR #7).

**Features:**
- Collection registration with metadata (name, version, docCount, ipfsHash)
- Collection updates (author-only)
- Attestation system (1-5 star ratings with optional text reviews)
- One attestation per rater per collection (can update)
- Self-rating prevention

**Key Functions:**
- `registerCollection(id, name, version, docCount, ipfsHash)` - Register new collection
- `updateCollection(id, name, version, docCount, ipfsHash)` - Update existing collection
- `submitAttestation(collectionId, rating, review)` - Rate a collection
- `getCollection(id)` - Get collection details
- `getCollectionsByAuthor(author)` - Get all collections by author
- `getAttestations(collectionId)` - Get all ratings for a collection
- `getAverageRating(collectionId)` - Calculate average rating
- `getRatingCount(collectionId)` - Get number of ratings

### BaibelStaking.sol
EMBER token staking on collections (PR #8).

**Features:**
- Stake EMBER tokens on collections to signal quality
- Unstake with no cooldown (v1 simplicity)
- Owner-driven reward distribution (depositRewards pattern)
- Requires collection to exist in registry

**Key Functions:**
- `stake(collectionId, amount)` - Stake EMBER on a collection
- `unstake(collectionId)` - Withdraw staked EMBER
- `claimRewards()` - Claim pending rewards
- `depositRewards(amount)` - Owner deposits rewards (owner only)
- `allocateRewards(user, amount)` - Owner allocates rewards to user (owner only)
- `batchAllocateRewards(users[], amounts[])` - Batch allocate rewards (owner only)
- `getStake(collectionId, user)` - Get user's stake on collection
- `getTotalStaked(collectionId)` - Get total staked on collection
- `getPendingRewards(user)` - Get user's pending rewards

## EMBER Token
- Base Mainnet: `0x7FfBE850D2d45242efdb914D7d4Dbb682d0C9B07`
- Base Sepolia: Deploy MockEmberToken for testing

## Setup

```bash
# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts --no-git

# Run tests
forge test

# Run tests with coverage
forge coverage

# Run tests with verbose output
forge test -vvv
```

## Deployment

### Testnet (Base Sepolia)
```bash
source ~/.config/ember-treasury/.keys
forge script script/DeployTestnet.s.sol --rpc-url base-sepolia --broadcast
```

### Mainnet (Base)
```bash
source ~/.config/ember-treasury/.keys
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

## Test Coverage

| Contract | Lines | Statements | Branches | Functions |
|----------|-------|------------|----------|-----------|
| BaibelRegistry | 100% | 98.55% | 92.86% | 100% |
| BaibelStaking | 88.57% | 84.62% | 64.29% | 84.62% |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  BaibelRegistry │────▶│  BaibelStaking  │
│                 │     │                 │
│ - Collections   │     │ - Stakes        │
│ - Attestations  │     │ - Rewards       │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   EMBER Token   │
                        │  (ERC20 on Base)│
                        └─────────────────┘
```

## Security

- CEI pattern (Checks-Effects-Interactions) followed
- ReentrancyGuard for external token transfers
- SafeERC20 for token operations
- Custom errors for gas efficiency
- Access control via Ownable

## License

MIT
