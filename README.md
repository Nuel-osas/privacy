# VestLock Private — Confidential transfers on Sui

Confidential token transfers on **Sui devnet**, built on Mysten Labs' confidential
transfers ("Contra"). Balances and transfer amounts are encrypted on-chain with
**Twisted ElGamal over Ristretto255** + **Bulletproofs**; only the holder's viewing
key (or a registered auditor) can decrypt them.

This is **real, not a mockup**: the app connects a wallet, generates real
zero-knowledge proofs in the browser (WASM), and submits real transactions you can
verify on a block explorer.

## Live on devnet

| | Address |
|---|---|
| Launchpad package | `0x4f762554fd3493eab883a6aa372328206ed0991a0ded910f48cd0e8553658010` |
| Contra package | `0xa53010ace79c4202c2970cf890f58d1d7745495d45bac96d365a863e9726488d` |
| Open confidential token `ConfidentialToken<BU>` | `0xef276ec5b7aa4c97f128a2bd2db3e956fc2d595998bef5a4a6c8a48fdba714e0` |

All IDs are in `src/lib/contracts.ts`. (Devnet resets periodically — if IDs stop
resolving, redeploy: see "Redeploy" below.)

**Proof it works** — a real confidential transfer (amount hidden on-chain):
https://suiscan.xyz/devnet/tx/4KM9bMDkVr62XeMnnNcsvzbLTVc3tsDSJ8DeZxPEp6bT

## Run

```bash
pnpm install
pnpm dev                       # http://localhost:5173
pnpm crypto:test               # validate the in-browser ElGamal (20 checks)
node scripts/confidential-e2e.mjs   # run a REAL confidential transfer on devnet, end-to-end
```

### App tabs
- **Private** (real) — connect a wallet → *Activate* (register a confidential account
  + mint 10 BU) → see your encrypted balance (decrypt with your key) → *Mint+wrap* to
  add funds → *Send confidentially* to anyone who's activated. Real proofs, real txns,
  explorer links.
- **Live** (real) — connect a wallet, claim devnet SUI, send a plain SUI transfer with
  an explorer receipt. Proves the wallet/devnet pipeline.
- **Send / Auditor** (concept demo) — a fully client-side simulation (real ElGamal,
  simulated chain) that visualizes what's public vs. hidden + a live Chaum–Pedersen
  selective-disclosure proof.

## How it works

- **Open token model** — the BU token's `TreasuryCap` lives in a shared object, so
  *anyone* can mint (`mint_10`) and then send confidentially. No gatekeeper.
- **Confidential** — `register` (encrypted account) → `wrap` (public→confidential) →
  `transfer` (amount hidden) → `merge` (receiver folds in pending). Proofs generated
  in-browser via `@contra/bulletproofs-wasm`.
- **Compliant** — issuers can attach an auditor key at launch; holders can also make a
  ZK selective-disclosure proof of a specific balance.

## Contracts (`/move`, `/launchpad`)

- **`launchpad/`** — `confidential_launchpad::launchpad`: `create_open_token`
  (anyone-mints) / `create_token` (controlled) — turn a published `Coin<T>` into a
  confidential token in one call. Compiles + tested against Contra.
- **`move/`** — `contra_vault::vault`: a confidential, time-locked savings vault
  (object-owned confidential account + Clock gate). Compiles + tested.
- **`contra/`** — vendored Mysten "Contra" source (Move + SDK + WASM prover).

```bash
cd launchpad && sui move test -e devnet     # 4 passing
cd move && sui move test -e devnet          # 3 passing
```

### Redeploy (after a devnet reset)
1. Update the `[environments] devnet = "<chain-id>"` in `contra/move/Move.toml`,
   `launchpad/Move.toml`, `contra/utils/move/test_token/Move.toml` (get it from
   `sui client active-env`'s chain id).
2. `cd contra/move && rm -f Published.toml && sui client publish`
3. `cd launchpad && sui client publish`
4. `cd contra/utils/move/test_token && rm -f Published.toml && sui client publish`
5. PTB: `bu::register_confidential(BuTreasury, TokenRegistry, [])`
6. Paste the new IDs into `src/lib/contracts.ts`.

## Stack
React 19 · Vite · Tailwind v4 · `@mysten/dapp-kit-react` · `@noble/curves` · the
Contra TS SDK + WASM bulletproofs · Sui Move 2024.
