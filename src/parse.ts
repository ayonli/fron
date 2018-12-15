import "source-map-support/register";
import { ObjectTypes } from "./types";
import { LiteralToken, string, number, regexp, comment, keyword } from 'literal-toolkit';
import last = require("lodash/last");
import pick = require("lodash/pick");
import omit = require("lodash/omit");
import { AssertionError } from 'assert';
import * as path from "path";

export interface MetaToken {
    filename?: string;
    line: number;
    column: number;
    cursor: number;
    type?: string;
    data?: any;
    parent?: MetaToken;
}

// const CharRE = /\S/;
const TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;

function throwSyntaxError(token: MetaToken) {
    let filename = token.filename ? path.resolve(token.filename) : "<anonymous>",
        type = token.type ? token.type + " " : "";
    throw new SyntaxError(`Unexpected ${type}token in ${filename}:${token.line}:${token.column}`);
}

var tokenSample: MetaToken = {
    filename: "<anonymous>",
    line: 1,
    column: 1,
    cursor: 0,
    type: ""
};

function parseToken(str: string, token: MetaToken): MetaToken {
    let char: string,
        lastProp = "",
        setTokenData = (token: MetaToken, value) => {
            if (token.parent) {
                if (token.parent.type === ObjectTypes.Object) {
                    if (!token.data) token.data = {};

                    if (!lastProp) {
                        lastProp = value;
                        token.data[value] = undefined;
                    } else {
                        token.data[lastProp] = value;
                        lastProp = ""; // reset property
                    }
                } else if (token.parent.type === ObjectTypes.Array) { // array
                    if (!token.data) token.data = [];
                    token.data.push(value);
                } else {
                    let handle = getHandler(token.parent.type);

                    if (handle) {
                        token.data = handle(value);
                    } else {
                        token.data = value;
                    }
                }

                token.type = "";
            } else {
                token.data = value;
                token.type = "";
            }
        };

    loop:
    while ((char = str[token.cursor])) {
        if ((<any>char == false && char !== "0" && char !== "\n")) {
            token.column++;
            token.cursor++;
            continue;
        }

        let remains: string,
            innerToken: MetaToken,
            dataToken: LiteralToken & { value: any, type?: string };

        switch (char) {
            case "\n":
                token.line++;
                token.cursor++;
                token.column = 1;
                break;

            case ",":
                if (token.parent && !lastProp) {
                    token.column++;
                    token.cursor++;
                } else {
                    throwSyntaxError(token);
                }
                break;

            case ":":
                if (token.parent && lastProp) {
                    token.column++;
                    token.cursor++;
                } else {
                    throwSyntaxError(token);
                }
                break;

            // mixed type
            case "(":
                token.column++;
                token.cursor++;
                remains = str.slice(token.cursor);
                innerToken = parseToken(remains, Object.assign({
                    parent: token
                }, tokenSample, pick(token, [
                    "filename",
                    "line",
                    "column",
                    "type"
                ])));
                token.line = innerToken.line;
                token.column = innerToken.column;
                token.cursor += innerToken.cursor;
                setTokenData(token, innerToken.data);
                break;

            case ")":
            case "]":
            case "}":
                token.column++;
                token.cursor++;
                break loop;

            // object and array
            case "[":
            case "{":
                let isArray = char === "[";

                token.column++;
                token.cursor++;
                token.type = isArray ? ObjectTypes.Array : ObjectTypes.Object;
                remains = str.slice(token.cursor);
                innerToken = parseToken(remains, Object.assign({
                    data: isArray ? [] : {},
                    parent: token
                }, tokenSample, pick(token, ["filename", "line", "column"])));
                token.line = innerToken.line;
                token.column = innerToken.column;
                token.cursor += innerToken.cursor;
                setTokenData(token, innerToken.data);
                break;

            // string
            case "`":
            case '"':
            case "`":
                token.type = "string";
                dataToken = string.parseToken(str.slice(token.cursor));

                if (dataToken) {
                    let lines = dataToken.source.split("\n");
                    token.line += lines.length - 1;
                    token.cursor += dataToken.length;

                    if (lines.length > 1) {
                        token.column = last(lines).length;
                    } else {
                        token.column += dataToken.length;
                    }

                    setTokenData(token, dataToken.value);
                } else {
                    throwSyntaxError(token);
                }
                break;

            // regular expression or comment
            case "/":
                token.type = "regexp";
                remains = str.slice(token.cursor);

                if ((dataToken = regexp.parseToken(remains))) {
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                } else if ((dataToken = comment.parseToken(remains))) {
                    token.type = "comment";
                    token.cursor += dataToken.length;

                    if (dataToken.type !== "//") {
                        let lines = dataToken.source.split("\n");
                        token.line += lines.length - 1;

                        if (lines.length > 1) {
                            token.column = last(lines).length;
                        } else {
                            token.column += dataToken.length;
                        }
                    }
                } else {
                    throwSyntaxError(token);
                }
                break;

            // octal number or hexadecimal number, or decimal number starts with `.`.
            case "0":
            case ".":
                token.type = "number";

                if ((dataToken = number.parseToken(str.slice(token.cursor)))) {
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                } else {
                    throwSyntaxError(token);
                }
                break;

            default:
                remains = str.slice(token.cursor);

                if ((dataToken = number.parseToken(remains))) {
                    token.type = "number";
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                } else if ((dataToken = keyword.parseToken(remains))) {
                    token.type = "keyword";
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                } else {
                    let matches = remains.match(TypeOrPorp);

                    if (matches) {
                        let lines = matches[0].split("\n");

                        token.line += lines.length - 1;
                        token.cursor += matches[0].length - 1;

                        if (last(matches[0]) === ":") {
                            if (!lastProp) {
                                if (lines.length > 1) {
                                    token.column = last(lines).length - 1;
                                } else {
                                    token.column += matches[0].length - 1;
                                }
                                setTokenData(token, matches[1]);
                            } else {
                                token.type = "property";
                                throwSyntaxError(token);
                            }
                        } else {
                            if (lines.length > 1) {
                                token.column = last(lines).length - 1;
                            } else {
                                token.column += matches[0].length - 1;
                            }

                            if (ObjectTypes[matches[1]]) {
                                token.type = ObjectTypes[matches[1]];
                            } else {
                                token.type = matches[1];
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

export function parse(str: string, filename?: string): any {
    return parseToken(str, Object.assign({}, tokenSample, { filename })).data;
}

const Errors = [
    AssertionError,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];

function getHandler(type: string): (data: any) => any {
    let handlers = {
        "String": (data: string) => new String(data),
        "Number": (data: number) => new Number(data),
        "Boolean": (data: boolean) => new Boolean(data),
        "Date": (data: string) => new Date(data),
        "Buffer": (data: number[]) => Buffer.from(data),
        "Map": (data: [any, any][]) => new Map(data),
        "Set": (data: any[]) => new Set(data),
        "Symbol": (data: string) => Symbol.for(data),
        "Error": (data: {
            [x: string]: any;
            name: string,
            message: string,
            stack: string
        }) => {
            let err = Object.create((Errors[data.name] || Error).prototype);
            Object.defineProperties(err, {
                name: { value: data.name },
                message: { value: data.message },
                stack: { value: data.stack }
            });
            Object.assign(err, omit(data, ["name", "message", "stack"]));
            return err;
        }
    };

    for (let type of Errors) {
        if (type.name !== "Error")
            handlers[type.name] = handlers["Error"];
    }

    return handlers[type];
}