# Privacy — Confidential transfers on Sui

Confidential token transfers on **Sui devnet**, built on Mysten Labs' confidential
transfers ("Contra"). Balances and transfer amounts are encrypted on-chain with
**Twisted ElGamal over Ristretto255** + **Bulletproofs** — only the holder's
**wallet-derived viewing key** can decrypt them.

**Real, not a mockup:** the app connects a wallet, generates real zero-knowledge
proofs in the browser (WASM), and submits real transactions you can verify on a
block explorer.

## Live on devnet

| | Address |
|---|---|
| Launchpad package | `0x82bf0fe649414351fb890e9f5976463fbd1e3e0ed6fc84a41d0cb23c2eac3031` |
| Contra package | `0x4c86127b0f6a232c0e14bf38d307955e8c3a414cac456f922ccd61ec2872fd2b` |
| Open confidential token `ConfidentialToken<BU>` | `0x26e92c33a28be31d883a0b1adde6339c7940259bb9deb81a4dbf87e0bc586537` |

All IDs live in `src/lib/contracts.ts`. **Devnet resets periodically** — if the IDs
stop resolving, redeploy (see below) and paste the new IDs in.

A real confidential transfer (amount hidden on-chain), on SuiVision:
https://devnet.suivision.xyz/txblock/47Ln2oB7tDaFvUrtLGGvSqDF6KAJiDPxvD356fmWmuuK

## Run

```bash
pnpm install
pnpm dev                            # http://localhost:5173
pnpm crypto:test                    # validate the ElGamal scheme (standalone)
node scripts/confidential-e2e.mjs   # run a REAL confidential transfer on devnet, end-to-end
```

### The flow
Connect wallet → **Unlock** (sign once → derive viewing key, same on every device) →
**Activate** (register a confidential account; claim devnet SUI for gas if empty) →
**Mint + wrap** (move tokens into your encrypted balance) → **Merge** → **Send
confidentially** (amount hidden; only the recipient — who must also be activated —
can decrypt it). Proofs are generated in-browser via WASM; the viewing key never
leaves your device.

## Deploy (Vercel)

The web app is **self-contained** — the Contra SDK build (`vendor/ts-sdk`) and the
WASM prover (`vendor/utils/bulletproofs-wasm`) are committed, so no Rust/SDK build is
needed on CI. `vercel.json` is included:

```
Framework:     Vite
Build:         pnpm build
Output:        dist
Install:       pnpm install --no-frozen-lockfile
```

Just import the repo on Vercel — it builds with `pnpm install && pnpm build` out of
the box. (Heads-up: the deployed devnet contracts have a shelf life tied to devnet
resets — redeploy + update `contracts.ts` when devnet wipes.)

## Contracts (`/move`, `/launchpad`)

- **`launchpad/`** — `confidential_launchpad::launchpad`: `create_open_token`
  (anyone-mints) / `create_token` (controlled) — turn a published `Coin<T>` into a
  confidential token in one call. Compiles + tested against Contra.
- **`move/`** — `contra_vault::vault`: a confidential, time-locked savings vault
  (object-owned account + `Clock` gate). Compiles + tested.

Building the Move packages needs Mysten's Contra source locally (they depend on
`contra = { local = "../contra/move" }`). Clone it into `./contra`:
`git clone https://github.com/MystenLabs/confidential-transfers contra`, then
`cd launchpad && sui move test -e devnet`. *(The `contra/` source is not committed —
only its built SDK/WASM outputs are vendored for the web app.)*

### Redeploy (after a devnet reset)
1. `sui client active-env` → grab the current chain id; set it in the `[environments]`
   of `contra/move/Move.toml`, `launchpad/Move.toml`, `contra/utils/move/test_token/Move.toml`.
2. `cd contra/move && rm -f Published.toml && sui client publish`
3. `cd launchpad && sui client publish`
4. `cd contra/utils/move/test_token && rm -f Published.toml && sui client publish`
5. PTB: `bu::register_confidential(BuTreasury, TokenRegistry, [])`
6. Paste the new IDs into `src/lib/contracts.ts`.

## Stack
React 19 · Vite · Tailwind v4 · `@mysten/dapp-kit-react` · `@noble/curves` · the
Contra TS SDK + WASM bulletproofs · Sui Move 2024.
