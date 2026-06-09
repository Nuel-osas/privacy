// Real confidential transfers on Sui devnet via the official Contra SDK.
// Mirrors the proven flow in scripts/confidential-e2e.mjs, adapted for the
// browser (wallet signing via dapp-kit, viewing key derived from the wallet).
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { sha512 } from "@noble/hashes/sha512";
import { ContraClient, TokenAccount, DiscreteLogTable } from "ts-sdk";
// Vite serves the browser WASM as an asset URL for the in-browser prover.
import wasmUrl from "@contra/bulletproofs-wasm/web/contra_bulletproofs_wasm_bg.wasm?url";
import { DEVNET } from "./contracts";

const packageConfig = {
  packageId: DEVNET.contraPackage,
  accountRegistryId: DEVNET.accountRegistry,
  tokenRegistryId: DEVNET.tokenRegistry,
};

export const BU_TYPE = DEVNET.buCoinType;
export const BU_DECIMALS = 9;

// The SDK reads on-chain state through a JSON-RPC client — the same client
// kaisho and the proven e2e use. (The app's dapp-kit gRPC client is used only
// for signing + waiting, through the wallet.)
const readClient = new SuiJsonRpcClient({ network: "devnet", url: getJsonRpcFullnodeUrl("devnet") });

// The discrete-log table is expensive to build (65k entries) — build once.
let _table: DiscreteLogTable | null = null;
export function getTable(): DiscreteLogTable {
  _table ??= DiscreteLogTable.create(16);
  return _table;
}

let _client: ContraClient | null = null;
export function getContraClient(): ContraClient {
  _client ??= new ContraClient({
    suiClient: readClient as never,
    packageConfig,
    table: getTable(),
    wasmUrl,
  });
  return _client;
}

// ── Viewing key: DERIVED from a wallet signature (device-portable). ──────────
// The key is a deterministic function of the wallet — ed25519 signs the same
// fixed message identically on every device — so reconnecting the same wallet
// anywhere reproduces the same key. We cache it only to avoid re-signing;
// losing the cache is harmless (just sign again to re-derive the same key).
const VIEWING_KEY_MESSAGE =
  "VestLock Private — derive my confidential viewing key.\n" +
  "This signature stays in your browser and unlocks your encrypted balance.\nv1";
// Ristretto255 / ed25519 scalar-group order.
const L = 7237005577332262213973186563042994240857116359379907606001950938285454250989n;
const vkKey = (address: string) => `contra-vksig:${address}`;
const memCache = new Map<string, bigint>();

type WalletSigner = {
  signPersonalMessage: (a: { message: Uint8Array }) => Promise<{ signature: string }>;
};

function bytesToNumberLE(b: Uint8Array): bigint {
  let r = 0n;
  for (let i = b.length - 1; i >= 0; i--) r = (r << 8n) | BigInt(b[i]);
  return r;
}
function deriveScalar(signature: Uint8Array): bigint {
  const s = bytesToNumberLE(sha512(signature)) % L;
  return s === 0n ? 1n : s;
}
function cachedKey(address: string): bigint | null {
  if (memCache.has(address)) return memCache.get(address) ?? null;
  const hex = localStorage.getItem(vkKey(address));
  if (hex) {
    const sk = BigInt("0x" + hex);
    memCache.set(address, sk);
    return sk;
  }
  return null;
}

// Legacy random key from the pre-deterministic scheme (storage key `contra-vk:`).
// Kept as a fallback so accounts registered under the old key still work.
const overrideKey = new Map<string, bigint>();
function legacyKey(address: string): bigint | null {
  try {
    const hex = localStorage.getItem(`contra-vk:${address}`);
    return hex ? BigInt("0x" + hex) : null;
  } catch {
    return null;
  }
}
function activeKey(address: string): bigint | null {
  return overrideKey.get(address) ?? cachedKey(address);
}

/** True once the viewing key for this address is available (no signing needed). */
export function hasViewingKey(address: string): boolean {
  return cachedKey(address) != null;
}

