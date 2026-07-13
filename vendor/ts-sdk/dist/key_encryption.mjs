import { randomScalar } from "./ristretto255.mjs";
import { KeyConsistencyProof, scalarToLimbs } from "./nizk.mjs";
import { MultiRecipientEncryption } from "./twisted_elgamal.mjs";
//#region src/key_encryption.ts
/** Bit-length of each private-key limb committed in the key encryption. */
const LIMB_BITS = 32;
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
var KeyEncryption = class KeyEncryption {
	constructor(ciphertexts, proof, rangeProof) {
		this.ciphertexts = ciphertexts;
		this.proof = proof;
		this.rangeProof = rangeProof;
	}
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
	static prove(batchRangeProver, consistencyDst, rangeDst, senderPrivateKey, senderPublicKey, auditorPublicKeys) {
		const limbs = scalarToLimbs(senderPrivateKey);
		const blindings = [];
		const ciphertexts = limbs.map((limb) => {
			const r = randomScalar();
			blindings.push(r);
			return MultiRecipientEncryption.encrypt(auditorPublicKeys, limb, r);
		});
		const proof = KeyConsistencyProof.prove(consistencyDst, limbs, senderPublicKey, auditorPublicKeys, ciphertexts, blindings);
		const { proof: rangeProof } = batchRangeProver(limbs, blindings, LIMB_BITS, rangeDst);
		return new KeyEncryption(ciphertexts, proof, rangeProof);
	}
};
//#endregion
export { KeyEncryption };
