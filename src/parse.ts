import "source-map-support/register";
import { ObjectTypes } from "./types";
import { string, number, regexp, comment, keyword } from 'literal-toolkit';
import last = require("lodash/last");
import pick = require("lodash/pick");
import omit = require("lodash/omit");
import { AssertionError } from 'assert';
import * as fs from "fs";

export interface DataToken {
    filename?: string;
    line: number;
    column: number;
    cursor: number;
    type?: string;
    data?: any;
    parent?: DataToken;
}

// const CharRE = /\S/;
const TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;

function throwSyntaxError(token: DataToken) {
    throw new SyntaxError(`Unexpected ${token.type || "FRON"} token in ${token.filename || "<anonymous>"}:${token.line}:${token.column}`);
}

var tokenSample: DataToken = {
    filename: "<anonymous>",
    line: 1,
    column: 1,
    cursor: 0,
    type: ""
};

function parseToken(str: string, token: DataToken = Object.assign({}, tokenSample)): DataToken {
    let char: string;
    let isInnerToken = !!token.parent,
        lastProp = "",
        setTokenData = (value) => {
            if (token.parent) {
                if (token.parent.type === ObjectTypes.Object) {
                    if (!token.data) token.data = {};

                    if (!lastProp) {
                        lastProp = value;
                        token.data[value] = undefined;
                    } else {
                        token.data[lastProp] = value;
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
            } else {
                token.data = value;
            }
        };

    while ((char = str[token.cursor])) {
        if (char === "\n") {
            token.line++;
            token.cursor++;
            token.column = 1;
        } else if ((<any>char == false && char !== "0") || char === "(" || char === ")") {
            token.column++;
            token.cursor++;

            if (char === ")") {
                break;
            }
        } else if (char === ",") {
            if (isInnerToken) {
                lastProp = "";
                token.column++;
                token.cursor++;
            } else {
                throwSyntaxError(token);
            }
        } else if (char === ":") {
            if (isInnerToken) {
                token.column++;
                token.cursor++;
            } else {
                throwSyntaxError(token);
            }
        } else {
            let remains: string,
                strToken: string.StringToken,
                numToken: number.NumberToken,
                endPos: number;

            switch (char) {
                // object and array
                case "{":
                case "[":
                    let isArray = char === "[";
                    token.type = isArray ? ObjectTypes.Array : ObjectTypes.Object;
                    token.column++;
                    token.cursor++;
                    endPos = str.lastIndexOf(isArray ? "]" : "}");

                    if (endPos === -1) {
                        throwSyntaxError(token);
                    } else {
                        let innerStr = str.slice(token.cursor, endPos);

                        token.cursor = endPos + 1;
                        setTokenData(parseToken(innerStr, Object.assign({
                            parent: token
                        }, tokenSample, pick(token, ["line", "column"]))).data);
                    }
                    break;

                // string
                case "`":
                case '"':
                case "`":
                    token.type = "string";

                    strToken = string.parseToken(str.slice(token.cursor));

                    if (strToken) {
                        let lines = strToken.source.split("\n");
                        token.line += lines.length - 1;
                        token.cursor += strToken.length;

                        if (lines.length > 1) {
                            token.column = last(lines).length;
                        } else {
                            token.column += strToken.length;
                        }

                        setTokenData(strToken.value);
                    } else {
                        throwSyntaxError(token);
                    }
                    break;

                // regular expression or comment
                case "/":
                    remains = str.slice(token.cursor);

                    let regexToken = regexp.parseToken(remains),
                        cmtToken: comment.CommentToken;

                    if (regexToken) {
                        token.type = "regexp";
                        token.column += regexToken.length;
                        token.cursor += regexToken.length;
                        setTokenData(regexToken.value);
                    } else if ((cmtToken = comment.parseToken(remains))) {
                        token.type = "comment";
                        token.cursor += cmtToken.length;
                        // setTokenData(cmtToken.value);

                        if (cmtToken.type !== "//") {
                            let lines = cmtToken.source.split("\n");
                            token.line += lines.length - 1;

                            if (lines.length > 1) {
                                token.column = last(lines).length;
                            } else {
                                token.column += cmtToken.length;
                            }
                        }
                    } else {
                        throwSyntaxError(token);
                    }
                    break;

                // octal number or hexadecimal number, or decimal number starts with `.`.
                case "0":
                case ".":
                    numToken = number.parseToken(str.slice(token.cursor));

                    if (numToken) {
                        token.type = "number";
                        token.column += numToken.length;
                        token.cursor += numToken.length;
                        setTokenData(numToken.value);
                    } else {
                        let nextChar = str[token.cursor + 1];

                        if (nextChar === "x" || isFinite(Number(nextChar))) {
                            token.type = "number";
                        }

                        throwSyntaxError(token);
                    }
                    break;

                default:
                    remains = str.slice(token.cursor);
                    numToken = number.parseToken(remains);
                    let keywordToken: keyword.KeywordToken;

                    if (numToken) {
                        token.type = "number";
                        token.column += numToken.length;
                        token.cursor += numToken.length;
                        setTokenData(numToken.value);
                    } else if ((keywordToken = keyword.parseToken(remains))) {
                        token.type = "keyword";
                        token.column += keywordToken.length;
                        token.cursor += keywordToken.length;
                        setTokenData(keywordToken.value);
                    } else {
                        let matches = remains.match(TypeOrPorp);

                        if (matches) {
                            let lines = matches[0].split("\n");

                            token.line += lines.length - 1;
                            token.cursor += matches[0].length - 1;

                            if (lines.length > 1) {
                                token.column = last(lines).length - 1;
                            } else {
                                token.column += matches[0].length - 1;
                            }

                            if (last(matches[0]) === ":") {
                                if (!lastProp) {
                                    setTokenData(matches[1]);
                                } else {
                                    throwSyntaxError(token);
                                }
                            } else {
                                if (ObjectTypes[matches[1]]) {
                                    token.type = ObjectTypes[matches[1]];
                                } else {
                                    token.type = ObjectTypes.Object;
                                }

                                let innerStr = str.slice(token.cursor),
                                    innerToken = parseToken(innerStr, Object.assign({
                                        parent: token
                                    }, tokenSample, pick(token, ["line", "column", "type"])));

                                setTokenData(innerToken.data);
                                token.cursor += innerToken.cursor;
                            }
                        } else {
                            throwSyntaxError(token);
                        }
                    }
                    break;
            }
        }
    }

    return token;
}

export function parse(str: string): any {
    return parseToken(str).data;
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
        "Set": (data: any[]) => new Map(data),
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

var fron = fs.readFileSync("test.fron", "utf8");

console.log(parse(fron));