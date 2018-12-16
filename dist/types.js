"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
exports.MixedTypes = {
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
};
exports.ExtendedErrors = [
    assert_1.AssertionError,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];
function isMixed(type) {
    return !!exports.MixedTypes[type];
}
exports.isMixed = isMixed;
function registerType(type, name) {
    exports.MixedTypes[type] = name;
}
exports.registerType = registerType;
for (let type of exports.ExtendedErrors) {
    registerType(type.name, type.name);
}
//# sourceMappingURL=types.js.map