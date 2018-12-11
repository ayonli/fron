import { registerType } from "./types";
import { registerToFron } from "./stringify";

export function register<T>(constructor: new (...args) => T): void;
export function register<T>(type: string, prototype: { toFRON(): any, fromFRON(data: any): T }): void;
export function register(type: string, aliasOf: string): void;
export function register(type: string | Function, proto?: any) {
    if (typeof type === "function") {
        registerType(type.name, type.name);
        registerToFron(type.name, type.prototype.toFRON);
    } else {
        if (typeof proto === "string") {
            registerType(type, proto);
        } else {
            registerType(type, type);
            registerToFron(type, proto.toFRON);
        }
    }
}