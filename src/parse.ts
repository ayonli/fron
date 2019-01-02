import { MixedTypes, ExtendedErrors } from "./types";
import { LiteralToken, string, number, regexp, comment, keyword } from 'literal-toolkit';
import last = require("lodash/last");
import pick = require("lodash/pick");
import omit = require("lodash/omit");
import get = require("lodash/get");
import set = require("lodash/set");
// import cloneDeep = require("lodash/cloneDeep");
import * as path from "path";

export interface SourceToken {
    filename?: string;
    position: {
        start: {
            line: number,
            column: number
        };
        end: {
            line: number,
            column: number
        };
    };
    type: string;
    data: any;
    parent?: SourceToken;
    path?: string;
}

export class SourceToken implements SourceToken {
    constructor(token: SourceToken) {
        Object.assign(this, token);
    }
}

interface CursorToken {
    source: string;
    index: number;
    line: number;
    column: number;
    filename?: string;
}

const IsVar = /^[a-z_][a-z0-9_]*$/i;
const TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;
const MixedTypeHandlers = {
    "String": (data: string) => new String(data),
    "Number": (data: number) => new Number(data),
    "Boolean": (data: boolean) => new Boolean(data),
    "Date": (data: string) => new Date(data),
    "Buffer": (data: number[]) => Buffer.from(data),
    "Map": (data: [any, any][]) => new Map(data),
    "Set": (data: any[]) => new Set(data),
    "Symbol": (data: string) => Symbol.for(data),
    "Error": (data: { [x: string]: any }) => {
        let ctor: new (...args) => Error = ExtendedErrors[data.name] || Error,
            err: Error = Object.create(ctor.prototype);

        Object.defineProperties(err, {
            name: { value: data.name },
            message: { value: data.message },
            stack: { value: data.stack }
        });
        Object.assign(err, omit(data, ["name", "message", "stack"]));

        return err;
    }
};

ExtendedErrors.forEach(error => {
    MixedTypeHandlers[error.name] = MixedTypeHandlers["Error"];
});

function throwSyntaxError(token: SourceToken) {
    let filename = token.filename ? path.resolve(token.filename) : "<anonymous>",
        type = token.type ? token.type + " token" : "token",
        { line, column } = token.position.start;
    throw new SyntaxError(`Unexpected ${type} in ${filename}:${line}:${column}`);
}

function getHandler(type: string): (data: any) => any {
    return MixedTypeHandlers[type] || (MixedTypes[type]
        ? MixedTypes[type].prototype.fromFRON
        : undefined
    );
}

function getInstance(type: string): any {
    return MixedTypes[type] ? Object.create(MixedTypes[type].prototype) : undefined;
}

function setTokenData(token: SourceToken, value, cursor: CursorToken): number {
    token.position.end = pick(cursor, ["line", "column"]);

    if (token.parent) { // mixed types
        if (token.parent.type === "Object") {
            let prop = IsVar.test(value) ? (token.path ? "." : "") + `${value}` : `['${value}']`;

            token.path = (token.parent.path || "") + prop;
            token.type = "property";
            token.parent.data[value] = token;
            token.data = doParseToken(cursor.source, token, cursor);
            (<SourceToken>token.data).position.end = pick(cursor, ["line", "column"]);
        } else if (token.parent.type === "Array") { // array
            token.path = (token.parent.path || "") + `[${token.parent.data.length}]`;
            token.data = value;
            token.parent.data.push(token);
        } else if (token.parent.type === "property") {
            token.data = value;
            token.parent.data = token;

            return 1;
        } else {
            let handle = getHandler(token.parent.type),
                inst = getInstance(token.parent.type);

            token.data = handle ? handle.call(inst || value, value) : value;
        }
    } else { // primitive types
        token.data = value;
        return 1;
    }

    return 0;
}

