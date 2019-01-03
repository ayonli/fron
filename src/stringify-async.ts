import pick = require("lodash/pick");
import omit = require("lodash/omit");
import { string } from "literal-toolkit";
import { Variable, MixedTypes, ExtendedErrors, isMixed } from './types';
import { MixedTypeHandlers, getType, getValues, stringify } from "./stringify";

async function stringifyCommon(
    data: any,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): Promise<string> {
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

async function stringifyMixed(
    type: string,
    data: any,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
) {
    return type + "("
        + (await stringifyCommon(data, indent, originalIndent, path, refMap))
        + ")";
}

function stringifyIterable<T>(
    type: string,
    data: Iterable<T>,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
) {
    data = getValues(data);
    return stringifyMixed(type, data, indent, originalIndent, path, refMap);
}

function getHandler(
    type: string,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): (data: any) => (string | Promise<string>) {
    var handlers = Object.assign({}, <object>MixedTypeHandlers, {
        "Set": (data: Buffer) => {
            return stringifyIterable(type, data, indent, originalIndent, path, refMap);
        },
        "Error": (data: Error) => {
            let reserved = ["name", "message", "stack"],
                res = Object.assign(pick(data, reserved), omit(data, reserved));

            return stringifyMixed(type, res, indent, originalIndent, path, refMap);
        },
        "Object": async (data: any) => {
            let container: string[] = [];

            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }

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
        "Array": async (data: any[]) => {
            let container: string[] = [];

            for (let i = 0; i < data.length; i++) {
                let res = await stringifyCommon(
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
    } else if (MixedTypes[type]) {
        return async (data: any) => {
            let handler = MixedTypes[type].prototype.toFRON;

            if (handler) {
                data = handler.apply(data);
            } else {
                data = Object.assign({}, data);
            }

            return type + "(" + (await stringifyCommon(
                data,
                indent,
                originalIndent,
                path, refMap
            )) + ")";
        }
    }
}

export async function stringifyAsync(data: any, pretty?: boolean | string) {
    let indent = "";

    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }

    return stringifyCommon(data, indent, indent, "", new Map());
}