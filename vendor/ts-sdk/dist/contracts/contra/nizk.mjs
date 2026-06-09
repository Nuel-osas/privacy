import { MoveStruct } from "../utils/index.mjs";
import { Element } from "./deps/sui/group_ops.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/nizk.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
const $moduleName = "@local-pkg/contra::nizk";
const KeyConsistencyProof = new MoveStruct({
	name: `${$moduleName}::KeyConsistencyProof`,
	fields: {
		a1: bcs.vector(Element),
		a2: bcs.vector(Element),
		a3: Element,
		z1: bcs.vector(Element),
		z2: bcs.vector(Element)
	}
});
const ElGamalProof = new MoveStruct({
	name: `${$moduleName}::ElGamalProof`,
	fields: {
		a: Element,
		b: Element,
		z1: Element,
		z2: Element
	}
});
new MoveStruct({
	name: `${$moduleName}::DdhProof`,
	fields: {
		a: Element,
		b: Element,
		z: Element
	}
});
//#endregion
export { ElGamalProof, KeyConsistencyProof };
