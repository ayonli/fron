"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
const literal_toolkit_1 = require("literal-toolkit");
const util_1 = require("./util");
const types_1 = require("./types");
function getFavorData(data, type) {
    let handler;
    if (typeof data.toFRON == "function") {
        data = data.toFRON();
    }
    else if (handler = get(types_1.CompoundTypes[type], "prototype.toFRON")) {
        data = handler.apply(data);
    }
    else if (data.constructor !== Object) {
        data = Object.assign({}, data);
    }
    return data;
}
exports.getFavorData = getFavorData;
class ObjectNotationContainer {
    constructor(type, indent, originalIndent) {
        this.type = type;
        this.indent = indent;
        this.originalIndent = originalIndent;
        this.container = [];
    }
    push(value, key) {
        if (value === undefined)
            return;
        if (this.type === "Object") {
            if (this.indent)
                this.container.push(`${key}: ${value}`);
            else
                this.container.push(`${key}:${value}`);
        }
        else if (this.type === "Array") {
            this.container.push(value);
        }
    }
    toString() {
        let { type, container, indent, originalIndent } = this;
        let str;
        if (type === "Object") {
            if (indent && container.length) {
                str = "{\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "}";
            }
            else {
                str = "{" + container.join(",") + "}";
            }
        }
        else if (type === "Array") {
            if (indent && container.length) {
                str = "[\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "]";
            }
            else {
                str = "[" + container.join(",") + "]";
            }
        }
        return str;
    }
}
exports.ObjectNotationContainer = ObjectNotationContainer;
function stringifyCommon(data, indent, originalIndent, path, refMap, tranferUndefined = false) {
    let type = types_1.getType(data);
    if (type === "null" || (data === undefined && tranferUndefined)) {
        return "null";
    }
    else if (!type || type === "function") {
        return;
    }
    else if (type === "bigint") {
        return literal_toolkit_1.number.toLiteral(data);
    }
    else if (type === "string") {
        return literal_toolkit_1.string.toLiteral(data);
    }
    else if (type === "Symbol") {
        return getHandler(type, indent, originalIndent, path, refMap)(data);
    }
    else if (typeof data === "object") {
        if (refMap.has(data)) {
            return "Reference(" + stringify(refMap.get(data)) + ")";
        }
        else {
            refMap.set(data, path);
            return getHandler(type, indent, originalIndent, path, refMap)(data);
        }
    }
    else if (typeof data.toString === "function") {
        return data.toString();
    }
    else {
        return String(data);
    }
}
function getHandler(type, indent, originalIndent, path, refMap) {
    var handlers = {
        "Object": (data) => {
            data = getFavorData(data, "Object");
            if (data === undefined)
                return;
            let container = new ObjectNotationContainer("Object", indent, originalIndent);
            for (let x in data) {
                let isVar = util_1.LatinVar.test(x), prop = isVar ? x : `['${x}']`, key = isVar ? x : stringify(x);
                container.push(stringifyCommon(data[x], indent + originalIndent, originalIndent, path + (isVar && path ? "." : "") + prop, refMap), key);
            }
            return container.toString();
        },
        "Array": (data) => {
            let container = new ObjectNotationContainer("Array", indent, originalIndent);
            for (let i = 0, len = data.length; i < len; ++i) {
                container.push(stringifyCommon(data[i], indent + originalIndent, originalIndent, `${path}[${i}]`, refMap, true));
            }
            return container.toString();
        }
    };
    return handlers[type] || ((data) => {
        data = getFavorData(data, type);
        if (data === undefined) {
            return;
        }
        else if (data instanceof types_1.FRONString) {
            return data.valueOf();
        }
        else {
            return type + "(" + stringifyCommon(data, indent, originalIndent, path, refMap) + ")";
        }
    });
}
function stringify(data, pretty) {
    if (data === undefined)
        return;
    let indent = "";
    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }
    return stringifyCommon(data, indent, indent, "", new Map());
}
exports.stringify = stringify;
//# sourceMappingURL=stringify.js.map