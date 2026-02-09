import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

// Contract addresses - Base Sepolia (testnet)
export const CONTRACTS = {
  baseSepolia: {
    baibelRegistry: "0x487eDa788482142ECc4E7E8a7c9DD08B3ffE3862",
    baibelStaking: "0xC23278208cA7b90246572a8F2Dd66c0328ed187C",
    mockEmber: "0x9781D1B00F4a96e1590aA1118FBF33be3f9a2B01",
  },
} as const;

// BaibelRegistry ABI
export const BAIBEL_REGISTRY_ABI = [
  {
    type: "function",
    name: "doesCollectionExist",
    inputs: [{ name: "id", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAttestation",
    inputs: [
      { name: "collectionId", type: "string", internalType: "string" },
      { name: "rater", type: "address", internalType: "address" },
    ],
    outputs: [{
      name: "",
      type: "tuple",
      internalType: "struct BaibelRegistry.Attestation",
      components: [
        { name: "rater", type: "address", internalType: "address" },
        { name: "rating", type: "uint8", internalType: "uint8" },
        { name: "review", type: "string", internalType: "string" },
        { name: "timestamp", type: "uint256", internalType: "uint256" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAttestations",
    inputs: [{ name: "collectionId", type: "string", internalType: "string" }],
    outputs: [{
      name: "",
      type: "tuple[]",
      internalType: "struct BaibelRegistry.Attestation[]",
      components: [
        { name: "rater", type: "address", internalType: "address" },
        { name: "rating", type: "uint8", internalType: "uint8" },
        { name: "review", type: "string", internalType: "string" },
        { name: "timestamp", type: "uint256", internalType: "uint256" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAverageRating",
    inputs: [{ name: "collectionId", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCollection",
    inputs: [{ name: "id", type: "string", internalType: "string" }],
    outputs: [{
      name: "",
      type: "tuple",
      internalType: "struct BaibelRegistry.Collection",
      components: [
        { name: "id", type: "string", internalType: "string" },
        { name: "name", type: "string", internalType: "string" },
        { name: "author", type: "address", internalType: "address" },
        { name: "version", type: "string", internalType: "string" },
        { name: "docCount", type: "uint256", internalType: "uint256" },
        { name: "ipfsHash", type: "string", internalType: "string" },
        { name: "createdAt", type: "uint256", internalType: "uint256" },
        { name: "updatedAt", type: "uint256", internalType: "uint256" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRatingCount",
    inputs: [{ name: "collectionId", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasUserAttested",
    inputs: [
      { name: "collectionId", type: "string", internalType: "string" },
      { name: "rater", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
] as const;

// BaibelStaking ABI
export const BAIBEL_STAKING_ABI = [
  {
    type: "function",
    name: "getStake",
    inputs: [
      { name: "collectionId", type: "string", internalType: "string" },
      { name: "user", type: "address", internalType: "address" },
    ],
    outputs: [{
      name: "",
      type: "tuple",
      internalType: "struct BaibelStaking.Stake",
      components: [
        { name: "amount", type: "uint256", internalType: "uint256" },
        { name: "timestamp", type: "uint256", internalType: "uint256" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalStaked",
    inputs: [{ name: "collectionId", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserTotalStaked",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalStaked",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;

// Create a public client for read operations
export function getPublicClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });
}

// Contract read helpers
export async function getOnChainCollection(collectionId: string) {
  const client = getPublicClient();
  const address = CONTRACTS.baseSepolia.baibelRegistry;
  
  try {
    const data = await client.readContract({
      address: address as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: "getCollection",
      args: [collectionId],
    });
    
    return {
      id: data.id,
      name: data.name,
      author: data.author,
      version: data.version,
      docCount: Number(data.docCount),
      ipfsHash: data.ipfsHash,
      createdAt: Number(data.createdAt) * 1000,
      updatedAt: Number(data.updatedAt) * 1000,
    };
  } catch (error) {
    console.error("Error fetching on-chain collection:", error);
    return null;
  }
}

export async function getOnChainAverageRating(collectionId: string) {
  const client = getPublicClient();
  const address = CONTRACTS.baseSepolia.baibelRegistry;
  
  try {
    const rating = await client.readContract({
      address: address as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: "getAverageRating",
      args: [collectionId],
    });
    
    // Rating is stored with 1 decimal place (e.g., 45 = 4.5)
    return Number(rating) / 10;
  } catch (error) {
    console.error("Error fetching average rating:", error);
    return 0;
  }
}

export async function getOnChainRatingCount(collectionId: string) {
  const client = getPublicClient();
  const address = CONTRACTS.baseSepolia.baibelRegistry;
  
  try {
    const count = await client.readContract({
      address: address as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: "getRatingCount",
      args: [collectionId],
    });
    
    return Number(count);
  } catch (error) {
    console.error("Error fetching rating count:", error);
    return 0;
  }
}

export async function getOnChainAttestations(collectionId: string) {
  const client = getPublicClient();
  const address = CONTRACTS.baseSepolia.baibelRegistry;
  
  try {
    const attestations = await client.readContract({
      address: address as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: "getAttestations",
      args: [collectionId],
    });
    
    return attestations.map((a) => ({
      rater: a.rater,
      rating: a.rating,
      review: a.review,
      timestamp: Number(a.timestamp) * 1000,
    }));
  } catch (error) {
    console.error("Error fetching attestations:", error);
    return [];
  }
}

export async function getOnChainTotalStaked(collectionId: string) {
  const client = getPublicClient();
  const address = CONTRACTS.baseSepolia.baibelStaking;
  
  try {
    const amount = await client.readContract({
      address: address as `0x${string}`,
      abi: BAIBEL_STAKING_ABI,
      functionName: "getTotalStaked",
      args: [collectionId],
    });
    
    return formatEther(amount);
  } catch (error) {
    console.error("Error fetching total staked:", error);
    return "0";
  }
}

export async function getOnChainGlobalStats() {
  const client = getPublicClient();
  const address = CONTRACTS.baseSepolia.baibelStaking;
  
  try {
    const totalStaked = await client.readContract({
      address: address as `0x${string}`,
      abi: BAIBEL_STAKING_ABI,
      functionName: "totalStaked",
    });
    
    return {
      totalStaked: formatEther(totalStaked),
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return { totalStaked: "0" };
  }
}
