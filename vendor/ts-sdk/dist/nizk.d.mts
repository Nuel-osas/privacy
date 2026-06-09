import { RistrettoPoint } from "./ristretto255.mjs";
import { Ciphertext, MultiRecipientEncryption } from "./twisted_elgamal.mjs";

//#region src/nizk.d.ts
/**
 * Non-interactive zero-knowledge proof of a DDH tuple.
 *
 * Proves knowledge of `x` such that `xG = x * g` and `xH = x * h`.
 * Layout matches the on-chain `contra::nizk::DdhProof` struct.
 */
declare class DdhTupleNizk {
  a: RistrettoPoint;
  b: RistrettoPoint;
  z: bigint;
  constructor(a: RistrettoPoint, b: RistrettoPoint, z: bigint);
  static prove(dst: Uint8Array, x: bigint, g: RistrettoPoint, h: RistrettoPoint, xG: RistrettoPoint, xH: RistrettoPoint): DdhTupleNizk;
  verify(dst: Uint8Array, g: RistrettoPoint, h: RistrettoPoint, xG: RistrettoPoint, xH: RistrettoPoint): boolean;
}
/**
 * Non-interactive zero-knowledge proof that a twisted ElGamal
 * ciphertext `(c, d)` is well-formed: proves knowledge of `r` and `m`
 * such that `c = r*g + m*h` and `d = r*pk`.
 *
 * Layout matches the on-chain `contra::nizk::ElGamalProof` struct.
 */
declare class ElGamalNizk {
  a: RistrettoPoint;
  b: RistrettoPoint;
  z1: bigint;
  z2: bigint;
  constructor(a: RistrettoPoint, b: RistrettoPoint, z1: bigint, z2: bigint);
  /**
   * Prove that `encryption` is a valid twisted ElGamal encryption of
   * `amount` under `pk` with blinding `blinding`. The bases `g, h` are the
   * canonical Twisted ElGamal generators — fixed by the protocol, not a
   * parameter.
   */
  static prove(dst: Uint8Array, blinding: bigint, amount: bigint, encryption: Ciphertext, pk: RistrettoPoint): ElGamalNizk;
}
/**
 * Split a 256-bit scalar into eight u32 limbs in little-endian order,
 * matching Move's `nizk::scalar_to_limbs`.
 */
declare function scalarToLimbs(scalar: bigint): bigint[];
/**
 * Reassemble eight u32 limbs (little-endian) into a 256-bit scalar.
 * Inverse of `scalarToLimbs`.
 */
declare function limbsToScalar(limbs: bigint[]): bigint;
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
declare class KeyConsistencyProof {
  a1: RistrettoPoint[];
  a2: RistrettoPoint[];
  a3: RistrettoPoint;
  z1: bigint[];
  z2: bigint[];
  constructor(a1: RistrettoPoint[], a2: RistrettoPoint[], a3: RistrettoPoint, z1: bigint[], z2: bigint[]);
  /**
   * Prove that `ciphertexts` correctly encrypts the 32-bit limbs of the sender's private key
   * to all `recipientEncryptionKeys`.
   */
  static prove(dst: Uint8Array, senderPrivateKeyLimbs: bigint[], senderPublicKey: RistrettoPoint, recipientEncryptionKeys: RistrettoPoint[], ciphertexts: MultiRecipientEncryption[], blindings: bigint[]): KeyConsistencyProof;
  /**
   * Verify the proof against the sender's public key, the recipient encryption keys,
   * and the per-limb ciphertexts.
   */
  verify(dst: Uint8Array, senderPublicKey: RistrettoPoint, recipientEncryptionKeys: RistrettoPoint[], ciphertexts: MultiRecipientEncryption[]): boolean;
}
//#endregion
export { DdhTupleNizk, ElGamalNizk, KeyConsistencyProof, limbsToScalar, scalarToLimbs };