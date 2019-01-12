import pick = require("lodash/pick");
import omit = require("lodash/omit");
import get = require("lodash/get");
import upperFirst = require("lodash/upperFirst");

/**
 * The interface that restricts which a user defined type can be registered as 
 * FRON type.
 */
export interface FRONEntry<T> {
    toFRON(): any;
    fromFRON(data: any, type: string): T;
};

/** Indicates a class constructor that implements the FRONEntry interface. */
export type FRONConstructor<T> = new (...args: any[]) => FRONEntry<T>;

/** Whether the current environment is NodeJS. */
export const IsNode = typeof global === "object"
    && get(global, "process.release.name") === "node";

/** The pattern that matches valid JavaScript Latin variable names. */
export const Variable = /^[a-z_][a-z0-9_]*$/i;

/** 
 * Stores all supported compound types, includes the types that user registered.
 */
export const CompoundTypes: { [type: string]: FRONConstructor<any> } = {
    // objects and arrays are handled internally by the stringifier and parser,
    // register here is for checkers to identify them as compound types.
    Object: <any>Object,
    Array: <any>Object
};

/** Checks if the given type is an registered compound type. */
export function isCompound(type: string) {
    return !!CompoundTypes[type];
}

/**
 * Gets the type name in string of the input data, may return a primitive type 
 * or a compound type. If the type list doesn't contain the input type, returns 
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

        for (let x in CompoundTypes) {
            if (isObj && data.constructor.name === x) {
                return x;
            } else if (!isObj && x === Type) { // type alias
                return type;
            }
        }

        return isObj ? CompoundTypes.Object.name : type;
    }
}

/**
 * Gets an instance of the given type, may return undefined if the type isn't 
 * registered, this function calls `Object.create()` to create instance, so the
 * constructor will not be called automatically.
 */
export function getInstance<T = any>(type: string | FRONConstructor<T>): T {
    type = typeof type === "function" ? type.name : type;
    return CompoundTypes[type] && Object.create(CompoundTypes[type].prototype);
}

/**
 * When register a type with an object as its prototype, a new sub-class will 
 * be created to extend FRONEntryBase and merge the object to its prototype. In 
 * the parsing phase, a FRONEntryBase instance will be created via 
 * `Object.create()` and apply the `fromFRON()` method to it.
 */
export class FRONEntryBase implements FRONEntry<any> {
    toFRON() {
        return this;
    }

    fromFRON(data: any) {
        return data;
    }
}

/**
 * A special type used to mark up user defined FRON notations, if a `toFRON()`
 * method return a `FRONString`, them it will not be stringified again with
 * common approach, just use the represented value as the output notation.
 * NOTE: the personalized notation must use valid syntax that can be identified 
 * by the parser, it is either a literal, or a compound type.
 */
export class FRONString extends String { }

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
        // The second argument `type` is optional, when pass, it is the type 
        // notation in string of the token.
        throw new TypeError(`prototype method ${name}.fromFRON() is invalid`);
    }
}

