import { BcsEnum, BcsStruct, BcsTuple, BcsType } from "@mysten/sui/bcs";
import { TransactionArgument } from "@mysten/sui/transactions";
import { ClientWithCoreApi, SuiClientTypes } from "@mysten/sui/client";

//#region src/contracts/utils/index.d.ts
type RawTransactionArgument<T> = T | TransactionArgument;
type GetOptions<Include extends Omit<SuiClientTypes.ObjectInclude, 'content'> = {}> = SuiClientTypes.GetObjectOptions<Include> & {
  client: ClientWithCoreApi;
};
type GetManyOptions<Include extends Omit<SuiClientTypes.ObjectInclude, 'content'> = {}> = SuiClientTypes.GetObjectsOptions<Include> & {
  client: ClientWithCoreApi;
};
declare class MoveStruct<T extends Record<string, BcsType<any>>, const Name extends string = string> extends BcsStruct<T, Name> {
  get<Include extends Omit<SuiClientTypes.ObjectInclude, 'content' | 'json'> = {}>({
    objectId,
    ...options
  }: GetOptions<Include>): Promise<SuiClientTypes.Object<Include & {
    content: true;
    json: true;
  }> & {
    json: BcsStruct<T>['$inferType'];
  }>;
  getMany<Include extends Omit<SuiClientTypes.ObjectInclude, 'content' | 'json'> = {}>({
    client,
    ...options
  }: GetManyOptions<Include>): Promise<Array<SuiClientTypes.Object<Include & {
    content: true;
    json: true;
  }> & {
    json: BcsStruct<T>['$inferType'];
  }>>;
}
declare class MoveEnum<T extends Record<string, BcsType<any> | null>, const Name extends string> extends BcsEnum<T, Name> {}
declare class MoveTuple<const T extends readonly BcsType<any>[], const Name extends string> extends BcsTuple<T, Name> {}
//#endregion
export { MoveEnum, MoveStruct, MoveTuple, RawTransactionArgument };