"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const get = require("lodash/get");
const types_1 = require("./types");
const stringify_1 = require("./stringify");
function stringifyCommon(data, indent, originalIndent, path, refMap) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let type = types_1.getType(data);
        if (types_1.isMixed(type)) {
            if (refMap.has(data)) {
                return "Reference(" + stringify_1.stringify(refMap.get(data)) + ")";
            }
            else {
                refMap.set(data, path);
                return getHandler(type, indent, originalIndent, path, refMap)(data);
            }
        }
        else {
            return stringify_1.stringify(data);
        }
    });
}
function getHandler(type, indent, originalIndent, path, refMap) {
    var handlers = {
        "Object": (data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let container = [];
            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }
            for (let x in data) {
                let isVar = types_1.Variable.test(x), prop = isVar ? x : `['${x}']`, res = yield stringifyCommon(data[x], indent + originalIndent, originalIndent, path + (isVar && path ? "." : "") + prop, refMap);
                if (res === undefined)
                    continue;
                else if (indent)
                    container.push((isVar ? x : stringify_1.stringify(x)) + `: ${res}`);
                else
                    container.push((isVar ? x : stringify_1.stringify(x)) + `:${res}`);
            }
            if (indent && container.length) {
                return "{\n"
                    + indent + container.join(",\n" + indent) + "\n"
                    + indent.slice(0, -originalIndent.length) + "}";
            }
            else {
                return "{" + container.join(",") + "}";
            }
        }),
        "Array": (data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let container = [];
            for (let i = 0; i < data.length; i++) {
                let res = yield stringifyCommon(data[i], indent + originalIndent, originalIndent, `${path}[${i}]`, refMap);
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
        }),
    };
    if (handlers[type]) {
        return handlers[type];
    }
    else {
        return (data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let handler = get(types_1.MixedTypes[type], "prototype.toFRON");
            if (handler) {
                data = handler.apply(data);
            }
            else {
                data = Object.assign({}, data);
            }
            return type + "(" + (yield stringifyCommon(data, indent, originalIndent, path, refMap)) + ")";
        });
    }
}
function stringify(data, pretty) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let indent = "";
        if (pretty) {
            indent = typeof pretty == "string" ? pretty : "  ";
        }
        return stringifyCommon(data, indent, indent, "", new Map());
    });
}
exports.stringify = stringify;
//# sourceMappingURL=stringify-async.js.map