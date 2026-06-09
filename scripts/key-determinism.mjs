// Prove the confidential viewing key is DETERMINISTIC across machines.
// The key = sha512(wallet signature over a fixed message). ed25519 signing is
// deterministic (RFC 8032), so the SAME wallet (same secret key) must produce
// the SAME key on every device. We simulate "two machines" by signing with two
// independent keypair instances built from the same secret.
// Run: node scripts/key-determinism.mjs
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";
import { sha512 } from "@noble/hashes/sha512";

// Must match src/lib/confidential.ts exactly.
const VIEWING_KEY_MESSAGE =
  "VestLock Private — derive my confidential viewing key.\n" +
  "This signature stays in your browser and unlocks your encrypted balance.\nv1";
const L = 7237005577332262213973186563042994240857116359379907606001950938285454250989n;
function bytesToNumberLE(b) {
  let r = 0n;
  for (let i = b.length - 1; i >= 0; i--) r = (r << 8n) | BigInt(b[i]);
  return r;
}
function deriveScalar(sig) {
  const s = bytesToNumberLE(sha512(sig)) % L;
  return s === 0n ? 1n : s;
}

const MSG = new TextEncoder().encode(VIEWING_KEY_MESSAGE);

let pass = 0;
let fail = 0;
const check = (name, cond) => {
  (cond ? pass++ : fail++), console.log(`  ${cond ? "✓" : "✗ FAIL"} ${name}`);
};

const main = async () => {
  // A fixed 32-byte secret = "the same wallet imported on two machines".
  const secret = new Uint8Array(32);
  for (let i = 0; i < 32; i++) secret[i] = (i * 7 + 3) & 0xff;

  const machineA = Ed25519Keypair.fromSecretKey(secret);
  const machineB = Ed25519Keypair.fromSecretKey(secret); // same wallet, other device
  const otherWallet = Ed25519Keypair.generate(); // a DIFFERENT wallet

  const sigA1 = (await machineA.signPersonalMessage(MSG)).signature;
  const sigA2 = (await machineA.signPersonalMessage(MSG)).signature; // sign again
  const sigB = (await machineB.signPersonalMessage(MSG)).signature; // "machine B"
  const sigOther = (await otherWallet.signPersonalMessage(MSG)).signature;

  const kA1 = deriveScalar(fromBase64(sigA1));
  const kA2 = deriveScalar(fromBase64(sigA2));
  const kB = deriveScalar(fromBase64(sigB));
  const kOther = deriveScalar(fromBase64(sigOther));

  console.log("Determinism of derived viewing key\n" + "-".repeat(40));
  check("same wallet, signed twice → identical signature", sigA1 === sigA2);
  check("same wallet, second 'machine' → identical signature", sigA1 === sigB);
  check("same wallet → identical KEY (sign twice)", kA1 === kA2);
  check("same wallet → identical KEY across machines", kA1 === kB);
  check("different wallet → DIFFERENT key", kA1 !== kOther);
  console.log("-".repeat(40));
  console.log("derived key (hex):", kA1.toString(16).slice(0, 24), "…");
  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((e) => {
  console.error("FAILED:", e?.message ?? e);
  process.exit(1);
});
