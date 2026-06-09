import { InvalidArgumentError } from "./error.mjs";
import { TokenAccount, TokenAccountKey } from "./contracts/contra/contra.mjs";
import { Field } from "./contracts/sui/dynamic_field.mjs";
import { getTokenAccountId } from "./helpers.mjs";
import { limbsToScalar } from "./nizk.mjs";
import { MultiRecipientEncryption } from "./twisted_elgamal.mjs";
import { TokenAccount as TokenAccount$1 } from "./token_account.mjs";
//#region src/auditor.ts
/**
* Auditor SDK. Recovers a user's private key from the on-chain `verified_key_encryption` field
* of their `TokenAccount<T>`, returning a fully-keyed `TokenAccount` that
* can decrypt the user's balances and any event amounts encrypted to them.
*
* A set of auditor keys is versioned. The auditor needs to know one secret key for each version
* in order to decrypt all accounts.
*
* Previously registered user private keys can be recovered from NewRegistrationEvent and
* UpdatedPublicKeyEvent events.
*/
var ContraAuditor = class {
	#suiClient;
	#packageConfig;
	#tokenType;
	#table;
	#auditorKeyForVersion;
	constructor(options) {
		this.#suiClient = options.suiClient;
		this.#packageConfig = options.packageConfig;
		this.#tokenType = options.tokenType;
		this.#table = options.table;
		this.#auditorKeyForVersion = options.auditorKeyForVersion;
	}
	get tokenType() {
		return this.#tokenType;
	}
	/**
	* Decrypt the user's private key from a parsed `VerifiedKeyEncryption`.
	*
	* The input shape — `{ ciphertext: MultiRecipientEncryption[]; version: number }` —
	* matches the `verified_key_encryption` field on `TokenAccount<T>` (the current state)
	* **and** on `NewRegistrationEvent<T>` and `UpdatedPublicKeyEvent<T>`. Pass an event's
	* `verified_key_encryption` here to recover the user's private key as of the version
	* that was active at registration / key-rotation time — useful when tracking historical
	* state across `set_public_key` calls.
	*
	* @throws if `ciphertext` is empty (the user registered when no auditors were configured),
	* if this auditor has no record for `version`, or if the recorded `index` is out of range
	* for any per-limb ciphertext.
	*/
	recoverPrivateKey({ ciphertext, version }) {
		if (ciphertext.length === 0) throw new InvalidArgumentError(`Cannot recover private key: account was registered with no auditors (version ${version}).`);
		const entry = this.#auditorKeyForVersion.get(version);
		if (entry === void 0) throw new InvalidArgumentError(`Auditor has no record for version ${version}. Known versions: [${Array.from(this.#auditorKeyForVersion.keys()).sort((a, b) => a - b).join(", ")}].`);
		return limbsToScalar(ciphertext.map((mrc, i) => {
			if (entry.index >= mrc.decryptionHandles.length) throw new InvalidArgumentError(`Auditor index ${entry.index} out of range for limb ${i} (have ${mrc.decryptionHandles.length} recipients) at version ${version}.`);
			return mrc.decrypt(entry.index, entry.privateKey, this.#table);
		}));
	}
	/**
	* Fetch the on-chain `TokenAccount<tokenType>` belonging to `address`, decrypt the user's
	* private key from `verified_key_encryption`, and return a fully-keyed `TokenAccount`.
	*
	* The returned `TokenAccount` can be used with `ContraClient.getBalance` to read the user's
	* balance, or with `TokenAccount.decryptAmount` / `EncryptedAmount.decrypt` to read amounts
	* from event payloads.
	*
	* @throws on the same conditions as `recoverPrivateKey`.
	*/
	async getTokenAccount(address) {
		const tokenAccountId = getTokenAccountId(this.#packageConfig, address, this.#tokenType);
		const { object } = await this.#suiClient.core.getObject({
			objectId: tokenAccountId,
			include: { content: true }
		});
		const parsed = TokenAccountField.parse(object.content).value;
		const verified = {
			ciphertext: parsed.verified_key_encryption.ciphertext.map((raw) => MultiRecipientEncryption.fromBcs(raw)),
			version: parsed.verified_key_encryption.version
		};
		const privateKey = this.recoverPrivateKey(verified);
		return new TokenAccount$1(address, this.#tokenType, this.#packageConfig, privateKey);
	}
};
const TokenAccountField = Field(TokenAccountKey, TokenAccount);
//#endregion
export { ContraAuditor };
