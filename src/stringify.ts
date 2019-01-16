import get = require("get-value");
import { string } from "literal-toolkit";
import {
    Variable,
    CompoundTypes,
    FRONString,
    getType,
} from './types';

/** Stringifies any type of data in a common way. */
function stringifyCommon(
    data: any,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): string {
    let type = getType(data);

    if (!type || type == "function") {
        return;
    } else if (type == "null") {
        return type;
    } else if (type == "string") {
        return string.toLiteral(data);
    } else if (type == "Symbol") {
        return getHandler(type, indent, originalIndent, path, refMap)(data);
    } else if (typeof data === "object") {
        if (refMap.has(data)) {
            // `Reference` is a special type in FRON, it indicates that the 
            // current property references to another property, they are 
            // `aliases` to each other. When stringifing, the first reached 
            // property will be transferred as usual, but other properties that 
            // reference to this property will only be notate as an `Reference` 
            // with the original path, and the parser can use that path to set
            // property when parsing.
            return "Reference(" + stringify(refMap.get(data)) + ")";
        } else {
            refMap.set(data, path);
            return getHandler(type, indent, originalIndent, path, refMap)(data);
        }
    } else {
        return String(data);
    }
}

/** Gets the handler to stringify the corresponding compound type. */
function getHandler(
    type: string,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): (data: any) => string {
    var handlers = {
        "Object": (data: any) => {
            let container: string[] = [];

            if (typeof data.toFRON == "function") {
                // If the given object includes a `toFRON()` method, call it and
                // get the returning value as the data to be stringified.
                data = data.toFRON();
            }

            if (data === undefined) return;

            // Stringify all enumerable properties of the object.
            for (let x in data) {
                let isVar = Variable.test(x),
                    prop = isVar ? x : `['${x}']`,
                    res = stringifyCommon(
                        data[x],
                        indent + originalIndent,
                        originalIndent,
                        path + (isVar && path ? "." : "") + prop,
                        refMap
                    );

                if (res === undefined)
                    continue; // If the result returns undefined, skip it.
                else if (indent)
                    container.push((isVar ? x : stringify(x)) + `: ${res}`);
                else
                    container.push((isVar ? x : stringify(x)) + `:${res}`);
            }

            if (indent && container.length) { // use indentation
                return "{\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "}";
            } else {
                return "{" + container.join(",") + "}";
            }
        },
        "Array": (data: any[]) => {
            let container: string[] = [];

            // Only stringify iterable elements of the array.
            for (let i = 0; i < data.length; i++) {
                let res = stringifyCommon(
                    data[i],
                    indent + originalIndent,
                    originalIndent,
                    `${path}[${i}]`,
                    refMap
                );

                // skip undefined result
                (res !== undefined) && container.push(res);
            }

            if (indent && container.length) { // use indentation
                return "[\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "]";
            } else {
                return "[" + container.join(",") + "]";
            }
        },
    };

    if (handlers[type]) {
        return handlers[type];
    } else {
        return (data: any) => {
            let handler: Function;

            if (typeof data.toFRON == "function") {
                // If the given object includes a `toFRON()` method, call it and
                // get the returning value as the data to be stringified.
                data = data.toFRON();
            } else if (handler = get(CompoundTypes[type], "prototype.toFRON")) {
                // If there is a customized handler registered to deal with the 
                // type, apply it to the data. The reason to call `apply()` 
                // instead of calling the method directly is that the handler 
                // method may not exist on the data instance, it may be 
                // registered with an object as prototype in the first place.
                data = handler.apply(data);
            } else {
                // If no handler is found, stringify the data as an ordinary 
                // object with only its enumerable properties.
                data = Object.assign({}, data);
            }

            if (data === undefined) {
                return;
            } else if (data instanceof FRONString) {
                return data.valueOf();
            } else {
                return type + "(" + stringifyCommon(
                    data,
                    indent,
                    originalIndent,
                    path,
                    refMap
                ) + ")";
            }
        }
    }
}

/**
 * Stringifies the given data into a FRON string.
 * @param pretty The default indentation is two spaces, other than that, set 
 *  any strings for indentation is allowed.
 */
export function stringify(data: any, pretty?: boolean | string): string {
    let indent = "";

    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }

    return stringifyCommon(data, indent, indent, "", new Map<any, string>());
}