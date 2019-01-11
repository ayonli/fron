"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const get = require("lodash/get");
const upperFirst = require("lodash/upperFirst");
;
exports.IsNode = typeof global === "object"
    && get(global, "process.release.name") === "node";
exports.Variable = /^[a-z_][a-z0-9_]*$/i;
exports.CompoundTypes = {
    Object: Object,
    Array: Object
};
function isCompound(type) {
    return !!exports.CompoundTypes[type];
}
exports.isCompound = isCompound;
function getType(data) {
    if (data === undefined) {
        return;
    }
    else if (data === null) {
        return "null";
    }
    else {
        let type = typeof data, Type = upperFirst(type), isObj = type == "object";
        for (let x in exports.CompoundTypes) {
            if (isObj && data.constructor.name === x) {
                return x;
            }
            else if (!isObj && x === Type) {
                return type;
            }
        }
        return isObj ? exports.CompoundTypes.Object.name : type;
    }
}
exports.getType = getType;
function getInstance(type) {
    type = typeof type === "function" ? type.name : type;
    return exports.CompoundTypes[type] && Object.create(exports.CompoundTypes[type].prototype);
}
exports.getInstance = getInstance;
class FRONEntryBase {
    toFRON() {
        return this;
    }
    fromFRON(data) {
        return data;
    }
}
exports.FRONEntryBase = FRONEntryBase;
class FRONString extends String {
}
exports.FRONString = FRONString;
function checkProto(name, proto) {
    if (typeof proto.fromFRON !== "function") {
        throw new TypeError(`prototype method ${name}.fromFRON() is missing`);
    }
    else if (proto.fromFRON.length < 1) {
        throw new TypeError(`prototype method ${name}.fromFRON() is invalid`);
    }
}
function testCompound(type) {
    type = typeof type === "string" ? type : type.name;
    if (!isCompound(type)) {
        throw new ReferenceError(`Unrecognized type: ${type}`);
    }
}
function getValues(data) {
    let arr = [];
    for (let item of data) {
        arr.push(item);
    }
    return arr;
}
function copyProto(source, target) {
    source = typeof source === "function" ? source.prototype : source;
    Object.assign(target.prototype, pick(source, [
        "toFRON",
        "fromFRON"
    ]));
}
function register(type, proto) {
    if (typeof type === "function") {
        if (!proto) {
            checkProto(type.name, type.prototype);
            exports.CompoundTypes[type.name] = type;
        }
        else if (typeof proto === "string") {
            testCompound(proto);
            copyProto(exports.CompoundTypes[proto], type);
            exports.CompoundTypes[type.name] = type;
        }
        else if (typeof proto === "function") {
            testCompound(proto);
            copyProto(proto, type);
            exports.CompoundTypes[type.name] = type;
        }
        else if (typeof proto === "object") {
            checkProto(type.name, proto);
            copyProto(proto, type);
            exports.CompoundTypes[type.name] = type;
        }
        else {
            throw new Error(`Invalid prototype: ${proto}`);
        }
    }
    else if (typeof type === "string") {
        if (typeof proto === "string") {
            testCompound(proto);
            exports.CompoundTypes[type] = exports.CompoundTypes[proto];
        }
        else if (typeof proto === "function") {
            checkProto(proto.name, proto.prototype);
            exports.CompoundTypes[type] = proto;
        }
        else if (typeof proto === "object") {
            checkProto(type, proto);
            let ctor = proto.constructor;
            if (ctor === Object)
                ctor = class extends FRONEntryBase {
                };
            copyProto(proto, ctor);
            exports.CompoundTypes[type] = ctor;
        }
        else {
            throw new Error(`Invalid prototype: ${proto}`);
        }
    }
    else {
        throw new TypeError(`Invalid type: ${type}`);
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
register(Date, {
    toFRON() {
        return this.toISOString();
    },
    fromFRON(data) {
        return new Date(data);
    }
});
register(RegExp, {
    toFRON() {
        return new FRONString(this.toString());
    },
    fromFRON(data) {
        return new RegExp(data.source, data.flags);
    }
});
[Map, Set].forEach(type => {
    register(type, {
        toFRON() {
            return getValues(this);
        },
        fromFRON(data) {
            return new type(data);
        }
    });
});
[
    Int8Array,
    Int16Array,
    Int16Array,
    Uint8Array,
    Uint16Array,
    Uint32Array
].forEach(type => {
    register(type, {
        toFRON() {
            return getValues(this);
        },
        fromFRON(data) {
            return this.constructor.from(data);
        }
    });
});
[
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
].forEach(type => {
    register(type, {
        toFRON() {
            let reserved = ["name", "message", "stack"];
            return Object.assign({}, pick(this, reserved), omit(this, reserved));
        },
        fromFRON(data, type) {
            let err = getInstance(type);
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
if (exports.IsNode) {
    let AssertionError = require("assert").AssertionError;
    register(AssertionError, Error.name);
    register(Buffer, Uint8Array.name);
}
//# sourceMappingURL=types.js.map