import { MixedTypes, ExtendedErrors } from "./types";
import { LiteralToken, string, number, regexp, comment, keyword } from 'literal-toolkit';
import last = require("lodash/last");
import pick = require("lodash/pick");
import omit = require("lodash/omit");
import get = require("lodash/get");
import set = require("lodash/set");
import * as path from "path";

export interface SourceToken {
    filename: string;
    start: {
        line: number,
        column: number
    };
    end: {
        line: number,
        column: number
    };
    type: string;
    data: any;
    parent: MetaToken;
    path?: string;
}

interface MetaToken {
    filename?: string;
    line: number;
    column: number;
    cursor: number;
    type?: string;
    data?: any;
    parent?: MetaToken;
    property?: string;
    path?: string;
    refMap: { [x: string]: string };
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

function throwSyntaxError(token: MetaToken) {
    let filename = token.filename ? path.resolve(token.filename) : "<anonymous>",
        type = token.type ? token.type + " token" : "token",
        { line, column } = token;
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

function setTokenData(token: MetaToken, value) {
    if (token.parent) {
        if (token.parent.type === "Object") {
            if (!token.property) {
                let path = token.parent.path || "",
                    isVar = IsVar.test(value),
                    prop = isVar ? `${value}` : `['${value}']`;

                token.data[value] = undefined;
                token.property = value;

                // set the path to the property.
                token.path = path + (isVar && path ? "." : "") + prop;
            } else {
                token.data[token.property] = value;
                token.property = ""; // reset property
            }
        } else if (token.parent.type === "Array") { // array
            token.data.push(value);

            // increase the path in the array.
            token.path = (token.parent.path || "") + `[${token.data.length}]`;
        } else if (token.parent.type === "Reference") {
            token.refMap[token.path] = value;
        } else {
            let handle = getHandler(token.parent.type),
                inst = getInstance(token.parent.type);

            if (handle) {
                token.data = handle.call(inst || value, value);
            } else {
                token.data = value;
            }
        }
    } else {
        token.data = value;
    }

    token.type = "";
}

function parseToken(str: string, token: MetaToken): MetaToken {
    let char: string;

    loop:
    while ((char = str[token.cursor])) {
        if (<any>char == false && char !== "0" && char !== "\n") {
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
                if (token.parent && !token.property) {
                    token.column++;
                    token.cursor++;
                } else {
                    throwSyntaxError(token);
                }
                break;

            case ":":
                if (token.parent && token.property) {
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
                innerToken = parseToken(str, Object.assign({
                    parent: token
                }, pick(token, [
                    "filename",
                    "line",
                    "column",
                    "cursor",
                    "refMap",
                    "path",
                    // Pass the type from the parent node so that when 
                    // unexpected token happened inside the child node, the 
                    // parser will thrown the error with the parent type.
                    "type",
                ])));
                token.line = innerToken.line;
                token.column = innerToken.column;
                token.cursor = innerToken.cursor;
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
                token.type = isArray ? "Array" : "Object";
                innerToken = parseToken(str, Object.assign({
                    data: isArray ? [] : {},
                    path: isArray ? (token.path || "") + "[0]" : "",
                    parent: token
                }, pick(token, [
                    "filename",
                    "line",
                    "column",
                    "cursor",
                    "refMap"
                ])));
                token.line = innerToken.line;
                token.column = innerToken.column;
                token.cursor = innerToken.cursor;
                setTokenData(token, innerToken.data);
                break;

            // string
            case "'":
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

            // octal number or hexadecimal number, or decimal number starts with
            // `.`.
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
                            if (!token.property) {
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

                            token.type = matches[1];
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
    let token = parseToken(str, {
        filename,
        line: 1,
        column: 1,
        cursor: 0,
        path: "",
        refMap: {}
    });
    let data = token.data;

    for (let path in token.refMap) {
        let target = token.refMap[path];
        let ref = target ? get(data, target) : data;
        set(data, path, ref);
    }

    return data;
}