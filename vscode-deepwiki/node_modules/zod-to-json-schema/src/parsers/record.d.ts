import { ZodRecordDef, ZodTypeAny } from "zod";
import { JsonSchema7Type } from "../parseDef";
import { Refs } from "../Refs";
import { JsonSchema7EnumType } from "./enum";
import { JsonSchema7StringType } from "./string";
type JsonSchema7RecordPropertyNamesType = Omit<JsonSchema7StringType, "type"> | Omit<JsonSchema7EnumType, "type">;
export type JsonSchema7RecordType = {
    type: "object";
    additionalProperties: JsonSchema7Type;
    propertyNames?: JsonSchema7RecordPropertyNamesType;
};
export declare function parseRecordDef(def: ZodRecordDef<ZodTypeAny, ZodTypeAny>, refs: Refs): JsonSchema7RecordType;
export {};
