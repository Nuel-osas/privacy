// Copyright (c) 2026 Exorbi Labs
// SPDX-License-Identifier: Apache-2.0

#[test_only]
module contra_vault::vault_tests;

use std::unit_test::{assert_eq, destroy};

use contra_vault::vault;

public struct USD has drop {}

const OWNER: address = @0xA11CE;
const LOCKED_AT: u64 = 1_000;
const UNLOCK: u64 = 11_000; // +10s

#[test]
fun test_new_is_active_and_locked() {
    let ctx = &mut tx_context::dummy();
    let v = vault::new_for_testing<USD>(OWNER, UNLOCK, LOCKED_AT, ctx);
    let clock = sui::clock::create_for_testing(ctx);

    assert!(v.is_active_state());
    assert!(!v.is_withdrawn_state());
    assert_eq!(v.owner(), OWNER);
    assert_eq!(v.unlock_ms(), UNLOCK);
    assert!(!v.is_unlocked(&clock)); // clock at 0 < unlock

    destroy(v);
    clock.destroy_for_testing();
}

#[test]
fun test_unlock_boundary() {
    let ctx = &mut tx_context::dummy();
    let v = vault::new_for_testing<USD>(OWNER, UNLOCK, LOCKED_AT, ctx);
    let mut clock = sui::clock::create_for_testing(ctx);

    clock.set_for_testing(UNLOCK - 1);
    assert!(!v.is_unlocked(&clock)); // one ms before — still locked

    clock.set_for_testing(UNLOCK);
    assert!(v.is_unlocked(&clock)); // exactly at unlock — open

    destroy(v);
    clock.destroy_for_testing();
}

#[test]
fun test_withdrawn_is_terminal() {
    let ctx = &mut tx_context::dummy();
    let mut v = vault::new_for_testing<USD>(OWNER, UNLOCK, LOCKED_AT, ctx);
    let mut clock = sui::clock::create_for_testing(ctx);
    clock.set_for_testing(UNLOCK + 5_000);

    v.mark_withdrawn_for_testing(UNLOCK + 5_000);
    assert!(v.is_withdrawn_state());
    assert!(!v.is_active_state());
    assert!(!v.is_unlocked(&clock)); // withdrawn vaults never report unlocked

    destroy(v);
    clock.destroy_for_testing();
}
