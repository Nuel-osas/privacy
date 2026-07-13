import { DecryptionFailedError, InvalidArgumentError } from "./error.mjs";
import { G, H, ZERO, mul, mulUnsafe, pointFromBcs, randomScalar } from "./ristretto255.mjs";
import { DdhTupleNizk, ElGamalNizk } from "./nizk.mjs";
import { PedersenCommitment } from "./pedersen.mjs";
import { ristretto255 } from "@noble/curves/ed25519.js";
import { Field } from "@noble/curves/abstract/modular.js";
/** ed25519 base field for Montgomery batch inversion. */
const Fp = Field(2n ** 255n - 19n);
/** The 4 torsion points that form the ristretto equivalence kernel, in extended (X,Y,Z,T) coords. */
const SQRT_M1 = 19681161376707505956807079304988542015446066515923890162744021073123829784752n;
const p = 2n ** 255n - 19n;
const EP = ristretto255.Point.BASE.ep.constructor;
const TORSION_EPS = [
	new EP(0n, 1n, 1n, 0n),
	new EP(0n, p - 1n, 1n, 0n),
	new EP(SQRT_M1, 0n, 1n, 0n),
	new EP(p - SQRT_M1, 0n, 1n, 0n)
];
/** The 4 Edwards .x coordinates of the ristretto equivalence class of `point`. */
function cosetX(point) {
	const ep = point.ep;
	const shifted = TORSION_EPS.map((t) => ep.add(t));
	const invertedZs = Fp.invertBatch(shifted.map((s) => s.Z));
	return shifted.map((s, k) => Fp.mul(s.X, invertedZs[k]));
}
/** Key used for indexing the discrete-log table computed from the x-coordinate of the point. */
function key(x) {
	return Number(x & 4294967295n);
}
/**
* Compute the raw table entries (truncated x-coordinates) for a given
* numBits. This is a pure function that can run in a web worker. Returns
* a Uint32Array where `entries[i]` is the truncated x-coordinate of `i*H`.
* The result can be transferred to the main thread.
*/
function computeTableEntries(numBits) {
	performance.now();
	const tableSize = 2 ** numBits;
	const entries = new Uint32Array(tableSize);
	const CHUNK = 4096;
	const xs = new Array(CHUNK);
	const zs = new Array(CHUNK);
	let point = ZERO;
	for (let base = 0; base < tableSize; base += CHUNK) {
		const len = Math.min(CHUNK, tableSize - base);
		for (let k = 0; k < len; k++) {
			const ep = point.ep;
			xs[k] = ep.X;
			zs[k] = ep.Z;
			point = point.add(H);
		}
		const invertedZs = Fp.invertBatch(len === CHUNK ? zs : zs.slice(0, len));
		for (let k = 0; k < len; k++) entries[base + k] = key(Fp.mul(xs[k], invertedZs[k]));
	}
	return entries;
}
/**
* Precomputed discrete-log table for ristretto255. Stores sequential
* multiples of H keyed by truncated 4-byte Edwards x-coordinates,
* with verification by scalar multiplication to guard against collisions.
*
* The table is held as two parallel, key-sorted `Uint32Array`s — `#keys`
* (the truncated x-coordinates, ascending) and `#values` (the matching
* baby-step index `i` such that `i*H` has that key).
*
* Decrypt searches by subtracting `2^numBits * H` (the giant step)
* each iteration and checking the table. Small values (the common
* case for u16 limbs) are found on the first lookup with no loop.
*
* Larger `numBits` makes decryption faster (fewer giant-step iterations
* before a hit) but quadruples the table memory each bit: the table
* holds `2^numBits` entries of 8 bytes each, so e.g. `numBits = 16`
* is 512 KiB and `numBits = 24` is 128 MiB.
*/
var DiscreteLogTable = class DiscreteLogTable {
	#keys;
	#values;
	static {
		this.MAX_CACHE_SIZE = 1024;
	}
	#cache;
	constructor(numBits, keys, values) {
		this.numBits = numBits;
		this.tableSize = 2 ** numBits;
		this.giantStep = mul(H, BigInt(this.tableSize));
		this.#keys = keys;
		this.#values = values;
		this.#cache = /* @__PURE__ */ new Map();
	}
	/** Compute the table synchronously (convenience for tests / Node). */
	static create(numBits = 16) {
		if (numBits > 32) throw new InvalidArgumentError(`numBits must be <= 32 (got ${numBits})`);
		return DiscreteLogTable.fromEntries(numBits, computeTableEntries(numBits));
	}
	/**
	* Construct from pre-computed entries (e.g. from a web worker), where
	* `entries[i]` is the truncated x-coordinate of `i*H`. Sorts the baby-step
	* indices by their key into the parallel `#keys` / `#values` arrays.
	*/
	static fromEntries(numBits, entries) {
		const n = entries.length;
		const values = new Uint32Array(n);
		for (let i = 0; i < n; i++) values[i] = i;
		values.sort((a, b) => entries[a] - entries[b]);
		const keys = new Uint32Array(n);
		for (let j = 0; j < n; j++) keys[j] = entries[values[j]];
		return new DiscreteLogTable(numBits, keys, values);
	}
	/** Index of the first entry in `#keys` whose key is `>= target`. */
	#lowerBound(target) {
		let lo = 0;
		let hi = this.#keys.length;
		while (lo < hi) {
			const mid = lo + hi >>> 1;
			if (this.#keys[mid] < target) lo = mid + 1;
			else hi = mid;
		}
		return lo;
	}
	/**
	* Look up a point in the cache or precomputed table. Returns the
	* baby-step value (table index) if matched, `undefined` otherwise.
	* The caller adds the giant-step offset.
	*/
	lookup(point) {
		const cacheKey = key(point.x);
		const cached = this.#cache.get(cacheKey);
		if (cached !== void 0 && mulUnsafe(H, cached).equals(point)) return {
			value: cached,
			cached: true
		};
		for (const x of cosetX(point)) {
			const target = key(x);
			for (let j = this.#lowerBound(target); j < this.#keys.length && this.#keys[j] === target; j++) {
				const value = BigInt(this.#values[j]);
				if (mulUnsafe(H, value).equals(point)) {
					if (this.#cache.size >= DiscreteLogTable.MAX_CACHE_SIZE) {
						const oldest = this.#cache.keys().next().value;
						if (oldest !== void 0) this.#cache.delete(oldest);
					}
					this.#cache.set(cacheKey, value);
					return {
						value,
						cached: false
					};
				}
			}
		}
	}
};
/**
* Baby-step giant-step search for the `m` with `point = m*H`, over `table`:
* subtract the giant step each iteration until a baby-step entry matches. Small
* values (the common case for u16 limbs) are found on the first lookup with no
* subtraction. Throws {@link DecryptionFailedError} if `m` is outside the table's
* `2^(2 * numBits)` range.
*/
function solveBsgs(point, table) {
	performance.now();
	const tableSize = BigInt(table.tableSize);
	for (let g = 0n; g < tableSize; g++) {
		const hit = table.lookup(point);
		if (hit !== void 0) return g * tableSize + hit.value;
		point = point.subtract(table.giantStep);
	}
	throw new DecryptionFailedError(table.numBits);
}
/**
* A twisted ElGamal encryption — `ciphertext = r*G + m*H` and
* `decryptionHandle = r*pk` — of a u16 value (decryptable up to ~2^32).
*
* The two fields match the `contra::twisted_elgamal::Encryption` Move
* struct. Use `Ciphertext.fromBcs` to lift the raw shape produced by the
* generated `twisted_elgamal.Encryption` BCS schema into a `Ciphertext`.
*/
var Ciphertext = class Ciphertext {
	constructor(ciphertext, decryptionHandle) {
		this.ciphertext = ciphertext;
		this.decryptionHandle = decryptionHandle;
	}
	static encryptWithBlinding(pk, value, blinding) {
		return {
			ciphertext: new Ciphertext(new PedersenCommitment(value, blinding).p, mul(pk, blinding)),
			blinding
		};
	}
	static encrypt(pk, value) {
		const blinding = randomScalar();
		return Ciphertext.encryptWithBlinding(pk, value, blinding);
	}
	/**
	* Encrypt a value under `pk` with the given `blinding` and generate an ElGamal
	* consistency proof.
	*/
	static encryptWithConsistencyProof(dst, pk, value, blinding) {
		const { ciphertext } = Ciphertext.encryptWithBlinding(pk, value, blinding);
		return {
			ciphertext,
			blinding,
			proof: ElGamalNizk.prove(dst, blinding, value, ciphertext, pk)
		};
	}
	/**
	* Prove that this ciphertext encrypts zero under the given key pair.
	* Returns a `DdhTupleNizk` proving `decryptionHandle = sk * ciphertext`.
	*/
	proveIsZero(dst, sk, pk) {
		return DdhTupleNizk.prove(dst, sk, G, this.ciphertext, pk, this.decryptionHandle);
	}
	/**
	* Prove that this ciphertext decrypts to `value` under the key pair
	* `(sk, pk)`, without revealing `sk`.
	*/
	proveDecryption(dst, sk, pk, value) {
		const commitmentToZero = this.ciphertext.subtract(mul(H, value));
		return DdhTupleNizk.prove(dst, sk, G, commitmentToZero, pk, this.decryptionHandle);
	}
	/**
	* Verify a `proveDecryption` proof: returns `true` iff `proof`
	* demonstrates that this ciphertext decrypts to `value` under the
	* secret key corresponding to `pk`.
	*/
	verifyDecryption(dst, pk, value, proof) {
		const commitmentToZero = this.ciphertext.subtract(mul(H, value));
		return proof.verify(dst, G, commitmentToZero, pk, this.decryptionHandle);
	}
	/**
	* Construct a `Ciphertext` from the BCS-decoded shape produced by the
	* generated `twisted_elgamal.Encryption` schema.
	*/
	static fromBcs(raw) {
		return new Ciphertext(pointFromBcs(raw.ciphertext), pointFromBcs(raw.decryption_handle));
	}
	/** Trivial encryption of `value` with zero blinding: `(value*H, identity)`. */
	static trivial(value) {
		return new Ciphertext(mul(H, value), ZERO);
	}
	/** Component-wise addition of two ciphertexts. */
	add(other) {
		return new Ciphertext(this.ciphertext.add(other.ciphertext), this.decryptionHandle.add(other.decryptionHandle));
	}
	/** Component-wise subtraction. */
	subtract(other) {
		return new Ciphertext(this.ciphertext.subtract(other.ciphertext), this.decryptionHandle.subtract(other.decryptionHandle));
	}
	/** Scalar-multiply both components by `2^bits`. */
	shiftLeft(bits) {
		const factor = 1n << BigInt(bits);
		return new Ciphertext(mul(this.ciphertext, factor), mul(this.decryptionHandle, factor));
	}
	/**
	* Decrypt this ciphertext under `privateKey`, recovering the
	* underlying plaintext via baby-step giant-step over `table`.
	* Throws {@link DecryptionFailedError} if the plaintext is outside
	* the table's `2^(2 * numBits)` range or the key is wrong.
	*/
	decrypt(privateKey, table) {
		return this.decryptWithInverse(ristretto255.Point.Fn.inv(privateKey), table);
	}
	/**
	* Like {@link decrypt}, but takes a precomputed scalar-field inverse
	* of the private key so that callers decrypting many ciphertexts
	* under the same key invert once and reuse the result.
	*/
	decryptWithInverse(privateKeyInverse, table) {
		return solveBsgs(this.ciphertext.subtract(mul(this.decryptionHandle, privateKeyInverse)), table);
	}
	/**
	* Recover the plaintext from the commitment alone, given the blinding `r`
	* used to form it.
	*/
	decryptWithBlinding(blinding, table) {
		return solveBsgs(this.ciphertext.subtract(mul(G, blinding)), table);
	}
};
/**
* Four twisted ElGamal ciphertext limbs that together represent an
* on-chain `contra::encrypted_amount::EncryptedAmount`. The underlying
* plaintext is `l0 + 2^16 * l1 + 2^32 * l2 + 2^48 * l3`.
*/
var EncryptedAmount = class EncryptedAmount {
	constructor(l0, l1, l2, l3) {
		this.l0 = l0;
		this.l1 = l1;
		this.l2 = l2;
		this.l3 = l3;
	}
	/**
	* Construct an `EncryptedAmount` from the BCS-decoded shape produced by the generated
	* `encrypted_amount.EncryptedAmount` schema.
	*/
	static fromBcs(raw) {
		return new EncryptedAmount(Ciphertext.fromBcs(raw.l0), Ciphertext.fromBcs(raw.l1), Ciphertext.fromBcs(raw.l2), Ciphertext.fromBcs(raw.l3));
	}
	/**
	* Trivially encrypt `value` with zero blinding, splitting it into
	* four u16 limbs. Matches the on-chain `from_value` helper.
	*/
	static trivial(value) {
		return new EncryptedAmount(Ciphertext.trivial(value & 65535n), Ciphertext.trivial(value >> 16n & 65535n), Ciphertext.trivial(value >> 32n & 65535n), Ciphertext.trivial(value >> 48n & 65535n));
	}
	/**
	* Combine the four limbs into a single `Ciphertext` encoding the
	* full u64 value, matching the on-chain
	* `EncryptedAmount::to_encryption()`.
	*/
	collapse() {
		return this.l0.add(this.l1.shiftLeft(16).add(this.l2.shiftLeft(32).add(this.l3.shiftLeft(48))));
	}
	/**
	* Decrypt all four limbs and combine into the underlying u64
	* plaintext. Each limb is decrypted independently and shifted
	* into place: `l0 + 2^16 * l1 + 2^32 * l2 + 2^48 * l3`.
	*/
	decrypt(privateKey, table) {
		const inv = ristretto255.Point.Fn.inv(privateKey);
		const d0 = this.l0.decryptWithInverse(inv, table);
		const d1 = this.l1.decryptWithInverse(inv, table);
		const d2 = this.l2.decryptWithInverse(inv, table);
		const d3 = this.l3.decryptWithInverse(inv, table);
		return d0 + (d1 << 16n) + (d2 << 32n) + (d3 << 48n);
	}
	/**
	* Recover the plaintext from the limb commitments alone, given the per-limb
	* blindings.
	*/
	decryptWithBlindings(blindingForLimb, table) {
		const d0 = this.l0.decryptWithBlinding(blindingForLimb(0), table);
		const d1 = this.l1.decryptWithBlinding(blindingForLimb(1), table);
		const d2 = this.l2.decryptWithBlinding(blindingForLimb(2), table);
		const d3 = this.l3.decryptWithBlinding(blindingForLimb(3), table);
		return d0 + (d1 << 16n) + (d2 << 32n) + (d3 << 48n);
	}
};
function collapseBlindings(blindings) {
	return blindings.map((e) => e.blinding).reduce((acc, r, i) => {
		const shift = BigInt(i * 16);
		const shifted = shift === 0n ? r : ristretto255.Point.Fn.create(r * (1n << shift));
		return ristretto255.Point.Fn.create(acc + shifted);
	}, 0n);
}
/**
* A Twisted ElGamal ciphertext encrypted to multiple recipients.
* All recipients share the same Pedersen commitment `C = r*G + m*H`;
* each recipient j gets their own decryption handle `D_j = r * pk_j`.
*
*/
var MultiRecipientEncryption = class MultiRecipientEncryption {
	constructor(commitment, decryptionHandles) {
		this.commitment = commitment;
		this.decryptionHandles = decryptionHandles;
	}
	/**
	* Encrypt `value` to all `recipientKeys` using the provided shared blinding `r`.
	*/
	static encrypt(recipientKeys, value, blinding) {
		const commitment = new PedersenCommitment(value, blinding).p;
		return new MultiRecipientEncryption(commitment, recipientKeys.map((pk) => mul(pk, blinding)));
	}
	/**
	* Construct a `MultiRecipientEncryption` from the BCS-decoded shape produced
	* by the generated `twisted_elgamal.MultiRecipientEncryption` schema.
	*/
	static fromBcs(raw) {
		return new MultiRecipientEncryption(pointFromBcs(raw.ciphertext), raw.decryption_handles.map(pointFromBcs));
	}
	/**
	* Extract the single-recipient `Ciphertext` for recipient at `index`.
	*/
	#ciphertextFor(index) {
		return new Ciphertext(this.commitment, this.decryptionHandles[index]);
	}
	/**
	* Decrypt this ciphertext for recipient at `index` using `privateKey`.
	*/
	decrypt(index, privateKey, table) {
		return this.#ciphertextFor(index).decrypt(privateKey, table);
	}
};
//#endregion
export { Ciphertext, DiscreteLogTable, EncryptedAmount, MultiRecipientEncryption, collapseBlindings, computeTableEntries };
