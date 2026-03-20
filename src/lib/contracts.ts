// ─── Chain-specific contract addresses ─────────────────────────────────────────
export type SwapImpactAddresses = {
  POOL_MANAGER: `0x${string}`
  HOOK: `0x${string}`
  NFT: `0x${string}`
  POSITION_MANAGER: `0x${string}`
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const envAddress = (value?: string): `0x${string}` =>
  value ? (value as `0x${string}`) : ZERO_ADDRESS;

const chainAddressesById: Record<number, SwapImpactAddresses> = {
  1301 : {
    POOL_MANAGER: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
    HOOK: "0x51C982655087c78b3280f0440B5d714683c320c0",
    NFT: "0xd035b10DC2f0627393d255cbbDa4ef270eAEd906",
    POSITION_MANAGER: "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4",
  },
  11155111: {
    POOL_MANAGER: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
    HOOK: "0x51C982655087c78b3280f0440B5d714683c320c0",
    NFT: "0xd035b10DC2f0627393d255cbbDa4ef270eAEd906",
    POSITION_MANAGER: "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4",
  },
  1: {
    POOL_MANAGER: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
    HOOK: "0x51C982655087c78b3280f0440B5d714683c320c0",
    NFT: "0xd035b10DC2f0627393d255cbbDa4ef270eAEd906",
    POSITION_MANAGER: "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4",
    },
};

const defaultChainId = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID ?? 31337);

export function getChainAddresses(chainId?: number): SwapImpactAddresses {
  if (!chainId) {
    return chainAddressesById[defaultChainId] ?? chainAddressesById[31337];
  }
  return chainAddressesById[chainId] ?? chainAddressesById[defaultChainId] ?? chainAddressesById[31337];
}

export const ADDRESSES = getChainAddresses();

// ─── Pool Manager ABI ──────────────────────────────────────────────────────────
export const POOL_MANAGER_ABI = [
  {
    type: "function", name: "initialize", stateMutability: "nonpayable",
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
      { name: "sqrtPriceX96", type: "uint160" },
    ],
    outputs: [{ name: "tick", type: "int24" }],
  },
  {
    type: "function", name: "swap", stateMutability: "nonpayable",
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
      { name: "params", type: "tuple", components: [
        { name: "zeroForOne", type: "bool" },
        { name: "amountSpecified", type: "int256" },
        { name: "sqrtPriceLimitX96", type: "uint160" },
      ]},
      { name: "hookData", type: "bytes" },
    ],
    outputs: [{ name: "delta", type: "int256" }],
  },
  {
    type: "function", name: "modifyLiquidity", stateMutability: "nonpayable",
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ]},
      { name: "params", type: "tuple", components: [
        { name: "tickLower", type: "int24" },
        { name: "tickUpper", type: "int24" },
        { name: "liquidityDelta", type: "int256" },
        { name: "salt", type: "bytes32" },
      ]},
      { name: "hookData", type: "bytes" },
    ],
    outputs: [
      { name: "callerDelta", type: "int256" },
      { name: "feesAccrued", type: "int256" },
    ],
  },
  {
    type: "function", name: "settle", stateMutability: "payable",
    inputs: [], outputs: [{ name: "paid", type: "uint256" }],
  },
  {
    type: "function", name: "take", stateMutability: "nonpayable",
    inputs: [
      { name: "currency", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function", name: "sync", stateMutability: "nonpayable",
    inputs: [{ name: "currency", type: "address" }],
    outputs: [],
  },
  {
    type: "function", name: "extsload", stateMutability: "view",
    inputs: [{ name: "slot", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "event", name: "Initialize",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "currency0", type: "address", indexed: true },
      { name: "currency1", type: "address", indexed: true },
      { name: "fee", type: "uint24" },
      { name: "tickSpacing", type: "int24" },
      { name: "hooks", type: "address" },
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
    ],
  },
  {
    type: "event", name: "Swap",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "amount0", type: "int128" },
      { name: "amount1", type: "int128" },
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "liquidity", type: "uint128" },
      { name: "tick", type: "int24" },
      { name: "fee", type: "uint24" },
    ],
  },
  {
    type: "event", name: "ModifyLiquidity",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "tickLower", type: "int24" },
      { name: "tickUpper", type: "int24" },
      { name: "liquidityDelta", type: "int256" },
      { name: "salt", type: "bytes32" },
    ],
  },
] as const;

// ─── SwapImpactNFT ABI ─────────────────────────────────────────────────────────
export const NFT_ABI = [
  {
    type: "function", name: "bestTierOf", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "best", type: "uint8" }],
  },
  {
    type: "function", name: "holdsTier", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }, { name: "tier", type: "uint8" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function", name: "userTierToken", stateMutability: "view",
    inputs: [{ name: "user", type: "address" }, { name: "tier", type: "uint8" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "event", name: "ImpactNFTMinted",
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "tier", type: "uint8" },
    ],
  },
] as const;

// ─── SwapImpactFeesHook ABI ────────────────────────────────────────────────────
export const HOOK_ABI = [
  {
    type: "function", name: "previewFee", stateMutability: "view",
    inputs: [{ name: "swapper", type: "address" }],
    outputs: [{ name: "fee", type: "uint24" }, { name: "tier", type: "uint8" }],
  },
  {
    type: "function", name: "tierName", stateMutability: "pure",
    inputs: [{ name: "tier", type: "uint8" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function", name: "BASE_FEE", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint24" }],
  },
  {
    type: "event", name: "ImpactNFTAwarded",
    inputs: [
      { name: "swapper", type: "address", indexed: true },
      { name: "tier", type: "uint8" },
      { name: "sqrtPricePpm", type: "uint256" },
      { name: "poolId", type: "bytes32", indexed: true },
    ],
  },
  {
    type: "event", name: "FeeDiscountApplied",
    inputs: [
      { name: "swapper", type: "address", indexed: true },
      { name: "tier", type: "uint8" },
      { name: "fee", type: "uint24" },
      { name: "poolId", type: "bytes32", indexed: true },
    ],
  },
] as const;

// ─── ERC20 ABI ─────────────────────────────────────────────────────────────────
export const ERC20_ABI = [
  {
    type: "function", name: "decimals", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function", name: "symbol", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function", name: "name", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function", name: "balanceOf", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "allowance", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function", name: "approve", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ─── Constants ─────────────────────────────────────────────────────────────────
export const DYNAMIC_FEE_FLAG = 0x800000;
export const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
export const MIN_SQRT_PRICE = BigInt("4295128740");
export const MAX_SQRT_PRICE = BigInt("1461446703485210103287273052203988822378723970341");

// ─── Tier metadata ──────────────────────────────────────────────────────────────
export const TIER_META = [
  { tier: 0, name: "None",          impact: "—",              discount: 0,  color: "#888780" },
  { tier: 1, name: "Featherweight", impact: "0.00 – 0.10%",  discount: 20, color: "#1D9E75" },
  { tier: 2, name: "Lightweight",   impact: "0.10 – 0.50%",  discount: 40, color: "#378ADD" },
  { tier: 3, name: "Middleweight",  impact: "0.50 – 1.00%",  discount: 60, color: "#7F77DD" },
  { tier: 4, name: "Heavyweight",   impact: "1.00 – 2.00%",  discount: 75, color: "#EF9F27" },
  { tier: 5, name: "Champion",      impact: "2.00%+",        discount: 90, color: "#D85A30" },
] as const;
