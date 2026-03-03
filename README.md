# BICVAR — Private BTC Exchange on Starknet

A commit-reveal dark pool for private BTC/USDC trading on Starknet. Orders are Poseidon-hashed on-chain — invisible until revealed and matched.

**Live:** [bicvar-starknet.vercel.app](https://bicvar-starknet.vercel.app)

## How It Works

```
Deposit → Commit → Reveal → Match → Settle
```

1. **Deposit** — Transfer BTC or USDC tokens into the dark pool vault
2. **Commit** — Submit a Poseidon hash of your order (side, price, amount, nonce). Only the hash is stored on-chain — no one can see your intent
3. **Reveal** — Disclose the original parameters. The contract verifies the hash matches and locks funds as escrow
4. **Match** — Any two revealed orders with overlapping prices can be matched. Settlement is atomic at the midpoint price

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│         Next.js · React · Tailwind               │
│     starknet-react (Argent X / Braavos)          │
└────────────────────┬────────────────────────────┘
                     │ JSON-RPC
┌────────────────────▼────────────────────────────┐
│              Starknet Sepolia                    │
│                                                  │
│   DarkPool.cairo         MockToken.cairo (×2)    │
│   ├── deposit/withdraw   ├── ERC20 (BTC)         │
│   ├── commit_order       └── ERC20 (USDC)        │
│   ├── reveal_order                               │
│   ├── match_orders                               │
│   └── cancel_order                               │
└──────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Cairo, Scarb, Starknet |
| Hashing | Poseidon (ZK-friendly, native to Starknet) |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| Wallet | starknet-react (Argent X, Braavos) |
| Network | Starknet Sepolia testnet |

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| DarkPool | `0x5e70bdb135537663bcddded8a9f4805c65fa451ce7d00a455f1d828f8d11814` |
| Mock BTC | `0x42769d67da8bb4ea209659fe987b525b7fd4564abad6303c6bdb7240ad506e` |
| Mock USDC | `0x4d254088994a5278bc7f436e3d00bfd5a8e5a114f14abe2a303d9de618d3088` |

## Project Structure

```
├── src/
│   ├── darkpool.cairo      # Main dark pool contract
│   ├── mock_token.cairo     # Test ERC20 token
│   ├── interfaces.cairo     # Contract interfaces
│   └── lib.cairo            # Module declarations
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   │   ├── OrderForm.tsx    # Commit orders with Poseidon hash
│   │   ├── OrderBook.tsx    # View, reveal, match, cancel orders
│   │   ├── PoolBalances.tsx # Deposit/withdraw vault
│   │   ├── WalletBar.tsx    # Wallet connection
│   │   └── StarknetProvider.tsx
│   └── lib/
│       └── contracts.ts     # ABIs and addresses
├── scripts/
│   └── deploy.js            # Deployment script
└── Scarb.toml
```

## Getting Started

### Prerequisites

- [Scarb](https://docs.swmansion.com/scarb/) (Cairo package manager)
- [Node.js](https://nodejs.org/) ≥ 20
- Starknet wallet (Argent X or Braavos) on Sepolia

### Build Contracts

```bash
scarb build
```

### Deploy Contracts

```bash
cd scripts
npm install
node deploy.js
```

### Run Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_RPC_URL=https://api.cartridge.gg/x/starknet/sepolia
NEXT_PUBLIC_DARKPOOL_ADDRESS=<your_darkpool_address>
NEXT_PUBLIC_BTC_TOKEN_ADDRESS=<your_btc_token_address>
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=<your_usdc_token_address>
```

## Privacy Model

The commit-reveal pattern ensures:

- **Pre-trade privacy** — Order parameters (side, price, amount) are hidden behind a Poseidon hash until the trader chooses to reveal
- **Commitment binding** — The on-chain hash prevents modification after commitment
- **Atomic settlement** — Matched orders settle in a single transaction with escrowed funds
- **Front-running resistance** — No one can see or copy your order before you reveal it

## License

MIT

---

Built for **RE{DEFINE} Hackathon 2026**
