import * as _$_mysten_sui_transactions0 from "@mysten/sui/transactions";
import { Transaction } from "@mysten/sui/transactions";

//#region src/helpers.d.ts
/** Serialize a ristretto255 point into an on-chain `Element<G>`. */
declare function point(bytes: Uint8Array): (tx: Transaction) => _$_mysten_sui_transactions0.TransactionResult;
//#endregion
export { point };