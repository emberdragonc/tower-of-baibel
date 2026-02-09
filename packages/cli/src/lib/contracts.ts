import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, base } from 'viem/chains';

// Contract addresses - Base Sepolia (testnet)
export const CONTRACTS = {
  baseSepolia: {
    baibelRegistry: '0x487eDa788482142ECc4E7E8a7c9DD08B3ffE3862',
    baibelStaking: '0xC23278208cA7b90246572a8F2Dd66c0328ed187C',
    mockEmber: '0x9781D1B00F4a96e1590aA1118FBF33be3f9a2B01',
  },
  // Mainnet addresses (placeholder - update when deployed)
  base: {
    baibelRegistry: '0x0000000000000000000000000000000000000000',
    baibelStaking: '0x0000000000000000000000000000000000000000',
    mockEmber: '0x7FfBE850D2d45242efdb914D7d4Dbb682d0C9B07', // Real EMBER token
  },
} as const;

// BaibelRegistry ABI
export const BAIBEL_REGISTRY_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "doesCollectionExist",
    "inputs": [{ "name": "id", "type": "string", "internalType": "string" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAttestation",
    "inputs": [
      { "name": "collectionId", "type": "string", "internalType": "string" },
      { "name": "rater", "type": "address", "internalType": "address" }
    ],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "internalType": "struct BaibelRegistry.Attestation",
      "components": [
        { "name": "rater", "type": "address", "internalType": "address" },
        { "name": "rating", "type": "uint8", "internalType": "uint8" },
        { "name": "review", "type": "string", "internalType": "string" },
        { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAttestations",
    "inputs": [{ "name": "collectionId", "type": "string", "internalType": "string" }],
    "outputs": [{
      "name": "",
      "type": "tuple[]",
      "internalType": "struct BaibelRegistry.Attestation[]",
      "components": [
        { "name": "rater", "type": "address", "internalType": "address" },
        { "name": "rating", "type": "uint8", "internalType": "uint8" },
        { "name": "review", "type": "string", "internalType": "string" },
        { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAverageRating",
    "inputs": [{ "name": "collectionId", "type": "string", "internalType": "string" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCollection",
    "inputs": [{ "name": "id", "type": "string", "internalType": "string" }],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "internalType": "struct BaibelRegistry.Collection",
      "components": [
        { "name": "id", "type": "string", "internalType": "string" },
        { "name": "name", "type": "string", "internalType": "string" },
        { "name": "author", "type": "address", "internalType": "address" },
        { "name": "version", "type": "string", "internalType": "string" },
        { "name": "docCount", "type": "uint256", "internalType": "uint256" },
        { "name": "ipfsHash", "type": "string", "internalType": "string" },
        { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
        { "name": "updatedAt", "type": "uint256", "internalType": "uint256" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRatingCount",
    "inputs": [{ "name": "collectionId", "type": "string", "internalType": "string" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasUserAttested",
    "inputs": [
      { "name": "collectionId", "type": "string", "internalType": "string" },
      { "name": "rater", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerCollection",
    "inputs": [
      { "name": "id", "type": "string", "internalType": "string" },
      { "name": "name", "type": "string", "internalType": "string" },
      { "name": "version", "type": "string", "internalType": "string" },
      { "name": "docCount", "type": "uint256", "internalType": "uint256" },
      { "name": "ipfsHash", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submitAttestation",
    "inputs": [
      { "name": "collectionId", "type": "string", "internalType": "string" },
      { "name": "rating", "type": "uint8", "internalType": "uint8" },
      { "name": "review", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [{ "name": "newOwner", "type": "address", "internalType": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "AttestationSubmitted",
    "inputs": [
      { "name": "collectionId", "type": "string", "indexed": true, "internalType": "string" },
      { "name": "rater", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "rating", "type": "uint8", "indexed": false, "internalType": "uint8" },
      { "name": "review", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "CollectionAlreadyExists",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CollectionNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyCollectionId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyIpfsHash",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRating",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotCollectionAuthor",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SelfRatingNotAllowed",
    "inputs": []
  }
] as const;

// BaibelStaking ABI
export const BAIBEL_STAKING_ABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "_emberToken", "type": "address", "internalType": "address" },
      { "name": "_registry", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimRewards",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "emberToken",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract IERC20" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAvailableRewards",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPendingRewards",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getStake",
    "inputs": [
      { "name": "collectionId", "type": "string", "internalType": "string" },
      { "name": "user", "type": "address", "internalType": "address" }
    ],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "internalType": "struct BaibelStaking.Stake",
      "components": [
        { "name": "amount", "type": "uint256", "internalType": "uint256" },
        { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalStaked",
    "inputs": [{ "name": "collectionId", "type": "string", "internalType": "string" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserTotalStaked",
    "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingRewards",
    "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registry",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "contract IBaibelRegistry" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "stake",
    "inputs": [
      { "name": "collectionId", "type": "string", "internalType": "string" },
      { "name": "amount", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "stakes",
    "inputs": [
      { "name": "", "type": "string", "internalType": "string" },
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "amount", "type": "uint256", "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalStaked",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalStakedPerCollection",
    "inputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "unstake",
    "inputs": [{ "name": "collectionId", "type": "string", "internalType": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "RewardsClaimed",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Staked",
    "inputs": [
      { "name": "collectionId", "type": "string", "indexed": true, "internalType": "string" },
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Unstaked",
    "inputs": [
      { "name": "collectionId", "type": "string", "indexed": true, "internalType": "string" },
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "CollectionNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRegistry",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidToken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoActiveStake",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoRewardsToClaim",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAmount",
    "inputs": []
  }
] as const;

// ERC20 Token ABI (for EMBER)
export const ERC20_ABI = [
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      { "name": "owner", "type": "address", "internalType": "address" },
      { "name": "spender", "type": "address", "internalType": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address", "internalType": "address" },
      { "name": "value", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address", "internalType": "address" }],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decimals",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8", "internalType": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string", "internalType": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Approval",
    "inputs": [
      { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "spender", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "value", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "ERC20InsufficientAllowance",
    "inputs": [
      { "name": "spender", "type": "address", "internalType": "address" },
      { "name": "allowance", "type": "uint256", "internalType": "uint256" },
      { "name": "needed", "type": "uint256", "internalType": "uint256" }
    ]
  }
] as const;

// Get network configuration from environment or default to baseSepolia
export function getNetworkConfig() {
  const network = process.env.BAIBEL_NETWORK || 'baseSepolia';
  
  if (network === 'base') {
    return {
      chain: base,
      contracts: CONTRACTS.base,
      rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    };
  }
  
  return {
    chain: baseSepolia,
    contracts: CONTRACTS.baseSepolia,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  };
}

// Create a public client for read operations
export function getPublicClient() {
  const config = getNetworkConfig();
  
  return createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });
}

// Create a wallet client for write operations
export function getWalletClient(privateKey: string) {
  const config = getNetworkConfig();
  
  // Ensure private key has 0x prefix
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: config.chain,
    transport: http(config.rpcUrl),
  });
}

// Helper to get wallet address from private key
export function getWalletAddress(privateKey: string): string {
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey as `0x${string}`);
  return account.address;
}

// Parse amount with decimals
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseEther(amount);
}

// Format token amount for display
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return formatEther(amount);
}
