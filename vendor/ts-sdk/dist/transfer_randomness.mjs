import { G, mul, randomScalar } from "./ristretto255.mjs";
import { ristretto255 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToNumberLE } from "@noble/curves/utils.js";
import { hkdf } from "@noble/hashes/hkdf.js";
//#region src/transfer_randomness.ts
/** HKDF `info` domain-separating the seed derivation. */
const SEED_INFO = new TextEncoder().encode("contra/transfer-seed/v1");
/**
* Sample fresh per-transfer randomness for a transfer signed under `senderPk`.
*/
function sampleTransferRandomness(senderPk) {
	const t = randomScalar();
	return fromSharedSecret(mul(G, t), mul(senderPk, t));
}
/**
* Reconstruct the blindings of a past transfer from the sender's secret key and
* the published point `P`.
*/
function recoverTransferRandomness(sk, seedPoint) {
	return fromSharedSecret(seedPoint, mul(seedPoint, sk));
}
function fromSharedSecret(seedPoint, shared) {
	const seed = hkdf(sha256, shared.toBytes(), void 0, SEED_INFO, 32);
	return {
		seedPoint,
		blinding(batchIndex, limbIndex) {
			const wide = hkdf(sha256, seed, void 0, Uint8Array.from([batchIndex, limbIndex]), 64);
			return ristretto255.Point.Fn.create(bytesToNumberLE(wide));
		}
	};
}
//#endregion
export { recoverTransferRandomness, sampleTransferRandomness };
