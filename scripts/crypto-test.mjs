// Validation harness for the real Twisted ElGamal scheme used by the app.
// Mirrors src/lib/crypto/elgamal.ts exactly so we prove the @noble/curves API
// + the math BEFORE wiring any UI. Run: node scripts/crypto-test.mjs
import { RistrettoPoint, ed25519 } from "@noble/curves/ed25519";
import { sha512 } from "@noble/hashes/sha512";

const L = ed25519.CURVE.n; // Ristretto255 scalar-group order
const G = RistrettoPoint.BASE;
const ZERO = RistrettoPoint.ZERO;
const enc = new TextEncoder();

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}  <-- FAILED`);
  }
}

function mod(a, m = L) {
  const r = a % m;
  return r >= 0n ? r : r + m;
}
function modInverse(a, m = L) {
  let [oldR, r] = [mod(a, m), m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return mod(oldS, m);
}
function bytesToNumberLE(b) {
  let r = 0n;
  for (let i = b.length - 1; i >= 0; i--) r = (r << 8n) | BigInt(b[i]);
  return r;
}
function randScalar() {
  const b = new Uint8Array(64);
  globalThis.crypto.getRandomValues(b);
  return mod(bytesToNumberLE(b));
}
function mul(P, k) {
  const s = mod(k);
  return s === 0n ? ZERO : P.multiply(s);
}
function hashToScalar(...points) {
  const parts = points.map((p) => p.toRawBytes());
  let len = 0;
  for (const p of parts) len += p.length;
  const all = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    all.set(p, o);
    o += p.length;
  }
  return mod(bytesToNumberLE(sha512(all)));
}

// ---- second generator H (nothing-up-my-sleeve, unknown dlog wrt G) ----
// hashToCurve wants a 64-byte input, so we expand the domain seed via sha512.
const H = RistrettoPoint.hashToCurve(
  sha512(enc.encode("VestLock-Private/twisted-elgamal/blinding-generator/H/v1")),
);

// ---- scheme ----
const LIMBS = 4;
const LIMB_BITS = 16n;
const LIMB_MASK = 0xffffn;

function pkFromSk(sk) {
  return mul(G, sk);
}
function encryptLimb(m, pk) {
  const r = randScalar();
  return { C: mul(G, r).add(mul(H, BigInt(m))), D: mul(pk, r) };
}
function encrypt(amount, pk) {
  const out = [];
  let a = amount;
  for (let i = 0; i < LIMBS; i++) {
    out.push(encryptLimb(Number(a & LIMB_MASK), pk));
    a >>= LIMB_BITS;
  }
  return out;
}
function addEnc(a, b) {
  return a.map((ct, i) => ({ C: ct.C.add(b[i].C), D: ct.D.add(b[i].D) }));
}
function subEnc(a, b) {
  return a.map((ct, i) => ({ C: ct.C.subtract(b[i].C), D: ct.D.subtract(b[i].D) }));
}

// BSGS discrete-log table for limbs in [0, 2^16)
const BABY = 256;
let babyTable = null;
let giant = null;
function buildTable() {
  babyTable = new Map();
  for (let j = 0; j < BABY; j++) babyTable.set(mul(H, BigInt(j)).toHex(), j);
  giant = mul(H, BigInt(BABY)); // 256*H
}
function dlog(M) {
  if (!babyTable) buildTable();
  let cur = M;
  for (let i = 0; i < 4096; i++) {
    const hit = babyTable.get(cur.toHex());
    if (hit !== undefined) return i * BABY + hit;
    cur = cur.subtract(giant);
  }
  return null;
}
function decrypt(encAmt, sk) {
  const skInv = modInverse(sk);
  let total = 0n;
  for (let i = 0; i < encAmt.length; i++) {
    const M = encAmt[i].C.subtract(mul(encAmt[i].D, skInv)); // = limb * H
    const limb = dlog(M);
    if (limb === null) return null;
    total += BigInt(limb) << (LIMB_BITS * BigInt(i));
  }
  return total;
}
function recanonicalize(encAmt, sk, pk) {
  const v = decrypt(encAmt, sk);
  if (v === null) throw new Error("recanonicalize: undecryptable (limb out of range)");
  return encrypt(v, pk);
}
// A spend produces a FRESH canonical ciphertext of (balance - amount), exactly
// like Contra (new balance + a ZK equality proof), instead of limb-wise sub
// which would borrow/underflow a u16 limb.
function spend(balanceEnc, amount, sk, pk) {
  const cur = decrypt(balanceEnc, sk);
  if (cur === null) throw new Error("spend: undecryptable balance");
  if (cur < amount) throw new Error("overdraft");
  return encrypt(cur - amount, pk);
}

// aggregate 4 limbs -> single ciphertext encrypting the full value
function aggregate(encAmt) {
  let C = ZERO;
  let D = ZERO;
  for (let i = 0; i < encAmt.length; i++) {
    const w = 1n << (LIMB_BITS * BigInt(i));
    C = C.add(mul(encAmt[i].C, w));
    D = D.add(mul(encAmt[i].D, w));
  }
  return { C, D };
}
// Chaum-Pedersen proof that encAmt decrypts to v under pk (selective disclosure)
function proveDisclosure(encAmt, sk, v) {
  const agg = aggregate(encAmt);
  const B = agg.C.subtract(mul(H, v)); // = R*G
  const pk = mul(G, sk);
  const k = randScalar();
  const A1 = mul(G, k);
  const A2 = mul(B, k);
  const e = hashToScalar(G, B, pk, agg.D, A1, A2);
  const z = mod(k + e * sk);
  return { A1, A2, z };
}
function verifyDisclosure(encAmt, pk, v, proof) {
  const agg = aggregate(encAmt);
  const B = agg.C.subtract(mul(H, v));
  const e = hashToScalar(G, B, pk, agg.D, proof.A1, proof.A2);
  const lhs1 = mul(G, proof.z).equals(proof.A1.add(mul(pk, e)));
  const lhs2 = mul(B, proof.z).equals(proof.A2.add(mul(agg.D, e)));
  return lhs1 && lhs2;
}

console.log("\nTwisted ElGamal / Ristretto255 validation\n" + "-".repeat(44));

// 1. keygen + basic encrypt/decrypt
const t0 = performance.now();
const alice = randScalar();
const alicePk = pkFromSk(alice);
check("L is the ed25519 group order", typeof L === "bigint" && L > 2n ** 250n);
check("H != G and H != identity", !H.equals(G) && !H.equals(ZERO));

for (const amt of [0n, 1n, 42n, 1_000_000n, 123_456_789n, 4_294_967_295n, 999_999_999_999n]) {
  const ct = encrypt(amt, alicePk);
  const back = decrypt(ct, alice);
  check(`encrypt->decrypt ${amt}`, back === amt);
}

// 2. additive homomorphism (deposit folding)
const a = encrypt(250_000n, alicePk);
const b = encrypt(1_234_560n, alicePk);
const sum = recanonicalize(addEnc(a, b), alice, alicePk);
check("homomorphic add 250000 + 1234560 = 1484560", decrypt(sum, alice) === 1_484_560n);

// fold many small deposits, recanonicalizing each time (bounded-aggregation)
let bal = encrypt(0n, alicePk);
for (let i = 0; i < 8; i++) bal = recanonicalize(addEnc(bal, encrypt(12_500n, alicePk)), alice, alicePk);
check("fold 8 x 12500 deposits = 100000", decrypt(bal, alice) === 100_000n);

// spend = fresh canonical ciphertext of (balance - amount)
const afterSpend = spend(encrypt(5_000_000n, alicePk), 1_500_000n, alice, alicePk);
check("spend 5000000 - 1500000 = 3500000", decrypt(afterSpend, alice) === 3_500_000n);
let threw = false;
try {
  spend(encrypt(100n, alicePk), 500n, alice, alicePk);
} catch {
  threw = true;
}
check("spend rejects overdraft", threw);
void subEnc;

// 3. only the right key decrypts
const mallory = randScalar();
const wrong = decrypt(encrypt(777n, alicePk), mallory);
check("wrong key does NOT recover the amount", wrong !== 777n);

// 4. encrypting to a recipient's pk (confidential transfer)
const bob = randScalar();
const bobPk = pkFromSk(bob);
const toBob = encrypt(88_000n, bobPk);
check("recipient decrypts transfer", decrypt(toBob, bob) === 88_000n);
check("sender canNOT decrypt recipient ciphertext", decrypt(toBob, alice) !== 88_000n);

// 5. selective disclosure proof (real Chaum-Pedersen)
const secret = encrypt(42_000n, alicePk);
const proof = proveDisclosure(secret, alice, 42_000n);
check("valid disclosure proof verifies", verifyDisclosure(secret, alicePk, 42_000n, proof));
check("disclosure proof rejects wrong claimed value", !verifyDisclosure(secret, alicePk, 41_999n, proof));
const forged = proveDisclosure(secret, mallory, 42_000n); // wrong sk
check("disclosure proof rejects forgery with wrong key", !verifyDisclosure(secret, alicePk, 42_000n, forged));

// 6. auditor: a second viewing key escrow (encrypt amount to auditor pk too)
const auditor = randScalar();
const auditorPk = pkFromSk(auditor);
const auditable = encrypt(64_000n, auditorPk);
check("auditor decrypts when amount escrowed to auditor pk", decrypt(auditable, auditor) === 64_000n);

const t1 = performance.now();
console.log("-".repeat(44));
console.log(`\n${pass} passed, ${fail} failed   (${(t1 - t0).toFixed(0)}ms)\n`);
process.exit(fail === 0 ? 0 : 1);
