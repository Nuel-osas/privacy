import { G, H, mul, randomScalar } from "./ristretto255.mjs";
import { fiatShamirChallenge } from "./helpers.mjs";
import { ristretto255 } from "@noble/curves/ed25519.js";
import { equalBytes } from "@noble/curves/utils.js";
//#region src/nizk.ts
/**
* Fiat-Shamir challenge for the DDH proof. Binds the bases `g, h` so the challenge commits to the
* full statement (matching Move's `challenge_ddh`).
*/
function challengeDdh(dst, g, h, xG, xH, a, b) {
	return fiatShamirChallenge([
		dst,
		g.toBytes(),
		h.toBytes(),
		xG.toBytes(),
		xH.toBytes(),
		a.toBytes(),
		b.toBytes()
	]);
}
/**
* Non-interactive zero-knowledge proof of a DDH tuple.
*
* Proves knowledge of `x` such that `xG = x * g` and `xH = x * h`.
* Layout matches the on-chain `contra::nizk::DdhProof` struct.
*/
var DdhTupleNizk = class DdhTupleNizk {
	constructor(a, b, z) {
		this.a = a;
		this.b = b;
		this.z = z;
	}
	static prove(dst, x, g, h, xG, xH) {
		const r = randomScalar();
		const a = mul(g, r);
		const b = mul(h, r);
		const c = challengeDdh(dst, g, h, xG, xH, a, b);
		return new DdhTupleNizk(a, b, ristretto255.Point.Fn.create(r + c * x));
	}
	verify(dst, g, h, xG, xH) {
		const c = challengeDdh(dst, g, h, xG, xH, this.a, this.b);
		return isValidRelation(this.a, xG, g, this.z, c) && isValidRelation(this.b, xH, h, this.z, c);
	}
};
function isValidRelation(e1, e2, e3, z, c) {
	return equalBytes(e1.toBytes(), mul(e3, z).subtract(mul(e2, c)).toBytes());
}
/**
* Fiat-Shamir challenge for the batched DDH proof. Binds, in order, the DST, every base, every
* image, and every per-pair Schnorr commitment (matching Move's `challenge_batched_ddh`).
*/
function challengeBatchedDdh(dst, bases, images, commitments) {
	return fiatShamirChallenge([
		dst,
		...bases.map((b) => b.toBytes()),
		...images.map((i) => i.toBytes()),
		...commitments.map((c) => c.toBytes())
	]);
}
/**
* Non-interactive zero-knowledge proof of a shared-witness DDH relation over a batch of base/image
* pairs: proves knowledge of a single `w` such that `images[k] = w * bases[k]` for every `k`.
*
* Layout matches the on-chain `contra::nizk::BatchedDdhProof` struct.
*/
var BatchedDdhNizk = class BatchedDdhNizk {
	constructor(commitments, z) {
		this.commitments = commitments;
		this.z = z;
	}
	static prove(dst, w, bases, images) {
		const s = randomScalar();
		const commitments = bases.map((b) => mul(b, s));
		const c = challengeBatchedDdh(dst, bases, images, commitments);
		return new BatchedDdhNizk(commitments, ristretto255.Point.Fn.create(s + c * w));
	}
	verify(dst, bases, images) {
		if (images.length !== bases.length || this.commitments.length !== bases.length) return false;
		const c = challengeBatchedDdh(dst, bases, images, this.commitments);
		return bases.every((base, k) => isValidRelation(this.commitments[k], images[k], base, this.z, c));
	}
};
/**
* Fiat-Shamir challenge for the ElGamal proof. Binds the bases `g, h` so the challenge commits to
* the full statement (matching Move's `challenge_elgamal`).
*/
function challengeElgamal(dst, g, h, pk, c, d, a, b) {
	return fiatShamirChallenge([
		dst,
		g.toBytes(),
		h.toBytes(),
		pk.toBytes(),
		c.toBytes(),
		d.toBytes(),
		a.toBytes(),
		b.toBytes()
	]);
}
/**
* Non-interactive zero-knowledge proof that a twisted ElGamal
* ciphertext `(c, d)` is well-formed: proves knowledge of `r` and `m`
* such that `c = r*g + m*h` and `d = r*pk`.
*
* Layout matches the on-chain `contra::nizk::ElGamalProof` struct.
*/
var ElGamalNizk = class ElGamalNizk {
	constructor(a, b, z1, z2) {
		this.a = a;
		this.b = b;
		this.z1 = z1;
		this.z2 = z2;
	}
	/**
	* Prove that `encryption` is a valid twisted ElGamal encryption of
	* `amount` under `pk` with blinding `blinding`. The bases `g, h` are the
	* canonical Twisted ElGamal generators — fixed by the protocol, not a
	* parameter.
	*/
	static prove(dst, blinding, amount, encryption, pk) {
		const r1 = randomScalar();
		const r2 = randomScalar();
		const a = mul(pk, r1);
		const b = mul(G, r1).add(mul(H, r2));
		const challenge = challengeElgamal(dst, G, H, pk, encryption.ciphertext, encryption.decryptionHandle, a, b);
		return new ElGamalNizk(a, b, ristretto255.Point.Fn.create(r1 + challenge * blinding), ristretto255.Point.Fn.create(r2 + challenge * amount));
	}
};
/**
* Split a 256-bit scalar into eight u32 limbs in little-endian order,
* matching Move's `nizk::scalar_to_limbs`.
*/
function scalarToLimbs(scalar) {
	return Array.from({ length: 8 }, (_, i) => scalar >> BigInt(i * 32) & 4294967295n);
}
/**
* Reassemble eight u32 limbs (little-endian) into a 256-bit scalar.
* Inverse of `scalarToLimbs`.
*/
function limbsToScalar(limbs) {
	return limbs.reduce((acc, limb, i) => acc | limb << BigInt(i * 32), 0n);
}
/**
* Fiat-Shamir challenge for the key-consistency proof. Binds the bases `g, h`, the sender public
* key, the recipient public keys, every per-limb ciphertext with its decryption handles, and
* finally the prover commitments `(a1, a2, a3)` — matching Move's `challenge_key_consistency`.
*/
function challengeKeyConsistency(dst, g, h, senderPublicKey, recipientEncryptionKeys, ciphertexts, a1, a2, a3) {
	return fiatShamirChallenge([
		dst,
		g.toBytes(),
		h.toBytes(),
		senderPublicKey.toBytes(),
		...recipientEncryptionKeys.map((k) => k.toBytes()),
		...ciphertexts.flatMap((ct) => [ct.commitment.toBytes(), ...ct.decryptionHandles.map((dh) => dh.toBytes())]),
		...a1.map((p) => p.toBytes()),
		...a2.map((p) => p.toBytes()),
		a3.toBytes()
	]);
}
/**
* Non-interactive zero-knowledge proof showing that the eight 32-bit limbs of a 256-bit
* sender private key are correctly encrypted to a list of recipient public keys using
* Twisted ElGamal.
*
* Proves knowledge of blindings (r_1,...,r_8) and key limbs (u_1,...,u_8) such that:
*   - D_ij = r_i * pk_j  for all limbs i and recipients j
*   - C_i  = r_i * G + u_i * H  for all i
*   - (\sum_i u_i * 2^{32i}) * G == sender_public_key
*
* Layout matches the on-chain `contra::nizk::KeyConsistencyProof` struct.
*/
var KeyConsistencyProof = class KeyConsistencyProof {
	constructor(a1, a2, a3, z1, z2) {
		this.a1 = a1;
		this.a2 = a2;
		this.a3 = a3;
		this.z1 = z1;
		this.z2 = z2;
	}
	/**
	* Prove that `ciphertexts` correctly encrypts the 32-bit limbs of the sender's private key
	* to all `recipientEncryptionKeys`.
	*/
	static prove(dst, senderPrivateKeyLimbs, senderPublicKey, recipientEncryptionKeys, ciphertexts, blindings) {
		const n = senderPrivateKeyLimbs.length;
		const a = Array.from({ length: n }, () => randomScalar());
		const b = Array.from({ length: n }, () => randomScalar());
		const a1 = a.flatMap((ai) => recipientEncryptionKeys.map((pk) => mul(pk, ai)));
		const a2 = Array.from({ length: n }, (_, i) => mul(G, a[i]).add(mul(H, b[i])));
		const a3 = mul(G, b.reduce((acc, bi, i) => ristretto255.Point.Fn.create(acc + (bi << BigInt(i * 32))), 0n));
		const c = challengeKeyConsistency(dst, G, H, senderPublicKey, recipientEncryptionKeys, ciphertexts, a1, a2, a3);
		return new KeyConsistencyProof(a1, a2, a3, a.map((ai, i) => ristretto255.Point.Fn.create(ai + c * blindings[i])), b.map((bi, i) => ristretto255.Point.Fn.create(bi + c * senderPrivateKeyLimbs[i])));
	}
	/**
	* Verify the proof against the sender's public key, the recipient encryption keys,
	* and the per-limb ciphertexts.
	*/
	verify(dst, senderPublicKey, recipientEncryptionKeys, ciphertexts) {
		const n = this.a2.length;
		const m = recipientEncryptionKeys.length;
		const c = challengeKeyConsistency(dst, G, H, senderPublicKey, recipientEncryptionKeys, ciphertexts, this.a1, this.a2, this.a3);
		for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
			const lhs = this.a1[i * m + j].add(mul(ciphertexts[i].decryptionHandles[j], c));
			const rhs = mul(recipientEncryptionKeys[j], this.z1[i]);
			if (!lhs.equals(rhs)) return false;
		}
		for (let i = 0; i < n; i++) {
			const lhs = this.a2[i].add(mul(ciphertexts[i].commitment, c));
			const rhs = mul(G, this.z1[i]).add(mul(H, this.z2[i]));
			if (!lhs.equals(rhs)) return false;
		}
		const base = 1n << 32n;
		let exp = 1n;
		let zSum = 0n;
		for (let i = 0; i < n; i++) {
			zSum = ristretto255.Point.Fn.create(zSum + this.z2[i] * exp);
			exp = ristretto255.Point.Fn.create(exp * base);
		}
		const lhs3 = mul(G, zSum);
		const rhs3 = this.a3.add(mul(senderPublicKey, c));
		return lhs3.equals(rhs3);
	}
};
//#endregion
export { BatchedDdhNizk, DdhTupleNizk, ElGamalNizk, KeyConsistencyProof, limbsToScalar, scalarToLimbs };
