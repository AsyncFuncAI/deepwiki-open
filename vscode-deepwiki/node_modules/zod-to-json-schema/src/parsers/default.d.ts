import { ZodDefaultDef } from "zod";
import { JsonSchema7Type } from "../parseDef";
import { Refs } from "../Refs";
export declare function parseDefaultDef(_def: ZodDefaultDef, refs: Refs): JsonSchema7Type & {
    default: any;
};
