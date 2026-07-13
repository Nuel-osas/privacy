import { G, assertNonZeroScalar, mul, randomScalar } from "./ristretto255.mjs";
import { dst, newSessionId } from "./helpers.mjs";
import { recoverTransferRandomness } from "./transfer_randomness.mjs";
//#region src/token_account.ts
/**
* Represents a per-(address, tokenType) token account on the client
* side. Holds the owner's address, the token type, the deployment
* package config, and the twisted ElGamal private key used for
* on-chain encryption/decryption.
*
* The public key is derived on the fly as `G * privateKey` when
* needed, so only the scalar private key is stored.
*
* If no `privateKey` is supplied at construction time, a fresh one is
* generated automatically.
*/
var TokenAccount = class {
	#packageConfig;
	constructor(address, tokenType, packageConfig, privateKey) {
		this.address = address;
		this.tokenType = tokenType;
		this.#packageConfig = packageConfig;
		if (privateKey !== void 0) assertNonZeroScalar(privateKey);
		this.privateKey = privateKey ?? randomScalar();
	}
	/** Derive the public key as `G * privateKey`. */
	get publicKey() {
		return mul(G, this.privateKey);
	}
	/**
	* 21-byte Fiat-Shamir domain-separation tag (DST) for `protocolId` on this
	* (address, tokenType) account: `TokenAccount<tokenType>.id.bytes[..20] ‖ protocolId`.
	*/
	dst(protocolId) {
		return dst(newSessionId(this.#packageConfig, this.address, this.tokenType), protocolId);
	}
	/**
	* Decrypt an `EncryptedAmount` using this account's private key,
	* returning the underlying u64 plaintext as a `bigint`.
	*
	* Convenience wrapper over `EncryptedAmount.decrypt(privateKey, table)`.
	*/
	decryptAmount(encryptedAmount, table) {
		return encryptedAmount.decrypt(this.privateKey, table);
	}
	/**
	* Decrypt a single `Ciphertext` and produce a zero-knowledge proof
	* that the returned `value` is its plaintext under this account's
	* key pair.
	*
	* The verifier reconstructs the DST as
	* `verifiedDecDst = dst(newSessionId(packageConfig, address, tokenType), PROTOCOL_VERIFIED_DEC)`
	* and checks the proof with
	* `ciphertext.verifyDecryption(verifiedDecDst, publicKey, value, proof)`.
	*/
	decryptWithProof(ciphertext, table) {
		const value = ciphertext.decrypt(this.privateKey, table);
		const verifiedDecDst = this.dst(100);
		return {
			value,
			proof: ciphertext.proveDecryption(verifiedDecDst, this.privateKey, this.publicKey, value)
		};
	}
	/**
	* Recover an outgoing batched-transfer amount this account sent, from the
	* on-chain `TransferEvent`, without any sender-keyed decryption handle.
	*/
	recoverSentAmount(encryptedAmount, seedPoint, batchIndex, table) {
		const randomness = recoverTransferRandomness(this.privateKey, seedPoint);
		return encryptedAmount.decryptWithBlindings((limbIndex) => randomness.blinding(batchIndex, limbIndex), table);
	}
};
//#endregion
export { TokenAccount };
