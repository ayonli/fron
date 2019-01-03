import { MixedTypes, ExtendedErrors } from "./types";
import { LiteralToken, string, number, regexp, comment, keyword } from 'literal-toolkit';
import last = require("lodash/last");
import pick = require("lodash/pick");
import omit = require("lodash/omit");
import get = require("lodash/get");
import set = require("lodash/set");
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
    return MixedTypes[type] ? Object.create(MixedTypes[type].prototype) : void 0;
}

function doParseToken(str: string, parent: SourceToken, cursor: CursorToken, listener?: (token: SourceToken) => void): SourceToken {
    let char: string;
    let token: SourceToken;

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

        token = new SourceToken({
            filename: cursor.filename || "<anonymous>",
            position: {
                start: pick(cursor, ["line", "column"]),
                end: undefined
            },
            type: undefined,
            data: undefined,
        });

        if (parent) token.parent = parent;

        switch (char) {
            case ",":
                if (parent && ["Object", "Array"].indexOf(parent.type) >= 0) {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token);
                }
                break;

            case ":":
                if (parent && parent.type === "property") {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token);
                }
                break;

            case "(":
                if (parent) {
                    cursor.index++;
                    cursor.column++
                } else {
                    throwSyntaxError(token);
                }
                break;

            case ")":
                if (parent) {
                    cursor.index++;
                    cursor.column++
                } else {
                    throwSyntaxError(token);
                }
                break loop;

            case "]":
            case "}":
                if (parent) {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token);
                }
                return;

            // object and array
            case "[":
            case "{":
                let isArray = char === "[";

                cursor.index++;
                cursor.column++;
                token.type = isArray ? "Array" : "Object";
                token.data = isArray ? [] : {};

                doParseToken(str, token, cursor, listener);
                break loop;

            // string
            case "'":
            case '"':
            case "`":
                token.type = "string";

                if ((dataToken = string.parseToken(str.slice(cursor.index)))) {
                    let lines = dataToken.source.split("\n");

                    token.data = dataToken.value;
                    cursor.index += dataToken.length;
                    cursor.line += lines.length - 1;

                    if (lines.length > 1) {
                        cursor.column = last(lines).length;
                    } else {
                        cursor.column += dataToken.length;
                    }
                } else {
                    throwSyntaxError(token);
                }
                break loop;

            // regular expression or comment
            case "/":
                token.type = "regexp";
                remains = str.slice(cursor.index);

                if ((dataToken = regexp.parseToken(remains))) {
                    token.data = dataToken.value;
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                } else if ((dataToken = comment.parseToken(remains))) {
                    token.type = "comment";
                    token.data = dataToken.value;
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
                } else {
                    throwSyntaxError(token);
                }
                break loop;

            // binary, octal or hexadecimal number, or decimal number starts 
            // with `.`.
            case "0":
            case ".":
                token.type = "number";

                if ((dataToken = number.parseToken(str.slice(cursor.index)))) {
                    token.data = dataToken.value;
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                } else {
                    throwSyntaxError(token);
                }
                break loop;

            default:
                remains = str.slice(cursor.index);

                if ((dataToken = number.parseToken(remains))) { // number
                    token.type = "number";
                    token.data = dataToken.value;
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                } else if ((dataToken = keyword.parseToken(remains))) { // keyword
                    token.type = "keyword";
                    token.data = dataToken.value;
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                } else {
                    let matches = remains.match(TypeOrPorp);

                    if (matches) {
                        let lines = matches[0].split("\n"),
                            key = matches[1];

                        cursor.index += key.length;
                        cursor.line += lines.length - 1;

                        if (lines.length > 1) {
                            cursor.column = last(lines).length;
                        } else {
                            cursor.column += key.length;
                        }

                        if (last(matches[0]) === ":") { // property
                            token.type = "property";

                            if (parent && parent.type === "Object") {
                                token.data = key;
                            } else {
                                throwSyntaxError(token);
                            }
                        } else {
                            token.type = key; // personalized type

                            if (!parent && token.type === "Reference") {
                                throwSyntaxError(token);
                            } else {
                                token.data = doParseToken(str, token, cursor, listener);

                                // since the token of personalized type will 
                                // contain an extra closing bracket ")", and 
                                // potential spaces, using doParseToken() can 
                                // let the cursor travel through them.
                                doParseToken(str, token, cursor);
                            }
                        }
                    } else {
                        isFinite(Number(char)) && (token.type = "number");
                        throwSyntaxError(token);
                    }
                }
                break loop;
        }
    }

    token.position.end = pick(cursor, ["line", "column"]);

    if (token.parent) { // mixed type
        if (token.parent.type === "Object") {
            let prop = token.data,
                prefix = get(token, "parent.parent.path", ""),
                path = IsVar.test(prop) ? (prefix ? "." : "") + `${prop}` : `['${prop}']`;

            token.path = (prefix || "") + path;
            token.type = "property";
            token.data = doParseToken(str, token, cursor, listener);
            token.parent.data[prop] = token;
        } else if (token.parent.type === "Array") { // array
            token.path = (token.parent.path || "") + `[${token.parent.data.length}]`;
            token.parent.data.push(token);
        }
    }

    listener && listener.call(void 0, token);

    if (token.parent && ["Object", "Array"].indexOf(token.parent.type) >= 0) {
        return doParseToken(str, token.parent, cursor, listener);
    } else {
        return token;
    }
}

export function parseToken(str: string, filename?: string, listener?: (token: SourceToken) => void): SourceToken {
    return doParseToken(str, null, {
        index: 0,
        line: 1,
        column: 1,
        filename
    }, listener);
}

export function parse(str: string, filename?: string): any {
    return composeToken(parseToken(str, filename));
}

export function composeToken(token: SourceToken): any {
    let refMap = {},
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
                data[prop] = compose(token.data[prop].data, refMap);
            }
            break;

        case "Array":
            data = [];
            for (let item of token.data) {
                data.push(compose(item, refMap));
            }
            break;

        case "Reference":
            refMap[token.parent.path] = compose(token.data, refMap);
            break;

        default:
            if (token.data instanceof SourceToken) {
                let handle = getHandler(token.type),
                    inst = getInstance(token.type);

                data = compose(token.data, refMap);
                data = handle ? handle.call(inst || data, data) : data;
            } else {
                data = token.data;
            }
            break;
    }

    return data;
}