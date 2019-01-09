"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
const literal_toolkit_1 = require("literal-toolkit");
const types_1 = require("./types");
function stringifyCommon(data, indent, originalIndent, path, refMap) {
    let type = types_1.getType(data);
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
        return key === undefined ? key : "Symbol(" + stringify(key) + ")";
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
function getHandler(type, indent, originalIndent, path, refMap) {
    var handlers = {
        "Object": (data) => {
            let container = [];
            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }
            for (let x in data) {
                let isVar = types_1.Variable.test(x), prop = isVar ? x : `['${x}']`, res = stringifyCommon(data[x], indent + originalIndent, originalIndent, path + (isVar && path ? "." : "") + prop, refMap);
                if (res === undefined)
                    continue;
                else if (indent)
                    container.push((isVar ? x : stringify(x)) + `: ${res}`);
                else
                    container.push((isVar ? x : stringify(x)) + `:${res}`);
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
    if (handlers[type]) {
        return handlers[type];
    }
    else {
        return (data) => {
            let handler = get(types_1.MixedTypes[type], "prototype.toFRON");
            if (handler) {
                data = handler.apply(data);
            }
            else {
                data = Object.assign({}, data);
            }
            return type + "(" + stringifyCommon(data, indent, originalIndent, path, refMap) + ")";
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
//# sourceMappingURL=stringify.js.map