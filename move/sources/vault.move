// Copyright (c) 2026 Exorbi Labs
// SPDX-License-Identifier: Apache-2.0

/// Confidential, time-locked savings vault on Sui.
///
/// A `Vault<T>` is a shared object that OWNS a Contra confidential `Account`
/// (the account's `owner` is the vault's object address) and gates every
/// withdrawal behind an unlock timestamp. The running balance lives on-chain as
/// Twisted-ElGamal ciphertext encrypted under the depositor's viewing key, so
/// only the owner — or a registered auditor — can read it, while spend authority
/// belongs to the vault object and is released only after `unlock_ms`.
///
/// ### Key Features:
///
/// - Object-owned confidential account (Contra `authorize_as_object`)
/// - `Clock`-gated, owner-only withdrawal
/// - Permissionless top-ups (public wrap or confidential transfer-in)
/// - Hidden running balance; decryption decoupled from spend authority
///
/// ### Security:
///
/// This module is the SOLE holder of `&mut self.id`. No public function returns
/// an object `Auth<T>`, and the only fund-exit path (`withdraw`) is owner- and
/// time-gated. This is deliberate: Contra's `batched_transfer` is authenticated
/// by `account.owner` alone (it is NOT policy-gateable), so an exposed
/// `authorize_as_object` on the vault would let funds be confidentially
/// transferred out before unlock. Encapsulating the UID is what makes the lock
/// hold — the `set_policy` unwrap gate is defense-in-depth, not the lock.
///
/// ### State Machine:
///
/// Active(unlock_ms, locked_at_ms) → Withdrawn(withdrawn_at_ms)  (terminal)
module contra_vault::vault;

use sui::clock::Clock;
use sui::coin::{Coin, TreasuryCap};
use sui::deny_list::DenyList;
use sui::event::emit;
use sui::group_ops::Element;
use sui::ristretto255::G;

use contra::auditors::KeyEncryption;
use contra::contra::{Self, ConfidentialToken, Account, AccountRegistry, Pool};
use contra::encrypted_amount::{EncryptedAmount, WellFormedProof};
use contra::nizk::DdhProof;
use contra::policy::Auth;

// === Structs ===

public struct Vault<phantom T> has key {
    id: UID,
    owner: address,
    state: VaultState,
}

// === Enums ===

public enum VaultState has copy, drop, store {
    Active { unlock_ms: u64, locked_at_ms: u64 },
    Withdrawn(u64),
}

// === Witness ===

/// Constructible only inside this module — installs the unwrap policy so direct
/// `contra::unwrap` calls fail and every unwrap must route through `withdraw`.
public struct VaultWitness has drop {}

// === Events ===

public struct VaultCreatedEvent has copy, drop {
    vault_id: ID,
    owner: address,
    account_owner: address,
    unlock_ms: u64,
}

public struct VaultDepositedEvent has copy, drop {
    vault_id: ID,
    boundary_public: bool,
}

public struct VaultWithdrawnEvent has copy, drop {
    vault_id: ID,
    owner: address,
    withdrawn_at_ms: u64,
}

// === Constants ===

/// Mirrors `contra::PERMISSIONED_UNWRAP`. Keep in sync with the pinned Contra rev.
const UNWRAP_OP: u8 = 2;

// === Errors ===
// State errors (10-19)
const ENotActiveState: u64 = 10;

// Validation errors (20-29)
const EUnlockInPast: u64 = 20;

// Permission errors (40-49)
const ENotOwner: u64 = 40;
const EStillLocked: u64 = 41;

// === Public Functions ===

/// Install the unwrap policy so unwrap is forced through this module's witness.
/// Call once per `ConfidentialToken<T>` (defense-in-depth alongside the UID
/// encapsulation that is the real lock).
public fun install_policy<T>(ct: &mut ConfidentialToken<T>, cap: &mut TreasuryCap<T>) {
    contra::set_policy<T, VaultWitness>(ct, cap, vector[UNWRAP_OP]);
}

/// Create a time-locked vault that owns a fresh confidential account. The
/// account is encrypted under `depositor_pk` (the owner's viewing key), so only
/// the owner can read the balance; spend authority is the vault object + lock.
public fun new<T>(
    registry: &mut AccountRegistry,
    ct: &ConfidentialToken<T>,
    depositor_pk: Element<G>,
    key_encryption: Option<KeyEncryption>,
    unlock_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(unlock_ms > clock.timestamp_ms(), EUnlockInPast);

    let mut self = Vault<T> {
        id: object::new(ctx),
        owner: ctx.sender(),
        state: VaultState::Active { unlock_ms, locked_at_ms: clock.timestamp_ms() },
    };

    let vault_id = object::uid_to_inner(&self.id);
    let account_owner = object::uid_to_address(&self.id);
    let auth = self.object_auth(ct);
    let mut account = contra::new_account(registry, account_owner);
    contra::register(&mut account, &auth, ct, depositor_pk, key_encryption);
    contra::share_account(account);

    emit(VaultCreatedEvent { vault_id, owner: self.owner, account_owner, unlock_ms });
    transfer::share_object(self);
}

