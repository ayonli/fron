"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const upperFirst = require("lodash/upperFirst");
const assert_1 = require("assert");
exports.Variable = /^[a-z_][a-z0-9_]*$/i;
exports.MixedTypes = {};
;
function getType(data) {
    if (data === undefined) {
        return;
    }
    else if (data === null) {
        return "null";
    }
    else {
        let type = typeof data, Type = upperFirst(type), isObj = type == "object";
        for (let x in exports.MixedTypes) {
            if (isObj && data.constructor.name === x) {
                return x;
            }
            else if (!isObj && x === Type) {
                return type;
            }
        }
        return type == "object" ? exports.MixedTypes.Object.name : type;
    }
}
exports.getType = getType;
function isMixed(type) {
    return !!exports.MixedTypes[type];
}
exports.isMixed = isMixed;
class Unknown {
}
function checkProto(name, proto) {
    if (typeof proto.fromFRON !== "function") {
        throw new TypeError(`prototype method ${name}.fromFRON() is missing`);
    }
    else if (proto.fromFRON.length < 1) {
        throw new TypeError(`prototype method ${name}.fromFRON() is invalid`);
    }
}
function getValues(data) {
    let arr = [];
    for (let item of data) {
        arr.push(item);
    }
    return arr;
}
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
[Number, Boolean, String, Symbol].forEach(type => {
    register(type.name, {
        toFRON() {
            return this.valueOf();
        },
        fromFRON(data) {
            return type === Symbol ? Symbol.for(data) : new type(data);
        }
    });
});
register(Date.name, {
    toFRON() {
        return this.toISOString();
    },
    fromFRON(data) {
        return new Date(data);
    }
});
register(Object.name, {
    toFRON() {
        return this;
    },
    fromFRON(data) {
        return data;
    }
});
[Array, Buffer, Map, Set].forEach(type => {
    register(type.name, {
        toFRON() {
            return getValues(this);
        },
        fromFRON(data) {
            return type === Buffer ? Buffer.from(data) : new type(data);
        }
    });
});
[
    assert_1.AssertionError,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
].forEach(type => {
    register(type.name, {
        toFRON() {
            let reserved = ["name", "message", "stack"];
            return Object.assign({}, pick(this, reserved), omit(this, reserved));
        },
        fromFRON(data) {
            let err = Object.create(type.prototype);
            Object.defineProperties(err, {
                name: { value: data.name },
                message: { value: data.message },
                stack: { value: data.stack }
            });
            Object.assign(err, omit(data, ["name", "message", "stack"]));
            return err;
        }
    });
});
//# sourceMappingURL=types.js.map