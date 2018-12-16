import { AssertionError } from "assert";

export const MixedTypes = {
    "Array": "Array",
    "Boolean": "Boolean",
    "Buffer": "Buffer",
    "Date": "Date",
    "Error": "Error",
    "Map": "Map",
    "Number": "Number",
    "Object": "Object",
    "RegExp": "RegExp",
    "Set": "Set",
    "String": "String",
    // "Unknown": "Unknown",
};
export const ExtendedErrors = [
    AssertionError,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];

export function isMixed(type: string) {
    return !!MixedTypes[type];
}

export function registerType(type: string, name: string) {
    MixedTypes[type] = name;
}

for (let type of ExtendedErrors) {
    registerType(type.name, type.name);
}