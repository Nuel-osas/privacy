//#region src/error.ts
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
var ContraError = class extends Error {};
/** The SDK was called with an invalid argument. */
var InvalidArgumentError = class extends ContraError {};
/** Trying to spend more than the available (active or total) balance. */
var InsufficientBalanceError = class extends ContraError {
	constructor(amount, spendable, scope) {
		super(`Insufficient balance: trying to spend ${amount} but ${scope} balance is ${spendable}.`);
		this.amount = amount;
		this.spendable = spendable;
		this.scope = scope;
	}
};
/**
* One or more transfer recipients cannot accept encrypted deposits — either they
* have explicitly paused them, or their account is frozen.
*/
var ReceiverDoesNotAcceptDepositsError = class extends ContraError {
	constructor(addresses) {
		super(`Receivers do not accept encrypted deposits: ${addresses.join(", ")}.`);
		this.addresses = addresses;
	}
};
/**
* An operation requires the account's encrypted deposits to be paused
* (`acceptsEncryptedDeposits === false`), but they are currently enabled.
* Call `pauseAccount` first, then retry.
*/
var DepositsMustBePausedError = class extends ContraError {
	constructor(address) {
		super(`Account ${address} must have encrypted deposits paused; call pauseAccount first.`);
		this.address = address;
	}
};
/** A `TokenAccount<T>` object does not exist on chain for the given owner. */
var TokenAccountDoesNotExistError = class extends ContraError {
	constructor(address, cause) {
		super(`Token account does not exist for ${address}: ${cause}`);
		this.address = address;
		this.cause = cause;
	}
};
/** An invariant inside the SDK was violated. */
var ContraInternalError = class extends ContraError {};
/** Discrete-log search exhausted the table — wrong key or plaintext out of range. */
var DecryptionFailedError = class extends ContraError {
	constructor(numBits) {
		super(`Decryption failed: no plaintext found in the table's 2^${numBits * 2} range (wrong key or plaintext exceeds range).`);
		this.numBits = numBits;
	}
};
//#endregion
export { ContraError, ContraInternalError, DecryptionFailedError, DepositsMustBePausedError, InsufficientBalanceError, InvalidArgumentError, ReceiverDoesNotAcceptDepositsError, TokenAccountDoesNotExistError };
