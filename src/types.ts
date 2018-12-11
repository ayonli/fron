import upperFirst = require("lodash/upperFirst");
import { AssertionError } from "assert";

export const ObjectTypes = {
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
    "Unknown": "Unknown"
};

export function isObjectType(type: string) {
    return !!ObjectTypes[type];
}

export function getType(data: any): string {
    if (data === undefined) {
        return;
    } else if (data === null) {
        return "null";
    } else {
        let type = typeof data,
            Type = upperFirst(type),
            isObj = type == "object";

        for (let x in ObjectTypes) {
            if (isObj && data.constructor.name === x) {
                return ObjectTypes[x];
            } else if (!isObj && x === Type) {
                return type;
            }
        }

        return type == "object" ? ObjectTypes.Object : type;
    }
}

export function registerType(type: string, name: string) {
    ObjectTypes[type] = name;
}

export default ObjectTypes;

// register all error types as aliases of Error
var Errors = [
    AssertionError,
    // Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];

for (let type of Errors) {
    registerType(type.name, "Error");
}