import get = require("lodash/get");

/** Whether the current environment is NodeJS. */
export const IsNode = typeof global === "object"
    && get(global, "process.release.name") === "node";

/** The pattern that matches valid JavaScript Latin variable names. */
export const LatinVar = /^[a-z_\$][a-z0-9_\$]*$/i;

/** Gets the values in the given iterable object. */
export function values<T>(data: Iterable<T> | { [x: string]: T }) {
    let arr: T[] = [];

    if (typeof data[Symbol.iterator] === "function") {
        for (let item of (<Iterable<T>>data)) {
            arr.push(item);
        }
    } else {
        for (let key in data) {
            arr.push(data[key]);
        }
    }

    return arr;
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