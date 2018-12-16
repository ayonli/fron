"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const upperFirst = require("lodash/upperFirst");
const IsVar = /^[a-z_][a-z0-9_]*$/i;
const CustomHandlers = {};
const MixedTypeHandlers = {
    "String": (data) => 'String(' + stringify(String(data)) + ')',
    "Boolean": (data) => "Boolean(" + String(data) + ")",
    "Number": (data) => "Number(" + String(data) + ")",
    "Date": (data) => "Date(" + stringify(data.toISOString()) + ")",
    "RegExp": (data) => String(data),
};
function getType(data) {
    if (data === undefined) {
        return;
    }
    else if (data === null) {
        return "null";
    }
    else {
        let type = typeof data, Type = upperFirst(type), isObj = type == "object";
        for (let x in types_1.MixedTypes) {
            if (isObj && data.constructor.name === x) {
                return types_1.MixedTypes[x];
            }
            else if (!isObj && x === Type) {
                return type;
            }
        }
        return type == "object" ? types_1.MixedTypes.Object : type;
    }
}
function getValues(data) {
    let arr = [];
    for (let item of data) {
        arr.push(item);
    }
    return arr;
}
function stringifyCommon(data, indent, originalIndent, path, refMap) {
    let type = getType(data);
    if (!type || type == "function") {
        return;
    }
    else if (type == "null") {
        return type;
    }
    else if (type == "string") {
        return literal_toolkit_1.string.toLiteral(data);
    }
    else if (type == "symbol") {
        let key = Symbol.keyFor(data);
        return key === undefined ? void 0 : "Symbol(" + stringify(key) + ")";
    }
    else if (types_1.isMixed(type)) {
        if (refMap.has(data)) {
            return "Reference(" + stringify(refMap.get(data)) + ")";
        }
        else {
            refMap.set(data, path);
            return getHandler(type, indent, originalIndent, path, refMap)(data);
        }
    }
    else {
        return String(data);
    }
}
function stringifyMixed(type, data, indent, originalIndent, path, refMap) {
    return type + "("
        + stringifyCommon(data, indent, originalIndent, path, refMap)
        + ")";
}
function stringifyIterable(type, data, indent, originalIndent, path, refMap) {
    data = getValues(data);
    return stringifyMixed(type, data, indent, originalIndent, path, refMap);
}
function getHandler(type, indent, originalIndent, path, refMap) {
    var handlers = Object.assign({}, MixedTypeHandlers, {
        "Set": (data) => {
            return stringifyIterable(type, data, indent, originalIndent, path, refMap);
        },
        "Error": (data) => {
            let reserved = ["name", "message", "stack"], res = Object.assign(pick(data, reserved), omit(data, reserved));
            return stringifyMixed(type, res, indent, originalIndent, path, refMap);
        },
        "Object": (data) => {
            let container = [];
            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }
            for (let x in data) {
                let isVar = IsVar.test(x), prop = isVar ? x : `['${x}']`, res = stringifyCommon(data[x], indent + originalIndent, originalIndent, path + (isVar && path ? "." : "") + prop, refMap);
                if (res !== undefined) {
                    if (indent) {
                        container.push((isVar ? x : stringify(x)) + `: ${res}`);
                    }
                    else {
                        container.push((isVar ? x : stringify(x)) + `:${res}`);
                    }
                }
            }
            if (indent && container.length) {
                return "{\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "}";
            }
            else {
                return "{" + container.join(",") + "}";
            }
        },
        "Array": (data) => {
            let container = [];
            for (let i = 0; i < data.length; i++) {
                let res = stringifyCommon(data[i], indent + originalIndent, originalIndent, `${path}[${i}]`, refMap);
                (res !== undefined) && container.push(res);
            }
            if (indent && container.length) {
                return "[\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "]";
            }
            else {
                return "[" + container.join(",") + "]";
            }
        },
    });
    handlers["Buffer"] = handlers["Map"] = handlers["Set"];
    types_1.ExtendedErrors.forEach(error => handlers[error.name] = handlers["Error"]);
    if (handlers[type]) {
        return handlers[type];
    }
    else if (CustomHandlers[type]) {
        return (data) => {
            data = CustomHandlers[type].apply(data);
            return type + "("
                + stringifyCommon(data, indent, originalIndent, path, refMap)
                + ")";
        };
    }
}
function stringify(data, pretty) {
    let indent = "";
    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }
    return stringifyCommon(data, indent, indent, "", new Map());
}
exports.stringify = stringify;
function registerToFron(type, toFRON) {
    CustomHandlers[type] = toFRON;
}
exports.registerToFron = registerToFron;
//# sourceMappingURL=stringify.js.map