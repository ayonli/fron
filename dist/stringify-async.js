"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const literal_toolkit_1 = require("literal-toolkit");
const types_1 = require("./types");
const stringify_1 = require("./stringify");
function stringifyCommon(data, indent, originalIndent, path, refMap) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let type = stringify_1.getType(data);
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
            return key === undefined ? void 0 : "Symbol(" + stringify_1.stringify(key) + ")";
        }
        else if (types_1.isMixed(type)) {
            if (refMap.has(data)) {
                return "Reference(" + stringify_1.stringify(refMap.get(data)) + ")";
            }
            else {
                refMap.set(data, path);
                return getHandler(type, indent, originalIndent, path, refMap)(data);
            }
        }
        else {
            return String(data);
        }
    });
}
function stringifyMixed(type, data, indent, originalIndent, path, refMap) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return type + "("
            + (yield stringifyCommon(data, indent, originalIndent, path, refMap))
            + ")";
    });
}
function stringifyIterable(type, data, indent, originalIndent, path, refMap) {
    data = stringify_1.getValues(data);
    return stringifyMixed(type, data, indent, originalIndent, path, refMap);
}
function getHandler(type, indent, originalIndent, path, refMap) {
    var handlers = Object.assign({}, stringify_1.MixedTypeHandlers, {
        "Set": (data) => {
            return stringifyIterable(type, data, indent, originalIndent, path, refMap);
        },
        "Error": (data) => {
            let reserved = ["name", "message", "stack"], res = Object.assign(pick(data, reserved), omit(data, reserved));
            return stringifyMixed(type, res, indent, originalIndent, path, refMap);
        },
        "Object": (data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let container = [];
            if (typeof data.toFRON == "function") {
                data = data.toFRON();
            }
            for (let x in data) {
                let isVar = types_1.Variable.test(x), prop = isVar ? x : `['${x}']`, res = yield stringifyCommon(data[x], indent + originalIndent, originalIndent, path + (isVar && path ? "." : "") + prop, refMap);
                if (res !== undefined) {
                    if (indent) {
                        container.push((isVar ? x : stringify_1.stringify(x)) + `: ${res}`);
                    }
                    else {
                        container.push((isVar ? x : stringify_1.stringify(x)) + `:${res}`);
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
    });
    handlers["Buffer"] = handlers["Map"] = handlers["Set"];
    types_1.ExtendedErrors.forEach(error => handlers[error.name] = handlers["Error"]);
    if (handlers[type]) {
        return handlers[type];
    }
    else if (types_1.MixedTypes[type]) {
        return (data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let handler = types_1.MixedTypes[type].prototype.toFRON;
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
function stringifyAsync(data, pretty) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let indent = "";
        if (pretty) {
            indent = typeof pretty == "string" ? pretty : "  ";
        }
        return stringifyCommon(data, indent, indent, "", new Map());
    });
}
exports.stringifyAsync = stringifyAsync;
//# sourceMappingURL=stringify-async.js.map