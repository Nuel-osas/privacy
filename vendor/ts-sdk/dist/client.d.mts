import { PublicKey } from "./twisted_elgamal.mjs";
import { AccountStatus, BatchedTransferOptions, ContraClientOptions, ContraCompatibleClient, ContraOptions, NewAccountOptions, PauseAccountOptions, RegisterOptions, RotateKeyAndTransferBatchOptions, RotateKeyOptions, ShareAccountOptions, TokenAuditors, TokenBalance, TransferOptions, UnpauseAccountOptions, UnwrapOptions, UpdateBalanceOptions, WrapOptions } from "./types.mjs";
import { TokenAccount } from "./token_account.mjs";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";

//#region src/client.d.ts
/**
 * Create a contra client extension that can be registered with a Sui
 * client, e.g. `suiClient.$extend(contra({ packageConfig, table }))`.
 * `table` is a precomputed `DiscreteLogTable` used to brute-force decrypt
 * limb-sized ciphertexts.
 */
declare function contra(options: ContraOptions): {
  name: "contra";
  register: (client: ContraCompatibleClient) => ContraClient;
};
/**
 * Stateless client for the `contra` Move package.
 *
 * Each transaction-building method returns a thunk
 * `(tx: Transaction) => TransactionResult` that can be passed to
 * `tx.add(...)`. Methods that need encryption key material take a
 * `TokenAccount` directly — the client holds no per-account state.
 */
