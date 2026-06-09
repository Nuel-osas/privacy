import { normalizeMoveArguments } from "../utils/index.mjs";
//#region src/contracts/contra/decode.ts
function gVector(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>"];
	const parameterNames = ["parts"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "decode",
		function: "g_vector",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
function encryptedAmount(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>"];
	const parameterNames = ["parts"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "decode",
		function: "encrypted_amount",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
function multiRecipientEncryption(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>", "u64"];
	const parameterNames = ["parts", "m"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "decode",
		function: "multi_recipient_encryption",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
function ddhProof(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>"];
	const parameterNames = ["parts"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "decode",
		function: "ddh_proof",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
function elgamalProof(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>"];
	const parameterNames = ["parts"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "decode",
		function: "elgamal_proof",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
function consistencyProof(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>"];
	const parameterNames = ["parts"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "decode",
		function: "consistency_proof",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
function keyConsistencyProof(options) {
	const packageAddress = options.package ?? "@local-pkg/contra";
	const argumentsTypes = ["vector<vector<u8>>", "u64"];
	const parameterNames = ["parts", "m"];
	return (tx) => tx.moveCall({
		package: packageAddress,
		module: "decode",
		function: "key_consistency_proof",
		arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames)
	});
}
//#endregion
export { consistencyProof, ddhProof, elgamalProof, encryptedAmount, gVector, keyConsistencyProof, multiRecipientEncryption };
