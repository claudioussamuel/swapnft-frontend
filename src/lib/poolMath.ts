import { encodePacked, keccak256, getAddress } from "viem";

// ─── Integer square root (Newton's method) ────────────────────────────────────
export function bigIntSqrt(n: bigint): bigint {
  if (n < 0n) throw new Error("sqrt of negative");
  if (n === 0n) return 0n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + n / x) / 2n; }
  return x;
}

// ─── sqrtPriceX96 from price ratio ────────────────────────────────────────────
// price = token1 per token0
// sqrtPriceX96 = sqrt(price) * 2^96
// We avoid float overflow by computing sqrt(price * 2^192) purely in BigInt.
export function priceToSqrtPriceX96(price: number): bigint {
  const Q96 = BigInt(2) ** BigInt(96);
  // Scale price by 1e18 so we can express it as a bigint without decimals
  const SCALE = BigInt(1_000_000_000_000_000_000);
  const priceScaled = BigInt(Math.round(price * 1e18));
  // sqrt(price) * 2^96 = sqrt(priceScaled * 2^192 / SCALE)
  const radicand = priceScaled * Q96 * Q96 / SCALE;
  return bigIntSqrt(radicand);
}

// Common starting prices
export const SQRT_PRICE_1_1 = BigInt("79228162514264337593543950336"); // 1:1
export const SQRT_PRICE_1_2 = BigInt("56022770974786139918731938227"); // 0.5:1
export const SQRT_PRICE_2_1 = BigInt("112045541949572279837463876454"); // 2:1

// ─── Sort two token addresses (currency0 must be < currency1) ─────────────────
export function sortTokens(
  tokenA: `0x${string}`,
  tokenB: `0x${string}`
): [currency0: `0x${string}`, currency1: `0x${string}`] {
  const a = tokenA.toLowerCase();
  const b = tokenB.toLowerCase();
  return a < b
    ? [getAddress(tokenA), getAddress(tokenB)]
    : [getAddress(tokenB), getAddress(tokenA)];
}

// ─── Derive PoolId (keccak256 of ABI-encoded PoolKey) ─────────────────────────
export function derivePoolId(
  currency0: `0x${string}`,
  currency1: `0x${string}`,
  fee: number,
  tickSpacing: number,
  hooks: `0x${string}`
): `0x${string}` {
  return keccak256(
    encodePacked(
      ["address", "address", "uint24", "int24", "address"],
      [currency0, currency1, fee, tickSpacing, hooks]
    )
  );
}

// ─── Fee formatting ────────────────────────────────────────────────────────────
export function formatFee(feePips: number): string {
  // fee is in pips: 1 pip = 0.0001%, so 3000 pips = 0.30%
  return (feePips / 10000).toFixed(2) + "%";
}

// ─── Tick spacing options ──────────────────────────────────────────────────────
export const TICK_SPACING_OPTIONS = [
  { label: "Stable (1)",     value: 1   },
  { label: "Low (10)",       value: 10  },
  { label: "Standard (60)",  value: 60  },
  { label: "Wide (200)",     value: 200 },
] as const;

// ─── Common initial price options ─────────────────────────────────────────────
export const INITIAL_PRICE_OPTIONS = [
  { label: "1:1 (equal)",   sqrtPriceX96: SQRT_PRICE_1_1 },
  { label: "1:2",           sqrtPriceX96: SQRT_PRICE_1_2 },
  { label: "2:1",           sqrtPriceX96: SQRT_PRICE_2_1 },
] as const;
