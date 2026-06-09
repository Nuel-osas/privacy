// REAL Twisted ElGamal over Ristretto255 — the exact encryption scheme behind
// Sui confidential transfers (Mysten "Contra"). Runs entirely in the browser.
//
//   pk = sk·G                              (account viewing key)
//   encrypt(m): C = r·G + m·H ,  D = r·pk   (C is a Pedersen commitment to m)
//   decrypt:    M = C − sk⁻¹·D = m·H , then recover m by BSGS discrete log
//   additively homomorphic: (C₁+C₂, D₁+D₂) encrypts m₁+m₂
//
// A u64 amount is split into four u16 limbs (EncryptedAmount4U16) so the
// discrete-log search stays small — faithful to Contra's encrypted_amount.move.
//
// Validated in scripts/crypto-test.mjs (20/20).
import { RistrettoPoint, ed25519 } from "@noble/curves/ed25519";
import { sha512 } from "@noble/hashes/sha512";

export type Point = typeof RistrettoPoint.BASE;

const L = ed25519.CURVE.n; // Ristretto255 scalar-group order
const G = RistrettoPoint.BASE;
const ZERO = RistrettoPoint.ZERO;
const textEncoder = new TextEncoder();

const LIMBS = 4;
const LIMB_BITS = 16n;
const LIMB_MASK = 0xffffn;

