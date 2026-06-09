import { MoveStruct } from "../utils/index.mjs";
import { TypeName } from "./deps/std/type_name.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/policy.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
/**
* Access policies for `ConfidentialToken<T>`. A `Policy` records the set of
* operations that require a witness of a specific type, used to gate permissioned
* versions of those operations.
*/
const $moduleName = "@local-pkg/contra::policy";
const Policy = new MoveStruct({
	name: `${$moduleName}::Policy`,
	fields: {
		witness_type: TypeName,
		permissioned_operations_bitmap: bcs.u32()
	}
});
new MoveStruct({
	name: `${$moduleName}::Auth<phantom T>`,
	fields: {
		/** Bitmap with bit `o` set iff operation `o` is allowed. */
		operations: bcs.u32(),
		owner: bcs.Address
	}
});
//#endregion
export { Policy };
