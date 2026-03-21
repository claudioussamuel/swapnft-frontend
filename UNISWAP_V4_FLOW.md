# Uniswap V4 Universal Router Swap Flow

## Overview
This implementation follows the **Uniswap V4 Universal Router** pattern with **Permit2** for streamlined token approvals. The flow is divided into two main steps that are automatically orchestrated by the `useUniversalRouterSwap` hook.

## Flow Diagram

```
User initiates Swap
        ↓
[useUniversalRouterSwap Hook]
        ↓
    ┌───────────────────────────────────────┐
    │   STEP 1: PERMIT2 APPROVALS           │
    ├───────────────────────────────────────┤
    │ 1.1 Approve ERC20 → Permit2           │
    │     (Allow Permit2 to spend tokens)   │
    │                                        │
    │ 1.2 Approve Permit2 → Universal Router │
    │     (Allow Router to spend via Permit2)│
    │     Expiration: +7 days               │
    └───────────────────────────────────────┘
            ↓ (After approvals confirmed)
    ┌───────────────────────────────────────┐
    │   STEP 2: EXECUTE SWAP                │
    ├───────────────────────────────────────┤
    │ Input to Universal Router:            │
    │                                        │
    │ Commands = [0x10]                     │
    │   → SWAP_EXACT_IN_SINGLE              │
    │                                        │
    │ Inputs = [encoded actions + params]   │
    │   Actions:                            │
    │   • 0x06 SWAP_EXACT_IN_SINGLE         │
    │   • 0x0C SETTLE_ALL                   │
    │   • 0x0F TAKE_ALL                     │
    │                                        │
    │ Params:                               │
    │   • ExactInputSingleParams            │
    │   • Settlement data (currency0, amt)  │
    │   • Take data (currency1, 0)          │
    └───────────────────────────────────────┘
            ↓ (After swap execution)
    Transaction mined → User receives tokens
```

## Component Architecture

### 1. **useUniversalRouterSwap Hook** (`src/hooks/useUniversalRouterSwap.ts`)
- **Purpose**: Orchestrates the complete swap flow with Permit2 approvals
- **Key Functions**:
  - `approvePermit2()`: Handles token→Permit2 and Permit2→Router approvals
  - `executeSwap()`: Encodes swap data and calls Universal Router
  - `swap()`: Combined function that runs approvals then swap
- **State Management**:
  ```typescript
  txStep: "idle" | "permitting" | "swapping" | "pending" | "success" | "error"
  txHash: `0x${string}` | undefined
  error: string
  isMined: boolean
  ```

### 2. **SwapPanel Component** (`src/components/SwapPanel.tsx`)
- **Purpose**: UI component for user interaction
- **Integration**: Uses `useUniversalRouterSwap` to execute swaps
- **Features**:
  - Token input validation
  - NFT tier status tracking
  - Real-time transaction status
  - Amount flipping (reverse swap direction)

### 3. **Contracts Module** (`src/lib/contracts.ts`)
- **New ABIs Added**:
  - `PERMIT2_ABI`: Approve function for delegating approvals
  - `UNIVERSAL_ROUTER_ABI`: Execute function for swaps
- **Chain Addresses**: Includes UNIVERSAL_ROUTER and PERMIT2 addresses for each chain

## Step-by-Step Execution

### Step 1: Approve Permit2
```typescript
// First transaction: Approve token to Permit2
approve(tokenIn, PERMIT2_ADDRESS, MAX_UINT256)

// Second transaction: Approve Permit2 to spend on behalf of Universal Router
permit2.approve(
  tokenIn,           // Token to spend
  UNIVERSAL_ROUTER,  // Spender (via Permit2)
  MAX_UINT160,       // uint160 amount (max for Permit2)
  expiration         // +7 days from now
)
```

### Step 2: Execute Swap
```typescript
// Encode swap parameters
poolKey = {
  currency0: tokenIn,
  currency1: tokenOut,
  fee: 3000,
  tickSpacing: 60,
  hooks: "0x0000..." // None
}

// Encode ExactInputSingleParams
exactInputSingleParams = encode([poolKey, zeroForOne, amountIn, amountOutMinimum, hookData])

// Build actions (packed as bytes)
actions = encode([0x06, 0x0C, 0x0F])
  // 0x06: SWAP_EXACT_IN_SINGLE → Execute the actual swap
  // 0x0C: SETTLE_ALL → Send output tokens
  // 0x0F: TAKE_ALL → Receive input tokens from router

// Execute via Universal Router
router.execute(commands=[0x10], inputs=[encoded_data])
```

## Key Differences from Standard Swaps

| Feature | Traditional Swap | Universal Router + Permit2 |
|---------|-----------------|--------------------------|
| Approvals | Approve Router directly | Approve Permit2, then Router via Permit2 |
| Approval Scope | Per spender | Delegated through Permit2 |
| Expiration | Indefinite | Can set expiration (7 days here) |
| Gas Efficiency | Moderate | Optimized with Permit2 delegation |
| Composability | Limited | Built for multi-step operations |

## Data Encoding

### Commands Byte
```
0x10 = SWAP_EXACT_IN_SINGLE command
```

### Actions Bytes
```
[0x06, 0x0C, 0x0F]
0x06 = SWAP_EXACT_IN_SINGLE → Executes the swap
0x0C = SETTLE_ALL → Settles payment (sends input token)
0x0F = TAKE_ALL → Receives output tokens
```

### Parameters Structure
```typescript
{
  poolKey: {
    currency0: address,
    currency1: address,
    fee: uint24,
    tickSpacing: int24,
    hooks: address
  },
  zeroForOne: boolean,          // Direction of swap
  amountIn: uint128,            // Input amount
  amountOutMinimum: uint128,    // Slippage tolerance
  hookData: bytes               // Additional hook data (empty here)
}
```

## Error Handling

The hook catches and reports errors at each stage:
- **Permitting Stage**: Failed token approvals (insufficient balance, transaction reverted)
- **Swapping Stage**: Failed swap execution (liquidity issues, slippage)
- **Transaction Status**: Monitored via `useWaitForTransactionReceipt`

Errors are stored in the `error` state and communicated to the UI component.

## Integration with Existing Features

- **NFT Status Tracking**: Still fully integrated via `useNFTStatus` hook
- **Pool Key Management**: Uses existing `usePoolKey` context
- **Token Info**: Leverages `useTokenInfo` for decimals and symbols
- **Balance Tracking**: Maintains `useTokenBalance` refetch pattern

## Future Optimizations

1. **Slippage Protection**: Currently set to 0, should be configurable
2. **Gas Estimation**: Could pre-estimate gas before sending transactions
3. **Deadline**: Could add transaction deadline parameter
4. **MultiHop Swaps**: Universal Router supports complex routing patterns
5. **Flash Swaps**: Could implement flash swap patterns for more advanced users

## Testing Checklist

- [ ] Token approvals execute correctly
- [ ] Permit2 delegation works
- [ ] Swap executes end-to-end
- [ ] NFT status updates after swap
- [ ] Error states are handled gracefully
- [ ] UI shows correct status messages at each step
- [ ] Transaction hash is captured and displayable
