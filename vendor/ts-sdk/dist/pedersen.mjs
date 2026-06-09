import { G, H, mul, randomScalar } from "./ristretto255.mjs";
import { equalBytes } from "@noble/curves/utils.js";
//#region src/pedersen.ts
var PedersenCommitment = class PedersenCommitment {
	constructor(value, blinding) {
		this.p = mul(H, value).add(mul(G, blinding));
	}
	static commit(value) {
		const blinding = randomScalar();
		return [new PedersenCommitment(value, blinding), blinding];
	}
	verify(value, blinding) {
		const expected = new PedersenCommitment(value, blinding);
		return equalBytes(this.p.toBytes(), expected.p.toBytes());
	}
};
//#endregion
export { PedersenCommitment };
