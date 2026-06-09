//#region src/error.d.ts
/**
 * Error taxonomy for the SDK. Every error the SDK raises itself extends
 * {@link ContraError}, and falls into one of five categories:
 *
 * 1. SDK invariant violations (i.e., a bug in the SDK) — {@link ContraInternalError}.
 * 2. Invalid caller arguments — {@link InvalidArgumentError}.
 * 3. Chain/account-state conditions — explicit error types.
 * 4. Cryptographic/runtime failures — explicit error types.
 * 5. Errors originating from RPC calls (timeouts, transport failures, etc.)
 *    are not wrapped but propagate to the caller untouched.
 *
 * Note: the SDK only *builds* transactions; it does not execute them. A
 * transaction returned by the SDK may still abort on chain with a Move error
 * code from the contract (e.g. a failed proof verification or a state change
 * between build and execution). Those aborts surface through the caller's
 * execution path, not as {@link ContraError}s.
 */
declare class ContraError extends Error {}
/** The SDK was called with an invalid argument. */
declare class InvalidArgumentError extends ContraError {}
/** Trying to spend more than the available (active or total) balance. */
declare class InsufficientBalanceError extends ContraError {
  readonly amount: bigint;
  readonly spendable: bigint;
  readonly scope: 'active' | 'total';
  constructor(amount: bigint, spendable: bigint, scope: 'active' | 'total');
}
/**
 * One or more transfer recipients cannot accept encrypted deposits — either they
 * have explicitly paused them, or their account is frozen.
 */
declare class ReceiverDoesNotAcceptDepositsError extends ContraError {
  readonly addresses: readonly string[];
  constructor(addresses: readonly string[]);
}
/**
 * An operation requires the account's encrypted deposits to be paused
 * (`acceptsEncryptedDeposits === false`), but they are currently enabled.
 * Call `pauseAccount` first, then retry.
 */
declare class DepositsMustBePausedError extends ContraError {
  readonly address: string;
  constructor(address: string);
}
/** A `TokenAccount<T>` object does not exist on chain for the given owner. */
declare class TokenAccountDoesNotExistError extends ContraError {
  readonly address: string;
  readonly cause: string;
  constructor(address: string, cause: string);
}
/** An invariant inside the SDK was violated. */
declare class ContraInternalError extends ContraError {}
/** Discrete-log search exhausted the table — wrong key or plaintext out of range. */
declare class DecryptionFailedError extends ContraError {
  readonly numBits: number;
  constructor(numBits: number);
}
//#endregion
export { ContraError, ContraInternalError, DecryptionFailedError, DepositsMustBePausedError, InsufficientBalanceError, InvalidArgumentError, ReceiverDoesNotAcceptDepositsError, TokenAccountDoesNotExistError };