import { AssertionError } from "assert";

export const MixedTypes = {
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
export const ExtendedErrors = [
    AssertionError,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];

type FRONHandlerPrototype = {
    toFRON: () => any,
    fromFRON: (data: any) => any
};

function checkProto(name: string, proto: FRONHandlerPrototype) {
    if (typeof proto.fromFRON !== "function") {
        throw new TypeError(`prototype method ${name}.fromFRON() is missing`);
    } else if (proto.fromFRON.length < 1) {
        throw new TypeError(`prototype method ${name}.fromFRON() is invalid`);
    }
}

export class Unknown { }

export function isMixed(type: string) {
    return !!MixedTypes[type];
}

export function register(type: string, proto: FRONHandlerPrototype);
export function register(type: Function);
export function register(type: string, asAlias: string);
export function register(type: string | Function, proto?: string | FRONHandlerPrototype) {
    if (typeof type === "function") {
        checkProto(type.name, type.prototype);
        MixedTypes[type.name] = type;
    } else {
        if (typeof proto === "string") {
            MixedTypes[type] = MixedTypes[proto];
        } else {
            checkProto(type, proto);
            let ctor: Function = proto.constructor;

            if (ctor === Object)
                ctor = class extends Unknown { };

            Object.assign(ctor.prototype, proto);
            MixedTypes[type] = ctor;
        }
    }
}

for (let type of ExtendedErrors) {
    register(type.name, Error.name);
}