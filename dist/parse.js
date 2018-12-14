"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
const last = require("lodash/last");
const pick = require("lodash/pick");
const TypeOrPorp = /\s*([a-z_][a-z0-9_]*)\s*[:\(]/i;
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
    let isInnerToken = !!token.parent, isPropValue = false, setTokenData = (value) => {
        if (token.parent) {
            if (token.parent.type === types_1.ObjectTypes.Object) {
                if (!token.data)
                    token.data = {};
                if (!isPropValue) {
                    token.data[value] = undefined;
                }
                else {
                    token.data[last(Object.keys(token.data))] = value;
                }
            }
            else {
                if (!token.data)
                    token.data = [];
                token.data.push(value);
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
            continue;
        }
        else if ((char == false && char !== "0")) {
            token.column++;
            token.cursor++;
            continue;
        }
        else if (char === ",") {
            if (isInnerToken) {
                isPropValue = false;
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
                        }, tokenSample, pick(token, ["line", "column"]))));
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
                        token.column = lines.length > 1 ? last(lines).length : strToken.length;
                        token.cursor += strToken.length;
                        setTokenData(strToken.value);
                    }
                    else {
                        throwSyntaxError(token);
                    }
                    break;
                case "/":
                    remains = str.slice(token.cursor);
                    let regexToken = literal_toolkit_1.regexp.parseToken(remains), commentToken;
                    if (regexToken) {
                        token.type = "regexp";
                        token.column += regexToken.length;
                        token.cursor += regexToken.length;
                        setTokenData(regexToken.value);
                    }
                    else if ((commentToken = literal_toolkit_1.comment.parseToken(remains))) {
                        token.type = "comment";
                        token.cursor += commentToken.length;
                        setTokenData(commentToken.value);
                        if (commentToken.type !== "//") {
                            let lines = commentToken.source.split("\n");
                            token.line += lines.length - 1;
                            token.column = lines.length > 1 ? last(lines).length : strToken.length;
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
                            if (last(matches[0]) === ":") {
                                if (!isPropValue) {
                                    setTokenData(matches[1]);
                                    isPropValue = true;
                                }
                                else {
                                    throwSyntaxError(token);
                                }
                            }
                            else {
                                let lines = matches[0].split("\n");
                                token.line += lines.length - 1;
                                token.column = lines.length > 1 ? last(lines).length : strToken.length;
                                token.cursor += matches[0].length;
                                if (types_1.ObjectTypes[matches[1]]) {
                                    token.type = types_1.ObjectTypes[matches[1]];
                                }
                                else {
                                    token.type = types_1.ObjectTypes.Object;
                                }
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
console.log(parseToken('{ a: 0x12, b: { c: "hello, world" }, d: 12 }'));
//# sourceMappingURL=parse.js.map