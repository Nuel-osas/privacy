import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";
import { MoveStruct, MoveTuple } from "../utils/index.mjs";
import { Element } from "./deps/sui/group_ops.mjs";
import { VerifiedKeyEncryption } from "./auditors.mjs";
import { EncryptedAmount } from "./encrypted_amount.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/events.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
var events_exports = /* @__PURE__ */ __exportAll({
	AccountFreezeEvent: () => AccountFreezeEvent,
	AccountUnfreezeEvent: () => AccountUnfreezeEvent,
	GlobalFreezeEvent: () => GlobalFreezeEvent,
	GlobalUnfreezeEvent: () => GlobalUnfreezeEvent,
	MergeDepositsEvent: () => MergeDepositsEvent,
	NewConfidentialTokenEvent: () => NewConfidentialTokenEvent,
	NewRegistrationEvent: () => NewRegistrationEvent,
	PolicyUpdateEvent: () => PolicyUpdateEvent,
	SetBalanceByIssuerEvent: () => SetBalanceByIssuerEvent,
	TransferEvent: () => TransferEvent,
	TrySetPublicKeyFailedEvent: () => TrySetPublicKeyFailedEvent,
	TryTransferFailedEvent: () => TryTransferFailedEvent,
	TryUnwrapFailedEvent: () => TryUnwrapFailedEvent,
	UnwrapEvent: () => UnwrapEvent,
	UpdateAuditorsEvent: () => UpdateAuditorsEvent,
	UpdateBalanceEvent: () => UpdateBalanceEvent,
	UpdatedPublicKeyEvent: () => UpdatedPublicKeyEvent,
	WrapEvent: () => WrapEvent
});
const $moduleName = "@local-pkg/contra::events";
const NewConfidentialTokenEvent = new MoveTuple({
	name: `${$moduleName}::NewConfidentialTokenEvent<phantom T>`,
	fields: [bcs.bool()]
});
const PolicyUpdateEvent = new MoveTuple({
	name: `${$moduleName}::PolicyUpdateEvent<phantom T, phantom W>`,
	fields: [bcs.vector(bcs.u8())]
});
const NewRegistrationEvent = new MoveStruct({
	name: `${$moduleName}::NewRegistrationEvent<phantom T>`,
	fields: {
		owner: bcs.Address,
		pk: Element,
		verified_key_encryption: VerifiedKeyEncryption
	}
});
const UpdatedPublicKeyEvent = new MoveStruct({
	name: `${$moduleName}::UpdatedPublicKeyEvent<phantom T>`,
	fields: {
		owner: bcs.Address,
		new_pk: Element,
		verified_key_encryption: VerifiedKeyEncryption
	}
});
const WrapEvent = new MoveStruct({
	name: `${$moduleName}::WrapEvent<phantom T>`,
	fields: {
		receiver: bcs.Address,
		amount: bcs.u64(),
		memo: bcs.vector(bcs.u8())
	}
});
const TransferEvent = new MoveStruct({
	name: `${$moduleName}::TransferEvent<phantom T>`,
	fields: {
		sender: bcs.Address,
		sender_pk: Element,
		seed_point: Element,
		batch_index: bcs.u8(),
		receiver: bcs.Address,
		receiver_pk: Element,
		encrypted_amount_receiver: EncryptedAmount,
		memo: bcs.vector(bcs.u8())
	}
});
const MergeDepositsEvent = new MoveStruct({
	name: `${$moduleName}::MergeDepositsEvent<phantom T>`,
	fields: { account: bcs.Address }
});
const TryTransferFailedEvent = new MoveTuple({
	name: `${$moduleName}::TryTransferFailedEvent`,
	fields: [bcs.bool()]
});
const TryUnwrapFailedEvent = new MoveTuple({
	name: `${$moduleName}::TryUnwrapFailedEvent`,
	fields: [bcs.bool()]
});
const TrySetPublicKeyFailedEvent = new MoveTuple({
	name: `${$moduleName}::TrySetPublicKeyFailedEvent`,
	fields: [bcs.bool()]
});
const UnwrapEvent = new MoveStruct({
	name: `${$moduleName}::UnwrapEvent<phantom T>`,
	fields: {
		sender: bcs.Address,
		amount: bcs.u64()
	}
});
const UpdateBalanceEvent = new MoveStruct({
	name: `${$moduleName}::UpdateBalanceEvent<phantom T>`,
	fields: { account: bcs.Address }
});
const SetBalanceByIssuerEvent = new MoveStruct({
	name: `${$moduleName}::SetBalanceByIssuerEvent<phantom T>`,
	fields: {
		account: bcs.Address,
		new_balance: EncryptedAmount
	}
});
const GlobalFreezeEvent = new MoveTuple({
	name: `${$moduleName}::GlobalFreezeEvent<phantom T>`,
	fields: [bcs.bool()]
});
const GlobalUnfreezeEvent = new MoveTuple({
	name: `${$moduleName}::GlobalUnfreezeEvent<phantom T>`,
	fields: [bcs.bool()]
});
const AccountFreezeEvent = new MoveStruct({
	name: `${$moduleName}::AccountFreezeEvent<phantom T>`,
	fields: {
		admin: bcs.Address,
		account: bcs.Address
	}
});
const AccountUnfreezeEvent = new MoveStruct({
	name: `${$moduleName}::AccountUnfreezeEvent<phantom T>`,
	fields: { account: bcs.Address }
});
const UpdateAuditorsEvent = new MoveStruct({
	name: `${$moduleName}::UpdateAuditorsEvent<phantom T>`,
	fields: {
		public_keys: bcs.vector(Element),
		version: bcs.u32(),
		recommended_min_version: bcs.u32()
	}
});
//#endregion
export { TransferEvent, events_exports };
