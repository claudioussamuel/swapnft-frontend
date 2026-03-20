// ─── Addresses ────────────────────────────────────────────────────────────────
export const ADDRESSES = {
  POOL_MANAGER: (process.env.NEXT_PUBLIC_POOL_MANAGER ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  HOOK: (process.env.NEXT_PUBLIC_HOOK_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  NFT: (process.env.NEXT_PUBLIC_NFT_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  POSITION_MANAGER: (process.env.NEXT_PUBLIC_POSITION_MANAGER ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

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
