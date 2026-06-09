import { BcsEnum, BcsStruct, BcsTuple, TypeTagSerializer, bcs } from "@mysten/sui/bcs";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { isArgument } from "@mysten/sui/transactions";
//#region src/contracts/utils/index.ts
const MOVE_STDLIB_ADDRESS = normalizeSuiAddress("0x1");
const SUI_FRAMEWORK_ADDRESS$1 = normalizeSuiAddress("0x2");
function getPureBcsSchema(typeTag) {
	const parsedTag = typeof typeTag === "string" ? TypeTagSerializer.parseFromStr(typeTag) : typeTag;
	if ("u8" in parsedTag) return bcs.U8;
	else if ("u16" in parsedTag) return bcs.U16;
	else if ("u32" in parsedTag) return bcs.U32;
	else if ("u64" in parsedTag) return bcs.U64;
	else if ("u128" in parsedTag) return bcs.U128;
	else if ("u256" in parsedTag) return bcs.U256;
	else if ("address" in parsedTag) return bcs.Address;
	else if ("bool" in parsedTag) return bcs.Bool;
	else if ("vector" in parsedTag) {
		const type = getPureBcsSchema(parsedTag.vector);
		return type ? bcs.vector(type) : null;
	} else if ("struct" in parsedTag) {
		const structTag = parsedTag.struct;
		const pkg = normalizeSuiAddress(structTag.address);
		if (pkg === MOVE_STDLIB_ADDRESS) {
			if ((structTag.module === "ascii" || structTag.module === "string") && structTag.name === "String") return bcs.String;
			if (structTag.module === "option" && structTag.name === "Option") {
				const inner = structTag.typeParams[0];
				const type = inner ? getPureBcsSchema(inner) : null;
				return type ? bcs.option(type) : null;
			}
		}
		if (pkg === SUI_FRAMEWORK_ADDRESS$1 && structTag.module === "object" && (structTag.name === "ID" || structTag.name === "UID")) return bcs.Address;
	}
	return null;
}
function normalizeMoveArguments(args, argTypes, parameterNames) {
	const argLen = Array.isArray(args) ? args.length : Object.keys(args).length;
	if (parameterNames && argLen !== parameterNames.length) throw new Error(`Invalid number of arguments, expected ${parameterNames.length}, got ${argLen}`);
	const normalizedArgs = [];
	let index = 0;
	for (const argType of argTypes) {
		if (argType === "0x2::clock::Clock") {
			normalizedArgs.push((tx) => tx.object.clock());
			continue;
		}
		if (argType === "0x2::random::Random") {
			normalizedArgs.push((tx) => tx.object.random());
			continue;
		}
		if (argType === "0x2::deny_list::DenyList") {
			normalizedArgs.push((tx) => tx.object.denyList());
			continue;
		}
		if (argType === "0x3::sui_system::SuiSystemState") {
			normalizedArgs.push((tx) => tx.object.system());
			continue;
		}
		let arg;
		if (Array.isArray(args)) {
			if (index >= args.length) throw new Error(`Invalid number of arguments, expected at least ${index + 1}, got ${args.length}`);
			arg = args[index];
		} else {
			if (!parameterNames) throw new Error(`Expected arguments to be passed as an array`);
			const name = parameterNames[index];
			arg = args[name];
			if (arg === void 0) throw new Error(`Parameter ${name} is required`);
		}
		index += 1;
		if (typeof arg === "function" || isArgument(arg)) {
			normalizedArgs.push(arg);
			continue;
		}
		const bcsType = argType === null ? null : getPureBcsSchema(argType);
		if (bcsType) {
			const bytes = bcsType.serialize(arg);
			normalizedArgs.push((tx) => tx.pure(bytes));
			continue;
		}
		if (typeof arg === "string") {
			normalizedArgs.push((tx) => tx.object(arg));
			continue;
		}
		throw new Error(`Invalid argument ${stringify(arg)} for type ${argType}`);
	}
	return normalizedArgs;
}
var MoveStruct = class extends BcsStruct {
	async get({ objectId, ...options }) {
		const [res] = await this.getMany({
			...options,
			objectIds: [objectId]
		});
		if (!res) throw new Error(`No object found for id ${objectId}`);
		return res;
	}
	async getMany({ client, ...options }) {
		return (await client.core.getObjects({
			...options,
			include: {
				...options.include,
				content: true
			}
		})).objects.map((obj) => {
			if (obj instanceof Error) throw obj;
			return {
				...obj,
				json: this.parse(obj.content)
			};
		});
	}
};
var MoveEnum = class extends BcsEnum {};
var MoveTuple = class extends BcsTuple {};
function stringify(val) {
	if (typeof val === "object") return JSON.stringify(val, (val) => val);
	if (typeof val === "bigint") return val.toString();
	return val;
}
//#endregion
export { MoveEnum, MoveStruct, MoveTuple, normalizeMoveArguments };
