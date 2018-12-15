"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
const last = require("lodash/last");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const assert_1 = require("assert");
const path = require("path");
const TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;
function throwSyntaxError(token) {
    let filename = token.filename ? path.resolve(token.filename) : "<anonymous>", type = token.type ? token.type + " " : "";
    throw new SyntaxError(`Unexpected ${type}token in ${filename}:${token.line}:${token.column}`);
}
var tokenSample = {
    filename: "<anonymous>",
    line: 1,
    column: 1,
    cursor: 0,
    type: ""
};
function parseToken(str, token) {
    let char, lastProp = "", setTokenData = (token, value) => {
        if (token.parent) {
            if (token.parent.type === types_1.ObjectTypes.Object) {
                if (!token.data)
                    token.data = {};
                if (!lastProp) {
                    lastProp = value;
                    token.data[value] = undefined;
                }
                else {
                    token.data[lastProp] = value;
                    lastProp = "";
                }
            }
            else if (token.parent.type === types_1.ObjectTypes.Array) {
                if (!token.data)
                    token.data = [];
                token.data.push(value);
            }
            else {
                let handle = getHandler(token.parent.type);
                if (handle) {
                    token.data = handle(value);
                }
                else {
                    token.data = value;
                }
            }
            token.type = "";
        }
        else {
            token.data = value;
            token.type = "";
        }
    };
    loop: while ((char = str[token.cursor])) {
        if ((char == false && char !== "0" && char !== "\n")) {
            token.column++;
            token.cursor++;
            continue;
        }
        let remains, innerToken, dataToken;
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
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case ":":
                if (token.parent && lastProp) {
                    token.column++;
                    token.cursor++;
                }
                else {
                    throwSyntaxError(token);
                }
                break;
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
            case "[":
            case "{":
                let isArray = char === "[";
                token.column++;
                token.cursor++;
                token.type = isArray ? types_1.ObjectTypes.Array : types_1.ObjectTypes.Object;
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
            case "`":
            case '"':
            case "`":
                token.type = "string";
                dataToken = literal_toolkit_1.string.parseToken(str.slice(token.cursor));
                if (dataToken) {
                    let lines = dataToken.source.split("\n");
                    token.line += lines.length - 1;
                    token.cursor += dataToken.length;
                    if (lines.length > 1) {
                        token.column = last(lines).length;
                    }
                    else {
                        token.column += dataToken.length;
                    }
                    setTokenData(token, dataToken.value);
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case "/":
                token.type = "regexp";
                remains = str.slice(token.cursor);
                if ((dataToken = literal_toolkit_1.regexp.parseToken(remains))) {
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                }
                else if ((dataToken = literal_toolkit_1.comment.parseToken(remains))) {
                    token.type = "comment";
                    token.cursor += dataToken.length;
                    if (dataToken.type !== "//") {
                        let lines = dataToken.source.split("\n");
                        token.line += lines.length - 1;
                        if (lines.length > 1) {
                            token.column = last(lines).length;
                        }
                        else {
                            token.column += dataToken.length;
                        }
                    }
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case "0":
            case ".":
                token.type = "number";
                if ((dataToken = literal_toolkit_1.number.parseToken(str.slice(token.cursor)))) {
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            default:
                remains = str.slice(token.cursor);
                if ((dataToken = literal_toolkit_1.number.parseToken(remains))) {
                    token.type = "number";
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                }
                else if ((dataToken = literal_toolkit_1.keyword.parseToken(remains))) {
                    token.type = "keyword";
                    token.column += dataToken.length;
                    token.cursor += dataToken.length;
                    setTokenData(token, dataToken.value);
                }
                else {
                    let matches = remains.match(TypeOrPorp);
                    if (matches) {
                        let lines = matches[0].split("\n");
                        token.line += lines.length - 1;
                        token.cursor += matches[0].length - 1;
                        if (last(matches[0]) === ":") {
                            if (!lastProp) {
                                if (lines.length > 1) {
                                    token.column = last(lines).length - 1;
                                }
                                else {
                                    token.column += matches[0].length - 1;
                                }
                                setTokenData(token, matches[1]);
                            }
                            else {
                                token.type = "property";
                                throwSyntaxError(token);
                            }
                        }
                        else {
                            if (lines.length > 1) {
                                token.column = last(lines).length - 1;
                            }
                            else {
                                token.column += matches[0].length - 1;
                            }
                            if (types_1.ObjectTypes[matches[1]]) {
                                token.type = types_1.ObjectTypes[matches[1]];
                            }
                            else {
                                token.type = matches[1];
                            }
                        }
                    }
                    else {
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
function parse(str, filename) {
    return parseToken(str, Object.assign({}, tokenSample, { filename })).data;
}
exports.parse = parse;
const Errors = [
    assert_1.AssertionError,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError
];
function getHandler(type) {
    let handlers = {
        "String": (data) => new String(data),
        "Number": (data) => new Number(data),
        "Boolean": (data) => new Boolean(data),
        "Date": (data) => new Date(data),
        "Buffer": (data) => Buffer.from(data),
        "Map": (data) => new Map(data),
        "Set": (data) => new Set(data),
        "Symbol": (data) => Symbol.for(data),
        "Error": (data) => {
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
//# sourceMappingURL=parse.js.map