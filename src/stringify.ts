import { MixedTypes, ExtendedErrors, isMixed } from './types';
import { string } from "literal-toolkit";
import pick = require("lodash/pick");
import omit = require("lodash/omit");
import upperFirst = require("lodash/upperFirst");

const IsVar = /^[a-z_][a-z0-9_]*$/i;
const CustomHandlers: { [type: string]: () => any } = {};
const MixedTypeHandlers: { [x: string]: (data) => string } = {
    "String": (data: String) => 'String(' + stringify(String(data)) + ')',
    "Boolean": (data: Boolean) => "Boolean(" + String(data) + ")",
    "Number": (data: Number) => "Number(" + String(data) + ")",
    "Date": (data: Date) => "Date(" + stringify(data.toISOString()) + ")",
    "RegExp": (data: RegExp) => String(data),
};

function getType(data: any): string {
    if (data === undefined) {
        return;
    } else if (data === null) {
        return "null";
    } else {
        let type = typeof data,
            Type = upperFirst(type),
            isObj = type == "object";

        for (let x in MixedTypes) {
            if (isObj && data.constructor.name === x) {
                return MixedTypes[x];
            } else if (!isObj && x === Type) {
                return type;
            }
        }

        return type == "object" ? MixedTypes.Object : type;
    }
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
        return string.toLiteral(data);
    } else if (type == "symbol") {
        let key = Symbol.keyFor(data);
        return key === undefined ? void 0 : "Symbol(" + stringify(key) + ")";
    } else if (isMixed(type)) {
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
    var handlers = Object.assign({}, MixedTypeHandlers, {
        "Set": (data: Buffer) => {
            return stringifyIterable(type, data, indent, originalIndent, path, refMap);
        },
        "Error": (data: Error) => {
            let reserved = ["name", "message", "stack"],
                res = Object.assign(pick(data, reserved), omit(data, reserved));

            return stringifyMixed(type, res, indent, originalIndent, path, refMap);
        },
        "Object": (data: any) => {
            let container: string[] = [];

            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }

            for (let x in data) {
                let isVar = IsVar.test(x),
                    prop = isVar ? x : `['${x}']`,
                    res = stringifyCommon(
                        data[x],
                        indent + originalIndent,
                        originalIndent,
                        path + (isVar && path ? "." : "") + prop,
                        refMap
                    );

                if (res !== undefined) {
                    if (indent) {
                        container.push((isVar ? x : stringify(x)) + `: ${res}`);
                    } else {
                        container.push((isVar ? x : stringify(x)) + `:${res}`);
                    }
                }
            }

            if (indent && container.length) {
                return "{\n"
                    + indent + container.join(",\n" + indent) + "\n"
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
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "]";
            } else {
                return "[" + container.join(",") + "]";
            }
        },
    });

    handlers["Buffer"] = handlers["Map"] = handlers["Set"];
    ExtendedErrors.forEach(error => handlers[error.name] = handlers["Error"]);

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

export function stringify(data: any, pretty?: boolean | string) {
    let indent = "";

    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }

    return stringifyCommon(data, indent, indent, "", new Map());
}

export function registerToFron(type: string, toFRON: () => any) {
    CustomHandlers[type] = toFRON;
}