/** Derive + cache the viewing key by signing a fixed message with the wallet. */
export async function unlockViewingKey(wallet: WalletSigner, address: string): Promise<void> {
  if (cachedKey(address) != null) return;
  const message = new TextEncoder().encode(VIEWING_KEY_MESSAGE);
  const { signature } = await wallet.signPersonalMessage({ message });
  const sk = deriveScalar(fromBase64(signature));
  memCache.set(address, sk);
  localStorage.setItem(vkKey(address), sk.toString(16));
}

export function tokenAccountFor(address: string): TokenAccount {
  const sk = activeKey(address);
  if (sk == null) throw new Error("Confidential account locked — unlock with your wallet first.");
  return new TokenAccount(address, BU_TYPE, packageConfig, sk);
}

/** The wallet's plain SUI balance (for gas), in MIST. */
export async function fetchSuiGas(address: string): Promise<bigint> {
  const b = await readClient.getBalance({ owner: address });
  return BigInt(b.totalBalance ?? "0");
}

export type ConfidentialBalance = {
  active: bigint;
  pending: bigint;
  pendingPublic: bigint;
  /** True if this account was registered under a different viewing key. */
  keyMismatch: boolean;
};

export async function fetchBalance(address: string): Promise<ConfidentialBalance> {
  const client = getContraClient();
  const read = async (sk: bigint): Promise<ConfidentialBalance> => {
    const b = await client.getBalance(new TokenAccount(address, BU_TYPE, packageConfig, sk));
    return {
      active: b.balance.amount ?? 0n,
      pending: b.pending.amount ?? 0n,
      pendingPublic: b.pendingPublicBalance ?? 0n,
      keyMismatch: false,
    };
  };
  const primary = activeKey(address);
  if (primary == null) throw new Error("Confidential account locked — unlock with your wallet first.");
  try {
    return await read(primary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("Decryption failed")) throw e;
    // Fall back to the legacy random key — recovers accounts registered under
    // the pre-deterministic scheme (if that key is still in this browser).
    const legacy = legacyKey(address);
    if (legacy != null && legacy !== primary) {
      try {
        const r = await read(legacy);
        overrideKey.set(address, legacy); // it works — use it for this address from now on
        return r;
      } catch {
        /* legacy also fails — truly mismatched */
      }
    }
    return { active: 0n, pending: 0n, pendingPublic: 0n, keyMismatch: true };
  }
}

/** Is the wallet's confidential account already registered? */
export async function isRegistered(address: string): Promise<boolean> {
  try {
    // Throws TokenAccountDoesNotExistError when the account isn't registered.
    await getContraClient().getAccountStatus(address, BU_TYPE);
    return true;
  } catch {
    return false;
  }
}

/** Register the confidential account (no mint — funding is a separate step). */
export async function buildActivateTx(address: string): Promise<Transaction> {
  const client = getContraClient();
  const ta = tokenAccountFor(address);
  const tx = new Transaction();
  const account = tx.add(client.newAccount({ owner: address }));
  tx.add(await client.register({ tokenAccount: ta, account, auditorPublicKeys: [] }));
  tx.add(client.shareAccount({ account }));
  return tx;
}

/** Mint `amount` BU (open) and wrap it straight into the confidential balance. */
export async function buildFundTx(address: string, amount: bigint): Promise<Transaction> {
  const client = getContraClient();
  const tx = new Transaction();
  const coin = tx.moveCall({
    target: `${DEVNET.buPackage}::bu::mint`,
    arguments: [tx.object(DEVNET.buTreasury), tx.pure.u64(amount)],
  });
  tx.add(client.wrap({ coin, receiver: address, tokenType: BU_TYPE }));
  return tx;
}

/** Merge pending deposits into the active confidential balance. */
export async function buildMergeTx(address: string): Promise<Transaction> {
  const client = getContraClient();
  const tx = new Transaction();
  tx.add(await client.updateBalance({ tokenAccount: tokenAccountFor(address), merge: true }));
  return tx;
}

/** Confidential transfer: amount hidden, sender→receiver public. */
export async function buildTransferTx(
  fromAddress: string,
  toAddress: string,
  amount: bigint,
): Promise<Transaction> {
  const client = getContraClient();
  const tx = new Transaction();
  tx.add(
    await client.transfer({
      tokenAccount: tokenAccountFor(fromAddress),
      receiverAddress: toAddress,
      amount,
      merge: true,
    }),
  );
  return tx;
}
