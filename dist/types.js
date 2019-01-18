"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const util_1 = require("./util");
;
exports.CompoundTypes = {
    Object: Object,
    Array: Object
};
function getType(data) {
    if (data === undefined) {
        return;
    }
    else if (data === null) {
        return "null";
    }
    else {
        let type = typeof data, ctor;
        if (type !== "object") {
            return type === "symbol" ? "Symbol" : type;
        }
        else if (ctor = get(data, "constructor")) {
            for (let type in exports.CompoundTypes) {
                if (ctor === exports.CompoundTypes[type])
                    return type;
            }
            return ctor.name;
        }
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
        return Object.assign({}, this);
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
function checkType(type) {
    type = typeof type === "string" ? type : type.name;
    if (!exports.CompoundTypes[type]) {
        throw new ReferenceError(`Unrecognized type: ${type}`);
    }
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
            checkType(proto);
            copyProto(exports.CompoundTypes[proto], type);
            exports.CompoundTypes[type.name] = type;
        }
        else if (typeof proto === "function") {
            checkProto(proto.name, proto.prototype);
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
            checkType(proto);
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
register(Symbol, {
    toFRON() {
        return Symbol.keyFor(this);
    },
    fromFRON(data) {
        return Symbol.for(data);
    }
});
[Number, Boolean, String].forEach(type => {
    register(type, {
        toFRON() {
            return this.valueOf();
        },
        fromFRON(data) {
            return new this.constructor(data);
        }
    });
});
register(RegExp, {
    toFRON() {
        return new FRONString(this.toString());
    },
    fromFRON(data) {
        return new this.constructor(data.source, data.flags);
    }
});
register(Date, {
    toFRON() {
        return this.toISOString();
    },
    fromFRON(data) {
        return new this.constructor(data);
    }
});
[Map, Set].forEach(type => {
    register(type, {
        toFRON() {
            return util_1.values(this);
        },
        fromFRON(data) {
            return new this.constructor(data);
        }
    });
});
[
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint16Array,
    Uint32Array
].forEach(type => {
    register(type, {
        toFRON() {
            return util_1.values(this);
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
        fromFRON(data) {
            Object.defineProperties(this, {
                name: {
                    value: data.name,
                    writable: true,
                    configurable: true
                },
                message: {
                    value: data.message,
                    writable: true,
                    configurable: true
                },
                stack: {
                    value: data.stack,
                    writable: true,
                    configurable: true
                }
            });
            Object.assign(this, omit(data, ["name", "message", "stack"]));
            return this;
        }
    });
});
if (util_1.IsNode) {
    register(require("assert").AssertionError, Error.name);
    register(Buffer, Uint8Array.name);
}
//# sourceMappingURL=types.js.map