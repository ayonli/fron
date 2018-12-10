import { getType, Types } from './types';

function isObjectType(type: string) {
    let code = type.charCodeAt(0);
    return code >= 65 && code <= 90;
}

function getValues<T>(data: Iterable<T>): T[] {
    let arr = [];
    for (let item of data) {
        arr.push(item);
    }
    return arr;
}

export function stringify(data: any): string | void {
    let type = getType(data);

    if (!type) {
        return;
    } else if (isObjectType(type)) {
        return getHandler(type)(data);
    } else if (type === "null") {
        return "null";
    } else {
        return String(data);
    }
}

function stringifyMixed(type: string, data: any) {
    return type + "(" + stringify(data) + ")";
}

function stringifyIterable<T>(type: string, data: Iterable<T>): string {
    return stringifyMixed(type, getValues(data));
}

function getHandler(type: string): (data: any) => string {
    var handlers = {
        "Array": (data: any[]) => {
            let arr: string[] = [];
            for (let item of data) {
                let res = stringify(item);
                (res !== undefined) && arr.push(<string>res);
            }
            return "[" + arr.join(",") + "]";
        },
        "Boolean": (data: Boolean) => "Boolean(" + Boolean(data) + ")",
        "Buffer": (data: Buffer) => stringifyIterable(type, data),
        "Date": (data: Date) => "Date(" + data.toISOString() + ")",
        "Map": (data: Map<any, any>) => stringifyIterable(type, data),
        "Number": (data: Number) => "Number(" + Number(data) + ")",
        "Object": (data: object) => {
            let re = /^[a-z_][a-z_]*$/i,
                obj = {};
            for (let x in data) {
                if (re.test(x)) {
                    // obj[]
                }
            }
        },
        "RegExp": (data: RegExp) => String(data),
        "Set": (data: Set<any>) => stringifyIterable(type, data),
        "String": (data: String) => 'String("' + String(data) + '")',
        "Symbol": (data: symbol) => {
            let key = Symbol.keyFor(data);
            return key === undefined ? void 0 : `String("${key}")`;
        }
    };
    return handlers[type];
}

var a = {
    我们: ""
}

export function register<T>(constructor: new (...args) => T): void;
export function register<T>(type: string, prototype: { toFRON(): any, fromFRON(data: any): T }): void;
export function register(type: string, aliasOf: string): void;
export function register(type: string | Function, proto?: any) {
    if (typeof type === "function") {
        Types[type.name] = type.name;
    } else {
        if (typeof proto === "string") {
            Types[type] = Types[proto];
        } else {
            Types[type] = type;
        }
    }
}