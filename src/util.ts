/** Whether the current environment is NodeJS. */
export const IsNode = typeof process === "object"
    && process.release?.name === "node";

/** The pattern that matches valid JavaScript Latin variable names. */
export const LatinVar = /^[a-z_\$][a-z0-9_\$]*$/i;
export const LatinVar2 = /^[a-z_\$][a-z0-9_\$]*/i;

export function last<T>(arr: T[]): T | undefined {
    return arr.length ? arr[arr.length - 1] : undefined;
}

/** Gets the values in the given iterable object. */
export function values<T>(data: Iterable<T> | object) {
    const arr: T[] = [];

    if (typeof (data as any)[Symbol.iterator] === "function") {
        for (const item of (<Iterable<T>>data)) {
            arr.push(item);
        }
    } else {
        for (const key of Reflect.ownKeys(data)) {
            arr.push((data as any)[key]);
        }
    }

    return arr;
}

/**
 * Normalizes the given path, resolving '..' and '.' segments, and change path
 * separators to platform preference.
 */
export function normalize(path: string): string {
    const parts = path.split(/\/|\\/);
    const sep = IsNode ? (process.platform == "win32" ? "\\" : "/") : "/";

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

/**
 * Matches the reference notation in the form of `$.a.b.c` where `$` stands for
 * the current object.
 */
export function matchRefNotation(str: string) {
    if (str[0] !== "$") {
        return null;
    }

    const value = "$" + resolvePropPath(str.slice(1));

    return {
        value,
        offset: 0,
        length: value.length,
        source: str,
    };
}

function resolvePropPath(str: string): string {
    let prop = str[0];

    if (prop === "[") {
        const end = str.indexOf("]");

        if (end === -1) {
            return "";
        } else {
            prop += str.slice(1, end + 1);
            str = str.slice(end + 1);
        }
    } else if (prop === ".") {
        str = str.slice(1);
        const matches = str.match(LatinVar2);

        if (!matches) {
            return "";
        } else {
            prop += matches[0];
            str = str.slice(matches[0].length);
        }
    } else {
        return "";
    }

    return prop + resolvePropPath(str);
}
