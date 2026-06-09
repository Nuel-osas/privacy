import { RistrettoPoint } from "./ristretto255.mjs";
import { DdhTupleNizk, ElGamalNizk } from "./nizk.mjs";

//#region src/twisted_elgamal.d.ts
type PublicKey = RistrettoPoint;
type PrivateKey = bigint;
/**
 * Compute the raw table entries (truncated x-coordinate → index pairs)
 * for a given numBits. This is a pure function that can run in a web
 * worker. Returns a flat Uint32Array of [key, value, key, value, ...]
 * pairs that can be transferred to the main thread.
 */
declare function computeTableEntries(numBits: number): Uint32Array;
/**
 * Precomputed discrete-log table for ristretto255. Stores sequential
 * multiples of H keyed by truncated 4-byte Edwards x-coordinates,
 * with verification by scalar multiplication to guard against collisions.
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
declare class DiscreteLogTable {
  #private;
  readonly numBits: number;
  readonly tableSize: number;
  readonly giantStep: RistrettoPoint;
  static readonly MAX_CACHE_SIZE = 1024;
  private constructor();
  /** Compute the table synchronously (convenience for tests / Node). */
  static create(numBits?: number): DiscreteLogTable;
  /** Construct from pre-computed entries (e.g. from a web worker). */
  static fromEntries(numBits: number, entries: Uint32Array): DiscreteLogTable;
  /**
   * Look up a point in the cache or precomputed table. Returns the
   * baby-step value (table index) if matched, `undefined` otherwise.
   * The caller adds the giant-step offset.
   */
  lookup(point: RistrettoPoint): {
    value: bigint;
    cached: boolean;
  } | undefined;
}
/**
 * A twisted ElGamal encryption — `ciphertext = r*G + m*H` and
 * `decryptionHandle = r*pk` — of a u16 value (decryptable up to ~2^32).
 *
 * The two fields match the `contra::twisted_elgamal::Encryption` Move
 * struct. Use `Ciphertext.fromBcs` to lift the raw shape produced by the
 * generated `twisted_elgamal.Encryption` BCS schema into a `Ciphertext`.
 */
declare class Ciphertext {
  ciphertext: RistrettoPoint;
  decryptionHandle: RistrettoPoint;
  constructor(ciphertext: RistrettoPoint, decryptionHandle: RistrettoPoint);
  static encryptWithBlinding(pk: PublicKey, value: bigint, blinding: bigint): {
    ciphertext: Ciphertext;
    blinding: bigint;
  };
  static encrypt(pk: PublicKey, value: bigint): {
    ciphertext: Ciphertext;
    blinding: bigint;
  };
  /**
   * Encrypt a value under `pk` and generate an ElGamal consistency proof.
   * `blinding` defaults to a fresh random scalar; pass it explicitly to
   * re-key an existing amount while keeping the same per-limb commitment.
   */
  static encryptWithConsistencyProof(dst: Uint8Array, pk: PublicKey, value: bigint): {
    ciphertext: Ciphertext;
    blinding: bigint;
    proof: ElGamalNizk;
  };
  /**
   * Prove that this ciphertext encrypts zero under the given key pair.
   * Returns a `DdhTupleNizk` proving `decryptionHandle = sk * ciphertext`.
   */
  proveIsZero(dst: Uint8Array, sk: PrivateKey, pk: PublicKey): DdhTupleNizk;
  /**
   * Prove that this ciphertext decrypts to `value` under the key pair
   * `(sk, pk)`, without revealing `sk`.
   */
  proveDecryption(dst: Uint8Array, sk: PrivateKey, pk: PublicKey, value: bigint): DdhTupleNizk;
  /**
   * Verify a `proveDecryption` proof: returns `true` iff `proof`
   * demonstrates that this ciphertext decrypts to `value` under the
   * secret key corresponding to `pk`.
   */
  verifyDecryption(dst: Uint8Array, pk: PublicKey, value: bigint, proof: DdhTupleNizk): boolean;
  /**
   * Construct a `Ciphertext` from the BCS-decoded shape produced by the
   * generated `twisted_elgamal.Encryption` schema.
   */
  static fromBcs(raw: {
    ciphertext: {
      bytes: number[];
    };
    decryption_handle: {
      bytes: number[];
    };
  }): Ciphertext;
  /** Trivial encryption of `value` with zero blinding: `(value*H, identity)`. */
  static trivial(value: bigint): Ciphertext;
  /** Component-wise addition of two ciphertexts. */
  add(other: Ciphertext): Ciphertext;
  /** Component-wise subtraction. */
  subtract(other: Ciphertext): Ciphertext;
  /** Scalar-multiply both components by `2^bits`. */
  shiftLeft(bits: number): Ciphertext;
  /**
   * Decrypt this ciphertext under `privateKey`, recovering the
   * underlying plaintext via baby-step giant-step over `table`.
   * Throws {@link DecryptionFailedError} if the plaintext is outside
   * the table's `2^(2 * numBits)` range or the key is wrong.
   */
  decrypt(privateKey: PrivateKey, table: DiscreteLogTable): bigint;
  /**
   * Like {@link decrypt}, but takes a precomputed scalar-field inverse
   * of the private key so that callers decrypting many ciphertexts
   * under the same key invert once and reuse the result.
   */
  decryptWithInverse(privateKeyInverse: bigint, table: DiscreteLogTable): bigint;
}
/**
 * Four twisted ElGamal ciphertext limbs that together represent an
 * on-chain `contra::encrypted_amount::EncryptedAmount`. The underlying
 * plaintext is `l0 + 2^16 * l1 + 2^32 * l2 + 2^48 * l3`.
 */
