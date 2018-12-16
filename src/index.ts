import { registerType } from "./types";
import { registerToFron, stringify } from "./stringify";
import { registerFromFron, registerConstructr, parse } from "./parse";

export function register<T>(constructor: new (...args) => T): void;
export function register<T>(type: string, prototype: { toFRON(): any, fromFRON(data: any): T }): void;
export function register(type: string, aliasOf: string): void;
export function register(type: string | Function, proto?: any) {
    if (typeof type === "function") {
        registerType(type.name, type.name);
        registerToFron(type.name, type.prototype.toFRON);
        registerFromFron(type.name, type.prototype.fromFRON);
        registerConstructr(type);
    } else {
        if (typeof proto === "string") {
            registerType(type, proto);
        } else {
            registerType(type, type);
            registerToFron(type, proto.toFRON);
            registerFromFron(type, proto.fromFRON);
        }
    }
}

export { stringify, parse };