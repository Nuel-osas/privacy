import { RistrettoPoint } from "./ristretto255.mjs";
import { Ciphertext, DiscreteLogTable, EncryptedAmount, PrivateKey, PublicKey } from "./twisted_elgamal.mjs";
import { DdhTupleNizk } from "./nizk.mjs";
import { ContraPackageConfig } from "./types.mjs";

//#region src/token_account.d.ts
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
declare class TokenAccount {
  #private;
  readonly address: string;
  readonly tokenType: string;
  readonly privateKey: PrivateKey;
  constructor(address: string, tokenType: string, packageConfig: ContraPackageConfig, privateKey?: PrivateKey);
  /** Derive the public key as `G * privateKey`. */
  get publicKey(): PublicKey;
  /**
   * 21-byte Fiat-Shamir domain-separation tag (DST) for `protocolId` on this
   * (address, tokenType) account: `TokenAccount<tokenType>.id.bytes[..20] ‖ protocolId`.
   */
  dst(protocolId: number): Uint8Array;
  /**
   * Decrypt an `EncryptedAmount` using this account's private key,
   * returning the underlying u64 plaintext as a `bigint`.
   *
   * Convenience wrapper over `EncryptedAmount.decrypt(privateKey, table)`.
   */
  decryptAmount(encryptedAmount: EncryptedAmount, table: DiscreteLogTable): bigint;
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
  decryptWithProof(ciphertext: Ciphertext, table: DiscreteLogTable): {
    value: bigint;
    proof: DdhTupleNizk;
  };
  /**
   * Recover an outgoing batched-transfer amount this account sent, from the
   * on-chain `TransferEvent`, without any sender-keyed decryption handle.
   */
  recoverSentAmount(encryptedAmount: EncryptedAmount, seedPoint: RistrettoPoint, batchIndex: number, table: DiscreteLogTable): bigint;
}
//#endregion
export { TokenAccount };