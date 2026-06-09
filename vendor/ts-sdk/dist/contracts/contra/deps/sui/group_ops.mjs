import { MoveStruct } from "../../../utils/index.mjs";
import { bcs } from "@mysten/sui/bcs";
const Element = new MoveStruct({
	name: `0x2::group_ops::Element<phantom T>`,
	fields: { bytes: bcs.vector(bcs.u8()) }
});
//#endregion
export { Element };
