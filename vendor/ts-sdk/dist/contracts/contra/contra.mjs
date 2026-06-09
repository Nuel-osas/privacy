import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";
import { MoveEnum, MoveStruct, MoveTuple, normalizeMoveArguments } from "../utils/index.mjs";
import { Element } from "./deps/sui/group_ops.mjs";
import { Auditors, VerifiedKeyEncryption } from "./auditors.mjs";
import { EncryptedAmount } from "./encrypted_amount.mjs";
import { EncryptedBalance, EncryptedCoin, PublicCoin } from "./balance.mjs";
import { VecSet } from "./deps/sui/vec_set.mjs";
import { Policy } from "./policy.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/contra.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
/**
* Confidential transfers on Sui.
*
* Enables token transfers where amounts are encrypted using twisted ElGamal
* encryption while remaining verifiable through zero-knowledge proofs.
*
* ## Key Flows for the Token Issuer of public token type `T`:
*
* 1.  Create a new confidential token for a token type `T` (using the
*     TreasuryCap), optionally with an initial set of auditor public keys.
*     Creation returns a `ManagementCap<T>`.
* 2.  Set the freeze admins who can freeze the token globally or specific accounts
*     (via the ManagementCap). Those admins may monitor the confidential token and
*     freeze it or individual accounts if necessary.
* 3.  Unfreeze the token globally or a specific account (using the TreasuryCap).
* 4.  Set the balance of an account directly, to emulate burn/seize (using the
*     TreasuryCap).
* 5.  Freeze specific accounts via the token's deny list, using
*     `sui::coin::deny_list_v2_add` / `sui::coin::deny_list_v2_remove`. The deny
*     list affects both the public and the private coin; to freeze only the
*     private coin, see items 2 and 3.
* 6.  Rotate or disable the auditor key set via `update_auditors` (using the
*     ManagementCap). Setting `bump_recommended_min` raises the auditors'
*     `recommended_min_version` to the new version, signalling to wallets that
*     every user should refresh their key. Passing an empty `public_keys` vector
*     disables the auditor flow.
* 7.  [Advanced] Set the policy for the confidential token (using the
*     TreasuryCap). Policies define which operations are permissioned. Currently
*     supported permissioned operations are:
*     - `register`: Register a token account for a token type `T`. E.g., caller
*       ensures the user is KYCed before registering an account. When set, also
*       setting the public key for an account is permissioned.
*     - `wrap`: Wrap a public coin into a private balance. E.g., caller ensures
*       the funds passed screening before wrapping.
*     - `unwrap`: Unwrap a private balance into a public coin. E.g., caller
*       enforces rate limit on exiting the system. Additional permissioned
*       operations may be added in the future. Permissioned operations are
*       customized flows that should be implemented by the issuer's contract, and
*       may not be supported by all clients/wallets. The default policy is fully
*       permissionless.
*
* ## Key Flows for Users:
*
* 1.  Create an account for an address (needed once for all token types).
* 2.  Register a token account for a token type `T` with a public key `pk`. If the
*     token has auditors configured, the user must additionally provide the user's
*     key encrypted to every auditor public key in the current set, and a proof
*     that the ciphertext encrypts its secret key.
* 3.  Update the public key for a token account.
* 4.  Wrap a public coin into a confidential token, adding to the pending
*     encrypted balance of an account.
* 5.  Transfer an encrypted amount to two or more token accounts.
* 6.  Unwrap an encrypted amount from a token account and convert it to public
*     coins.
*
* ## Authentication:
*
* Some functions require authorization via an `&Auth<T>` argument. The `Auth<T>`
* is passed by reference, so a single one can authorize multiple calls in the same
* PTB (e.g. `merge` then `unwrap`). Under the default permissionless policy any
* `Auth<T>` is accepted; permissioning narrows which constructors produce a valid
* `Auth<T>`. The caller constructs the `Auth<T>` via one of three constructors:
*
* - `authorize_as_sender`: authenticates `ctx.sender()`. The standard path for
*   end-user wallets and permissionless operations.
* - `authorize_as_object`: authenticates the address derived from a given object's
*   `UID`. Use this when access is controlled by a Move object (the holder of
*   `&mut UID` proves ownership).
* - `authorize_with_witness`: authenticates `owner` under a witness `W` required
*   by the policy. Use this to implement custom permissioned operations: the
*   issuer's contract holds `W`, performs its own checks (e.g. KYC, screening,
*   rate limiting), and creates an `Auth<T>` for the requested operation.
*/
var contra_exports = /* @__PURE__ */ __exportAll({
	Account: () => Account,
	AccountKey: () => AccountKey,
	AccountRegistry: () => AccountRegistry,
	ConfidentialToken: () => ConfidentialToken,
	ManagementCap: () => ManagementCap,
	Pool: () => Pool,
	PoolKey: () => PoolKey,
	TokenAccount: () => TokenAccount,
	TokenAccountKey: () => TokenAccountKey,
	TokenKey: () => TokenKey,
	TokenRegistry: () => TokenRegistry,
	TransferBatch: () => TransferBatch,
	accountFreeze: () => accountFreeze,
	accountUnfreeze: () => accountUnfreeze,
	addToBatch: () => addToBatch,
	authorizeAsObject: () => authorizeAsObject,
	authorizeAsSender: () => authorizeAsSender,
	authorizeWithWitness: () => authorizeWithWitness,
	batchedTransfer: () => batchedTransfer,
	finalize: () => finalize,
	globalFreeze: () => globalFreeze,
	globalUnfreeze: () => globalUnfreeze,
	issueFreezeCap: () => issueFreezeCap,
	merge: () => merge,
	newAccount: () => newAccount,
	newConfidentialToken: () => newConfidentialToken,
	owner: () => owner,
	register: () => register,
	revokeFreezeCap: () => revokeFreezeCap,
	setAcceptsEncryptedDeposits: () => setAcceptsEncryptedDeposits,
	setBalanceByIssuer: () => setBalanceByIssuer,
	setPolicy: () => setPolicy,
	setPublicKey: () => setPublicKey,
	shareAccount: () => shareAccount,
	shareConfidentialToken: () => shareConfidentialToken,
	tryFinalize: () => tryFinalize,
	trySetPublicKeyAndUnpause: () => trySetPublicKeyAndUnpause,
	tryUnwrap: () => tryUnwrap,
	unwrap: () => unwrap,
	updateActiveBalance: () => updateActiveBalance,
	updateAuditors: () => updateAuditors,
	wrap: () => wrap
});
const $moduleName = "@local-pkg/contra::contra";
const TokenRegistry = new MoveStruct({
	name: `${$moduleName}::TokenRegistry`,
	fields: { id: bcs.Address }
});
const AccountRegistry = new MoveStruct({
	name: `${$moduleName}::AccountRegistry`,
	fields: { id: bcs.Address }
});
const ConfidentialToken = new MoveStruct({
	name: `${$moduleName}::ConfidentialToken<phantom T>`,
	fields: {
		id: bcs.Address,
		is_active: bcs.bool(),
		freeze_admins: VecSet(bcs.Address),
		policy: bcs.option(Policy),
		auditors: Auditors
	}
});
const Pool = new MoveStruct({
	name: `${$moduleName}::Pool<phantom T>`,
	fields: { id: bcs.Address }
});
const Account = new MoveStruct({
	name: `${$moduleName}::Account`,
	fields: {
		id: bcs.Address,
		owner: bcs.Address
	}
});
const TokenAccount = new MoveStruct({
	name: `${$moduleName}::TokenAccount<phantom T>`,
	fields: {
		pk: Element,
		verified_key_encryption: VerifiedKeyEncryption,
		session_id: bcs.vector(bcs.u8()),
		is_frozen: bcs.bool(),
		accepts_deposits: bcs.bool(),
		active: EncryptedBalance,
		pending: EncryptedBalance,
		public_balance: PublicCoin
	}
});
const TokenKey = new MoveTuple({
	name: `${$moduleName}::TokenKey<phantom T>`,
	fields: [bcs.bool()]
});
const PoolKey = new MoveTuple({
	name: `${$moduleName}::PoolKey`,
	fields: [bcs.bool()]
});
const TokenAccountKey = new MoveTuple({
	name: `${$moduleName}::TokenAccountKey<phantom T>`,
	fields: [bcs.bool()]
});
const AccountKey = new MoveTuple({
	name: `${$moduleName}::AccountKey`,
	fields: [bcs.Address]
});
const ManagementCap = new MoveStruct({
	name: `${$moduleName}::ManagementCap<phantom T>`,
	fields: { id: bcs.Address }
});
/**
* State machine for batched transfers from a single sender to multiple receivers.
* Created by `batched_transfer`, consumed by calling `add` for each receiver then
* `finalize`.
*/
const TransferBatch = new MoveEnum({
	name: `${$moduleName}::TransferBatch<phantom T>`,
	fields: {
		/**
		* The sender's balance proof failed. Subsequent `add` calls are no-ops;
		* `try_finalize` returns `false` and `finalize` aborts.
		*/
		BalanceProofFailed: null,
		/**
		* The balance proof succeeded. Holds the receiver-keyed `EncryptedCoin`s split off
		* the sender's balance, one per transfer. `add_to_batch` pops one per receiver and
		* credits it to their pending deposits. `sender_amounts` is the parallel vector of
		* sender-keyed encryptions of the same _total_ (individual values aren't
		* constrained — see the `TransferEvent` doc), carried only so each `add_to_batch`
		* can emit one in the `TransferEvent`. `sender_pk` is likewise carried only for
		* the event.
		*/
		Ok: new MoveStruct({
			name: `TransferBatch.Ok`,
			fields: {
				sender: bcs.Address,
				sender_pk: Element,
				coins: bcs.vector(EncryptedCoin),
				sender_amounts: bcs.vector(EncryptedAmount)
			}
		})
	}
});
/**
* Create an `Auth<T>` for `ctx.sender()` covering every operation the policy on
* `ct` leaves permissionless.
*/
function authorizeAsSender(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null];
	const parameterNames = ["ct"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "authorize_as_sender",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Create an `Auth<T>` on behalf of `owner` covering the requested `operation`,
* authorized by witness `W`. Aborts unless the policy on `ct` is set, its witness
* type is `W`, and `operation` is permissioned. The witness-holding contract is
* fully responsible for authenticating `owner`.
*/
function authorizeWithWitness(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		"u8",
		"address",
		`${options.typeArguments[1]}`
	];
	const parameterNames = [
		"ct",
		"operation",
		"owner",
		"witness"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "authorize_with_witness",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Create an `Auth<T>` on behalf of an object identified by `uid`, covering every
* operation the policy on `ct` leaves permissionless. Holding `&mut UID` proves
* custody of the object, so the object self-authenticates as its own `owner` (the
* address derived from the UID).
*/
function authorizeAsObject(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null, "0x2::object::ID"];
	const parameterNames = ["ct", "uid"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "authorize_as_object",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Create a new confidential token for the given token type. Can only happen once
* per token type, and the token object is immediately shared.
*
* Requires a `&mut TreasuryCap` for authorization, this is to prevent frozen
* TreasuryCaps from being used.
*
* Creates an `Auditors` object for the confidential token using the provided
* public keys. The auditor public keys can be empty initially and updated later by
* the issuer.
*
* Returns the created `ConfidentialToken` and a `ManagementCap` that can be used
* to perform administrative operations for this token.
*/
function newConfidentialToken(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		"vector<null>"
	];
	const parameterNames = [
		"registry",
		"T",
		"auditorPublicKeys"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "new_confidential_token",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Share the confidential token object. This is needed to allow the issuer to
* interact with the confidential token, e.g., to set permissions, in the same PTB.
*/
function shareConfidentialToken(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null];
	const parameterNames = ["ct"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "share_confidential_token",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Create a new account for the given address. Can only happen once per address.
*
* Note: the `owner` argument is not tied to `ctx.sender()` — anyone can create an
* `Account` on behalf of any address. Since `Account` has `key` only (no `store`),
* the only way to dispose of it outside this module is via `share_account`, and
* all authenticated operations still gate on `account.owner == ctx.sender()`.
*/
function newAccount(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null, "address"];
	const parameterNames = ["registry", "owner"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "new_account",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
/**
* Share the account object. This has do be done after `new_account`, but it allows
* the user to create token accounts for confidential tokens immediately.
*/
function shareAccount(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null];
	const parameterNames = ["account"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "share_account",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
/**
* Create a `TokenAccount` for token `T` with the given `pk`. Authorized by `auth`,
* which must be for the `PERMISSIONED_REGISTER` operation and for `account.owner`.
* If `ConfidentialToken<T>` has auditors enabled, a `KeyEncryption` must be
* provided.
*/
function register(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		null,
		null
	];
	const parameterNames = [
		"account",
		"auth",
		"ct",
		"pk",
		"keyEncryption"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "register",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Set whether this account for token `T` accepts new encrypted deposits. This is
* used to prevent receiving new encrypted deposits during token account key
* rotation. Authorized by `auth`, which must be for `account.owner`. Any `Auth<T>`
* is accepted regardless of which operation it covers.
*/
function setAcceptsEncryptedDeposits(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		"bool"
	];
	const parameterNames = [
		"account",
		"auth",
		"acceptsEncryptedDeposits"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "set_accepts_encrypted_deposits",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Update the public key for the account of token `T`. Authorized by `auth`, which
* must be for the `PERMISSIONED_REGISTER` operation and for `account.owner` -- key
* rotation reuses the registration authorization since the same flow gates account
* onboarding. This aborts if there are pending deposits that need to be merged, so
* the caller should:
*
* - Call `merge` to merge pending deposits and `set_accepts_encrypted_deposits` to
*   false to prevent new encrypted deposits.
* - Call `set_public_key` to update the public key and
*   `set_accepts_encrypted_deposits` to true to allow new encrypted deposits
*   again.
*/
function setPublicKey(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null
	];
	const parameterNames = [
		"account",
		"auth",
		"ct",
		"newPk",
		"newBalance",
		"newBalanceProof",
		"handleEqProof",
		"keyEncryption"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "set_public_key",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Optimistic key rotation: re-state the balance under a fresh blinding, re-key it
* to `new_pk`, and unpause. If the restate's `balance_proof` fails (e.g. a deposit
* raced the caller's read), emits `TrySetPublicKeyFailedEvent` and leaves the
* account paused for a retry. The caller must `merge` (and pause) first.
*/
function trySetPublicKeyAndUnpause(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null
	];
	const parameterNames = [
		"account",
		"auth",
		"ct",
		"newPk",
		"restatedBalance",
		"restatedBalanceProof",
		"balanceProof",
		"newBalance",
		"newBalanceProof",
		"handleEqProof",
		"keyEncryption"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "try_set_public_key_and_unpause",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Convert public coin to private tokens and add them to the public pending balance
* of `receiver`. Authorized by `auth`, which must be for the `PERMISSIONED_WRAP`
* operation; `auth` may be for any owner.
*/
function wrap(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		"0x2::deny_list::DenyList",
		null,
		null,
		"vector<u8>"
	];
	const parameterNames = [
		"receiver",
		"auth",
		"ct",
		"pool",
		"coin",
		"memo"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "wrap",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Start a batched transfer from `sender`. `receiver_amounts[i]` is the transferred
* value re-encrypted under `receiver_pks[i]`; `sender_amounts[i]` is the same
* value under the sender's key, forwarded to the events and otherwise only checked
* as a sum. `well_formed_proofs` is a single batched `WellFormedProof` covering
* `receiver_amounts ++ [new_balance]` under `receiver_pks ++ [sender_pk]` — one
* aggregate Bulletproof for the whole transfer. `consistency_proof` and
* `balance_proof` together prove the sender's balance drops by exactly the
* transfer total (see `balance::try_split_batch`).
*
* Returns `TransferBatch::Ok` when `balance_proof` verifies, else
* `BalanceProofFailed`. Aborts if `well_formed_proofs` does not verify, the sender
* amounts don't sum to the receivers, or `consistency_proof` fails. Call `add`
* once per receiver, in `receiver_amounts` order, then `finalize`. Authorized by
* any `Auth<T>` for `sender.owner`.
*/
function batchedTransfer(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		"0x2::deny_list::DenyList",
		"vector<null>",
		"vector<null>",
		null,
		"vector<null>",
		null,
		null,
		null
	];
	const parameterNames = [
		"sender",
		"auth",
		"ct",
		"receiverPks",
		"receiverAmounts",
		"wellFormedProofs",
		"senderAmounts",
		"consistencyProof",
		"newBalance",
		"balanceProof"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "batched_transfer",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Add a receiver to a batched transfer: pop the next receiver-keyed
* `EncryptedCoin` and credit it to the receiver's pending deposits. Aborts if:
*
* - the receiver is not registered, frozen, or on the deny list,
* - `add_to_batch` is called more times than there were `receiver_amounts` in
*   `batched_transfer`,
* - the coin is not encrypted under the receiver's registered public key.
*/
function addToBatch(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		"vector<u8>",
		"0x2::deny_list::DenyList"
	];
	const parameterNames = [
		"batch",
		"receiver",
		"memo"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "add_to_batch",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Consume the `TransferBatch` to complete the transfer batch and return `true` if
* the transfer succeeded and `false` if the balance proof failed.
*/
function tryFinalize(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null];
	const parameterNames = ["batch"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "try_finalize",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Consume the `TransferBatch` to complete the transfer batch. Aborts if any check,
* including the balance proof, failed.
*/
function finalize(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null];
	const parameterNames = ["batch"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "finalize",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Merge all pending deposits into the active balance. This must be done before
* pending encrypted and public deposits can be used in a transfer. To prevent
* overflows, the number of additions done with the active balance is limited,
* including the number of additions done with the pending deposits. Authorized by
* `auth`, which must be for `account.owner`. Any `Auth<T>` is accepted regardless
* of which operation it covers.
*/
function merge(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null, null];
	const parameterNames = ["account", "auth"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "merge",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* This may be used to update the balance after merging many pending deposits
* before merging new deposits. Authorized by `auth`, which must be for
* `account.owner`. Any `Auth<T>` is accepted regardless of which operation it
* covers.
*/
function updateActiveBalance(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		null,
		null
	];
	const parameterNames = [
		"account",
		"auth",
		"newBalance",
		"newBalanceProof",
		"balanceProof"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "update_active_balance",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Take an amount of `Coin<T>` from the encrypted balance of `account`. Authorized
* by `auth`, which must be for the `PERMISSIONED_UNWRAP` operation and for
* `account.owner`. The caller needs to provide a proof that the new balance is
* correct after taking the amount:
*
* - `new_balance` is the new encrypted balance of the account after taking the
*   amount,
* - `amount` is the amount of coins taken from the balance,
* - `balance_proof` is a proof that `account.balance = new_balance + amount`.
*/
function unwrap(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		"0x2::deny_list::DenyList",
		null,
		null,
		null,
		"u64",
		null
	];
	const parameterNames = [
		"account",
		"auth",
		"ct",
		"pool",
		"newBalance",
		"newBalanceProof",
		"amount",
		"balanceProof"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "unwrap",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Same as `unwrap` but does not abort if the balance proof fails. Instead, it
* emits a `TryUnwrapFailedEvent` and returns a zero-value coin.
*/
function tryUnwrap(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null,
		"0x2::deny_list::DenyList",
		null,
		null,
		null,
		"u64",
		null
	];
	const parameterNames = [
		"account",
		"auth",
		"ct",
		"pool",
		"newBalance",
		"newBalanceProof",
		"amount",
		"balanceProof"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "try_unwrap",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
function owner(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null];
	const parameterNames = ["account"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "owner",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
/**
* A function for the issuer to set the balance of an account directly. This is
* used in cases where the issuer needs to intervene.
*
* WARNING: This may break the consistency of the balance such that the number of
* confidential tokens in circulation does not match the amount of coins in the
* pool. It is the responsibility of the caller to ensure consistency is maintained
* when using this function. The `upper_bound` is set to 1, so the caller is
* responsible for ensuring that the `EncryptedAmount` is well-formed.
*/
function setBalanceByIssuer(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		null
	];
	const parameterNames = [
		"t",
		"account",
		"newBalance"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "set_balance_by_issuer",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Allow the given address to freeze the token globally or freeze individual
* accounts (via the ManagementCap). Only the issuer can unfreeze (globally or
* per-account). Aborts if the address already has the freeze capability.
*/
function issueFreezeCap(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		"address"
	];
	const parameterNames = [
		"ct",
		"T",
		"addr"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "issue_freeze_cap",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Revoke the freeze capability from the given address. Aborts if the address does
* not have the freeze capability.
*/
function revokeFreezeCap(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		"address"
	];
	const parameterNames = [
		"ct",
		"T",
		"addr"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "revoke_freeze_cap",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Freeze the token globally. This prevents any transfers from happening until the
* token is unfrozen again.
*/
function globalFreeze(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null];
	const parameterNames = ["ct"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "global_freeze",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Unfreeze the token globally. This allows transfers to happen again and can only
* be done by the token issuer.
*/
function globalUnfreeze(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null, null];
	const parameterNames = ["ct", "Cap"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "global_unfreeze",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Freeze the given account for token `T`. A frozen account cannot transfer,
* receive, wrap, or unwrap until unfrozen. Only addresses in `ct.freeze_admins`
* may call this.
*/
function accountFreeze(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null, null];
	const parameterNames = ["ct", "account"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "account_freeze",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Unfreeze the given account for token `T`. Only the token issuer (holder of
* `&TreasuryCap<T>`) may call this. The asymmetry — admins freeze, only the issuer
* unfreezes — mirrors `global_freeze` / `global_unfreeze`.
*/
function accountUnfreeze(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [null, null];
	const parameterNames = ["Cap", "account"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "account_unfreeze",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Set a policy for the confidential token. This allows implementing permissioned
* operations, but only the witness type is stored here - the logic must be handled
* in the corresponding flows. See `register_permissioned` for an example of how
* this can be implemented. Changing the witness type will break all in-flight
* permissioned calls using the old witness, and thus highly discouraged.
*/
function setPolicy(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		"vector<u8>"
	];
	const parameterNames = [
		"ct",
		"T",
		"permissionedOperations"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "set_policy",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
/**
* Update the auditors for this confidential token by setting their new public keys
* in the corresponding `auditors` struct. If `bump_recommended_min` is true, the
* auditors' `recommended_min_version` is raised to the new version, signalling
* that all users should call `set_public_key` with a valid viewing key encrypted
* towards the new auditor keys. The floor is advisory; the chain does not enforce
* it on transfer. The auditor flow can be disabled by inputting an empty
* `public_keys` vector.
*/
function updateAuditors(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		null,
		null,
		"vector<null>",
		"bool"
	];
	const parameterNames = [
		"ct",
		"Cap",
		"publicKeys",
		"bumpRecommendedMin"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "contra",
		function: "update_auditors",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
		typeArguments: options.typeArguments
	});
}
//#endregion
export { ConfidentialToken, TokenAccount, TokenAccountKey, addToBatch, authorizeAsSender, batchedTransfer, contra_exports, merge, newAccount, register, setAcceptsEncryptedDeposits, shareAccount, tryFinalize, trySetPublicKeyAndUnpause, tryUnwrap, updateActiveBalance, wrap };