/// Top up the vault from public coins (wrap → merge). The deposit AMOUNT is
/// public on the coin layer; the resulting balance stays hidden. Permissionless.
public fun deposit_public<T>(
    self: &mut Vault<T>,
    account: &mut Account,
    ct: &ConfidentialToken<T>,
    deny_list: &DenyList,
    pool: &Pool<T>,
    coin: Coin<T>,
    memo: vector<u8>,
) {
    assert!(self.is_active_state(), ENotActiveState);
    let auth = self.object_auth(ct);
    contra::wrap(account, &auth, ct, deny_list, pool, coin, memo);
    contra::merge(account, &auth);
    emit(VaultDepositedEvent { vault_id: object::uid_to_inner(&self.id), boundary_public: true });
}

/// Fold a confidential transfer-in (sent to the vault account out-of-band) into
/// the hidden balance. The deposit amount stays HIDDEN. Permissionless.
public fun merge_pending<T>(self: &mut Vault<T>, account: &mut Account, ct: &ConfidentialToken<T>) {
    assert!(self.is_active_state(), ENotActiveState);
    let auth = self.object_auth(ct);
    contra::merge(account, &auth);
    emit(VaultDepositedEvent { vault_id: object::uid_to_inner(&self.id), boundary_public: false });
}

/// Owner-only, time-gated withdrawal: unwraps the confidential balance back to a
/// public `Coin<T>` and sends it to the owner. Aborts before `unlock_ms`. The
/// proof args are produced client-side by the Contra SDK.
public fun withdraw<T>(
    self: &mut Vault<T>,
    account: &mut Account,
    ct: &ConfidentialToken<T>,
    deny_list: &DenyList,
    pool: &mut Pool<T>,
    clock: &Clock,
    new_balance: EncryptedAmount,
    new_balance_proof: WellFormedProof,
    amount: u64,
    balance_proof: DdhProof,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == self.owner, ENotOwner);
    assert!(self.is_unlocked(clock), EStillLocked);

    let account_owner = object::uid_to_address(&self.id);
    let auth = contra::authorize_with_witness(ct, UNWRAP_OP, account_owner, VaultWitness {});
    let coin = contra::unwrap(
        account,
        &auth,
        ct,
        deny_list,
        pool,
        new_balance,
        new_balance_proof,
        amount,
        &balance_proof,
        ctx,
    );
    transfer::public_transfer(coin, self.owner);

    let withdrawn_at_ms = clock.timestamp_ms();
    self.state = VaultState::Withdrawn(withdrawn_at_ms);
    emit(VaultWithdrawnEvent {
        vault_id: object::uid_to_inner(&self.id),
        owner: self.owner,
        withdrawn_at_ms,
    });
}

// === View Functions ===

public fun owner<T>(self: &Vault<T>): address { self.owner }

public fun unlock_ms<T>(self: &Vault<T>): u64 {
    match (&self.state) {
        VaultState::Active { unlock_ms, .. } => *unlock_ms,
        VaultState::Withdrawn(_) => 0,
    }
}

public fun is_active_state<T>(self: &Vault<T>): bool {
    match (&self.state) {
        VaultState::Active { .. } => true,
        _ => false,
    }
}

public fun is_withdrawn_state<T>(self: &Vault<T>): bool {
    match (&self.state) {
        VaultState::Withdrawn(_) => true,
        _ => false,
    }
}

public fun is_unlocked<T>(self: &Vault<T>, clock: &Clock): bool {
    match (&self.state) {
        VaultState::Active { unlock_ms, .. } => clock.timestamp_ms() >= *unlock_ms,
        VaultState::Withdrawn(_) => false,
    }
}

// === Private Helpers ===

/// The vault's object-owner authorization. PRIVATE — never returned or exposed,
/// so funds can never leave the account except through the gated `withdraw`.
fun object_auth<T>(self: &mut Vault<T>, ct: &ConfidentialToken<T>): Auth<T> {
    contra::authorize_as_object(ct, &mut self.id)
}

// === Test Only ===

#[test_only]
public fun new_for_testing<T>(
    owner: address,
    unlock_ms: u64,
    locked_at_ms: u64,
    ctx: &mut TxContext,
): Vault<T> {
    Vault<T> {
        id: object::new(ctx),
        owner,
        state: VaultState::Active { unlock_ms, locked_at_ms },
    }
}

#[test_only]
public fun mark_withdrawn_for_testing<T>(self: &mut Vault<T>, at_ms: u64) {
    self.state = VaultState::Withdrawn(at_ms);
}
