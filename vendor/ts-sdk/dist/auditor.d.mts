import { PrivateKey, PublicKey } from "./twisted_elgamal.mjs";
import { ContraAuditorOptions, VerifiedKeyEncryption } from "./types.mjs";
import { TokenAccount } from "./token_account.mjs";

//#region src/auditor.d.ts
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
declare class ContraAuditor {
  #private;
  constructor(options: ContraAuditorOptions);
  get tokenType(): string;
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
   * `expectedPk` should be the account/event public key from the same object or event.
   *
   * @throws if `ciphertext` is empty (the user registered when no auditors were configured),
   * if this auditor has no record for `version`, if the recorded `index` is out of range for any per-limb
   * ciphertext, or if the recovered key does not match `expectedPk`.
   */
  recoverPrivateKey({
    ciphertext,
    version
  }: VerifiedKeyEncryption, expectedPk: PublicKey): PrivateKey;
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
  getTokenAccount(address: string): Promise<TokenAccount>;
}
//#endregion
export { ContraAuditor };