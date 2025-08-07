import { ZodPromiseDef } from "zod";
import { JsonSchema7Type } from "../parseDef";
import { Refs } from "../Refs";
export declare function parsePromiseDef(def: ZodPromiseDef, refs: Refs): JsonSchema7Type | undefined;
