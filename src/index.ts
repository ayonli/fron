import { stringify } from "./stringify";
import {
    parse,
    parseToken,
    composeToken,
    SourceToken,
    throwSyntaxError
} from "./parse";
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
    getInstance,
    throwSyntaxError
};

/**
 * A decorator used to register a type (class constructor) with a specified 
 * namespace.
 */
export function registerNS(nsp: string) {
    return (ctor: FRONConstructor) => register(`${nsp}.${ctor.name}`, ctor);
}

export * from "./async/parse";
export * from "./async/stringify";