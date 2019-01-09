import get = require("lodash/get");
import { Variable, MixedTypes, isMixed, getType } from './types';
import { stringify as stringifySync } from "./stringify";

/** Stringifies any type of data in a common way. */
async function stringifyCommon(
    data: any,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): Promise<string> {
    let type = getType(data);

    if (isMixed(type)) {
        if (refMap.has(data)) {
            return "Reference(" + stringifySync(refMap.get(data)) + ")";
        } else {
            refMap.set(data, path);
            return getHandler(type, indent, originalIndent, path, refMap)(data);
        }
    } else {
        return stringifySync(data);
    }
}

/** Gets the handler to stringify the corresponding mixed type. */
function getHandler(
    type: string,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): (data: any) => Promise<string> {
    var handlers = {
        "Object": async (data: any) => {
            let container: string[] = [];

            if (typeof data.toFRON == "function") {
                // If the given object includes a `toFRON()` method, call it and
                // get the returning value as the data to be stringified.
                data = data.toFRON();
            }

            // Stringify all enumerable properties of the object.
            for (let x in data) {
                let isVar = Variable.test(x),
                    prop = isVar ? x : `['${x}']`,
                    res = await stringifyCommon(
                        data[x],
                        indent + originalIndent,
                        originalIndent,
                        path + (isVar && path ? "." : "") + prop,
                        refMap
                    );

                if (res === undefined)
                    continue; // If the result returns undefined, skip it.
                else if (indent)
                    container.push((isVar ? x : stringifySync(x)) + `: ${res}`);
                else
                    container.push((isVar ? x : stringifySync(x)) + `:${res}`);
            }

            if (indent && container.length) { // use indentation
                return "{\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "}";
            } else {
                return "{" + container.join(",") + "}";
            }
        },
        "Array": async (data: any[]) => {
            let container: string[] = [];

            // Only stringify iterable elements of the array.
            for (let i = 0; i < data.length; i++) {
                let res = await stringifyCommon(
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
        return async (data: any) => {
            let handler: () => any = get(MixedTypes[type], "prototype.toFRON");

            if (handler) {
                // If there is a handler registered to deal with the type, apply
                // it to the data. The reason to call `apply()` instead of 
                // calling the method directly is that the handler method may 
                // not exist on the data instance, it may be registered with an 
                // object as prototype in the first place.
                data = handler.apply(data);
            } else {
                // If no handler is found, stringify the data as an ordinary 
                // object with only its enumerable properties.
                data = Object.assign({}, data);
            }

            return type + "(" + await stringifyCommon(
                data,
                indent,
                originalIndent,
                path,
                refMap
            ) + ")";
        }
    }
}

/**
 * Stringifies the given data into a FRON string.
 * @param pretty The default indentation is two spaces, other than that, set 
 *  any strings for indentation is allowed.
 */
export async function stringify(data: any, pretty?: boolean | string) {
    let indent = "";

    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }

    return stringifyCommon(data, indent, indent, "", new Map<any, string>());
}