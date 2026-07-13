import { RistrettoPoint } from "./ristretto255.mjs";
import { MultiRecipientEncryption, PrivateKey } from "./twisted_elgamal.mjs";
import { KeyConsistencyProof } from "./nizk.mjs";
import { BatchRangeProver } from "./bp.mjs";

//#region src/key_encryption.d.ts
/**
 * The bundle a user submits on `register` / `set_public_key` whenever the token has
 * auditors configured. Wraps:
 *   - per-limb `MultiRecipientEncryption` of the user's 32-bit private-key limbs
 *     under every auditor's public key,
 *   - a `KeyConsistencyProof` (sigma protocol) tying the encrypted limbs to the
 *     user's public key,
 *   - an aggregate Bulletproof showing each limb lies in `[0, 2^32)`.
 *
 * Mirrors `contra::auditors::KeyEncryption` on chain.
 */
declare class KeyEncryption {
  ciphertexts: MultiRecipientEncryption[];
  proof: KeyConsistencyProof;
  rangeProof: Uint8Array;
  constructor(ciphertexts: MultiRecipientEncryption[], proof: KeyConsistencyProof, rangeProof: Uint8Array);
  /**
   * Build a `KeyEncryption` for the given private key under the auditor key set.
   * Generates fresh blindings per limb, the sigma proof, and the aggregate
   * Bulletproof in one call. `consistencyDst` is bound into the sigma transcript
   * and `rangeDst` into the Bulletproof transcript; they must equal the `dst` /
   * `range_dst` the Move side passes to `auditors::verify_key_encryption` (the
   * `DST_KEY_CONSISTENCY` and `DST_KEY_RANGE_PROOF` tags, which are distinct).
   * `batchRangeProver` is a bound function from the caller's `getBulletproofs()`
   * result (WASM already initialized).
   */
  static prove(batchRangeProver: BatchRangeProver, consistencyDst: Uint8Array, rangeDst: Uint8Array, senderPrivateKey: PrivateKey, senderPublicKey: RistrettoPoint, auditorPublicKeys: RistrettoPoint[]): KeyEncryption;
}
//#endregion
export { KeyEncryption };