import { MixedTypes, ExtendedErrors } from "./types";
import { LiteralToken, string, number, regexp, comment, keyword } from 'literal-toolkit';
import last = require("lodash/last");
import pick = require("lodash/pick");
import omit = require("lodash/omit");
import get = require("lodash/get");
import set = require("lodash/set");
import cloneDeep = require("lodash/cloneDeep");
import * as path from "path";

export interface SourceToken {
    filename: string;
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

function setTokenData(token: SourceToken, value, cursor: CursorToken) {
    token.position.end = pick(cursor, ["line", "column"]);

    if (token.parent) { // mixed types
        if (token.parent.type === "Object") {
            let prop = IsVar.test(value) ? (token.path ? "." : "") + `${value}` : `['${value}']`;

            token.path = (token.parent.path || "") + prop;
            token.parent.data[value] = token;
            (<SourceToken>token.parent.data[value]).data = doParseToken(cursor.source, new SourceToken({
                filename: token.filename,
                position: cloneDeep(token.position),
                type: token.type,
                data: undefined,
                parent: token,
                path: token.path
            }), cursor);
            (<SourceToken>token.parent.data[value].data).position.end = pick(cursor, ["line", "column"]);
        } else if (token.parent.type === "Array") { // array
            token.path = (token.parent.path || "") + `[${token.data.length}]`;
            token.parent.data.push(token);
        } else if (token.parent.type === "property") {
            token.parent.data = token;
        } else {
            let handle = getHandler(token.parent.type),
                inst = getInstance(token.parent.type);

            token.data = handle ? handle.call(inst || value, value) : value;
        }
    } else { // primitive types
        token.data = value;
    }
}

function doParseToken(str: string, token: SourceToken, cursor: CursorToken): SourceToken {
    let char: string;

    loop:
    while ((char = str[cursor.index])) {
        if (<any>char == false && char !== "0" && char !== "\n") {
            cursor.column++;
            cursor.index++;
            continue;
        }

        let remains: string,
            innerToken: SourceToken,
            dataToken: LiteralToken & { value: any, type?: string };

        switch (char) {
            case "\n":
                cursor.index++;
                cursor.line++;
                cursor.column = 1;
                break;

            case ",":
                if (token.parent && ["Object", "Array"].includes(token.parent.type)) {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token);
                }
                break;

            case ":":
                if (token.parent && token.parent.type === "property") {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token);
                }
                break;

            // mixed type
            case "(":
                cursor.index++;
                cursor.column++;
                token.position.start = pick(cursor, ["line", "column"]);
                innerToken = doParseToken(str, new SourceToken({
                    filename: token.filename,
                    position: cloneDeep(token.position),
                    type: token.type,
                    data: undefined,
                    parent: token,
                    path: token.path
                }), cursor);
                token.position.end = {
                    line: cursor.line,
                    column: cursor.column + 1 // include the closing brace ")"
                };
                token.data = innerToken;
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
                token.position.start = pick(cursor, ["line", "column"]);
                innerToken = doParseToken(str, new SourceToken({
                    filename: token.filename,
                    position: cloneDeep(token.position),
                    type: token.type,
                    data: undefined,
                    parent: token,
                    path: token.path
                }), cursor);
                token.position.end = {
                    line: cursor.line,
                    column: cursor.column + 1 // include the closing brace "}" or "]"
                };
                token.data = innerToken;
                break;

            // string
            case "'":
            case '"':
            case "`":
                token.type = "string";
                token.position.start = pick(cursor, ["line", "column"]);
                dataToken = string.parseToken(str.slice(cursor.index));

                if (dataToken) {
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
                    setTokenData(token, dataToken.value, cursor);
                } else {
                    throwSyntaxError(token);
                }
                break;

            // regular expression or comment
            case "/":
                token.type = "regexp";
                token.position.start = pick(cursor, ["line", "column"]);
                remains = str.slice(cursor.index);

                if ((dataToken = regexp.parseToken(remains))) {
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    token.position.end = pick(cursor, ["line", "column"]);
                    setTokenData(token, dataToken.value, cursor);
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

                    token.position.end = pick(cursor, ["line", "column"]);
                    setTokenData(token, dataToken.value, cursor);
                } else {
                    throwSyntaxError(token);
                }
                break;

            // binary, octal or hexadecimal number, or decimal number starts 
            // with `.`.
            case "0":
            case ".":
                token.type = "number";
                token.position.start = pick(cursor, ["line", "column"]);

                if ((dataToken = number.parseToken(str.slice(cursor.index)))) {
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    token.position.end = pick(cursor, ["line", "column"]);
                    setTokenData(token, dataToken.value, cursor);
                } else {
                    throwSyntaxError(token);
                }
                break;

            default:
                remains = str.slice(cursor.index);
                token.position.start = pick(cursor, ["line", "column"]);

                if ((dataToken = number.parseToken(remains))) { // number
                    token.type = "number";
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    token.position.end = pick(cursor, ["line", "column"]);
                    setTokenData(token, dataToken.value, cursor);
                } else if ((dataToken = keyword.parseToken(remains))) { // keyword
                    token.type = "keyword";
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    token.position.end = pick(cursor, ["line", "column"]);
                    setTokenData(token, dataToken.value, cursor);
                } else {
                    let matches = remains.match(TypeOrPorp);

                    if (matches) {
                        let lines = matches[0].split("\n"),
                            key = matches[1];

                        cursor.index += matches[0].length - 1;
                        cursor.line += lines.length - 1;

                        if (last(matches[0]) === ":") { // property
                            token.type = "property";

                            if (token.parent.type === "Object") {
                                if (lines.length > 1) {
                                    cursor.column = last(lines).length - 1;
                                } else {
                                    cursor.column += matches[0].length - 1;
                                }

                                setTokenData(token, key, cursor);
                            } else {
                                throwSyntaxError(token);
                            }
                        } else {
                            token.type = key; // personalized type

                            if (token.type === "Reference" && !token.parent) {
                                throwSyntaxError(token);
                            }

                            if (lines.length > 1) {
                                cursor.column = last(lines).length - 1;
                            } else {
                                cursor.column += matches[0].length - 1;
                            }
                        }
                    } else {
                        if (isFinite(Number(char))) {
                            token.type = "number";
                        }
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
    };
    
    return doParseToken(str, new SourceToken({
        filename,
        position: {
            start: {
                line: 1,
                column: 1
            },
            end: {
                line: 1,
                column: 1
            }
        },
        type: undefined,
        data: undefined
    }), cursor);
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