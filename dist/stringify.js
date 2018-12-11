"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const safe_string_literal_1 = require("safe-string-literal");
const assert_1 = require("assert");
function stringify(data, pretty) {
    let indent = "";
    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }
    return stringifyCommon(data, indent, indent, "", new Map());
}
exports.stringify = stringify;
exports.CustomHandlers = {};
function registerToFron(type, toFRON) {
    exports.CustomHandlers[type] = toFRON;
}
exports.registerToFron = registerToFron;
function getValues(data) {
    let arr = [];
    for (let item of data) {
        arr.push(item);
    }
    return arr;
}
function stringifyCommon(data, indent, originalIndent, path, refMap) {
    let type = types_1.getType(data);
    if (!type || type == "function") {
        return;
    }
    else if (type == "null") {
        return type;
    }
    else if (type == "string") {
        return '"' + safe_string_literal_1.escape(data, "'`") + '"';
    }
    else if (type == "symbol") {
        let key = Symbol.keyFor(data);
        return key === undefined ? void 0 : "Symbol(" + stringify(key) + ")";
    }
    else if ((types_1.isObjectType(type))) {
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
    var handlers = {
        "String": (data) => 'String(' + stringify(String(data)) + ')',
        "Boolean": (data) => "Boolean(" + String(data) + ")",
        "Number": (data) => "Number(" + String(data) + ")",
        "Date": (data) => "Date(" + stringify(data.toISOString()) + ")",
        "RegExp": (data) => String(data),
        "Buffer": (data) => {
            return stringifyIterable("Buffer", data, indent, originalIndent, path, refMap);
        },
        "Map": (data) => {
            return stringifyIterable("Map", data, indent, originalIndent, path, refMap);
        },
        "Set": (data) => {
            return stringifyIterable("Set", data, indent, originalIndent, path, refMap);
        },
        "Error": (data) => {
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
        "Object": (data) => {
            let isVar = /^[a-z_][a-z0-9_]*$/i, container = [];
            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }
            for (let x in data) {
                let _isVar = isVar.test(x);
                let _path = path ? path + (_isVar ? `.${x}` : `['${x}']`) : x;
                let res = stringifyCommon(data[x], indent + originalIndent, originalIndent, _path, refMap);
                if (res !== undefined) {
                    if (indent) {
                        container.push((_isVar ? x : stringify(x)) + `: ${res}`);
                    }
                    else {
                        container.push((_isVar ? x : stringify(x)) + `:${res}`);
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
    };
    var Errors = [
        assert_1.AssertionError,
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
    }
    else if (exports.CustomHandlers[type]) {
        return (data) => {
            data = exports.CustomHandlers[type].apply(data);
            return type + "("
                + stringifyCommon(data, indent, originalIndent, path, refMap)
                + ")";
        };
    }
}
//# sourceMappingURL=stringify.js.map