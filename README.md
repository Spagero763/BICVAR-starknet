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

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| DarkPool | `0x5e70bdb135537663bcddded8a9f4805c65fa451ce7d00a455f1d828f8d11814` |
| Mock BTC | `0x42769d67da8bb4ea209659fe987b525b7fd4564abad6303c6bdb7240ad506e` |
| Mock USDC | `0x4d254088994a5278bc7f436e3d00bfd5a8e5a114f14abe2a303d9de618d3088` |

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
