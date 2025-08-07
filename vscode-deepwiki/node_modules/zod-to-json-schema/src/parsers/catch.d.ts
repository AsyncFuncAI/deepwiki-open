import { ZodCatchDef } from "zod";
import { Refs } from "../Refs";
export declare const parseCatchDef: (def: ZodCatchDef<any>, refs: Refs) => import("../parseDef").JsonSchema7Type | undefined;
