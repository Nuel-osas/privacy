import { MoveStruct } from "../utils/index.mjs";
import { Element } from "./deps/sui/group_ops.mjs";
import { bcs } from "@mysten/sui/bcs";
//#region src/contracts/contra/twisted_elgamal.ts
/**************************************************************
* THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
**************************************************************/
const $moduleName = "@local-pkg/contra::twisted_elgamal";
const MultiRecipientEncryption = new MoveStruct({
	name: `${$moduleName}::MultiRecipientEncryption`,
	fields: {
		ciphertext: Element,
		decryption_handles: bcs.vector(Element)
	}
});
const Encryption = new MoveStruct({
	name: `${$moduleName}::Encryption`,
	fields: {
		ciphertext: Element,
		decryption_handle: Element
	}
});
//#endregion
export { Encryption, MultiRecipientEncryption };
