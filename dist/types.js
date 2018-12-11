"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upperFirst = require("lodash/upperFirst");
exports.ObjectTypes = {
    "AssertionError": "AssertionError",
    "Array": "Array",
    "Boolean": "Boolean",
    "Buffer": "Buffer",
    "Date": "Date",
    "Error": "Error",
    "EvalError": "EvalError",
    "Map": "Map",
    "Number": "Number",
    "Object": "Object",
    "RangeError": "RangeError",
    "ReferenceError": "ReferenceError",
    "RegExp": "RegExp",
    "Set": "Set",
    "String": "String",
    "SyntaxError": "SyntaxError",
    "Unknown": "Unknown",
    "TypeError": "TypeError"
};
function isObjectType(type) {
    return !!exports.ObjectTypes[type];
}
exports.isObjectType = isObjectType;
function getType(data) {
    if (data === undefined) {
        return;
    }
    else if (data === null) {
        return "null";
    }
    else {
        let type = typeof data, Type = upperFirst(type), isObj = type == "object";
        for (let x in exports.ObjectTypes) {
            if (isObj && data.constructor.name === x) {
                return exports.ObjectTypes[x];
            }
            else if (!isObj && x === Type) {
                return type;
            }
        }
        return type == "object" ? exports.ObjectTypes.Object : type;
    }
}
exports.getType = getType;
function registerType(type, name) {
    exports.ObjectTypes[type] = name;
}
exports.registerType = registerType;
exports.default = exports.ObjectTypes;
//# sourceMappingURL=types.js.map