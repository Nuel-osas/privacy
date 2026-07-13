import { InvalidArgumentError } from "./error.mjs";
import { ristretto255, ristretto255_hasher } from "@noble/curves/ed25519.js";
import { sha512 } from "@noble/hashes/sha2.js";
//#region src/ristretto255.ts
/** The ristretto255 prime-order group's standard base point. */
const G = ristretto255.Point.BASE;
/**
* A second, independent ristretto255 generator used as the blinding
* base point in Pedersen commitments and twisted ElGamal encryptions.
* Matches the on-chain `contra::twisted_elgamal::h()` constant which
* was derived via fastcrypto's `hash_to_curve("fastcrypto-blinding-gen-01")`.
*
* We reproduce the derivation here using noble's lower-level primitives:
* `SHA-512(input)` followed by `deriveToCurve` (the Elligator 2 map).
* Noble's higher-level `hashToCurve` cannot be used because it applies
* RFC 9380 `expand_message_xmd` with a DST, whereas fastcrypto hashes
* the raw input with plain SHA-512 — producing different 64-byte
* intermediates and therefore a different point.
*/
const H = ristretto255_hasher.deriveToCurve(sha512(new TextEncoder().encode("fastcrypto-blinding-gen-01")));
H.precompute(8);
/** The ristretto255 identity (zero) point. */
const ZERO = ristretto255.Point.ZERO;
/** The order of the ristretto255 scalar field. */
const GROUP_ORDER = ristretto255.Point.Fn.ORDER;
/**
* Constant-time scalar multiplication `scalar * point` that accepts `0`.
* Leaks information in case of 0 input.
*
* Out-of-range scalars (negative or `>= group order`) throw.
*/
function mul(point, scalar) {
	return scalar === 0n ? ZERO : point.multiply(scalar);
}
/**
* Variable-time scalar multiplication `scalar * point`; accepts `0`.
* NOT constant-time, its purpose is speed.
*/
function mulUnsafe(point, scalar) {
	return point.multiplyUnsafe(scalar);
}
/**
* Deserialize a compressed ristretto255 point from its on-chain BCS
* encoding.
*/
function pointFromBcs(element) {
	try {
		return ristretto255.Point.fromBytes(Uint8Array.from(element.bytes));
	} catch (cause) {
		throw new InvalidArgumentError(`not a canonical compressed ristretto255 point: ${cause instanceof Error ? cause.message : String(cause)}`);
	}
}
/** Generate a uniformly random scalar. */
function randomScalar() {
	const seed = new Uint8Array(32);
	crypto.getRandomValues(seed);
	return ristretto255_hasher.hashToScalar(seed);
}
/** Assert that `s` is a usable secret scalar, i.e. `1 <= s < group order`. */
function assertNonZeroScalar(s) {
	const Fn = ristretto255.Point.Fn;
	if (s === 0n || !Fn.isValid(s)) throw new InvalidArgumentError(`scalar must be a non-zero canonical element of the ristretto255 scalar field`);
}
/** Sum scalars in the ristretto255 scalar field, reducing modulo the group order. */
function addScalars(scalars) {
	const Fn = ristretto255.Point.Fn;
	return scalars.reduce((acc, s) => Fn.add(acc, s), 0n);
}
/**
* Serialize a ristretto255 scalar as 32 little-endian bytes.
* Throws if `s` is not a canonical element of the ristretto255 scalar field.
*/
function scalarToBytes(s) {
	const Fn = ristretto255.Point.Fn;
	if (!Fn.isValid(s)) throw new InvalidArgumentError(`scalar ${s} is not a canonical element of the ristretto255 scalar field`);
	return Fn.toBytes(s);
}
//#endregion
export { G, GROUP_ORDER, H, ZERO, addScalars, assertNonZeroScalar, mul, mulUnsafe, pointFromBcs, randomScalar, scalarToBytes };