/** Tests if a type is registered. */
function testCompound(type: string | FRONConstructor<any>) {
    type = typeof type === "string" ? type : type.name;
    if (!isCompound(type)) {
        throw new ReferenceError(`Unrecognized type: ${type}`);
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
 * Copies the FRONEntry protocol methods from a FRONConstructor to another 
 * constructor.
 */
function copyProto(source: object | FRONConstructor<any>, target: Function) {
    source = typeof source === "function" ? source.prototype : source;
    Object.assign(target.prototype, pick(source, [
        "toFRON",
        "fromFRON"
    ]));
}

/**
 * Registers a customized data type so that the stringifier and parser can 
 * identify it.
 * @example
 *  // Register a constructor with `toFRON` and `fromFRON` methods.
 *  register(User);
 * 
 *  // Register a constructor and merger a customized prototype.
 *  register(Date, { toFRON() { ... }, fromFRON() { ... } });
 * 
 *  // Register a non-constructor type with a customized prototype.
 *  register("Article", { toFRON() { ... }, fromFRON() { ... } });
 * 
 *  // Four ways to register an alias type.
 *  // NOTE: the former two will use the constructor `Student`
 *  // to create instance when parsing, but the last two will
 *  // use `User` since "Student" is not a constructor. However,
 *  // they all use the name "Student" as notation.
 *  register(Student, User);
 *  register(Student, "User");
 *  register("Student", User);
 *  register("Student", "User");
 */
export function register<T = any>(
    type: string | FRONConstructor<T> | (new (...args: any[]) => any),
    proto?: string | FRONConstructor<T> | FRONEntry<T>
): void {
    if (typeof type === "function") {
        if (!proto) {
            checkProto(type.name, type.prototype);
            CompoundTypes[type.name] = type;
        } else if (typeof proto === "string") {
            testCompound(proto);
            copyProto(CompoundTypes[proto], type);
            CompoundTypes[type.name] = type;
        } else if (typeof proto === "function") {
            testCompound(proto);
            copyProto(proto, type);
            CompoundTypes[type.name] = type;
        } else if (typeof proto === "object") {
            checkProto(type.name, proto);
            copyProto(proto, type);
            CompoundTypes[type.name] = type;
        } else {
            throw new Error(`Invalid prototype: ${proto}`);
        }
    } else if (typeof type === "string") {
        if (typeof proto === "string") {
            testCompound(proto);
            CompoundTypes[type] = CompoundTypes[proto];
        } else if (typeof proto === "function") {
            checkProto(proto.name, proto.prototype);
            CompoundTypes[type] = proto;
        } else if (typeof proto === "object") {
            checkProto(type, proto);
            let ctor: Function = proto.constructor;

            if (ctor === Object)
                ctor = class extends FRONEntryBase { };

            copyProto(proto, ctor);
            CompoundTypes[type] = <any>ctor;
        } else {
            throw new Error(`Invalid prototype: ${proto}`);
        }
    } else {
        throw new TypeError(`Invalid type: ${type}`);
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
register(Date, {
    toFRON(this: Date) {
        return this.toISOString();
    },
    fromFRON(data: string) {
        return new this.constructor(data);
    }
});

// Register handler for RegExp.
register(RegExp, {
    toFRON(this: RegExp) {
        return new FRONString(this.toString());
    },
    fromFRON(data: { source: string, flags: string }) {
        // For FRON string to support object wrapped by RegExp, and literal is 
        // internally support by the parser.
        return new this.constructor(data.source, data.flags);
    }
});

// Register handlers for Map and Set.
[Map, Set].forEach(type => {
    register(type, {
        toFRON(this: Iterable<any>) {
            return getValues(this);
        },
        fromFRON(data: any[]) {
            return new this.constructor(data);
        }
    });
});

// Register handlers for typed arrays.
[
    Int8Array,
    Int16Array,
    Int16Array,
    Uint8Array,
    Uint16Array,
    Uint32Array
].forEach(type => {
    register(type, {
        toFRON(this: Iterable<number>) {
            return getValues(this);
        },
        fromFRON(data: number[]) {
            return this.constructor.from(data);
        }
    });
});

// Register handlers for all errors.
[
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
].forEach(type => {
    register(type, {
        toFRON(this: Error) {
            // When stringify an error, stringify all its member properties,
            // include `name`, `message` and `stack`, since they may not be 
            // enumerated, so using `pick()` to fetch them manually.
            let reserved = ["name", "message", "stack"];

            return Object.assign({}, pick(this, reserved), omit(this, reserved));
        },
        fromFRON(data: { [x: string]: any }, type: string): Error {
            let err: Error = getInstance(type);

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

if (IsNode) {
    // Register some well-known NodeJS types.
    let AssertionError: FRONConstructor<any> = require("assert").AssertionError;
    register(AssertionError, Error.name);
    register(Buffer, Uint8Array.name);
}