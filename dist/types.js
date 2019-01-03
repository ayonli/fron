"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
exports.Variable = /^[a-z_][a-z0-9_]*$/i;
exports.MixedTypes = {
    Array,
    Boolean,
    Buffer,
    Date,
    Error,
    Map,
    Number,
    Object,
    RegExp,
    Set,
    String
};
exports.ExtendedErrors = [
    assert_1.AssertionError,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];
;
function checkProto(name, proto) {
    if (typeof proto.fromFRON !== "function") {
        throw new TypeError(`prototype method ${name}.fromFRON() is missing`);
    }
    else if (proto.fromFRON.length < 1) {
        throw new TypeError(`prototype method ${name}.fromFRON() is invalid`);
    }
}
class Unknown {
}
function isMixed(type) {
    return !!exports.MixedTypes[type];
}
exports.isMixed = isMixed;
function register(type, proto) {
    if (typeof type === "function") {
        checkProto(type.name, type.prototype);
        exports.MixedTypes[type.name] = type;
    }
    else {
        if (typeof proto === "string") {
            exports.MixedTypes[type] = exports.MixedTypes[proto];
        }
        else {
            checkProto(type, proto);
            let ctor = proto.constructor;
            if (ctor === Object)
                ctor = class extends Unknown {
                };
            Object.assign(ctor.prototype, proto);
            exports.MixedTypes[type] = ctor;
        }
    }
}
exports.register = register;
for (let type of exports.ExtendedErrors) {
    register(type.name, Error.name);
}
//# sourceMappingURL=types.js.map