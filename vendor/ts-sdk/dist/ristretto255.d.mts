//#region src/ristretto255.d.ts
/**
 * Structural interface for a ristretto255 point, covering the subset of the
 * `@noble/curves` `_RistrettoPoint` API that this SDK uses. A dedicated
 * interface is used (rather than `InstanceType<typeof ristretto255.Point>`)
 * because the underlying class has protected members that can't appear in
 * emitted `.d.ts` files.
 */
interface RistrettoPoint {
  readonly x: bigint;
  readonly y: bigint;
  add(other: RistrettoPoint): RistrettoPoint;
  subtract(other: RistrettoPoint): RistrettoPoint;
  /** Constant-time, rejects 0 as input. */
  multiply(scalar: bigint): RistrettoPoint;
  /** Not constant-time (faster), accepts 0 as input. */
  multiplyUnsafe(scalar: bigint): RistrettoPoint;
  double(): RistrettoPoint;
  equals(other: RistrettoPoint): boolean;
  toBytes(): Uint8Array;
  /**
   * Register a wNAF window size for this point so subsequent `multiply`
   * / `multiplyUnsafe` calls use a precomputed table. Without this the
   * default `W = 1` falls back to a plain double-and-add ladder.
   */
  precompute(windowSize?: number, isLazy?: boolean): RistrettoPoint;
}
/** The ristretto255 prime-order group's standard base point. */
declare const G: RistrettoPoint;
/**
 * Deserialize a compressed ristretto255 point from its on-chain BCS
 * encoding.
 */
declare function pointFromBcs(element: {
  bytes: number[];
}): RistrettoPoint;
/** Generate a uniformly random scalar. */
declare function randomScalar(): bigint;
/**
 * Serialize a ristretto255 scalar as 32 little-endian bytes.
 * Throws if `s` is not a canonical element of the ristretto255 scalar field.
 */
declare function scalarToBytes(s: bigint): Uint8Array;
//#endregion
export { G, RistrettoPoint, pointFromBcs, randomScalar, scalarToBytes };