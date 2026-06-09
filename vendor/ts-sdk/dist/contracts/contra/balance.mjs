import { MoveStruct } from "../utils/index.mjs";
import { EncryptedAmount, WellFormedEncryptedAmount } from "./encrypted_amount.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/balance.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
/**
* Confidential value: `EncryptedBalance<T>` (a single encrypted amount with a
* count of merged u16-bounded values that bounds limb growth), plus the linear
* coin types `PublicCoin<T>` and `EncryptedCoin<T>` that move value in and out.
*/
const $moduleName = "@local-pkg/contra::balance";
const EncryptedBalance = new MoveStruct({
	name: `${$moduleName}::EncryptedBalance<phantom T>`,
	fields: {
		amount: EncryptedAmount,
		upper_bound: bcs.u16()
	}
});
const PublicCoin = new MoveStruct({
	name: `${$moduleName}::PublicCoin<phantom T>`,
	fields: { value: bcs.u64() }
});
const EncryptedCoin = new MoveStruct({
	name: `${$moduleName}::EncryptedCoin<phantom T>`,
	fields: { amount: WellFormedEncryptedAmount }
});
//#endregion
export { EncryptedBalance, EncryptedCoin, PublicCoin };