function doParseToken(str: string, parent: SourceToken, cursor: CursorToken): SourceToken {
    let char: string;
    let token: SourceToken;
    let lastToken: SourceToken = null;

    loop:
    while ((char = str[cursor.index])) {
        if (<any>char == false && char !== "0") {
            cursor.index++;

            if (char === "\n") {
                cursor.line++;
                cursor.column = 1;
            } else {
                cursor.column++;
            }

            continue;
        }

        let remains: string,
            dataToken: LiteralToken & { value: any, type?: string };

        token = lastToken || {
            filename: cursor.filename || "<anonymous>",
            position: {
                start: pick(cursor, ["line", "column"]),
                end: undefined
            },
            type: undefined,
            data: undefined,
        };

        if (parent) token.parent = parent;

        switch (char) {
            case ",":
                if (parent && ["Object", "Array", "property"].includes(parent.type)) {
                    cursor.index++;
                    cursor.column++;

                    if (parent.type === "property") {
                        break loop;
                    }
                } else {
                    throwSyntaxError(token);
                }
                break;

            case ":":
                if (parent && parent.type === "property") {
                    cursor.index++;
                    cursor.column++;
                    lastToken = null;
                } else {
                    throwSyntaxError(token);
                }
                break;

            // mixed type
            case "(":
                cursor.index++;
                cursor.column++;
                token.data = doParseToken(str, token, cursor);
                token.position.end = {
                    line: cursor.line,
                    column: cursor.column + 1 // include the closing brace ")"
                };
                lastToken = null;
                break;

            case ")":
            case "]":
            case "}":
                cursor.index++;
                cursor.column++;
                break loop;

            // object and array
            case "[":
            case "{":
                let isArray = char === "[";

                cursor.index++;
                cursor.column++;
                token.type = isArray ? "Array" : "Object";
                token.data = isArray ? [] : {};

                doParseToken(str, token, cursor);

                token.position.end = pick(cursor, ["line", "column"]);
                break;

            // string
            case "'":
            case '"':
            case "`":
                token.type = "string";

                if ((dataToken = string.parseToken(str.slice(cursor.index)))) {
                    let lines = dataToken.source.split("\n");

                    cursor.index += dataToken.length;
                    cursor.line += lines.length - 1;

                    if (lines.length > 1) {
                        cursor.column = last(lines).length;
                    } else {
                        cursor.column += dataToken.length;
                    }

                    token.position.end = {
                        line: cursor.line,
                        column: cursor.column + 1 // include the closing quote
                    };

                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    } else {
                        break;
                    }
                } else {
                    throwSyntaxError(token);
                }

            // regular expression or comment
            case "/":
                token.type = "regexp";
                remains = str.slice(cursor.index);

                if ((dataToken = regexp.parseToken(remains))) {
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;

                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    } else {
                        break;
                    }
                } else if ((dataToken = comment.parseToken(remains))) {
                    token.type = "comment";
                    cursor.index += dataToken.length;

                    if (dataToken.type !== "//") {
                        let lines = dataToken.source.split("\n");
                        cursor.line += lines.length - 1;

                        if (lines.length > 1) {
                            cursor.column = last(lines).length;
                        } else {
                            cursor.column += dataToken.length;
                        }
                    }

                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    } else {
                        break;
                    }
                } else {
                    throwSyntaxError(token);
                }

            // binary, octal or hexadecimal number, or decimal number starts 
            // with `.`.
            case "0":
            case ".":
                token.type = "number";

                if ((dataToken = number.parseToken(str.slice(cursor.index)))) {
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;

                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    } else {
                        break;
                    }
                } else {
                    throwSyntaxError(token);
                }

            default:
                remains = str.slice(cursor.index);

                if ((dataToken = number.parseToken(remains))) { // number
                    token.type = "number";
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;

                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    } else {
                        break;
                    }
                } else if ((dataToken = keyword.parseToken(remains))) { // keyword
                    token.type = "keyword";
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;

                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    } else {
                        break;
                    }
                } else {
                    let matches = remains.match(TypeOrPorp);

                    if (matches) {
                        let lines = matches[0].split("\n"),
                            key = matches[1];

                        cursor.index += matches[0].length - 1;
                        cursor.line += lines.length - 1;

                        if (last(matches[0]) === ":") { // property
                            token.type = "property";
                            lastToken = token;

                            if (parent && parent.type === "Object") {
                                if (lines.length > 1) {
                                    cursor.column = last(lines).length - 1;
                                } else {
                                    cursor.column += matches[0].length - 1;
                                }

                                if (setTokenData(token, key, cursor)) {
                                    break loop;
                                } else {
                                    break;
                                }
                            } else {
                                throwSyntaxError(token);
                            }
                        } else {
                            token.type = key; // personalized type
                            lastToken = token;

                            if (token.type === "Reference" && !parent) {
                                throwSyntaxError(token);
                            }

                            if (lines.length > 1) {
                                cursor.column = last(lines).length - 1;
                            } else {
                                cursor.column += matches[0].length - 1;
                            }
                        }
                    } else {
                        isFinite(Number(char)) && (token.type = "number");
                        throwSyntaxError(token);
                    }
                }
                break;
        }
    }

    return token;
}

export function parseToken(str: string, filename?: string): SourceToken {
    let cursor = {
        source: str,
        index: 0,
        line: 1,
        column: 1,
        filename
    };

    return doParseToken(str, null, cursor);
}

export function parse(str: string, filename?: string): any {
    let token = parseToken(str, filename),
        refMap = {},
        data = compose(token, refMap);



    for (let path in refMap) {
        let target = refMap[path];
        let ref = target ? get(data, target) : data;
        set(data, path, ref);
    }

    return data;
}

function compose(token: SourceToken, refMap: { [path: string]: string }): any {
    let data;

    switch (token.type) {
        case "Object":
            data = {};
            for (let prop in token.data) {
                data[prop] = compose(token.data[prop], refMap);
            }
            break;

        case "Array":
            data = [];
            for (let item of token.data) {
                data.push(compose(item, refMap));
            }
            break;

        case "Reference":
            refMap[token.path] = token.data;
            break;

        default:
            data = token.data;
            break;
    }

    return data;
}