// ---------- scalar field helpers ----------
function mod(a: bigint, m = L): bigint {
  const r = a % m;
  return r >= 0n ? r : r + m;
}
function modInverse(a: bigint, m = L): bigint {
  let [oldR, r] = [mod(a, m), m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return mod(oldS, m);
}
function bytesToNumberLE(b: Uint8Array): bigint {
  let r = 0n;
  for (let i = b.length - 1; i >= 0; i--) r = (r << 8n) | BigInt(b[i]);
  return r;
}
export function randScalar(): bigint {
  const b = new Uint8Array(64);
  crypto.getRandomValues(b);
  return mod(bytesToNumberLE(b));
}
function mul(P: Point, k: bigint): Point {
  const s = mod(k);
  return s === 0n ? ZERO : P.multiply(s);
}
function concat(parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
function hashToScalar(...points: Point[]): bigint {
  return mod(bytesToNumberLE(sha512(concat(points.map((p) => p.toRawBytes())))));
}

// Second generator H — nothing-up-my-sleeve, unknown discrete log wrt G.
// hashToCurve wants a 64-byte input, so we expand the domain seed via sha512.
export const H: Point = RistrettoPoint.hashToCurve(
  sha512(textEncoder.encode("VestLock-Private/twisted-elgamal/blinding-generator/H/v1")),
);

// ---------- keys ----------
export interface KeyPair {
  sk: bigint;
  pk: Point;
}
export function keygen(): KeyPair {
  const sk = randScalar();
  return { sk, pk: mul(G, sk) };
}
export function pkFromSk(sk: bigint): Point {
  return mul(G, mod(sk));
}

// ---------- ciphertext ----------
export interface Ciphertext {
  C: Point;
  D: Point;
}
/** Four Twisted-ElGamal ciphertexts (one per u16 limb) = a confidential amount. */
export type EncryptedAmount = Ciphertext[];

function encryptLimb(m: number, pk: Point): Ciphertext {
  const r = randScalar();
  return { C: mul(G, r).add(mul(H, BigInt(m))), D: mul(pk, r) };
}
export function encrypt(amount: bigint, pk: Point): EncryptedAmount {
  const out: Ciphertext[] = [];
  let a = amount;
  for (let i = 0; i < LIMBS; i++) {
    out.push(encryptLimb(Number(a & LIMB_MASK), pk));
    a >>= LIMB_BITS;
  }
  return out;
}
export function encryptZero(pk: Point): EncryptedAmount {
  return encrypt(0n, pk);
}
export function addEnc(a: EncryptedAmount, b: EncryptedAmount): EncryptedAmount {
  return a.map((ct, i) => ({ C: ct.C.add(b[i].C), D: ct.D.add(b[i].D) }));
}

// ---------- discrete-log (BSGS) over [0, 2^16) per limb ----------
const BABY = 256;
let babyTable: Map<string, number> | null = null;
let giant: Point | null = null;
function buildTable() {
  babyTable = new Map();
  for (let j = 0; j < BABY; j++) babyTable.set(mul(H, BigInt(j)).toHex(), j);
  giant = mul(H, BigInt(BABY)); // 256·H
}
function dlog(M: Point): number | null {
  if (!babyTable || !giant) buildTable();
  let cur = M;
  for (let i = 0; i < 4096; i++) {
    const hit = babyTable!.get(cur.toHex());
    if (hit !== undefined) return i * BABY + hit;
    cur = cur.subtract(giant!);
  }
  return null;
}
/** Decrypt a confidential amount with the secret key. Null if undecryptable. */
export function decrypt(enc: EncryptedAmount, sk: bigint): bigint | null {
  const skInv = modInverse(sk);
  let total = 0n;
  for (let i = 0; i < enc.length; i++) {
    const M = enc[i].C.subtract(mul(enc[i].D, skInv)); // = limb·H
    const limb = dlog(M);
    if (limb === null) return null;
    total += BigInt(limb) << (LIMB_BITS * BigInt(i));
  }
  return total;
}
/** Re-encode to canonical u16 limbs (keeps limbs decryptable after folding). */
export function recanonicalize(enc: EncryptedAmount, sk: bigint, pk: Point): EncryptedAmount {
  const v = decrypt(enc, sk);
  if (v === null) throw new Error("recanonicalize: undecryptable amount");
  return encrypt(v, pk);
}
/**
 * Fold a deposit into a running encrypted balance homomorphically, then
 * recanonicalize so limbs stay in range — exactly Contra's bounded aggregation.
 */
export function foldDeposit(
  balance: EncryptedAmount,
  deposit: EncryptedAmount,
  sk: bigint,
  pk: Point,
): EncryptedAmount {
  return recanonicalize(addEnc(balance, deposit), sk, pk);
}
/**
 * A spend produces a FRESH canonical ciphertext of (balance − amount) under pk,
 * exactly like Contra (new balance ciphertext + a ZK equality proof), rather
 * than limb-wise subtraction which would borrow/underflow a u16 limb.
 */
export function spend(
  balance: EncryptedAmount,
  amount: bigint,
  sk: bigint,
  pk: Point,
): EncryptedAmount {
  const cur = decrypt(balance, sk);
  if (cur === null) throw new Error("spend: undecryptable balance");
  if (cur < amount) throw new Error("overdraft");
  return encrypt(cur - amount, pk);
}

// ---------- selective disclosure (real Chaum-Pedersen / DDH proof) ----------
// Proves a confidential amount decrypts to a claimed value v under pk, WITHOUT
// revealing the secret key. Same gadget Contra's nizk.move uses for disclosure.
export interface DisclosureProof {
  A1: Point;
  A2: Point;
  z: bigint;
}
function aggregate(enc: EncryptedAmount): Ciphertext {
  let C = ZERO;
  let D = ZERO;
  for (let i = 0; i < enc.length; i++) {
    const w = 1n << (LIMB_BITS * BigInt(i));
    C = C.add(mul(enc[i].C, w));
    D = D.add(mul(enc[i].D, w));
  }
  return { C, D };
}
export function proveDisclosure(enc: EncryptedAmount, sk: bigint, v: bigint): DisclosureProof {
  const agg = aggregate(enc);
  const B = agg.C.subtract(mul(H, v)); // = R·G
  const pk = mul(G, sk);
  const k = randScalar();
  const A1 = mul(G, k);
  const A2 = mul(B, k);
  const e = hashToScalar(G, B, pk, agg.D, A1, A2);
  const z = mod(k + e * sk);
  return { A1, A2, z };
}
export function verifyDisclosure(
  enc: EncryptedAmount,
  pk: Point,
  v: bigint,
  proof: DisclosureProof,
): boolean {
  const agg = aggregate(enc);
  const B = agg.C.subtract(mul(H, v));
  const e = hashToScalar(G, B, pk, agg.D, proof.A1, proof.A2);
  return (
    mul(G, proof.z).equals(proof.A1.add(mul(pk, e))) &&
    mul(B, proof.z).equals(proof.A2.add(mul(agg.D, e)))
  );
}

// ---------- serialization / display ----------
export function pkToHex(pk: Point): string {
  return pk.toHex();
}
/** Hex of all 8 group elements (4 limbs × {C,D}) — the opaque on-chain bytes. */
export function encToHex(enc: EncryptedAmount): string[] {
  return enc.flatMap((ct) => [ct.C.toHex(), ct.D.toHex()]);
}
/** A compact single-line fingerprint of a ciphertext for explorer rows. */
export function encFingerprint(enc: EncryptedAmount): string {
  return enc
    .map((ct) => ct.C.toHex().slice(0, 8))
    .join("");
}
