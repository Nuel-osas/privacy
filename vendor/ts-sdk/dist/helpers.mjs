import { InvalidArgumentError } from "./error.mjs";
import { newKeyEncryption } from "./contracts/contra/auditors.mjs";
import { newWellFormedProof } from "./contracts/contra/encrypted_amount.mjs";
import { batchedDdhProof, consistencyProof, ddhProof, elgamalProof, encryptedAmount, gVector, keyConsistencyProof, multiRecipientEncryption } from "./contracts/contra/decode.mjs";
import { bcs } from "@mysten/sui/bcs";
import { SUI_FRAMEWORK_ADDRESS, deriveDynamicFieldID, deriveObjectID, normalizeStructTag } from "@mysten/sui/utils";
import { ristretto255 } from "@noble/curves/ed25519.js";
import { bytesToNumberLE, numberToBytesLE } from "@noble/curves/utils.js";
import { blake2b } from "@noble/hashes/blake2.js";
import { hexToBytes } from "@noble/hashes/utils.js";
//#region src/helpers.ts
/** BCS layout of the Fiat-Shamir transcript: an ordered list of length-prefixed byte chunks. */
const FIAT_SHAMIR_TRANSCRIPT = bcs.vector(bcs.vector(bcs.u8()));
/**
* Fiat-Shamir challenge over the ordered byte chunks `parts`, matching on-chain
* `contra::nizk::fiat_shamir_challenge`: BCS-encode `parts` as a `vector<vector<u8>>` (ULEB128
* chunk count, then each chunk length-prefixed), Blake2b256, then reduce to a scalar by zeroing the
* top byte (the lower 248 bits are always below the ~2^252 group order).
*/
function fiatShamirChallenge(randomOracleInputs) {
	const hash = blake2b(FIAT_SHAMIR_TRANSCRIPT.serialize(randomOracleInputs.map((p) => Array.from(p))).toBytes(), { dkLen: 32 });
	hash[31] = 0;
	return ristretto255.Point.Fn.create(bytesToNumberLE(hash));
}
/** 20-byte per-account `session_id`: first 20 bytes of {@link getTokenAccountUniqueId}. */
function newSessionId(packageConfig, address, tokenType) {
	return hexToBytes(getTokenAccountUniqueId(packageConfig, address, tokenType).slice(2)).subarray(0, 20);
}
/**
* Deterministic per-`(account, tokenType)` address used only as the Fiat-Shamir
* session-id tag. It is `derived_object::derive_address(Account UID,
* TokenAccountKey<tokenType>())`, matching on-chain `contra::session_id`.
*/
function getTokenAccountUniqueId(packageConfig, address, tokenType) {
	const normalizedType = normalizeStructTag(tokenType);
	return deriveObjectID(getAccountId(packageConfig, address), `${packageConfig.packageId}::contra::TokenAccountKey<${normalizedType}>`, bcs.byteVector().serialize([]).toBytes());
}
/** 21-byte Fiat-Shamir DST `session_id ‖ protocol_id`. */
function dst(sessionId, protocolId) {
	const result = new Uint8Array(21);
	result.set(sessionId, 0);
	result[20] = protocolId;
	return result;
}
/** Derive the per-owner shared account object ID. */
function getAccountId(packageConfig, address) {
	return deriveObjectID(packageConfig.accountRegistryId, `${packageConfig.packageId}::contra::AccountKey`, bcs.Address.serialize(address).toBytes());
}
/**
* Derive the dynamic-field object ID of the `TokenAccount<tokenType>` inside
* the account owned by `address`.
*/
function getTokenAccountId(packageConfig, address, tokenType) {
	const normalizedType = normalizeStructTag(tokenType);
	return deriveDynamicFieldID(getAccountId(packageConfig, address), `${packageConfig.packageId}::contra::TokenAccountKey<${normalizedType}>`, bcs.byteVector().serialize([]).toBytes());
}
/** Derive the shared `ConfidentialToken<tokenType>` object ID. */
function getConfidentialTokenId(packageConfig, tokenType) {
	const normalizedType = normalizeStructTag(tokenType);
	return deriveObjectID(packageConfig.tokenRegistryId, `${packageConfig.packageId}::contra::TokenKey<${normalizedType}>`, bcs.byteVector().serialize([]).toBytes());
}
/** Serialize a ristretto255 point into an on-chain `Element<G>`. */
function point(bytes) {
	return (tx) => tx.moveCall({
		target: `${SUI_FRAMEWORK_ADDRESS}::ristretto255::g_from_bytes`,
		arguments: [tx.pure.vector("u8", bytes)]
	});
}
/**
* Element encodings (points/scalars, 32 bytes each) as the `parts` argument for the generated
* `contra::decode` constructors, which validate every point via `g_from_bytes` and every scalar via
* `scalar_from_bytes` — byte-for-byte equivalent to building the value element-by-element, but in a
* single Move call.
*/
function elemParts(elems) {
	return elems.map((e) => Array.from(e));
}
/** Serialize `points` into an on-chain `vector<Element<G>>` via `decode::g_vector`. */
function buildGVector(packageId, points) {
	return gVector({
		package: packageId,
		arguments: { parts: elemParts(points.map((p) => p.toBytes())) }
	});
}
/** Serialize a `DdhTupleNizk` into an on-chain `DdhProof`. */
function buildDdhProof(packageId, proof) {
	return ddhProof({
		package: packageId,
		arguments: { parts: elemParts([
			proof.a.toBytes(),
			proof.b.toBytes(),
			numberToBytesLE(proof.z, 32)
		]) }
	});
}
/**
* Serialize a `BatchedDdhNizk` into an on-chain `BatchedDdhProof`. The byte layout is the per-pair
* Schnorr commitments followed by the trailing scalar response `z`, matching `decode::batched_ddh_proof`.
*/
function buildBatchedDdhProof(packageId, proof) {
	return batchedDdhProof({
		package: packageId,
		arguments: { parts: elemParts([...proof.commitments.map((c) => c.toBytes()), numberToBytesLE(proof.z, 32)]) }
	});
}
/** Serialize an `ElGamalNizk` consistency proof into an on-chain `ElGamalProof`. */
function buildElGamalProof(packageId, proof) {
	return elgamalProof({
		package: packageId,
		arguments: { parts: elemParts([
			proof.a.toBytes(),
			proof.b.toBytes(),
			numberToBytesLE(proof.z1, 32),
			numberToBytesLE(proof.z2, 32)
		]) }
	});
}
/**
* Serialize a Move call sequence that constructs a raw `EncryptedAmount`
* on chain from four ciphertext limbs (no range or consistency proof).
*/
function buildEncryptedAmount(packageId, limbs) {
	if (limbs.length !== 4) throw new InvalidArgumentError(`buildEncryptedAmount requires exactly 4 limbs, got ${limbs.length}`);
	return encryptedAmount({
		package: packageId,
		arguments: { parts: elemParts(limbs.flatMap((l) => [l.ciphertext.toBytes(), l.decryptionHandle.toBytes()])) }
	});
}
/**
* Maximum number of amounts a single Bulletproof chunk can cover. Sui's
* `rangeproofs::verify_bulletproofs_with_dst_ristretto255` caps the aggregated commitment count at 32 for
* 16-bit range proofs, and each amount contributes 4 limb commitments, so a chunk holds at most
* `32 / 4 = 8` amounts. Mirrors `MAX_BATCH_SIZE` in `encrypted_amount.move`.
*/
const MAX_BATCH_SIZE = 8;
/**
* Build a `WellFormedProof` covering a batch of `EncryptedAmount`s on chain via
* `encrypted_amount::new_well_formed_proof`. Sui's bulletproof aggregator requires the number of
* committed values to be a power of 2 and at most `MAX_BATCH_SIZE` amounts (= 32 commitments) per
* proof; we partition N amounts into power-of-2 chunks largest-first, capped at `MAX_BATCH_SIZE`
* (e.g. N=7 → [4, 2, 1]; N=20 → [8, 8, 4]). The on-chain verifier reconstructs the same partition
* from N, so no explicit sizes vector needs to be carried. The pk isn't stored in the proof; the
* consumer supplies a parallel `vector<Element<G>>` to `verify`, so callers must hand pks
* separately to whichever Move entry verifies the proof. `rangeDst` is the domain-separation tag
* bound into the Bulletproof transcript; it must equal the `range_dst` the Move entry passes to
* `encrypted_amount::verify` (the `DST_RANGE_PROOF` tag) — distinct from the `DST_ELGAMAL` tag the
* per-limb consistency proofs in `batch` were generated under.
*/
function buildWellFormedProof(batchRangeProver, rangeDst, packageId, batch) {
	const rangeProofs = [];
	let offset = 0;
	let remaining = batch.length;
	let chunkSize = MAX_BATCH_SIZE;
	while (remaining > 0) {
		while (remaining >= chunkSize) {
			const chunk = batch.slice(offset, offset + chunkSize);
			rangeProofs.push(Array.from(batchRangeProver(chunk.flatMap((amount) => amount.map((l) => l.value)), chunk.flatMap((amount) => amount.map((l) => l.blinding)), 16, rangeDst).proof));
			offset += chunkSize;
			remaining -= chunkSize;
		}
		chunkSize = Math.floor(chunkSize / 2);
	}
	return (tx) => newWellFormedProof({
		package: packageId,
		arguments: {
			rangeProofs,
			consistencyProofs: tx.makeMoveVec({
				type: `${packageId}::encrypted_amount::ConsistencyProof`,
				elements: batch.map((amount) => consistencyProof({
					package: packageId,
					arguments: { parts: elemParts(amount.flatMap((l) => [
						l.proof.a.toBytes(),
						l.proof.b.toBytes(),
						numberToBytesLE(l.proof.z1, 32),
						numberToBytesLE(l.proof.z2, 32)
					])) }
				})(tx))
			})
		}
	})(tx);
}
/**
* Single-amount convenience: build an on-chain `EncryptedAmount` paired with a batch-of-1
* `WellFormedProof` over those four limbs. Returns the two `TransactionResult`s so callers can
* pass them as adjacent arguments to a consumer that takes `(EncryptedAmount, WellFormedProof)` —
* `unwrap`, `update_active_balance`, `set_public_key`, or the sender's new-balance slot of
* `batched_transfer`. Takes `tx` directly rather than returning a `(tx) => ...` thunk because
* `tx.add` only accepts thunks that return a single `TransactionResult`.
*/
function buildEncryptedAmountAndProof(batchRangeProver, rangeDst, tx, packageId, limbs) {
	return {
		encryptedAmount: tx.add(buildEncryptedAmount(packageId, limbs.map((l) => l.ciphertext))),
		wellFormedProof: tx.add(buildWellFormedProof(batchRangeProver, rangeDst, packageId, [limbs]))
	};
}
/**
* Build a `MultiRecipientEncryption` on-chain from a TypeScript
* `MultiRecipientEncryption`. Calls `twisted_elgamal::new_multi_recipient_encryption`
* with the shared commitment and per-recipient decryption handles.
*/
function buildMultiRecipientEncryption(packageId, mrc) {
	return multiRecipientEncryption({
		package: packageId,
		arguments: {
			parts: elemParts([mrc.commitment.toBytes(), ...mrc.decryptionHandles.map((dh) => dh.toBytes())]),
			m: mrc.decryptionHandles.length
		}
	});
}
/**
* Build an `Option<KeyEncryption>` Move value. Returns `option::some` wrapping the
* `KeyEncryption` when provided, `option::none` otherwise.
*/
function buildKeyEncryptionOption(packageId, keyEncryption) {
	const optionType = [`${packageId}::auditors::KeyEncryption`];
	if (keyEncryption) return (tx) => tx.moveCall({
		target: "0x1::option::some",
		typeArguments: optionType,
		arguments: [buildKeyEncryption(packageId, keyEncryption)]
	});
	return (tx) => tx.moveCall({
		target: "0x1::option::none",
		typeArguments: optionType
	});
}
/**
* Build a `KeyEncryption` on-chain from a TypeScript `KeyEncryption` by calling
* `auditors::new_key_encryption` with the per-limb ciphertexts, the
* `KeyConsistencyProof`, and the serialized aggregate Bulletproof.
*/
function buildKeyEncryption(packageId, keyEncryption) {
	return (tx) => newKeyEncryption({
		package: packageId,
		arguments: {
			ciphertext: tx.makeMoveVec({
				type: `${packageId}::twisted_elgamal::MultiRecipientEncryption`,
				elements: keyEncryption.ciphertexts.map((mrc) => buildMultiRecipientEncryption(packageId, mrc))
			}),
			proof: buildKeyConsistencyProof(packageId, keyEncryption.proof),
			rangeProof: Array.from(keyEncryption.rangeProof)
		}
	})(tx);
}
/**
* Build a `KeyConsistencyProof` on-chain via `decode::key_consistency_proof`, passing the
* sigma-protocol fields as one flat list `[a1(8m) ‖ a2(8) ‖ a3(1) ‖ z1(8) ‖ z2(8)]` plus the
* recipient count `m` so the on-chain side can slice the variable-length `a1`.
*/
function buildKeyConsistencyProof(packageId, proof) {
	const m = proof.a1.length / 8;
	return keyConsistencyProof({
		package: packageId,
		arguments: {
			parts: elemParts([
				...proof.a1.map((p) => p.toBytes()),
				...proof.a2.map((p) => p.toBytes()),
				proof.a3.toBytes(),
				...proof.z1.map((s) => numberToBytesLE(s, 32)),
				...proof.z2.map((s) => numberToBytesLE(s, 32))
			]),
			m
		}
	});
}
//#endregion
export { buildBatchedDdhProof, buildDdhProof, buildElGamalProof, buildEncryptedAmount, buildEncryptedAmountAndProof, buildGVector, buildKeyEncryptionOption, buildWellFormedProof, dst, fiatShamirChallenge, getAccountId, getConfidentialTokenId, getTokenAccountId, newSessionId, point };
