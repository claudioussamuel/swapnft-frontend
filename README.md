# SwapImpact — Uniswap v4 Hook Frontend

A Next.js 14 + RainbowKit app for creating and interacting with Uniswap v4 pools
using the SwapImpact dynamic fee hook.

## Pages

| Route   | Purpose                                      |
|---------|----------------------------------------------|
| `/`     | Create a new pool with the hook attached     |
| `/pool` | Swap, add liquidity, remove liquidity        |

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Fill in your contract addresses and WalletConnect project ID
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Free at [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `NEXT_PUBLIC_DEFAULT_CHAIN_ID` | Chain ID used when no wallet chain is available (defaults to 31337) |
| `NEXT_PUBLIC_POOL_MANAGER` | Uniswap v4 PoolManager address (default chain)
| `NEXT_PUBLIC_HOOK_ADDRESS` | Your deployed `SwapImpactFeesHook` address (default chain)
| `NEXT_PUBLIC_NFT_ADDRESS` | Your deployed `SwapImpactNFT` address (default chain)
| `NEXT_PUBLIC_POSITION_MANAGER` | v4-periphery PositionManager (for position reads, default chain)
| `NEXT_PUBLIC_POOL_MANAGER_SEPOLIA` | PoolManager address on Sepolia |
| `NEXT_PUBLIC_HOOK_ADDRESS_SEPOLIA` | Hook address on Sepolia |
| `NEXT_PUBLIC_NFT_ADDRESS_SEPOLIA` | NFT address on Sepolia |
| `NEXT_PUBLIC_POSITION_MANAGER_SEPOLIA` | PositionManager address on Sepolia |
| `NEXT_PUBLIC_POOL_MANAGER_MAINNET` | PoolManager address on Mainnet |
| `NEXT_PUBLIC_HOOK_ADDRESS_MAINNET` | Hook address on Mainnet |
| `NEXT_PUBLIC_NFT_ADDRESS_MAINNET` | NFT address on Mainnet |
| `NEXT_PUBLIC_POSITION_MANAGER_MAINNET` | PositionManager on Mainnet |

---

## Deploying contracts first

```bash
# From your Foundry project root
forge script script/PoolFlow.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

The hook address must have specific flag bits — your deploy script must use
`HookMiner.find(...)` with `BEFORE_INITIALIZE_FLAG | BEFORE_SWAP_FLAG | AFTER_SWAP_FLAG`
and deploy using the mined salt. See `PoolFlow.s.sol`.

---

## How the Pool page works

### Pool key
All three panels (Swap / Add / Remove) share a single **Pool Key** input at the
top of the page. Set your token addresses and tick spacing once — it persists
across tabs via `PoolKeyProvider` (React context).

Tokens are automatically sorted so `currency0 < currency1`, matching Uniswap v4's
requirement.

### Swap
- Calls `PoolManager.swap()` directly with `abi.encode(msg.sender)` as `hookData`
  so the hook attributes the NFT to the correct wallet
- Reads `previewFee()` from the hook before the swap and displays the active
  discount if the user holds a tier NFT
- Handles ERC-20 `approve` automatically if allowance is insufficient

### Add liquidity
- Calls `PoolManager.modifyLiquidity()` with a positive `liquidityDelta`
- Preset tick ranges: Full range, ±10%, ±5%, ±1%, Custom
- Approves both tokens if needed before submitting

### Remove liquidity
- Calls `PoolManager.modifyLiquidity()` with a negative `liquidityDelta`
- You enter the tick range and total liquidity of your position manually
  (or read it from the PositionManager contract)
- Percentage slider lets you remove 25 / 50 / 75 / 100% of the position

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx            Root layout, fonts, metadata
│   ├── page.tsx              / — Create pool page
│   ├── pool/
│   │   └── page.tsx          /pool — Swap / Add / Remove page
│   └── globals.css           All styles (dark industrial + acid green)
├── components/
│   ├── Providers.tsx         Wagmi + RainbowKit + QueryClient + PoolKeyProvider
│   ├── Navbar.tsx            Top bar — nav links, NFT badge, ConnectButton
│   ├── CreatePool.tsx        Pool creation form
│   ├── SwapPanel.tsx         Swap tab
│   ├── AddLiquidityPanel.tsx Add liquidity tab
│   ├── RemoveLiquidityPanel.tsx Remove liquidity tab
│   ├── PoolKeyForm.tsx       Shared pool key selector
│   ├── AmountInput.tsx       Token amount input with live balance
│   ├── TxStatus.tsx          Transaction state banner
│   ├── NFTBadge.tsx          Active tier NFT display in navbar
│   ├── TierTable.tsx         Impact tier reference table
│   └── TokenInput.tsx        Address input with symbol resolution
├── hooks/
│   ├── useNFTStatus.ts       bestTierOf + previewFee for connected wallet
│   ├── useTokenInfo.ts       symbol / name / decimals for a token address
│   ├── useTokenBalance.ts    balanceOf for a token + wallet pair
│   └── useApproval.ts        allowance check + approve flow
└── lib/
    ├── wagmi.ts              Wagmi + RainbowKit config (Anvil, Sepolia, Mainnet)
    ├── contracts.ts          All ABIs + addresses + tier metadata + constants
    ├── poolMath.ts           sqrtPriceX96 helpers, sortTokens, derivePoolId, formatFee
    └── poolKeyStore.tsx      React context for shared pool key state
```

---

## Important note on direct PoolManager calls

Uniswap v4 uses a `unlock → callback` pattern for state-changing operations.
Calling `swap()` or `modifyLiquidity()` directly on the PoolManager (as this
app does) requires the caller to also implement `IUnlockCallback.unlockCallback()`
to settle token balances.

In a production app you would route through the **Universal Router** or
**PositionManager** which handle the callback internally. The direct calls here
are correct for a local Anvil fork with `PoolSwapTest` / `PoolModifyLiquidityTest`
routers, or for use with a custom callback contract similar to `PoolFlow.s.sol`.
