import { ZodOptionalDef } from "zod";
import { JsonSchema7Type } from "../parseDef";
import { Refs } from "../Refs";
export declare const parseOptionalDef: (def: ZodOptionalDef, refs: Refs) => JsonSchema7Type | undefined;
