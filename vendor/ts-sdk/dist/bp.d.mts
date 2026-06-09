import { RistrettoPoint } from "./ristretto255.mjs";

//#region src/bp.d.ts
/** Bit-length options supported by `fastcrypto::bulletproofs::Range`. */
type RangeBits = 8 | 16 | 32 | 64;
/**
 * Bound, ready-to-call bulletproof functions returned by `getBulletproofs()`.
 * Synchronous — the WASM module is already initialized once the factory's
 * promise resolves, mirroring `@mysten/walrus-wasm`'s `getWasmBindings`.
 */
interface Bulletproofs {
  /**
   * Aggregate range proof that every `values[i]` lies in `[0, 2^bitSize)`.
   *
   * `values.length` must be a positive power of 2 and equal `blindings.length`.
   * Blindings are ristretto255 scalars (use `randomScalar()` from
   * `./ristretto255.js`). Returns the serialized proof and the per-value
   * Pedersen commitments in input order, compatible with fastcrypto.
   */
  batchRangeProver(values: bigint[], blindings: bigint[], bitSize: RangeBits): {
    proof: Uint8Array;
    commitments: RistrettoPoint[];
  };
  /**
   * Verify an aggregate range proof that every `commitments[i]` encodes a
   * value in `[0, 2^bitSize)`. Compatible with fastcrypto's bulletproofs.
   */
  verifyBatchRangeProof(proof: Uint8Array, commitments: RistrettoPoint[], bitSize: RangeBits): boolean;
}
/** A bound `batchRangeProver` function, injected into the proof-building helpers. */
type BatchRangeProver = Bulletproofs['batchRangeProver'];
//#endregion
export { BatchRangeProver };