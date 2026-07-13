import { MoveEnum, MoveStruct, MoveTuple, RawTransactionArgument } from "../utils/index.mjs";
import { BcsType } from "@mysten/sui/bcs";
import * as _$_mysten_sui_transactions0 from "@mysten/sui/transactions";
import { Transaction, TransactionArgument } from "@mysten/sui/transactions";

//#region src/contracts/contra/contra.d.ts
declare namespace contra_d_exports {
  export { Account, AccountFreezeArguments, AccountFreezeOptions, AccountKey, AccountRegistry, AccountUnfreezeArguments, AccountUnfreezeOptions, AddToBatchArguments, AddToBatchOptions, AuthorizeAsObjectArguments, AuthorizeAsObjectOptions, AuthorizeAsSenderArguments, AuthorizeAsSenderOptions, AuthorizeWithWitnessArguments, AuthorizeWithWitnessOptions, BatchedTransferArguments, BatchedTransferOptions, ConfidentialToken, FinalizeArguments, FinalizeOptions, GlobalFreezeArguments, GlobalFreezeOptions, GlobalUnfreezeArguments, GlobalUnfreezeOptions, IssueFreezeCapArguments, IssueFreezeCapOptions, ManagementCap, MergeArguments, MergeOptions, NewAccountArguments, NewAccountOptions, NewConfidentialTokenArguments, NewConfidentialTokenOptions, OwnerArguments, OwnerOptions, Pool, PoolKey, RegisterArguments, RegisterOptions, RevokeFreezeCapArguments, RevokeFreezeCapOptions, SetAcceptsEncryptedDepositsArguments, SetAcceptsEncryptedDepositsOptions, SetBalanceByIssuerArguments, SetBalanceByIssuerOptions, SetPolicyArguments, SetPolicyOptions, SetPublicKeyArguments, SetPublicKeyOptions, ShareAccountArguments, ShareAccountOptions, ShareConfidentialTokenArguments, ShareConfidentialTokenOptions, TokenAccount, TokenAccountKey, TokenKey, TokenRegistry, TransferBatch, TryFinalizeArguments, TryFinalizeOptions, TrySetPublicKeyAndUnpauseArguments, TrySetPublicKeyAndUnpauseOptions, TryUnwrapArguments, TryUnwrapOptions, UnwrapArguments, UnwrapOptions, UpdateActiveBalanceArguments, UpdateActiveBalanceOptions, UpdateAuditorsArguments, UpdateAuditorsOptions, WrapArguments, WrapOptions, accountFreeze, accountUnfreeze, addToBatch, authorizeAsObject, authorizeAsSender, authorizeWithWitness, batchedTransfer, finalize, globalFreeze, globalUnfreeze, issueFreezeCap, merge, newAccount, newConfidentialToken, owner, register, revokeFreezeCap, setAcceptsEncryptedDeposits, setBalanceByIssuer, setPolicy, setPublicKey, shareAccount, shareConfidentialToken, tryFinalize, trySetPublicKeyAndUnpause, tryUnwrap, unwrap, updateActiveBalance, updateAuditors, wrap };
}
declare const TokenRegistry: MoveStruct<{
  id: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::contra::TokenRegistry">;
declare const AccountRegistry: MoveStruct<{
  id: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::contra::AccountRegistry">;
declare const ConfidentialToken: MoveStruct<{
  id: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  is_active: BcsType<boolean, boolean, "bool">;
  freeze_admins: MoveStruct<{
    contents: BcsType<string[], Iterable<string | Uint8Array<ArrayBufferLike>> & {
      length: number;
    }, string>;
  }, "0x2::vec_set::VecSet<bytes[32]>">;
  policy: BcsType<{
    witness_type: {
      name: string;
    };
    permissioned_operations_bitmap: number;
  } | null, {
    witness_type: {
      name: string;
    };
    permissioned_operations_bitmap: number;
  } | null | undefined, "Option<@local-pkg/contra::policy::Policy>">;
  auditors: MoveStruct<{
    pks: BcsType<{
      bytes: number[];
    }[], Iterable<{
      bytes: Iterable<number> & {
        length: number;
      };
    }> & {
      length: number;
    }, string>;
    version: BcsType<number, number, "u32">;
    recommended_min_version: BcsType<number, number, "u32">;
  }, "@local-pkg/contra::auditors::Auditors">;
}, "@local-pkg/contra::contra::ConfidentialToken<phantom T>">;
declare const Pool: MoveStruct<{
  id: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::contra::Pool<phantom T>">;
declare const Account: MoveStruct<{
  id: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  owner: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::contra::Account">;
declare const TokenAccount: MoveStruct<{
  pk: MoveStruct<{
    bytes: BcsType<number[], Iterable<number> & {
      length: number;
    }, string>;
  }, "0x2::group_ops::Element<phantom T>">;
  verified_key_encryption: MoveStruct<{
    ciphertext: BcsType<{
      ciphertext: {
        bytes: number[];
      };
      decryption_handles: {
        bytes: number[];
      }[];
    }[], Iterable<{
      ciphertext: {
        bytes: Iterable<number> & {
          length: number;
        };
      };
      decryption_handles: Iterable<{
        bytes: Iterable<number> & {
          length: number;
        };
      }> & {
        length: number;
      };
    }> & {
      length: number;
    }, string>;
    version: BcsType<number, number, "u32">;
  }, "@local-pkg/contra::auditors::VerifiedKeyEncryption">;
  session_id: BcsType<number[], Iterable<number> & {
    length: number;
  }, string>;
  is_frozen: BcsType<boolean, boolean, "bool">;
  accepts_deposits: BcsType<boolean, boolean, "bool">;
  active: MoveStruct<{
    amount: MoveStruct<{
      l0: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
      l1: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
      l2: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
      l3: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    }, "@local-pkg/contra::encrypted_amount::EncryptedAmount">;
    upper_bound: BcsType<number, number, "u16">;
  }, "@local-pkg/contra::balance::EncryptedBalance<phantom T>">;
  pending: MoveStruct<{
    amount: MoveStruct<{
      l0: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
      l1: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
      l2: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
      l3: MoveStruct<{
        ciphertext: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
        decryption_handle: MoveStruct<{
          bytes: BcsType<number[], Iterable<number> & {
            length: number;
          }, string>;
        }, "0x2::group_ops::Element<phantom T>">;
      }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    }, "@local-pkg/contra::encrypted_amount::EncryptedAmount">;
    upper_bound: BcsType<number, number, "u16">;
  }, "@local-pkg/contra::balance::EncryptedBalance<phantom T>">;
  public_balance: MoveStruct<{
    value: BcsType<string, string | number | bigint, "u64">;
  }, "@local-pkg/contra::balance::PublicCoin<phantom T>">;
}, "@local-pkg/contra::contra::TokenAccount<phantom T>">;
declare const TokenKey: MoveTuple<readonly [BcsType<boolean, boolean, "bool">], "@local-pkg/contra::contra::TokenKey<phantom T>">;
declare const PoolKey: MoveTuple<readonly [BcsType<boolean, boolean, "bool">], "@local-pkg/contra::contra::PoolKey">;
declare const TokenAccountKey: MoveTuple<readonly [BcsType<boolean, boolean, "bool">], "@local-pkg/contra::contra::TokenAccountKey<phantom T>">;
declare const AccountKey: MoveTuple<readonly [BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">], "@local-pkg/contra::contra::AccountKey">;
declare const ManagementCap: MoveStruct<{
  id: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::contra::ManagementCap<phantom T>">;
/**
 * State machine for batched transfers from a single sender to multiple receivers.
 * Created by `batched_transfer`, consumed by calling `add` for each receiver then
 * `finalize`.
 */
declare const TransferBatch: MoveEnum<{
  /**
   * The sender's balance proof failed. Subsequent `add` calls are no-ops;
   * `try_finalize` returns `false` and `finalize` aborts.
   */
  BalanceProofFailed: null;
  /**
   * The balance proof succeeded. Holds the receiver-keyed `EncryptedCoin`s split off
   * the sender's balance, one per transfer. `add_to_batch` pops one per receiver and
   * credits it to their pending deposits. `seed_point` (= `P`) and
   * `next_index` are carried only for the events: each `add_to_batch` emits `P` and the
   * receiver's batch index so the sender can later re-derive that transfer's blinding
   * (`seed = HKDF(sk * P)`) and recover the amount from the on-chain commitment, without
   * any sender-keyed decryption handle. `sender_pk` is likewise carried only for the
   * event.
   */
  Ok: MoveStruct<{
    sender: BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
    sender_pk: MoveStruct<{
      bytes: BcsType<number[], Iterable<number> & {
        length: number;
      }, string>;
    }, "0x2::group_ops::Element<phantom T>">;
    coins: BcsType<{
      amount: {
        amount: {
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
        };
        pk: {
          bytes: number[];
        };
      };
    }[], Iterable<{
      amount: {
        amount: {
          l0: {
            ciphertext: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
            decryption_handle: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
          };
          l1: {
            ciphertext: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
            decryption_handle: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
          };
          l2: {
            ciphertext: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
            decryption_handle: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
          };
          l3: {
            ciphertext: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
            decryption_handle: {
              bytes: Iterable<number> & {
                length: number;
              };
            };
          };
        };
        pk: {
          bytes: Iterable<number> & {
            length: number;
          };
        };
      };
    }> & {
      length: number;
    }, string>;
    seed_point: MoveStruct<{
      bytes: BcsType<number[], Iterable<number> & {
        length: number;
      }, string>;
    }, "0x2::group_ops::Element<phantom T>">;
    next_index: BcsType<number, number, "u8">;
  }, "TransferBatch.Ok">;
}, "@local-pkg/contra::contra::TransferBatch<phantom T>">;
interface AuthorizeAsSenderArguments {
  ct: RawTransactionArgument<string>;
}
interface AuthorizeAsSenderOptions {
  package?: string;
  arguments: AuthorizeAsSenderArguments | [ct: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Create an `Auth<T>` for `ctx.sender()` covering every operation the policy on
 * `ct` leaves permissionless.
 */
declare function authorizeAsSender(options: AuthorizeAsSenderOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface AuthorizeWithWitnessArguments<W extends BcsType<any>> {
  ct: RawTransactionArgument<string>;
  operation: RawTransactionArgument<number>;
  owner: RawTransactionArgument<string>;
  witness: RawTransactionArgument<W>;
}
interface AuthorizeWithWitnessOptions<W extends BcsType<any>> {
  package?: string;
  arguments: AuthorizeWithWitnessArguments<W> | [ct: RawTransactionArgument<string>, operation: RawTransactionArgument<number>, owner: RawTransactionArgument<string>, witness: RawTransactionArgument<W>];
  typeArguments: [string, string];
}
/**
 * Create an `Auth<T>` on behalf of `owner` covering the requested `operation`,
 * authorized by witness `W`. Aborts unless the policy on `ct` is set, its witness
 * type is `W`, and `operation` is permissioned. The witness-holding contract is
 * fully responsible for authenticating `owner`.
 */
declare function authorizeWithWitness<W extends BcsType<any>>(options: AuthorizeWithWitnessOptions<W>): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface AuthorizeAsObjectArguments {
  ct: RawTransactionArgument<string>;
  uid: RawTransactionArgument<string>;
}
interface AuthorizeAsObjectOptions {
  package?: string;
  arguments: AuthorizeAsObjectArguments | [ct: RawTransactionArgument<string>, uid: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Create an `Auth<T>` on behalf of an object identified by `uid`, covering every
 * operation the policy on `ct` leaves permissionless. Holding `&mut UID` proves
 * custody of the object, so the object self-authenticates as its own `owner` (the
 * address derived from the UID).
 */
declare function authorizeAsObject(options: AuthorizeAsObjectOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface NewConfidentialTokenArguments {
  registry: RawTransactionArgument<string>;
  T: RawTransactionArgument<string>;
  auditorPublicKeys: TransactionArgument;
}
interface NewConfidentialTokenOptions {
  package?: string;
  arguments: NewConfidentialTokenArguments | [registry: RawTransactionArgument<string>, T: RawTransactionArgument<string>, auditorPublicKeys: TransactionArgument];
  typeArguments: [string];
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
declare function newConfidentialToken(options: NewConfidentialTokenOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface ShareConfidentialTokenArguments {
  ct: RawTransactionArgument<string>;
}
interface ShareConfidentialTokenOptions {
  package?: string;
  arguments: ShareConfidentialTokenArguments | [ct: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Share the confidential token object. This is needed to allow the issuer to
 * interact with the confidential token, e.g., to set permissions, in the same PTB.
 */
declare function shareConfidentialToken(options: ShareConfidentialTokenOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface NewAccountArguments {
  registry: RawTransactionArgument<string>;
  owner: RawTransactionArgument<string>;
}
interface NewAccountOptions {
  package?: string;
  arguments: NewAccountArguments | [registry: RawTransactionArgument<string>, owner: RawTransactionArgument<string>];
}
/**
 * Create a new account for the given address. Can only happen once per address.
 *
 * Note: the `owner` argument is not tied to `ctx.sender()` — anyone can create an
 * `Account` on behalf of any address. Since `Account` has `key` only (no `store`),
 * the only way to dispose of it outside this module is via `share_account`, and
 * all authenticated operations still gate on `account.owner == ctx.sender()`.
 */
declare function newAccount(options: NewAccountOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface ShareAccountArguments {
  account: RawTransactionArgument<string>;
}
interface ShareAccountOptions {
  package?: string;
  arguments: ShareAccountArguments | [account: RawTransactionArgument<string>];
}
/**
 * Share the account object. This has do be done after `new_account`, but it allows
 * the user to create token accounts for confidential tokens immediately.
 */
declare function shareAccount(options: ShareAccountOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface RegisterArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
  ct: RawTransactionArgument<string>;
  pk: TransactionArgument;
  keyEncryption: TransactionArgument;
}
interface RegisterOptions {
  package?: string;
  arguments: RegisterArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument, ct: RawTransactionArgument<string>, pk: TransactionArgument, keyEncryption: TransactionArgument];
  typeArguments: [string];
}
/**
 * Create a `TokenAccount` for token `T` with the given `pk`. Authorized by `auth`,
 * which must be for the `PERMISSIONED_REGISTER` operation and for `account.owner`.
 * If `ConfidentialToken<T>` has auditors enabled, a `KeyEncryption` must be
 * provided.
 */
declare function register(options: RegisterOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface SetAcceptsEncryptedDepositsArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
  acceptsEncryptedDeposits: RawTransactionArgument<boolean>;
}
interface SetAcceptsEncryptedDepositsOptions {
  package?: string;
  arguments: SetAcceptsEncryptedDepositsArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument, acceptsEncryptedDeposits: RawTransactionArgument<boolean>];
  typeArguments: [string];
}
/**
 * Set whether this account for token `T` accepts new encrypted deposits. This is
 * used to prevent receiving new encrypted deposits during token account key
 * rotation. Authorized by `auth`, which must be for `account.owner`. Any `Auth<T>`
 * is accepted regardless of which operation it covers.
 */
declare function setAcceptsEncryptedDeposits(options: SetAcceptsEncryptedDepositsOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface SetPublicKeyArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
  ct: RawTransactionArgument<string>;
  newPk: TransactionArgument;
  newHandles: TransactionArgument;
  rekeyProof: TransactionArgument;
  keyEncryption: TransactionArgument;
}
interface SetPublicKeyOptions {
  package?: string;
  arguments: SetPublicKeyArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument, ct: RawTransactionArgument<string>, newPk: TransactionArgument, newHandles: TransactionArgument, rekeyProof: TransactionArgument, keyEncryption: TransactionArgument];
  typeArguments: [string];
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
declare function setPublicKey(options: SetPublicKeyOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface TrySetPublicKeyAndUnpauseArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
  ct: RawTransactionArgument<string>;
  newPk: TransactionArgument;
  restatedBalance: TransactionArgument;
  restatedBalanceProof: TransactionArgument;
  balanceProof: TransactionArgument;
  newHandles: TransactionArgument;
  rekeyProof: TransactionArgument;
  keyEncryption: TransactionArgument;
}
interface TrySetPublicKeyAndUnpauseOptions {
  package?: string;
  arguments: TrySetPublicKeyAndUnpauseArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument, ct: RawTransactionArgument<string>, newPk: TransactionArgument, restatedBalance: TransactionArgument, restatedBalanceProof: TransactionArgument, balanceProof: TransactionArgument, newHandles: TransactionArgument, rekeyProof: TransactionArgument, keyEncryption: TransactionArgument];
  typeArguments: [string];
}
/**
 * Optimistic key rotation: re-state the balance under a fresh blinding, re-key it
 * to `new_pk`, and unpause. If the restate's `balance_proof` fails (e.g. a deposit
 * raced the caller's read), emits `TrySetPublicKeyFailedEvent` and leaves the
 * account paused for a retry. The caller must `merge` (and pause) first.
 */
declare function trySetPublicKeyAndUnpause(options: TrySetPublicKeyAndUnpauseOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface WrapArguments {
  receiver: RawTransactionArgument<string>;
  auth: TransactionArgument;
  ct: RawTransactionArgument<string>;
  pool: RawTransactionArgument<string>;
  coin: RawTransactionArgument<string>;
  memo: RawTransactionArgument<Array<number>>;
}
interface WrapOptions {
  package?: string;
  arguments: WrapArguments | [receiver: RawTransactionArgument<string>, auth: TransactionArgument, ct: RawTransactionArgument<string>, pool: RawTransactionArgument<string>, coin: RawTransactionArgument<string>, memo: RawTransactionArgument<Array<number>>];
  typeArguments: [string];
}
/**
 * Convert public coin to private tokens and add them to the public pending balance
 * of `receiver`. Authorized by `auth`, which must be for the `PERMISSIONED_WRAP`
 * operation; `auth` may be for any owner.
 */
declare function wrap(options: WrapOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface BatchedTransferArguments {
  sender: RawTransactionArgument<string>;
  auth: TransactionArgument;
  ct: RawTransactionArgument<string>;
  receiverPks: TransactionArgument;
  receiverAmounts: TransactionArgument;
  wellFormedProofs: TransactionArgument;
  totalSenderHandle: TransactionArgument;
  consistencyProof: TransactionArgument;
  seedPoint: TransactionArgument;
  newBalance: TransactionArgument;
  balanceProof: TransactionArgument;
}
interface BatchedTransferOptions {
  package?: string;
  arguments: BatchedTransferArguments | [sender: RawTransactionArgument<string>, auth: TransactionArgument, ct: RawTransactionArgument<string>, receiverPks: TransactionArgument, receiverAmounts: TransactionArgument, wellFormedProofs: TransactionArgument, totalSenderHandle: TransactionArgument, consistencyProof: TransactionArgument, seedPoint: TransactionArgument, newBalance: TransactionArgument, balanceProof: TransactionArgument];
  typeArguments: [string];
}
/**
 * Start a batched transfer from `sender`. `receiver_amounts[i]` is the transferred
 * value re-encrypted under `receiver_pks[i]`. `well_formed_proofs` is a single
 * batched `WellFormedProof` covering `receiver_amounts ++ [new_balance]` under
 * `receiver_pks ++ [sender_pk]` — one aggregate Bulletproof for the whole transfer.
 * `total_sender_handle` is the single sender-keyed decryption handle for the transfer
 * total; `consistency_proof` proves it well-formed and `balance_proof` proves the
 * sender's balance drops by exactly that total (see `balance::try_split_batch`).
 * `seed_point` (= `P`) is forwarded to the events so the sender can
 * re-derive each transfer's blinding and recover its outgoing amounts; it is not
 * otherwise verified on chain.
 *
 * Returns `TransferBatch::Ok` when `balance_proof` verifies, else
 * `BalanceProofFailed`. Aborts if `well_formed_proofs` does not verify or
 * `consistency_proof` fails. Call `add` once per receiver, in `receiver_amounts`
 * order, then `finalize`. Authorized by any `Auth<T>` for `sender.owner`.
 */
declare function batchedTransfer(options: BatchedTransferOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface AddToBatchArguments {
  batch: TransactionArgument;
  receiver: RawTransactionArgument<string>;
  memo: RawTransactionArgument<Array<number>>;
}
interface AddToBatchOptions {
  package?: string;
  arguments: AddToBatchArguments | [batch: TransactionArgument, receiver: RawTransactionArgument<string>, memo: RawTransactionArgument<Array<number>>];
  typeArguments: [string];
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
declare function addToBatch(options: AddToBatchOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface TryFinalizeArguments {
  batch: TransactionArgument;
}
interface TryFinalizeOptions {
  package?: string;
  arguments: TryFinalizeArguments | [batch: TransactionArgument];
  typeArguments: [string];
}
/**
 * Consume the `TransferBatch` to complete the transfer batch and return `true` if
 * the transfer succeeded and `false` if the balance proof failed.
 */
declare function tryFinalize(options: TryFinalizeOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface FinalizeArguments {
  batch: TransactionArgument;
}
interface FinalizeOptions {
  package?: string;
  arguments: FinalizeArguments | [batch: TransactionArgument];
  typeArguments: [string];
}
/**
 * Consume the `TransferBatch` to complete the transfer batch. Aborts if any check,
 * including the balance proof, failed.
 */
declare function finalize(options: FinalizeOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface MergeArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
}
interface MergeOptions {
  package?: string;
  arguments: MergeArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument];
  typeArguments: [string];
}
/**
 * Merge all pending deposits into the active balance. This must be done before
 * pending encrypted and public deposits can be used in a transfer. To prevent
 * overflows, the number of additions done with the active balance is limited,
 * including the number of additions done with the pending deposits. Authorized by
 * `auth`, which must be for `account.owner`. Any `Auth<T>` is accepted regardless
 * of which operation it covers.
 */
declare function merge(options: MergeOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface UpdateActiveBalanceArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
  newBalance: TransactionArgument;
  newBalanceProof: TransactionArgument;
  balanceProof: TransactionArgument;
}
interface UpdateActiveBalanceOptions {
  package?: string;
  arguments: UpdateActiveBalanceArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument, newBalance: TransactionArgument, newBalanceProof: TransactionArgument, balanceProof: TransactionArgument];
  typeArguments: [string];
}
/**
 * This may be used to update the balance after merging many pending deposits
 * before merging new deposits. Authorized by `auth`, which must be for
 * `account.owner`. Any `Auth<T>` is accepted regardless of which operation it
 * covers.
 */
declare function updateActiveBalance(options: UpdateActiveBalanceOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface UnwrapArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
  ct: RawTransactionArgument<string>;
  pool: RawTransactionArgument<string>;
  newBalance: TransactionArgument;
  newBalanceProof: TransactionArgument;
  amount: RawTransactionArgument<number | bigint>;
  balanceProof: TransactionArgument;
}
interface UnwrapOptions {
  package?: string;
  arguments: UnwrapArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument, ct: RawTransactionArgument<string>, pool: RawTransactionArgument<string>, newBalance: TransactionArgument, newBalanceProof: TransactionArgument, amount: RawTransactionArgument<number | bigint>, balanceProof: TransactionArgument];
  typeArguments: [string];
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
declare function unwrap(options: UnwrapOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface TryUnwrapArguments {
  account: RawTransactionArgument<string>;
  auth: TransactionArgument;
  ct: RawTransactionArgument<string>;
  pool: RawTransactionArgument<string>;
  newBalance: TransactionArgument;
  newBalanceProof: TransactionArgument;
  amount: RawTransactionArgument<number | bigint>;
  balanceProof: TransactionArgument;
}
interface TryUnwrapOptions {
  package?: string;
  arguments: TryUnwrapArguments | [account: RawTransactionArgument<string>, auth: TransactionArgument, ct: RawTransactionArgument<string>, pool: RawTransactionArgument<string>, newBalance: TransactionArgument, newBalanceProof: TransactionArgument, amount: RawTransactionArgument<number | bigint>, balanceProof: TransactionArgument];
  typeArguments: [string];
}
/**
 * Same as `unwrap` but does not abort if the balance proof fails. Instead, it
 * emits a `TryUnwrapFailedEvent` and returns a zero-value coin.
 */
declare function tryUnwrap(options: TryUnwrapOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface OwnerArguments {
  account: RawTransactionArgument<string>;
}
interface OwnerOptions {
  package?: string;
  arguments: OwnerArguments | [account: RawTransactionArgument<string>];
}
declare function owner(options: OwnerOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface SetBalanceByIssuerArguments {
  t: RawTransactionArgument<string>;
  account: RawTransactionArgument<string>;
  newBalance: TransactionArgument;
}
interface SetBalanceByIssuerOptions {
  package?: string;
  arguments: SetBalanceByIssuerArguments | [t: RawTransactionArgument<string>, account: RawTransactionArgument<string>, newBalance: TransactionArgument];
  typeArguments: [string];
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
declare function setBalanceByIssuer(options: SetBalanceByIssuerOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface IssueFreezeCapArguments {
  ct: RawTransactionArgument<string>;
  T: RawTransactionArgument<string>;
  addr: RawTransactionArgument<string>;
}
interface IssueFreezeCapOptions {
  package?: string;
  arguments: IssueFreezeCapArguments | [ct: RawTransactionArgument<string>, T: RawTransactionArgument<string>, addr: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Allow the given address to freeze the token globally or freeze individual
 * accounts (via the ManagementCap). Only the issuer can unfreeze (globally or
 * per-account). Aborts if the address already has the freeze capability.
 */
declare function issueFreezeCap(options: IssueFreezeCapOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface RevokeFreezeCapArguments {
  ct: RawTransactionArgument<string>;
  T: RawTransactionArgument<string>;
  addr: RawTransactionArgument<string>;
}
interface RevokeFreezeCapOptions {
  package?: string;
  arguments: RevokeFreezeCapArguments | [ct: RawTransactionArgument<string>, T: RawTransactionArgument<string>, addr: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Revoke the freeze capability from the given address. Aborts if the address does
 * not have the freeze capability.
 */
declare function revokeFreezeCap(options: RevokeFreezeCapOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface GlobalFreezeArguments {
  ct: RawTransactionArgument<string>;
}
interface GlobalFreezeOptions {
  package?: string;
  arguments: GlobalFreezeArguments | [ct: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Freeze the token globally. This prevents any transfers from happening until the
 * token is unfrozen again.
 */
declare function globalFreeze(options: GlobalFreezeOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface GlobalUnfreezeArguments {
  ct: RawTransactionArgument<string>;
  Cap: RawTransactionArgument<string>;
}
interface GlobalUnfreezeOptions {
  package?: string;
  arguments: GlobalUnfreezeArguments | [ct: RawTransactionArgument<string>, Cap: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Unfreeze the token globally. This allows transfers to happen again and can only
 * be done by the token issuer.
 */
declare function globalUnfreeze(options: GlobalUnfreezeOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface AccountFreezeArguments {
  ct: RawTransactionArgument<string>;
  account: RawTransactionArgument<string>;
}
interface AccountFreezeOptions {
  package?: string;
  arguments: AccountFreezeArguments | [ct: RawTransactionArgument<string>, account: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Freeze the given account for token `T`. A frozen account cannot transfer,
 * receive, wrap, or unwrap until unfrozen. Only addresses in `ct.freeze_admins`
 * may call this.
 */
declare function accountFreeze(options: AccountFreezeOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface AccountUnfreezeArguments {
  Cap: RawTransactionArgument<string>;
  account: RawTransactionArgument<string>;
}
interface AccountUnfreezeOptions {
  package?: string;
  arguments: AccountUnfreezeArguments | [Cap: RawTransactionArgument<string>, account: RawTransactionArgument<string>];
  typeArguments: [string];
}
/**
 * Unfreeze the given account for token `T`. Only the token issuer (holder of
 * `&TreasuryCap<T>`) may call this. The asymmetry — admins freeze, only the issuer
 * unfreezes — mirrors `global_freeze` / `global_unfreeze`.
 */
declare function accountUnfreeze(options: AccountUnfreezeOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface SetPolicyArguments {
  ct: RawTransactionArgument<string>;
  T: RawTransactionArgument<string>;
  permissionedOperations: RawTransactionArgument<Array<number>>;
}
interface SetPolicyOptions {
  package?: string;
  arguments: SetPolicyArguments | [ct: RawTransactionArgument<string>, T: RawTransactionArgument<string>, permissionedOperations: RawTransactionArgument<Array<number>>];
  typeArguments: [string, string];
}
/**
 * Set a policy for the confidential token. This allows implementing permissioned
 * operations, but only the witness type is stored here - the logic must be handled
 * in the corresponding flows. See `register_permissioned` for an example of how
 * this can be implemented. Changing the witness type will break all in-flight
 * permissioned calls using the old witness, and thus highly discouraged.
 */
declare function setPolicy(options: SetPolicyOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
interface UpdateAuditorsArguments {
  ct: RawTransactionArgument<string>;
  Cap: RawTransactionArgument<string>;
  publicKeys: TransactionArgument;
  bumpRecommendedMin: RawTransactionArgument<boolean>;
}
interface UpdateAuditorsOptions {
  package?: string;
  arguments: UpdateAuditorsArguments | [ct: RawTransactionArgument<string>, Cap: RawTransactionArgument<string>, publicKeys: TransactionArgument, bumpRecommendedMin: RawTransactionArgument<boolean>];
  typeArguments: [string];
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
declare function updateAuditors(options: UpdateAuditorsOptions): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
//#endregion
export { contra_d_exports };