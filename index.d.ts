export declare const FRON: FRON;
export declare interface FRON {
    stringify(data: any, pretty?: boolean | string): string;
    stringifyAsync(data: any, pretty?: boolean | string): Promise<string>;
    parse(data: string, parseUnknown?: boolean): any;
    parseAsync(data: string, parseUnknown?: boolean): Promise<any>;
    register<T>(constructor: new (...args) => T): void;
    register<T>(type: string, prototype: { toFRON(): any, fromFRON(data: any): T }): void;
    register(type: string, aliasOf: string): void;
}

export default FRON;