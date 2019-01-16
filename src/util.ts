import get = require("get-value");

/** Whether the current environment is NodeJS. */
export const IsNode = typeof global === "object"
    && get(global, "process.release.name") === "node";

/** The pattern that matches valid JavaScript Latin variable names. */
export const LatinVar = /^[a-z_][a-z0-9_]*$/i;

/**
 * Gets all properties of an object, including those inherited from prototype.
 */
export function keys(obj: any) {
    let proto = Object.getPrototypeOf(obj);

    return Reflect.ownKeys(obj).concat(
        Reflect.ownKeys(proto).filter(key => {
            if (typeof key === "string" && key.slice(0, 1) === "__") {
                return false;
            } else {
                let pass = false;

                try {
                    pass = typeof proto[key] !== "function";
                } finally {
                    return pass;
                }
            }
        })
    );
}

/** Gets the values in the given iterable object. */
export function values<T>(data: Iterable<T> | { [x: string]: T }) {
    let arr: T[] = [];

    if (typeof data[Symbol.iterator] === "function") {
        for (let item of (<Iterable<T>>data)) {
            arr.push(item);
        }
    } else {
        for (let key of keys(data)) {
            arr.push(data[key]);
        }
    }

    return arr;
}

/** Gets a copy of an object with only the specified keys. */
export function pick(obj: any, props: (string | number | symbol)[]): any {
    let result = {};

    for (let key of keys(obj)) {
        if (props.indexOf(key) >= 0) {
            result[key] = obj[key];
        }
    }

    return result;
}

/** Gets a copy of an object without the specified keys. */
export function omit(obj: any, props: (string | number | symbol)[]): any {
    let result = {};

    for (let key of keys(obj)) {
        if (props.indexOf(key) === -1) {
            result[key] = obj[key];
        }
    }

    return result;
}

/** Gets the last elements of an array-like object. */
export function last<T>(target: ArrayLike<T>): T {
    return target[target.length - 1];
}

/**
 * Normalizes the given path, resolving '..' and '.' segments, and change path
 * separators to platform preference.
 */
export function normalize(path: string): string {
    let parts = path.split(/\/|\\/),
        sep = IsNode ? "/" : (process.platform == "win32" ? "\\" : "/");

    for (let i = 0; i < parts.length; i++) {
        if (parts[i] == "..") {
            parts.splice(i - 1, 2);
            i -= 2;
        } else if (parts[i] == ".") {
            parts.splice(i, 1);
            i -= 1;
        }
    }

    return parts.join(sep);
}