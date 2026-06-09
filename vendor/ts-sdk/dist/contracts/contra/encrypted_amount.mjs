import { MoveStruct, normalizeMoveArguments } from "../utils/index.mjs";
import { Element } from "./deps/sui/group_ops.mjs";
import { ElGamalProof } from "./nizk.mjs";
import { Encryption } from "./twisted_elgamal.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/encrypted_amount.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
const $moduleName = "@local-pkg/contra::encrypted_amount";
const EncryptedAmount = new MoveStruct({
	name: `${$moduleName}::EncryptedAmount`,
	fields: {
		l0: Encryption,
		l1: Encryption,
		l2: Encryption,
		l3: Encryption
	}
});
const WellFormedEncryptedAmount = new MoveStruct({
	name: `${$moduleName}::WellFormedEncryptedAmount`,
	fields: {
		amount: EncryptedAmount,
		pk: Element
	}
});
const ConsistencyProof = new MoveStruct({
	name: `${$moduleName}::ConsistencyProof`,
	fields: {
		p0: ElGamalProof,
		p1: ElGamalProof,
		p2: ElGamalProof,
		p3: ElGamalProof
	}
});
new MoveStruct({
	name: `${$moduleName}::WellFormedProof`,
	fields: {
		range_proofs: bcs.vector(bcs.vector(bcs.u8())),
		consistency_proofs: bcs.vector(ConsistencyProof)
	}
});
/**
* Bundle range proofs and consistency proofs into a `WellFormedProof`. Pass one
* consistency proof per amount and one range proof per
* `batch_sizes(consistency_proofs.length())` chunk, where each chunk's range proof
* covers that chunk's amounts (4 limbs each). Aborts on length mismatch or empty
* `range_proofs[i]`; proofs are not verified here — callers must call `verify`.
*/
function newWellFormedProof(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>", "vector<null>"];
	const parameterNames = ["rangeProofs", "consistencyProofs"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "encrypted_amount",
		function: "new_well_formed_proof",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
//#endregion
export { EncryptedAmount, WellFormedEncryptedAmount, newWellFormedProof };
