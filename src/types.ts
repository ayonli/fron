import upperFirst = require("lodash/upperFirst");
import { AssertionError } from "assert";

export const Types = {
    "Array": "Array",
    "Boolean": "Boolean",
    "Buffer": "Buffer",
    "Date": "Date",
    "Error": "Error",
    "Map": "Map",
    // "Null": "Null",
    "Number": "Number",
    "Object": "Object",
    "RegExp": "RegExp",
    "Set": "Set",
    "String": "String",
    "Symbol": "Symbol",
    "Unknown": "Unknown"
};

export const Errors = {
    AssertionError,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
};

export function getType(data: any): string {
    if (data === undefined) {
        return;
    } else if (data === null) {
        return "null";
    } else {
        let type = typeof data,
            Type = upperFirst(type),
            isObj = type == "object";

        for (let x in Types) {
            if (isObj && data.constructor.name === Types[x]) {
                return Types[x];
            } else if (!isObj && x === Type) {
                return type;
            }
        }
    }

    return Types.Object;
}

export default Types;