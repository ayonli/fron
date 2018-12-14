"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
const last = require("lodash/last");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const assert_1 = require("assert");
const fs = require("fs");
const TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;
function throwSyntaxError(token) {
    throw new SyntaxError(`Unexpected ${token.type || "FRON"} token in ${token.filename || "<anonymous>"}:${token.line}:${token.column}`);
}
var tokenSample = {
    filename: "<anonymous>",
    line: 1,
    column: 1,
    cursor: 0,
    type: ""
};
function parseToken(str, token = Object.assign({}, tokenSample)) {
    let char;
    let isInnerToken = !!token.parent, lastProp = "", setTokenData = (value) => {
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
        }
        else {
            token.data = value;
        }
    };
    while ((char = str[token.cursor])) {
        if (char === "\n") {
            token.line++;
            token.cursor++;
            token.column = 1;
        }
        else if ((char == false && char !== "0") || char === "(" || char === ")") {
            token.column++;
            token.cursor++;
            if (char === ")") {
                break;
            }
        }
        else if (char === ",") {
            if (isInnerToken) {
                lastProp = "";
                token.column++;
                token.cursor++;
            }
            else {
                throwSyntaxError(token);
            }
        }
        else if (char === ":") {
            if (isInnerToken) {
                token.column++;
                token.cursor++;
            }
            else {
                throwSyntaxError(token);
            }
        }
        else {
            let remains, strToken, numToken, endPos;
            switch (char) {
                case "{":
                case "[":
                    let isArray = char === "[";
                    token.type = isArray ? types_1.ObjectTypes.Array : types_1.ObjectTypes.Object;
                    token.column++;
                    token.cursor++;
                    endPos = str.lastIndexOf(isArray ? "]" : "}");
                    if (endPos === -1) {
                        throwSyntaxError(token);
                    }
                    else {
                        let innerStr = str.slice(token.cursor, endPos);
                        token.cursor = endPos + 1;
                        setTokenData(parseToken(innerStr, Object.assign({
                            parent: token
                        }, tokenSample, pick(token, ["line", "column"]))).data);
                    }
                    break;
                case "`":
                case '"':
                case "`":
                    token.type = "string";
                    strToken = literal_toolkit_1.string.parseToken(str.slice(token.cursor));
                    if (strToken) {
                        let lines = strToken.source.split("\n");
                        token.line += lines.length - 1;
                        token.cursor += strToken.length;
                        if (lines.length > 1) {
                            token.column = last(lines).length;
                        }
                        else {
                            token.column += strToken.length;
                        }
                        setTokenData(strToken.value);
                    }
                    else {
                        throwSyntaxError(token);
                    }
                    break;
                case "/":
                    remains = str.slice(token.cursor);
                    let regexToken = literal_toolkit_1.regexp.parseToken(remains), cmtToken;
                    if (regexToken) {
                        token.type = "regexp";
                        token.column += regexToken.length;
                        token.cursor += regexToken.length;
                        setTokenData(regexToken.value);
                    }
                    else if ((cmtToken = literal_toolkit_1.comment.parseToken(remains))) {
                        token.type = "comment";
                        token.cursor += cmtToken.length;
                        if (cmtToken.type !== "//") {
                            let lines = cmtToken.source.split("\n");
                            token.line += lines.length - 1;
                            if (lines.length > 1) {
                                token.column = last(lines).length;
                            }
                            else {
                                token.column += cmtToken.length;
                            }
                        }
                    }
                    else {
                        throwSyntaxError(token);
                    }
                    break;
                case "0":
                case ".":
                    numToken = literal_toolkit_1.number.parseToken(str.slice(token.cursor));
                    if (numToken) {
                        token.type = "number";
                        token.column += numToken.length;
                        token.cursor += numToken.length;
                        setTokenData(numToken.value);
                    }
                    else {
                        let nextChar = str[token.cursor + 1];
                        if (nextChar === "x" || isFinite(Number(nextChar))) {
                            token.type = "number";
                        }
                        throwSyntaxError(token);
                    }
                    break;
                default:
                    remains = str.slice(token.cursor);
                    numToken = literal_toolkit_1.number.parseToken(remains);
                    let keywordToken;
                    if (numToken) {
                        token.type = "number";
                        token.column += numToken.length;
                        token.cursor += numToken.length;
                        setTokenData(numToken.value);
                    }
                    else if ((keywordToken = literal_toolkit_1.keyword.parseToken(remains))) {
                        token.type = "keyword";
                        token.column += keywordToken.length;
                        token.cursor += keywordToken.length;
                        setTokenData(keywordToken.value);
                    }
                    else {
                        let matches = remains.match(TypeOrPorp);
                        if (matches) {
                            let lines = matches[0].split("\n");
                            token.line += lines.length - 1;
                            token.cursor += matches[0].length - 1;
                            if (lines.length > 1) {
                                token.column = last(lines).length - 1;
                            }
                            else {
                                token.column += matches[0].length - 1;
                            }
                            if (last(matches[0]) === ":") {
                                if (!lastProp) {
                                    setTokenData(matches[1]);
                                }
                                else {
                                    throwSyntaxError(token);
                                }
                            }
                            else {
                                if (types_1.ObjectTypes[matches[1]]) {
                                    token.type = types_1.ObjectTypes[matches[1]];
                                }
                                else {
                                    token.type = types_1.ObjectTypes.Object;
                                }
                                let innerStr = str.slice(token.cursor), innerToken = parseToken(innerStr, Object.assign({
                                    parent: token
                                }, tokenSample, pick(token, ["line", "column", "type"])));
                                setTokenData(innerToken.data);
                                token.cursor += innerToken.cursor;
                            }
                        }
                        else {
                            throwSyntaxError(token);
                        }
                    }
                    break;
            }
        }
    }
    return token;
}
function parse(str) {
    return parseToken(str).data;
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
        "Set": (data) => new Map(data),
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
var fron = fs.readFileSync("test.fron", "utf8");
console.log(parse(fron));
//# sourceMappingURL=parse.js.map