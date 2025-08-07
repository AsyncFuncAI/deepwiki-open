import { ZodNumberDef } from "zod";
import { ErrorMessages } from "../errorMessages";
import { Refs } from "../Refs";
export type JsonSchema7NumberType = {
    type: "number" | "integer";
    minimum?: number;
    exclusiveMinimum?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
    errorMessage?: ErrorMessages<JsonSchema7NumberType>;
};
export declare function parseNumberDef(def: ZodNumberDef, refs: Refs): JsonSchema7NumberType;
