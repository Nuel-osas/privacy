import { MoveStruct, MoveTuple } from "../utils/index.mjs";
import * as _$_mysten_sui_bcs0 from "@mysten/sui/bcs";

//#region src/contracts/contra/events.d.ts
declare namespace events_d_exports {
  export { AccountFreezeEvent, AccountUnfreezeEvent, GlobalFreezeEvent, GlobalUnfreezeEvent, MergeDepositsEvent, NewConfidentialTokenEvent, NewRegistrationEvent, PolicyUpdateEvent, SetBalanceByIssuerEvent, TransferEvent, TrySetPublicKeyFailedEvent, TryTransferFailedEvent, TryUnwrapFailedEvent, UnwrapEvent, UpdateAuditorsEvent, UpdateBalanceEvent, UpdatedPublicKeyEvent, WrapEvent };
}
declare const NewConfidentialTokenEvent: MoveTuple<readonly [_$_mysten_sui_bcs0.BcsType<boolean, boolean, "bool">], "@local-pkg/contra::events::NewConfidentialTokenEvent<phantom T>">;
declare const PolicyUpdateEvent: MoveTuple<readonly [_$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
  length: number;
}, string>], "@local-pkg/contra::events::PolicyUpdateEvent<phantom T, phantom W>">;
declare const NewRegistrationEvent: MoveStruct<{
  owner: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  pk: MoveStruct<{
    bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
      length: number;
    }, string>;
  }, "0x2::group_ops::Element<phantom T>">;
  verified_key_encryption: MoveStruct<{
    ciphertext: _$_mysten_sui_bcs0.BcsType<{
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
    version: _$_mysten_sui_bcs0.BcsType<number, number, "u32">;
  }, "@local-pkg/contra::auditors::VerifiedKeyEncryption">;
}, "@local-pkg/contra::events::NewRegistrationEvent<phantom T>">;
declare const UpdatedPublicKeyEvent: MoveStruct<{
  owner: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  new_pk: MoveStruct<{
    bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
      length: number;
    }, string>;
  }, "0x2::group_ops::Element<phantom T>">;
  verified_key_encryption: MoveStruct<{
    ciphertext: _$_mysten_sui_bcs0.BcsType<{
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
    version: _$_mysten_sui_bcs0.BcsType<number, number, "u32">;
  }, "@local-pkg/contra::auditors::VerifiedKeyEncryption">;
}, "@local-pkg/contra::events::UpdatedPublicKeyEvent<phantom T>">;
declare const WrapEvent: MoveStruct<{
  receiver: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  amount: _$_mysten_sui_bcs0.BcsType<string, string | number | bigint, "u64">;
  memo: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
    length: number;
  }, string>;
}, "@local-pkg/contra::events::WrapEvent<phantom T>">;
declare const TransferEvent: MoveStruct<{
  sender: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  sender_pk: MoveStruct<{
    bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
      length: number;
    }, string>;
  }, "0x2::group_ops::Element<phantom T>">;
  seed_point: MoveStruct<{
    bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
      length: number;
    }, string>;
  }, "0x2::group_ops::Element<phantom T>">;
  batch_index: _$_mysten_sui_bcs0.BcsType<number, number, "u8">;
  receiver: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  receiver_pk: MoveStruct<{
    bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
      length: number;
    }, string>;
  }, "0x2::group_ops::Element<phantom T>">;
  encrypted_amount_receiver: MoveStruct<{
    l0: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    l1: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    l2: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    l3: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
  }, "@local-pkg/contra::encrypted_amount::EncryptedAmount">;
  memo: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
    length: number;
  }, string>;
}, "@local-pkg/contra::events::TransferEvent<phantom T>">;
declare const MergeDepositsEvent: MoveStruct<{
  account: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::events::MergeDepositsEvent<phantom T>">;
declare const TryTransferFailedEvent: MoveTuple<readonly [_$_mysten_sui_bcs0.BcsType<boolean, boolean, "bool">], "@local-pkg/contra::events::TryTransferFailedEvent">;
declare const TryUnwrapFailedEvent: MoveTuple<readonly [_$_mysten_sui_bcs0.BcsType<boolean, boolean, "bool">], "@local-pkg/contra::events::TryUnwrapFailedEvent">;
declare const TrySetPublicKeyFailedEvent: MoveTuple<readonly [_$_mysten_sui_bcs0.BcsType<boolean, boolean, "bool">], "@local-pkg/contra::events::TrySetPublicKeyFailedEvent">;
declare const UnwrapEvent: MoveStruct<{
  sender: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  amount: _$_mysten_sui_bcs0.BcsType<string, string | number | bigint, "u64">;
}, "@local-pkg/contra::events::UnwrapEvent<phantom T>">;
declare const UpdateBalanceEvent: MoveStruct<{
  account: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::events::UpdateBalanceEvent<phantom T>">;
declare const SetBalanceByIssuerEvent: MoveStruct<{
  account: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  new_balance: MoveStruct<{
    l0: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    l1: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    l2: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
    l3: MoveStruct<{
      ciphertext: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
      decryption_handle: MoveStruct<{
        bytes: _$_mysten_sui_bcs0.BcsType<number[], Iterable<number> & {
          length: number;
        }, string>;
      }, "0x2::group_ops::Element<phantom T>">;
    }, "@local-pkg/contra::twisted_elgamal::Encryption">;
  }, "@local-pkg/contra::encrypted_amount::EncryptedAmount">;
}, "@local-pkg/contra::events::SetBalanceByIssuerEvent<phantom T>">;
declare const GlobalFreezeEvent: MoveTuple<readonly [_$_mysten_sui_bcs0.BcsType<boolean, boolean, "bool">], "@local-pkg/contra::events::GlobalFreezeEvent<phantom T>">;
declare const GlobalUnfreezeEvent: MoveTuple<readonly [_$_mysten_sui_bcs0.BcsType<boolean, boolean, "bool">], "@local-pkg/contra::events::GlobalUnfreezeEvent<phantom T>">;
declare const AccountFreezeEvent: MoveStruct<{
  admin: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
  account: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::events::AccountFreezeEvent<phantom T>">;
declare const AccountUnfreezeEvent: MoveStruct<{
  account: _$_mysten_sui_bcs0.BcsType<string, string | Uint8Array<ArrayBufferLike>, "bytes[32]">;
}, "@local-pkg/contra::events::AccountUnfreezeEvent<phantom T>">;
declare const UpdateAuditorsEvent: MoveStruct<{
  public_keys: _$_mysten_sui_bcs0.BcsType<{
    bytes: number[];
  }[], Iterable<{
    bytes: Iterable<number> & {
      length: number;
    };
  }> & {
    length: number;
  }, string>;
  version: _$_mysten_sui_bcs0.BcsType<number, number, "u32">;
  recommended_min_version: _$_mysten_sui_bcs0.BcsType<number, number, "u32">;
}, "@local-pkg/contra::events::UpdateAuditorsEvent<phantom T>">;
//#endregion
export { TransferEvent, events_d_exports };