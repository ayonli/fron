/*
 * The async version of the FRON stringifier.
 */

import { stringify, getFavorData, ObjectNotationContainer } from "../stringify";
import { getType, FRONString } from "../types";
import { LatinVar } from "../util";

async function stringifyCommon(
    data: any,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): Promise<string> {
    if (data !== null && typeof data === "object") {
        if (refMap.has(data)) {
            return "Reference(" + stringify(refMap.get(data)) + ")";
        } else {
            refMap.set(data, path);
            return getHandler(getType(data), indent, originalIndent, path, refMap)(data);
        }
    } else {
        return stringify(data);
    }
}

function getHandler(
    type: string,
    indent: string,
    originalIndent: string,
    path: string,
    refMap: Map<any, string>
): (data: any) => Promise<string> {
    var handlers = {
        "Object": async (data: any) => {
            data = getFavorData(data, "Object");

            if (data === undefined) return;

            let container = new ObjectNotationContainer(
                "Object",
                indent,
                originalIndent
            );

            // Stringify all enumerable properties of the object.
            for (let x in data) {
                let isVar = LatinVar.test(x),
                    prop = isVar ? x : `['${x}']`,
                    key = isVar ? x : stringify(x);

                container.push(await stringifyCommon(
                    data[x],
                    indent + originalIndent,
                    originalIndent,
                    path + (isVar && path ? "." : "") + prop,
                    refMap
                ), key);
            }

            return container.toString();
        },
        "Array": async (data: any[]) => {
            let container = new ObjectNotationContainer(
                "Array",
                indent,
                originalIndent
            );

            // Only stringify iterable elements of the array.
            for (let i = 0, len = data.length; i < len; ++i) {
                container.push(await stringifyCommon(
                    data[i],
                    indent + originalIndent,
                    originalIndent,
                    `${path}[${i}]`,
                    refMap
                ));
            }

            return container.toString();
        }
    };

    return handlers[type] || (async (data: any) => {
        data = getFavorData(data, type);

        if (data === undefined) {
            return;
        } else if (data instanceof FRONString) {
            return data.valueOf();
        } else {
            return type + "(" + await stringifyCommon(
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
export function stringifyAsync(data: any, pretty?: boolean | string) {
    let indent = "";

    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }

    return stringifyCommon(data, indent, indent, "", new Map<any, string>());
}