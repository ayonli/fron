"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const stringify_1 = require("../stringify");
const types_1 = require("../types");
const util_1 = require("../util");
function stringifyCommon(data, indent, originalIndent, path, refMap) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (data !== null && typeof data === "object") {
            if (refMap.has(data)) {
                return "Reference(" + stringify_1.stringify(refMap.get(data)) + ")";
            }
            else {
                refMap.set(data, path);
                return getHandler(types_1.getType(data), indent, originalIndent, path, refMap)(data);
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
            data = stringify_1.getFavorData(data, "Object");
            if (data === undefined)
                return;
            let container = new stringify_1.ObjectNotationContainer("Object", indent, originalIndent);
            for (let x in data) {
                let isVar = util_1.LatinVar.test(x), prop = isVar ? x : `['${x}']`, key = isVar ? x : stringify_1.stringify(x);
                container.push(yield stringifyCommon(data[x], indent + originalIndent, originalIndent, path + (isVar && path ? "." : "") + prop, refMap), key);
            }
            return container.toString();
        }),
        "Array": (data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let container = new stringify_1.ObjectNotationContainer("Array", indent, originalIndent);
            for (let i = 0, len = data.length; i < len; ++i) {
                container.push(yield stringifyCommon(data[i], indent + originalIndent, originalIndent, `${path}[${i}]`, refMap));
            }
            return container.toString();
        })
    };
    return handlers[type] || ((data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        data = stringify_1.getFavorData(data, type);
        if (data === undefined) {
            return;
        }
        else if (data instanceof types_1.FRONString) {
            return data.valueOf();
        }
        else {
            return type + "(" + (yield stringifyCommon(data, indent, originalIndent, path, refMap)) + ")";
        }
    }));
}
function stringifyAsync(data, pretty) {
    let indent = "";
    if (pretty) {
        indent = typeof pretty == "string" ? pretty : "  ";
    }
    return stringifyCommon(data, indent, indent, "", new Map());
}
exports.stringifyAsync = stringifyAsync;
//# sourceMappingURL=stringify.js.map