import { ContraInternalError } from "./error.mjs";
import { scalarToBytes } from "./ristretto255.mjs";
import { ristretto255 } from "@noble/curves/ed25519.js";
import init, { batchRangeProof, verifyBatchRangeProof } from "@contra/bulletproofs-wasm";
//#region src/bp.ts
/**
* Convenience wrappers around the WASM bindings for fastcrypto's batched
* Bulletproof range proofs (`RangeProof::prove_batch` / `verify_batch`).
*
* The bindings live in the `@contra/bulletproofs-wasm` package, whose
* `nodejs` / `web` builds must be generated first (`pnpm build:wasm` in that
* package). The package's `exports` conditions select the right build per
* environment: Node loads the synchronous `nodejs` build (so `init` is a
* no-op), while bundlers pick the `web` build that needs an explicit `init`.
*/
/**
* Initialize the bulletproofs WASM module and return bound, synchronous proof
* functions. In Node the `nodejs` wasm-pack build loads synchronously (init is a no-op); in the
* browser it fetches and instantiates the `.wasm` asset, with `moduleOrPath`
* supplying an explicit URL/bytes when a bundler can't locate it.
*
* Not memoized here — callers cache the result.
*/
async function getBulletproofs(moduleOrPath) {
	await init({ module_or_path: moduleOrPath });
	return {
		batchRangeProver(values, blindings, bitSize) {
			if (values.length !== blindings.length) throw new ContraInternalError(`values.length must equal blindings.length (got ${values.length} and ${blindings.length})`);
			const n = values.length;
			if (n === 0 || (n & n - 1) !== 0) throw new ContraInternalError(`values.length must be a positive power of 2 (got ${n})`);
			const blindingBuf = new Uint8Array(n * 32);
			for (let i = 0; i < n; i++) blindingBuf.set(scalarToBytes(blindings[i]), i * 32);
			const { proof, commitments: flatCommitments } = batchRangeProof(new BigUint64Array(values), blindingBuf, bitSize);
			return {
				proof,
				commitments: Array.from(chunks(flatCommitments, 32), (c) => ristretto255.Point.fromBytes(c))
			};
		},
		verifyBatchRangeProof(proof, commitments, bitSize) {
			const commitmentBuf = new Uint8Array(commitments.length * 32);
			for (let i = 0; i < commitments.length; i++) commitmentBuf.set(commitments[i].toBytes(), i * 32);
			return verifyBatchRangeProof(proof, commitmentBuf, bitSize);
		}
	};
}
function* chunks(bytes, size) {
	for (let i = 0; i < bytes.length; i += size) yield bytes.subarray(i, i + size);
}
//#endregion
export { getBulletproofs };