declare class EncryptedAmount {
  l0: Ciphertext;
  l1: Ciphertext;
  l2: Ciphertext;
  l3: Ciphertext;
  constructor(l0: Ciphertext, l1: Ciphertext, l2: Ciphertext, l3: Ciphertext);
  /**
   * Construct an `EncryptedAmount` from the BCS-decoded shape produced by the generated
   * `encrypted_amount.EncryptedAmount` schema.
   */
  static fromBcs(raw: {
    l0: {
      ciphertext: {
        bytes: number[];
      };
      decryption_handle: {
        bytes: number[];
      };
    };
    l1: {
      ciphertext: {
        bytes: number[];
      };
      decryption_handle: {
        bytes: number[];
      };
    };
    l2: {
      ciphertext: {
        bytes: number[];
      };
      decryption_handle: {
        bytes: number[];
      };
    };
    l3: {
      ciphertext: {
        bytes: number[];
      };
      decryption_handle: {
        bytes: number[];
      };
    };
  }): EncryptedAmount;
  /**
   * Trivially encrypt `value` with zero blinding, splitting it into
   * four u16 limbs. Matches the on-chain `from_value` helper.
   */
  static trivial(value: bigint): EncryptedAmount;
  /**
   * Combine the four limbs into a single `Ciphertext` encoding the
   * full u64 value, matching the on-chain
   * `EncryptedAmount::to_encryption()`.
   */
  collapse(): Ciphertext;
  /**
   * Decrypt all four limbs and combine into the underlying u64
   * plaintext. Each limb is decrypted independently and shifted
   * into place: `l0 + 2^16 * l1 + 2^32 * l2 + 2^48 * l3`.
   */
  decrypt(privateKey: PrivateKey, table: DiscreteLogTable): bigint;
}
/**
 * A Twisted ElGamal ciphertext encrypted to multiple recipients.
 * All recipients share the same Pedersen commitment `C = r*G + m*H`;
 * each recipient j gets their own decryption handle `D_j = r * pk_j`.
 *
 */
declare class MultiRecipientEncryption {
  #private;
  commitment: RistrettoPoint;
  decryptionHandles: RistrettoPoint[];
  constructor(commitment: RistrettoPoint, decryptionHandles: RistrettoPoint[]);
  /**
   * Encrypt `value` to all `recipientKeys` using the provided shared blinding `r`.
   */
  static encrypt(recipientKeys: PublicKey[], value: bigint, blinding: bigint): MultiRecipientEncryption;
  /**
   * Construct a `MultiRecipientEncryption` from the BCS-decoded shape produced
   * by the generated `twisted_elgamal.MultiRecipientEncryption` schema.
   */
  static fromBcs(raw: {
    ciphertext: {
      bytes: number[];
    };
    decryption_handles: {
      bytes: number[];
    }[];
  }): MultiRecipientEncryption;
  /**
   * Decrypt this ciphertext for recipient at `index` using `privateKey`.
   */
  decrypt(index: number, privateKey: PrivateKey, table: DiscreteLogTable): bigint;
}
//#endregion
export { Ciphertext, DiscreteLogTable, EncryptedAmount, MultiRecipientEncryption, PrivateKey, PublicKey, computeTableEntries };