declare class ContraClient {
  #private;
  constructor(options: ContraClientOptions);
  /** Return the account object ID for the given owner address. */
  getAccountId(address: string): string;
  /**
   * Return the object ID of the token account for the given
   * `tokenType` inside the account owned by `address`.
   */
  getTokenAccountId(address: string, tokenType: string): string;
  /**
   * Create a new account for the given owner.
   *
   * @example
   * ```ts
   * const tx = new Transaction();
   * const account = tx.add(contraClient.newAccount({ owner: senderAddress }));
   * tx.add(contraClient.shareAccount({ account }));
   * ```
   *
   * On-chain aborts:
   * - `EAccountAlreadyRegistered` — `owner` already has an account (one per address).
   */
  newAccount({
    owner
  }: NewAccountOptions): (tx: Transaction) => TransactionResult;
  /**
   * Share an account object. The account is consumed by value, so the
   * argument must be a freshly-created account (e.g. the result of
   * `newAccount`) that has not yet been shared.
   */
  shareAccount({
    account
  }: ShareAccountOptions): (tx: Transaction) => TransactionResult;
  /**
   * Fetch the on-chain token account and return its full balance state
   * as a `TokenBalance`: the active (spendable) balance, the pending
   * encrypted deposits, and the pending public deposits.
   *
   * @example
   * ```ts
   * const { balance, pending, pendingPublicBalance } =
   *   await contraClient.getBalance(tokenAccount);
   * ```
   *
   * Throws `TokenAccountDoesNotExistError` if `tokenAccount.address` is not
   * registered for `tokenAccount.tokenType`.
   */
  getBalance(tokenAccount: TokenAccount): Promise<TokenBalance>;
  /**
   * Fetch the on-chain public key for a given address and token type.
   *
   * @example
   * ```ts
   * const pk = await contraClient.getPublicKey(
   *   recipientAddress,
   *   '0x2::sui::SUI',
   * );
   * ```
   *
   * Throws `TokenAccountDoesNotExistError` if `address` is not registered for
   * `tokenType`.
   */
  getPublicKey(address: string, tokenType: string): Promise<PublicKey>;
  /**
   * Fetch the current auditor configuration for the given token type.
   *
   * Returns the auditor public keys together with the current version number
   * and the `recommendedMinVersion` floor. The floor is advisory: the chain
   * does not enforce it, but wallets should treat accounts whose
   * viewing-key encryption version is below it as stale and prompt the user
   * to rotate via `set_public_key` before transferring.
   *
   * @example
   * ```ts
   * const { pks, version, recommendedMinVersion } =
   *   await contraClient.getAuditors('0x2::sui::SUI');
   * ```
   *
   * Throws the underlying fetch error if any.
   */
  getAuditors(tokenType: string): Promise<TokenAuditors>;
  /**
   * Return `true` iff the token is globally frozen. When frozen, no account can wrap,
   * transfer, or unwrap until the issuer calls `global_unfreeze`.
   *
   * @example
   * ```ts
   * if (await contraClient.isTokenFrozen('0x2::sui::SUI')) {
   *   // Surface to the user; building a transfer/unwrap would just abort on chain.
   * }
   * ```
   *
   * Throws the underlying fetch error if any.
   */
  isTokenFrozen(tokenType: string): Promise<boolean>;
  /**
   * Fetch the on-chain status of a per-token account.
   *
   * Currently exposes whether the account is frozen via `isFrozen`. A frozen
   * account cannot wrap, transfer, receive, or unwrap for this token type
   * until the issuer unfreezes it.
   *
   * @example
   * ```ts
   * const { isFrozen } = await contraClient.getAccountStatus(
   *   userAddress,
   *   '0x2::sui::SUI',
   * );
   * ```
   *
   * Throws `TokenAccountDoesNotExistError` if `address` is not registered for
   * `tokenType`.
   */
  getAccountStatus(address: string, tokenType: string): Promise<AccountStatus>;
  /**
   * Return `true` iff the issuer's `recommendedMinVersion` is above this account's
   * `keyEncryptionVersion`, signalling that the user should refresh their on-chain
   * key encryption against the new auditor set.
   *
   * @example
   * ```ts
   * if (await contraClient.shouldRotateKey(tokenAccount)) {
   *   // Caller builds the post-rotation account and submits the PTB themselves.
   *   // See `rotateKeyAndUnpauseAccount` for the full pause→rotate flow.
   * }
   * ```
   *
   * Throws `TokenAccountDoesNotExistError` if `tokenAccount.address` is not
   * registered for `tokenAccount.tokenType`.
   */
  shouldRotateKey(tokenAccount: TokenAccount): Promise<boolean>;
  /**
   * Register a token account for `tokenAccount.tokenType` inside the
   * account owned by `tokenAccount.address`.
   *
   * The public key registered on chain is derived from the token
   * account's private key as `G * privateKey`.
   *
   * When `account` is omitted the shared account object is looked up
   * by its derived ID. Pass `account` explicitly when the account was
   * just created in the same PTB and is not yet shared on chain.
   *
   * @example
   * ```ts
   * // Standalone registration (account already shared on chain):
   * const tx = new Transaction();
   * tx.add(await contraClient.register({ tokenAccount }));
   *
   * // In the same PTB as account creation:
   * const tx = new Transaction();
   * const account = tx.add(contraClient.newAccount({ owner: senderAddress }));
   * tx.add(await contraClient.register({ tokenAccount, account }));
   * tx.add(contraClient.shareAccount({ account }));
   * ```
   *
   * On-chain aborts:
   * - `EAccountAlreadyRegistered` — the account is already registered for `T`.
   * - `EAuthorizationError` — `auth` was invalid.
   * - `EMissingEncryptedViewingKeyArguments` / `ETooManyEncryptedViewingKeyArguments` —
   *   `auditorPublicKeys` doesn't match the token's auditor configuration (omitted
   *   when required, or provided when the token has none).
   * - `EInvalidEncryptedViewingKey` — `auditorPublicKeys` doesn't match the on-chain
   *   auditor set.
   */
  register({
    tokenAccount,
    account,
    auditorPublicKeys,
    auth
  }: RegisterOptions): Promise<(tx: Transaction) => TransactionResult>;
  /**
   * Wrap a public coin into the receiver's pending encrypted balance.
   *
   * The supplied coin is consumed, its value is added to the pool for
   * that token, and the same amount is credited to the receiver's
   * pending public balance. The receiver's account must already be
   * shared on chain.
   *
   * @example
   * ```ts
   * const tx = new Transaction();
   * const [payment] = tx.splitCoins(tx.object(sourceCoinId), [10n]);
   * tx.add(
   *   contraClient.wrap({
   *     coin: payment,
   *     receiver: receiverAddress,
   *     tokenType: '0x2::sui::SUI',
   *   }),
   * );
   * ```
   *
   * On-chain aborts:
   * - `EAuthorizationError` — invalid `auth`.
   * - `ETransferDenied` — the token is paused, the deny list is globally frozen, the receiver
   *   is on the deny list, or the receiver's per-account freeze is active.
   * - `sui::dynamic_field::EFieldDoesNotExist` — `receiver` is not registered for the token.
   */
  wrap({
    coin,
    receiver,
    tokenType,
    memo
  }: WrapOptions): (tx: Transaction) => TransactionResult;
  /**
   * Re-normalize the active balance into its canonical limb form.
   *
   * When `merge` is `true` (the default) and the sender has pending
   * deposits, a `merge` call is prepended to the
   * transaction so that pending deposits are included in the updated
   * balance.
   *
   * Should be called in rare cases where the balance was modified by
   * ~2^16 merges.
   *
   * @example
   * ```ts
   * const normalize = await client.contra.updateBalance({ tokenAccount });
   * const tx = new Transaction();
   * tx.add(normalize);
   * ```
   *
   * SDK-thrown:
   * - `TokenAccountDoesNotExistError` — the token account couldn't be fetched.
   *
   * On-chain aborts:
   * - `EAuthorizationError` — invalid `auth`.
   * - `sui::dynamic_field::EFieldDoesNotExist` — `tokenAccount.address` isn't registered for the token.
   * - `EBalanceProofFailed` — the balance changed between fetch and submission (e.g. a
   *   merge with `merge=false`, or a public deposit landing in between).
   */
  updateBalance({
    tokenAccount,
    merge,
    auth
  }: UpdateBalanceOptions): Promise<(tx: Transaction) => TransactionResult>;
  /**
   * Pause new encrypted deposits to `tokenAccount`. Subsequent `transfer` /
   * `transferBatch` calls targeting this account abort on the receiver-side
   * `add_to_batch` step (the sender-side balance is not consumed). Required
   * before `rotateKeyAndUnpauseAccount`; the rotation PTB unpauses deposits at the end.
   *
   * @example
   * ```ts
   * const pauseFn = contraClient.pauseAccount({ tokenAccount });
   * const tx = new Transaction();
   * tx.add(pauseFn);
   * ```
   *
   * On-chain aborts:
   * - `EAuthorizationError` — invalid `auth`.
   * - `sui::dynamic_field::EFieldDoesNotExist` — `tokenAccount.address` is not registered for the token.
   */
  pauseAccount({
    tokenAccount,
    auth
  }: PauseAccountOptions): (tx: Transaction) => TransactionResult;
  /**
   * Unpause encrypted deposits to `tokenAccount` after a `pauseAccount`. Note that
   * the rotation PTB already unpauses on its own, so this is only needed for callers
   * that paused for some other reason (or want to recover from a failed rotation).
   *
   * @example
   * ```ts
   * const unpauseFn = contraClient.unpauseAccount({ tokenAccount });
   * const tx = new Transaction();
   * tx.add(unpauseFn);
   * ```
   *
   * On-chain aborts:
   * - `EAuthorizationError` — invalid `auth`.
   * - `sui::dynamic_field::EFieldDoesNotExist` — `tokenAccount.address` is not registered for the token.
   */
  unpauseAccount({
    tokenAccount,
    auth
  }: UnpauseAccountOptions): (tx: Transaction) => TransactionResult;
  /**
   * Rotate a token account's encryption key. The caller supplies the post-rotation
   * `newTokenAccount` and must persist it.
   *
   * By default (`pauseAndMerge = true`) the returned PTB is optimistic and self-contained: it
   * pauses encrypted deposits, folds any pending deposits into the active balance, then in one
   * `try_set_public_key_and_unpause` call re-states the balance under a fresh blinding, re-keys
   * it, and unpauses. The pause and merge always commit. If a new encrypted deposit lands between
   * the SDK's balance read and execution, the restate's balance proof no longer matches:
   * `try_set_public_key_and_unpause` no-ops (emitting `TrySetPublicKeyFailedEvent`) and the
   * account is left paused with the merge applied. Re-run `rotateKeyAndUnpauseAccount` against the
   * new balance to converge — no deposit can race the retry since the account is now paused.
   *
   * Pass `pauseAndMerge = false` when the account is already paused and merged (e.g. paused in a
   * prior transaction): the PTB skips the pause + merge and issues only the rekey. The account
   * must already refuse deposits or this throws `DepositsMustBePausedError`.
   *
   * Detect success/failure via the emitted events: `UpdatedPublicKeyEvent` on success,
   * `TrySetPublicKeyFailedEvent` on a raced retry.
   *
   * SDK-thrown:
   * - `DepositsMustBePausedError` — `pauseAndMerge` is `false` but the account still accepts
   *   encrypted deposits.
   * - `InvalidArgumentError` — `pauseAndMerge` is `false` but the account has pending deposits
   *   that must be merged first.
   * - `TokenAccountDoesNotExistError` — `tokenAccount` is not registered for the
   *   token.
   *
   * On-chain aborts (rare; mostly indicate races with concurrent admin actions):
   * - `EAuthorizationError` — `auth` was not for the owner.
   * - `sui::dynamic_field::EFieldDoesNotExist` — account lost its registration between SDK and execution.
   * - `EMissingEncryptedViewingKeyArguments` / `ETooManyEncryptedViewingKeyArguments` /
   *   `EInvalidEncryptedViewingKey` — the auditor set changed between the SDK's
   *   read and execution.
   *
   * @example
   * ```ts
   * const newTokenAccount = new TokenAccount(address, tokenType, packageConfig, randomScalar());
   * const rotateFn = await contraClient.rotateKeyAndUnpauseAccount({ tokenAccount, newTokenAccount });
   * const tx = new Transaction();
   * tx.add(rotateFn);
   * ```
   */
  rotateKeyAndUnpauseAccount({
    tokenAccount,
    newTokenAccount,
    pauseAndMerge,
    auth
  }: RotateKeyOptions): Promise<(tx: Transaction) => TransactionResult>;
  /**
   * Build a confidential transfer transaction.
   *
   * Convenience wrapper around `transferBatch` for the single-recipient case.
   * See `transferBatch` for the full semantics.
   *
   * @example
   * ```ts
   * const transferFn = await contraClient.transfer({
   *   tokenAccount: senderTokenAccount,
   *   receiverAddress,
   *   amount: 100n,
   * });
   * const tx = new Transaction();
   * tx.add(transferFn);
   * ```
   *
   * See `transferBatch` for the full list of SDK-thrown errors and on-chain aborts.
   */
  transfer({
    tokenAccount,
    receiverAddress,
    amount,
    memo,
    merge,
    auth
  }: TransferOptions): Promise<(tx: Transaction) => TransactionResult>;
  /**
   * Build a confidential batched transfer transaction.
   *
   * Fetches the sender's current balance and each receiver's on-chain public
   * key, encrypts each transfer amount under both keys, generates the
   * required zero-knowledge proofs, and returns a thunk that adds the
   * `contra::batched_transfer` flow.
   *
   * The `recipients` order is preserved end-to-end: `recipients[i]` is
   * credited to `recipients[i].receiverAddress` with `recipients[i].memo`,
   * matching the order of emitted `TransferEvent`s.
   *
   * `recipients.length` must be in `[1, 7]`.
   *
   * When `merge` is `true` (the default) and the sender has pending
   * deposits, a `merge` call is prepended to the transaction so that
   * pending deposits are included in the spendable balance. The proofs are
   * computed against the post-merge balance.
   *
   * Note: when `merge` is enabled, the transaction may succeed but only
   * the merge is executed, not the transfers themselves. This happens if
   * the sender receives a deposit after the balance is fetched but before
   * the transaction is submitted. In that case, a `TryTransferFailedEvent`
   * is emitted and no receiver is credited (the on-chain `BalanceProofFailed`
   * branch short-circuits every `add_to_batch`). You can either try again or
   * call `transferBatch` with `merge = false` to be sure that the
   * transaction succeeds.
   *
   * @example
   * ```ts
   * const transferFn = await contraClient.transferBatch({
   *   tokenAccount: senderTokenAccount,
   *   recipients: [
   *     { receiverAddress: alice, amount: 100n },
   *     { receiverAddress: bob, amount: 50n, memo: 'rent' },
   *   ],
   * });
   * const tx = new Transaction();
   * tx.add(transferFn);
   * ```
   *
   * SDK-thrown:
   * - `InvalidArgumentError` — `recipients` is empty, has more than 255 entries, or
   *   contains the sender's own address.
   * - `ReceiverDoesNotAcceptDepositsError` — at least one receiver has paused encrypted
   *   deposits or has a per-account freeze active.
   * - `InsufficientBalanceError` — total amount exceeds the spendable balance (active,
   *   or active + pending when `merge` is `true`).
   * - `TokenAccountDoesNotExistError` — sender or a receiver is not registered for the
   *   token (no on-chain `TokenAccount` object).
   *
   * On-chain aborts:
   * - `EAuthorizationError` — invalid `auth`.
   * - `ETransferDenied` — the token is paused, the deny list is globally frozen, the sender
   *   or a receiver is on the deny list, the sender has a per-account freeze active (the
   *   receiver-frozen case is caught by the SDK), or a receiver's state changed between the
   *   SDK check and execution.
   * - `sui::dynamic_field::EFieldDoesNotExist` — sender or receiver lost its registration between the
   *   SDK's check and execution.
   */
  transferBatch({
    tokenAccount,
    recipients,
    merge,
    auth
  }: BatchedTransferOptions): Promise<(tx: Transaction) => TransactionResult>;
  /**
   * Transfer to a batch of recipients and rotate the account's encryption key, all in one
   * transaction: pause → merge → transfer → rotate (re-key + unpause).
   *
   * The transfer is built under the CURRENT (old) key against the merged balance; the rotation
   * then re-states the post-transfer balance and re-keys it. Both steps are optimistic: if a
   * deposit races the balance read, `TryTransferFailedEvent` is emitted and neither the transfer
   * nor the rotation took effect. Pause and merge stay committed, so the caller just retries
   * (deterministic now, since the account is paused). On success the account ends debited by the
   * transfer total, re-keyed, and unpaused.
   *
   * @example
   * ```ts
   * const newTokenAccount = new TokenAccount(address, tokenType, packageConfig, randomScalar());
   * const fn = await contraClient.rotateKeyAndTransferBatch({
   *   tokenAccount,
   *   newTokenAccount,
   *   recipients: [{ receiverAddress: alice, amount: 100n }],
   * });
   * const tx = new Transaction();
   * tx.add(fn);
   * ```
   *
   * SDK-thrown:
   * - `InvalidArgumentError` — `recipients` is empty, has more than 255 entries, or contains the
   *   sender's own address.
   * - `ReceiverDoesNotAcceptDepositsError` — at least one receiver has paused encrypted deposits
   *   or has a per-account freeze active.
   * - `InsufficientBalanceError` — the transfer total exceeds the spendable balance.
   * - `TokenAccountDoesNotExistError` — sender or a receiver is not registered for the token.
   *
   * On-chain aborts:
   * - `EAuthorizationError` — invalid `auth`.
   * - `ETransferDenied` — the token is paused, the deny list is globally frozen, the sender or
   *   a receiver is on the deny list, the sender has a per-account freeze active (the
   *   receiver-frozen case is caught by the SDK), or a receiver's state changed between the
   *   SDK check and execution.
   * - `sui::dynamic_field::EFieldDoesNotExist` — sender or receiver lost its registration between the SDK's check
   *   and execution.
   */
  rotateKeyAndTransferBatch({
    tokenAccount,
    newTokenAccount,
    recipients,
    auth
  }: RotateKeyAndTransferBatchOptions): Promise<(tx: Transaction) => TransactionResult>;
  /**
   * Unwrap an amount from the sender's confidential balance back into a
   * public `Coin<T>`.
   *
   * When `merge` is `true` (the default) and the sender has pending
   * deposits, a `merge` call is prepended to the
   * transaction so that pending deposits are included in the spendable
   * balance.
   *
   * Note: When `merge` is enabled, the transaction may succeed, but
   * only the merge is actually executed, not the actual unwrap. This
   * happens if the sender receives a deposit after the balance is
   * fetched but before the transaction is submitted. In that case,
   * a `TryUnwrapFailedEvent` is emitted and a zero-value coin is
   * returned. You can either try again or call `unwrap` with
   * `merge = false` to be sure that the unwrap succeeds.
   *
   * @example
   * ```ts
   * const unwrapFn = await contraClient.unwrap({ tokenAccount, amount: 100n });
   * const tx = new Transaction();
   * const coin = tx.add(unwrapFn);
   * tx.transferObjects([coin], recipientAddress);
   * ```
   *
   * SDK-thrown:
   * - `InsufficientBalanceError` — `amount` exceeds the spendable balance (active, or
   *   active + pending when `merge` is `true`).
   * - `TokenAccountDoesNotExistError` — `tokenAccount.address` is not registered for
   *   the token.
   *
   * On-chain aborts:
   * - `EAuthorizationError` — invalid `auth`.
   * - `ETransferDenied` — the token is paused, the deny list is globally frozen, the sender is
   *   on the deny list, or the account's per-account freeze is active.
   * - `sui::dynamic_field::EFieldDoesNotExist` — the account lost its registration between the SDK's check and
   *   execution.
   */
  unwrap({
    tokenAccount,
    amount,
    merge,
    auth
  }: UnwrapOptions): Promise<(tx: Transaction) => TransactionResult>;
}
//#endregion
export { ContraClient, contra };