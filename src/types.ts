import pick = require("lodash/pick");
import omit = require("lodash/omit");
import upperFirst = require("lodash/upperFirst");
import { AssertionError } from "assert";

/** The pattern that matches valid JavaScript Latin variable names. */
export const Variable = /^[a-z_][a-z0-9_]*$/i;

/** 
 * Stores all supported mixed types, includes the types that user registered.
 */
export const MixedTypes: { [type: string]: Function } = {};

/**
 * The interface that restricts which a user defined type can be registered as 
 * FRON type.
 */
export interface FRONEntry<T> {
    toFRON: () => any,
    fromFRON: (data: any) => T
};

/**
 * Gets the type name in string of the input data, may return a primitive type 
 * or a mixed type. If the type list doesn't contain the input type, returns 
 * `Object` instead.
 */
export function getType(data: any): string {
    if (data === undefined) {
        return;
    } else if (data === null) {
        return "null";
    } else {
        let type = typeof data,
            Type = upperFirst(type),
            isObj = type == "object";

        for (let x in MixedTypes) {
            if (isObj && data.constructor.name === x) {
                return x;
            } else if (!isObj && x === Type) { // type alias
                return type;
            }
        }

        return type == "object" ? MixedTypes.Object.name : type;
    }
}

/** Checks if the given type is an registered mixed type. */
export function isMixed(type: string) {
    return !!MixedTypes[type];
}

/**
 * Indicates an unknown type, when register an type that is not a constructor,
 * but an object match the `FRONEntry` interface, a new anonymous sub-class of 
 * `Unknown` will be defined and merge the provided object as prototype to store
 * the type.
 */
class Unknown { }

/** Checks if the given prototype can be registered as an FRON type. */
function checkProto(name: string, proto: FRONEntry<any>) {
    if (typeof proto.fromFRON !== "function") {
        // Every constructor that used as FRON type should include a 
        // `fromFRON()` method, so that when parsing the FRON string, the parser
        // could call the method to produce an expected instance of the type.
        throw new TypeError(`prototype method ${name}.fromFRON() is missing`);
    } else if (proto.fromFRON.length < 1) {
        // The `fromFRON()` method needs to accept at least one argument, which 
        // is the data parsed from the FRON string, usually used to create a new
        // instance of the type.
        // The method may accept any other arguments, if it'll be used for other
        // usage.
        throw new TypeError(`prototype method ${name}.fromFRON() is invalid`);
    }
}

/** Gets the values in the given iterable object. */
function getValues<T>(data: Iterable<T>): T[] {
    let arr = [];

    for (let item of data) {
        arr.push(item);
    }

    return arr;
}

/**
 * Registers the given `type` as FRON type with an object as prototype that 
 * matches the `FRONEntry` interface.
 */
export function register<T>(type: string, proto: FRONEntry<T>): void;

/** Registers the given `type` which is a constructor as FRON type. */
export function register<T>(type: new (...args: any[]) => FRONEntry<T>): void;

/**
 * Registers a type as alias to an existing type, so that the stringifier or 
 * parser could use an existing approach to deal with that type. However the 
 * stringifier should use the alias name as notation, so that when parsing it 
 * will be identified as an individual type.
 */
export function register(type: string, asAlias: string): void;

export function register(
    type: string | (new (...args: any[]) => FRONEntry<any>),
    proto?: string | FRONEntry<any>
) {
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

// Register handlers for Number, Boolean, String and Symbol.
[Number, Boolean, String, Symbol].forEach(type => {
    register(type.name, {
        toFRON(this: String | Number | Boolean) {
            // The symbol type won't call this method, it's handled inside the
            // stringifier.
            return this.valueOf();
        },
        fromFRON(data: any) {
            return type === Symbol ? Symbol.for(data) : new (<any>type)(data);
        }
    });
});

// Register handler for Date.
register(Date.name, {
    toFRON(this: Date) {
        return this.toISOString();
    },
    fromFRON(data: string) {
        return new Date(data);
    }
});

// Register handler for Object (only for FRON string to support object literal 
// wrapped by Object).
register(Object.name, {
    toFRON(this: object) {
        return this;
    },
    fromFRON(data: object) {
        return data;
    }
});

// Register handlers for Array, Buffer, Map and Set (Array handler only for 
// FRON string to support array literal wrapped by Array).
[Array, Buffer, Map, Set].forEach(type => {
    register(type.name, {
        toFRON(this: Iterable<any>) {
            return getValues(this);
        },
        fromFRON(data: any[]) {
            return type === Buffer ? Buffer.from(data) : new (<any>type)(data);
        }
    });
});

// Register handlers for all errors.
[
    AssertionError,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
].forEach(type => {
    register(type.name, {
        toFRON(this: Error) {
            // When stringify an error, stringify all its member properties,
            // include `name`, `message` and `stack`, since they may not be 
            // enumerated, so using `pick()` to fetch them manually.
            let reserved = ["name", "message", "stack"];

            return Object.assign({}, pick(this, reserved), omit(this, reserved));
        },
        fromFRON(data: { [x: string]: any }): Error {
            // When parse an error, create a new error instance via 
            // `Object.create()` and assign property values afterwards.
            let err: Error = Object.create(type.prototype);

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