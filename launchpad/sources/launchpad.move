// Copyright (c) 2026 Exorbi Labs
// SPDX-License-Identifier: Apache-2.0

/// Confidential token launchpad.
///
/// Turn a freshly-published `Coin<T>` into a confidential token in one call.
/// Two launch modes:
///
/// - **Open** (`create_open_token`) — the `TreasuryCap` is surrendered into a
///   shared `OpenMinter<T>`, so *anyone* can mint (faucet-style, capped per
///   call). No gatekeeper. Best for an open demo/community token.
/// - **Controlled** (`create_token`) — the creator keeps the `TreasuryCap` and
///   is the sole minter.
///
/// Either way confidential mode is on (a Contra `ConfidentialToken<T>` + reserve
/// `Pool<T>` are created), so holders wrap their coins and send confidentially.
///
/// ### Key Features:
///
/// - Open (permissionless) or controlled minting, chosen at launch
/// - Auditor key chosen at launch (compliance) or omitted (owner-only privacy)
/// - On-chain, event-indexed launch registry for platform discovery
///
/// Note: minting a brand-new `Coin<T>` type still requires publishing the coin
/// module (Sui has no runtime coin-type creation). The platform front-end
/// publishes a templated coin, then calls a `create_*` function with its
/// `TreasuryCap`.
module confidential_launchpad::launchpad;

use std::string::String;
use std::type_name::{Self, TypeName};

use sui::coin::{Self, TreasuryCap};
use sui::event::emit;
use sui::group_ops::Element;
use sui::ristretto255::G;

use contra::contra::{Self, ManagementCap, TokenRegistry};

// === Structs ===

public struct Launchpad has key {
    id: UID,
    launches: u64,
}

public struct LaunchpadAdminCap has key, store {
    id: UID,
}

/// Holds a token's `TreasuryCap` and exposes permissionless, capped minting.
public struct OpenMinter<phantom T> has key {
    id: UID,
    treasury: TreasuryCap<T>,
    per_mint_cap: u64, // max units per `open_mint` call; 0 = unlimited
    total_minted: u64,
}

// === Events ===

public struct TokenLaunchedEvent has copy, drop {
    token_type: TypeName,
    creator: address,
    name: String,
    symbol: String,
    initial_supply: u64,
    open_mint: bool,
    auditable: bool,
}

public struct MintedEvent has copy, drop {
    token_type: TypeName,
    to: address,
    amount: u64,
}

// === Errors ===
// Validation errors (20-29)
const EEmptySymbol: u64 = 20;
const EZeroAmount: u64 = 21;

// Constraint errors (30-39)
const EExceedsMintCap: u64 = 30;

// === Init ===

fun init(ctx: &mut TxContext) {
    transfer::share_object(Launchpad { id: object::new(ctx), launches: 0 });
    transfer::transfer(LaunchpadAdminCap { id: object::new(ctx) }, ctx.sender());
}

// === Public Functions ===

/// Launch an OPEN confidential token: anyone can mint via the shared
/// `OpenMinter<T>` (capped per call by `per_mint_cap`, 0 = unlimited), and send
/// confidentially. The `TreasuryCap` is surrendered to the open minter. Returns
/// the `ManagementCap<T>` (auditor rotation, freeze admins).
public fun create_open_token<T>(
    launchpad: &mut Launchpad,
    registry: &mut TokenRegistry,
    mut treasury: TreasuryCap<T>,
    auditor_public_keys: vector<Element<G>>,
    name: String,
    symbol: String,
    per_mint_cap: u64,
    ctx: &mut TxContext,
): ManagementCap<T> {
    assert!(symbol.length() > 0, EEmptySymbol);

    let auditable = !auditor_public_keys.is_empty();
    let (ct, management_cap) = contra::new_confidential_token<T>(registry, &mut treasury, auditor_public_keys, ctx);
    contra::share_confidential_token(ct);

    transfer::share_object(OpenMinter<T> {
        id: object::new(ctx),
        treasury,
        per_mint_cap,
        total_minted: 0,
    });

    launchpad.launches = launchpad.launches + 1;
    emit(TokenLaunchedEvent {
        token_type: type_name::with_defining_ids<T>(),
        creator: ctx.sender(),
        name,
        symbol,
        initial_supply: 0,
        open_mint: true,
        auditable,
    });

    management_cap
}

/// Launch a CONTROLLED confidential token: the creator keeps the `TreasuryCap`
/// and is the sole minter. Mints `initial_supply` to the creator. Returns the
/// `ManagementCap<T>`.
#[allow(lint(self_transfer))]
public fun create_token<T>(
    launchpad: &mut Launchpad,
    registry: &mut TokenRegistry,
    treasury: &mut TreasuryCap<T>,
    auditor_public_keys: vector<Element<G>>,
    name: String,
    symbol: String,
    initial_supply: u64,
    ctx: &mut TxContext,
): ManagementCap<T> {
    assert!(symbol.length() > 0, EEmptySymbol);

    let auditable = !auditor_public_keys.is_empty();
    let (ct, management_cap) = contra::new_confidential_token<T>(registry, treasury, auditor_public_keys, ctx);
    contra::share_confidential_token(ct);

    if (initial_supply > 0) {
        transfer::public_transfer(coin::mint(treasury, initial_supply, ctx), ctx.sender());
    };

    launchpad.launches = launchpad.launches + 1;
    emit(TokenLaunchedEvent {
        token_type: type_name::with_defining_ids<T>(),
        creator: ctx.sender(),
        name,
        symbol,
        initial_supply,
        open_mint: false,
        auditable,
    });

    management_cap
}

/// Permissionless mint of an OPEN token to the caller (capped per call). Anyone
/// can call this. The caller then wraps the coins via Contra to go confidential.
#[allow(lint(self_transfer))]
public fun open_mint<T>(minter: &mut OpenMinter<T>, amount: u64, ctx: &mut TxContext) {
    assert!(amount > 0, EZeroAmount);
    assert!(minter.per_mint_cap == 0 || amount <= minter.per_mint_cap, EExceedsMintCap);
    minter.total_minted = minter.total_minted + amount;
    transfer::public_transfer(coin::mint(&mut minter.treasury, amount, ctx), ctx.sender());
    emit(MintedEvent { token_type: type_name::with_defining_ids<T>(), to: ctx.sender(), amount });
}

/// Mint more supply of a CONTROLLED token to any wallet (issuer only — needs the
/// `TreasuryCap`).
public fun mint_to<T>(
    treasury: &mut TreasuryCap<T>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    transfer::public_transfer(coin::mint(treasury, amount, ctx), recipient);
    emit(MintedEvent { token_type: type_name::with_defining_ids<T>(), to: recipient, amount });
}

// === View Functions ===

public fun launches(self: &Launchpad): u64 { self.launches }

public fun per_mint_cap<T>(self: &OpenMinter<T>): u64 { self.per_mint_cap }

public fun total_minted<T>(self: &OpenMinter<T>): u64 { self.total_minted }

// === Test Only ===

#[test_only]
public fun new_for_testing(ctx: &mut TxContext): Launchpad {
    Launchpad { id: object::new(ctx), launches: 0 }
}

#[test_only]
public fun new_open_minter_for_testing<T>(
    treasury: TreasuryCap<T>,
    per_mint_cap: u64,
    ctx: &mut TxContext,
): OpenMinter<T> {
    OpenMinter { id: object::new(ctx), treasury, per_mint_cap, total_minted: 0 }
}
