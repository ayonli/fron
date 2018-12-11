"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upperFirst = require("lodash/upperFirst");
const assert_1 = require("assert");
exports.ObjectTypes = {
    "Array": "Array",
    "Boolean": "Boolean",
    "Buffer": "Buffer",
    "Date": "Date",
    "Error": "Error",
    "Map": "Map",
    "Number": "Number",
    "Object": "Object",
    "RegExp": "RegExp",
    "Set": "Set",
    "String": "String",
    "Unknown": "Unknown"
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
var Errors = [
    assert_1.AssertionError,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];
for (let type of Errors) {
    registerType(type.name, "Error");
}
//# sourceMappingURL=types.js.map