import { string, number } from "literal-toolkit";
import { LatinVar } from "./util";
import { CompoundTypes, FRONString, getType } from './types';

/**
 * Gets the favor data construction for stringifing, and calls the `toFRON()` 
 * method it provided.
 * */
export function getFavorData(data: any, type: string) {
    let handler: Function;

    if (typeof data.toFRON == "function") {
        // If the given object includes a `toFRON()` method, call it and
        // get the returning value as the data to be stringified.
        data = data.toFRON();
    } else if (handler = CompoundTypes[type]?.prototype?.toFRON) {
        // If there is a customized handler registered to deal with the 
        // type, apply it to the data. The reason to call `apply()` 
        // instead of calling the method directly is that the handler 
        // method may not exist on the data instance, it may be 
        // registered with an object as prototype in the first place.
        data = handler.apply(data);
    } else if (typeof data.toJSON === "function") { // compatible with JSON
        // If the given object includes a `toJSON()` method, call it and
        // get the returning value as the data to be stringified.
        data = data.toJSON();
    } else if (data.constructor !== Object) {
        // If no handler is found, stringify the data as an ordinary 
        // object with only its enumerable properties.
        data = Object.assign({}, data);
    }

    return data;
}

/** A container to store object notations. */
export class ObjectNotationContainer {
    private container: string[] = [];

    constructor(
        private type: "Object" | "Array",
        private indent: string,
        private originalIndent: string
    ) { }

    /** Pushes data into the container. */
    push(value: string | undefined, key?: string) {
        if (value === undefined) return;

        if (this.type === "Object") {
            if (this.indent)
                this.container.push(`${key}: ${value}`);
            else
                this.container.push(`${key}:${value}`);
        } else if (this.type === "Array") {
            this.container.push(value);
        }
    }

    /** Gets the stringified result of the notation. */
    toString(): string {
        const { type, container, indent, originalIndent } = this;
        let str = "";

        if (type === "Object") {
            if (indent && container.length) { // use indentation
                str = "{\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "}";
            } else {
                str = "{" + container.join(",") + "}";
            }
        } else if (type === "Array") {
            if (indent && container.length) { // use indentation
                str = "[\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "]";
            } else {
                str = "[" + container.join(",") + "]";
            }
        }

        return str;
    }
}

/** Stringifies any type of data in a common way. */
function stringifyCommon(
    data: any,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>,
    transferUndefined = false
): string | undefined {
    const type = getType(data);

    if (type === "null" || (data === undefined && transferUndefined)) {
        return "null";
    } else if (!type || type === "function") {
        return;
    } else if (type === "bigint") {
        return number.toLiteral(data);
    } else if (type === "string") {
        return string.toLiteral(data);
    } else if (type === "Symbol") {
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

            // return "Reference(" + stringify(refMap.get(data)) + ")";

            // since v0.1.5
            const path = refMap.get(data);
            return path ? `$.${path}` : "$";
        } else {
            refMap.set(data, path);
            return getHandler(type, indent, originalIndent, path, refMap)(data);
        }
    } else if (typeof data.toString === "function") {
        return data.toString();
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
    const handlers = {
        "Object": (data: any) => {
            data = getFavorData(data, "Object");

            if (data === undefined) return;
            if (data.constructor !== Object) {
                return stringifyCommon(
                    data,
                    indent,
                    originalIndent,
                    path,
                    refMap
                );
            }

            const container = new ObjectNotationContainer(
                "Object",
                indent,
                originalIndent
            );

            // Stringify all enumerable properties of the object.
            for (const x in data) {
                const isVar = LatinVar.test(x);
                const prop = isVar ? x : `['${x}']`;
                const key = isVar ? x : stringify(x);

                container.push(stringifyCommon(
                    data[x],
                    indent + originalIndent,
                    originalIndent,
                    path + (isVar && path ? "." : "") + prop,
                    refMap
                ), key);
            }

            return container.toString();
        },
        "Array": (data: any[]) => {
            const container = new ObjectNotationContainer(
                "Array",
                indent,
                originalIndent
            );

            // Only stringify iterable elements of the array.
            for (let i = 0, len = data.length; i < len; ++i) {
                container.push(stringifyCommon(
                    data[i],
                    indent + originalIndent,
                    originalIndent,
                    `${path}[${i}]`,
                    refMap,
                    true
                ));
            }

            return container.toString();
        }
    };

    return (handlers as any)[type] || ((data: any) => {
        data = getFavorData(data, type);

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
    });
}

/**
 * Stringifies the given data into a FRON string.
 * @param pretty The default indentation is two spaces, other than that, set 
 *  any strings for indentation is allowed.
 */
export function stringify(data: any, pretty?: boolean | string): string | undefined {
    if (data === undefined) return;

    let indent = "";

    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }

    return stringifyCommon(data, indent, indent, "", new Map<any, string>());
}
