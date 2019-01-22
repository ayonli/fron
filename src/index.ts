import { stringify } from "./stringify";
import { parse, parseToken, composeToken, SourceToken } from "./parse";
import {
    register,
    FRONEntry,
    FRONEntryBase,
    FRONConstructor,
    FRONString,
    getType,
    getInstance
} from "./types";

export {
    register,
    stringify,
    parse,
    parseToken,
    composeToken,
    SourceToken,
    FRONEntry,
    FRONEntryBase,
    FRONConstructor,
    FRONString,
    getType,
    getInstance
};

/**
 * A decorator used to register a type (class constructor) with a specified 
 * namespace.
 */
export function registerNS(nsp: string) {
    return (ctor: FRONConstructor) => register(`${nsp}.${ctor.name}`, ctor);
}