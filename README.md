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

## The Problem BICVAR Solves

On regular decentralized exchanges (like Uniswap), every order you place is **publicly visible** before it executes. This creates three major issues:

1. **Front-running** — Bots watch the network for pending buy orders. When they see yours, they buy first, driving the price up. Your trade executes at a worse price, and the bot profits from the difference.
2. **Sandwich attacks** — Bots place a buy *before* your trade and a sell *after* it, squeezing profit from you on both sides of your transaction.
3. **Information leakage** — Large orders reveal your trading strategy. Other traders can see what you're doing and trade against you before your order fills.

BICVAR eliminates all of this by **hiding your order** until you're ready. Nobody — not bots, not validators, not other traders — can see your order details until you choose to reveal them.

## Step-by-Step Guide (For Beginners)

Here's exactly how to use BICVAR, from start to finish:

### Step 1: Connect Your Wallet

- Install [Argent X](https://www.argent.xyz/argent-x/) or [Braavos](https://braavos.app/) browser extension
- Switch to **Starknet Sepolia** (testnet) in your wallet settings
- Click **Connect Wallet** on the BICVAR app
- Approve the connection in your wallet popup

### Step 2: Get Test Tokens

Since this runs on testnet, you need free test tokens:

- In the **Vault** section, find the **Mint** buttons
- Click **Mint BTC** or **Mint USDC** to get free test tokens
- Approve the transaction in your wallet
- Wait for it to confirm (a few seconds)

### Step 3: Deposit Tokens into the Dark Pool

You need funds in the pool before you can trade:

- In the **Vault** section, enter an amount next to BTC or USDC
- Click **Deposit**
- Approve the transaction — this transfers your tokens into the dark pool smart contract
- Your **Pool Balance** will update once confirmed

### Step 4: Commit an Order (Private)

This is where the magic happens — your order stays hidden:

- Go to the **Order Form**
- Choose **Buy** or **Sell**
- Enter your **Price** (in USDC per BTC) and **Amount** (in BTC)
- Click **Submit Order**
- The app computes a Poseidon hash of your order and submits *only the hash* on-chain
- **Nobody can see** your price, amount, or direction — just a random-looking hash
- Your order details are saved locally in your browser for the reveal step

### Step 5: Reveal Your Order

When you're ready for your order to be matchable:

- Go to the **Order Book**
- Find your committed order and click **Reveal**
- The app sends your original order parameters to the smart contract
- The contract checks that the hash matches — if it does, your order becomes visible and your funds are locked as escrow
- If the hash doesn't match (someone tampered with the data), the transaction is rejected

### Step 6: Match Orders

Once there are revealed buy and sell orders with overlapping prices:

- Go to the **Match Orders** panel at the bottom of the Order Book
- Select a **Buy Order** and a **Sell Order** from the dropdowns
- Click **Match Orders**
- The contract executes the trade at the **midpoint price** (average of both prices)
- Both traders get a fair deal — no front-running possible

### Step 7: Withdraw Your Funds

After your trade settles:

- Go to the **Vault** section
- Enter the amount you want to withdraw
- Click **Withdraw** to move tokens back to your wallet

## Privacy Model

The commit-reveal pattern ensures:

- **Pre-trade privacy** — Order parameters (side, price, amount) are hidden behind a Poseidon hash until the trader chooses to reveal
- **Commitment binding** — The on-chain hash prevents modification after commitment
- **Atomic settlement** — Matched orders settle in a single transaction with escrowed funds
- **Front-running resistance** — No one can see or copy your order before you reveal it

## License

MIT

---
