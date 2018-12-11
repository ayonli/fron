import { getType, isObjectType } from './types';
import { escape } from "safe-string-literal";
import { AssertionError } from 'assert';

export function stringify(data: any, pretty?: boolean | string) {
    let indent = "";

    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }

    return stringifyCommon(data, indent, indent, "", new Map());
}

export const CustomHandlers: { [type: string]: () => any } = {};

export function registerToFron(type: string, toFRON: () => any) {
    CustomHandlers[type] = toFRON;
}

function getValues<T>(data: Iterable<T>): T[] {
    let arr = [];
    for (let item of data) {
        arr.push(item);
    }
    return arr;
}

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
        return '"' + escape(data, "'`") + '"';
    } else if (type == "symbol") {
        let key = Symbol.keyFor(data);
        return key === undefined ? void 0 : "Symbol(" + stringify(key) + ")";
    } else if ((isObjectType(type))) {
        if (refMap.has(data)) {
            return "Reference(" + stringify(refMap.get(data)) + ")";
        } else {
            refMap.set(data, path);
            return getHandler(type, indent, originalIndent, path, refMap)(data);
        }
    } else {
        return String(data);
    }
}

function stringifyMixed(
    type: string,
    data: any,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
) {
    return type + "("
        + stringifyCommon(data, indent, originalIndent, path, refMap)
        + ")";
}

function stringifyIterable<T>(
    type: string,
    data: Iterable<T>,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): string {
    data = getValues(data);
    return stringifyMixed(type, data, indent, originalIndent, path, refMap);
}

function getHandler(
    type: string,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): (data: any) => string {
    var handlers = {
        "String": (data: String) => 'String(' + stringify(String(data)) + ')',
        "Boolean": (data: Boolean) => "Boolean(" + String(data) + ")",
        "Number": (data: Number) => "Number(" + String(data) + ")",
        "Date": (data: Date) => "Date(" + stringify(data.toISOString()) + ")",
        "RegExp": (data: RegExp) => String(data),
        "Buffer": (data: Buffer) => {
            return stringifyIterable("Buffer", data, indent, originalIndent, path, refMap);
        },
        "Map": (data: Buffer) => {
            return stringifyIterable("Map", data, indent, originalIndent, path, refMap);
        },
        "Set": (data: Buffer) => {
            return stringifyIterable("Set", data, indent, originalIndent, path, refMap);
        },
        "Error": (data: Error) => {
            let res = {
                name: data.name,
                message: data.message,
                stack: data.stack
            };

            for (let x in data) {
                if (x !== "name" && x !== "message" && x !== "stack") {
                    res[x] = data[x];
                }
            }

            return stringifyMixed(type, res, indent, originalIndent, path, refMap);
        },
        "Object": (data: any) => {
            let isVar = /^[a-z_][a-z0-9_]*$/i,
                container: string[] = [];

            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }

            for (let x in data) {
                let _isVar = isVar.test(x);
                let _path = path ? path + (_isVar ? `.${x}` : `['${x}']`) : x;
                let res = stringifyCommon(
                    data[x],
                    indent + originalIndent,
                    originalIndent,
                    _path,
                    refMap
                );

                if (res !== undefined) {
                    if (indent) {
                        container.push((_isVar ? x : stringify(x)) + `: ${res}`);
                    } else {
                        container.push((_isVar ? x : stringify(x)) + `:${res}`);
                    }
                }
            }

            if (indent && container.length) {
                return "{\n"
                    + indent + container.join(", \n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "}";
            } else {
                return "{" + container.join(",") + "}";
            }
        },
        "Array": (data: any[]) => {
            let container: string[] = [];

            for (let i = 0; i < data.length; i++) {
                let res = stringifyCommon(
                    data[i],
                    indent + originalIndent,
                    originalIndent,
                    `${path}[${i}]`,
                    refMap
                );

                (res !== undefined) && container.push(<string>res);
            }

            if (indent && container.length) {
                return "[\n"
                    + indent + container.join(", \n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "]";
            } else {
                return "[" + container.join(",") + "]";
            }
        },
    };

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
        handlers[type.name] = handlers["Error"];
    }

    if (handlers[type]) {
        return handlers[type];
    } else if (CustomHandlers[type]) {
        return (data: any) => {
            data = CustomHandlers[type].apply(data);
            return type + "("
                + stringifyCommon(data, indent, originalIndent, path, refMap)
                + ")";
        }
    }
}