import { MoveStruct, normalizeMoveArguments } from "../utils/index.mjs";
import { Element } from "./deps/sui/group_ops.mjs";
import { KeyConsistencyProof } from "./nizk.mjs";
import { MultiRecipientEncryption } from "./twisted_elgamal.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/auditors.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
const $moduleName = "@local-pkg/contra::auditors";
const Auditors = new MoveStruct({
	name: `${$moduleName}::Auditors`,
	fields: {
		pks: bcs.vector(Element),
		version: bcs.u32(),
		recommended_min_version: bcs.u32()
	}
});
const VerifiedKeyEncryption = new MoveStruct({
	name: `${$moduleName}::VerifiedKeyEncryption`,
	fields: {
		ciphertext: bcs.vector(MultiRecipientEncryption),
		version: bcs.u32()
	}
});
new MoveStruct({
	name: `${$moduleName}::KeyEncryption`,
	fields: {
		ciphertext: bcs.vector(MultiRecipientEncryption),
		proof: KeyConsistencyProof,
		range_proof: bcs.vector(bcs.u8())
	}
});
function newKeyEncryption(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = [
		"vector<null>",
		null,
		"vector<u8>"
	];
	const parameterNames = [
		"ciphertext",
		"proof",
		"rangeProof"
	];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "auditors",
		function: "new_key_encryption",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
//#endregion
export { Auditors, VerifiedKeyEncryption, newKeyEncryption };
