// Copyright (c) 2026 Exorbi Labs
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module confidential_launchpad::launchpad_tests;

use std::unit_test::{assert_eq, destroy};
use sui::coin;

use confidential_launchpad::launchpad;

public struct ACME has drop {}

#[test]
fun test_launchpad_starts_empty() {
    let ctx = &mut tx_context::dummy();
    let pad = launchpad::new_for_testing(ctx);
    assert_eq!(pad.launches(), 0);
    destroy(pad);
}

#[test]
fun test_mint_to_increases_supply() {
    let ctx = &mut tx_context::dummy();
    let mut treasury = coin::create_treasury_cap_for_testing<ACME>(ctx);

    launchpad::mint_to<ACME>(&mut treasury, 1_000_000, @0xB0B, ctx);
    launchpad::mint_to<ACME>(&mut treasury, 250_000, @0xA11CE, ctx);

    assert_eq!(coin::total_supply(&treasury), 1_250_000);
    destroy(treasury);
}

#[test]
fun test_open_mint_anyone_can_mint() {
    let ctx = &mut tx_context::dummy();
    let treasury = coin::create_treasury_cap_for_testing<ACME>(ctx);
    let mut minter = launchpad::new_open_minter_for_testing<ACME>(treasury, 1_000_000, ctx);

    launchpad::open_mint<ACME>(&mut minter, 1_000_000, ctx); // exactly at cap
    launchpad::open_mint<ACME>(&mut minter, 400_000, ctx);

    assert_eq!(minter.total_minted(), 1_400_000);
    assert_eq!(minter.per_mint_cap(), 1_000_000);
    destroy(minter);
}

#[test, expected_failure(abort_code = confidential_launchpad::launchpad::EExceedsMintCap)]
fun test_open_mint_rejects_over_cap() {
    let ctx = &mut tx_context::dummy();
    let treasury = coin::create_treasury_cap_for_testing<ACME>(ctx);
    let mut minter = launchpad::new_open_minter_for_testing<ACME>(treasury, 100, ctx);
    launchpad::open_mint<ACME>(&mut minter, 101, ctx); // over the per-mint cap
    abort 0
}
