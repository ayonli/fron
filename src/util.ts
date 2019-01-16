/**
 * Gets all properties of an object, including those inherited from prototype.
 */
export function keys(obj: any) {
    let props: (string | number | symbol)[] = [];

    props.push(
        ...Reflect.ownKeys(obj),
        ...Reflect.ownKeys(Object.getPrototypeOf(obj)),
    );

    return Array.from(new Set(props));
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
        if (props.indexOf(key) === -1 && typeof obj[key] !== "function") {
            result[key] = obj[key];
        }
    }

    return result;
}