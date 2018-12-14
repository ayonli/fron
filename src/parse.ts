import "source-map-support/register";
import { ObjectTypes } from "./types";
import { string, number, regexp, comment, keyword } from 'literal-toolkit';
import last = require("lodash/last");
import pick = require("lodash/pick");

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
const TypeOrPorp = /\s*([a-z_][a-z0-9_]*)\s*[:\(]/i;

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
        isPropValue = false,
        setTokenData = (value) => {
            if (token.parent) {
                if (token.parent.type === ObjectTypes.Object) {
                    if (!token.data) token.data = {};

                    if (!isPropValue) {
                        token.data[value] = undefined;
                    } else {
                        token.data[last(Object.keys(token.data))] = value;
                    }
                } else { // array
                    if (!token.data) token.data = [];
                    token.data.push(value);
                }
            } else {
                token.data = value;
            }
        };

    while ((char = str[token.cursor])) {
        if (char === "\n") {
            token.line++;
            token.cursor++;
            continue;
        } else if ((<any>char == false && char !== "0")) {
            token.column++;
            token.cursor++;
            continue;
        } else if (char === ",") {
            if (isInnerToken) {
                isPropValue = false;
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
                        }, tokenSample, pick(token, ["line", "column"]))));
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
                        token.column = lines.length > 1 ? last(lines).length : strToken.length;
                        token.cursor += strToken.length;
                        setTokenData(strToken.value);
                    } else {
                        throwSyntaxError(token);
                    }
                    break;

                // regular expression or comment
                case "/":
                    remains = str.slice(token.cursor);

                    let regexToken = regexp.parseToken(remains),
                        commentToken: comment.CommentToken;

                    if (regexToken) {
                        token.type = "regexp";
                        token.column += regexToken.length;
                        token.cursor += regexToken.length;
                        setTokenData(regexToken.value);
                    } else if ((commentToken = comment.parseToken(remains))) {
                        token.type = "comment";
                        token.cursor += commentToken.length;
                        setTokenData(commentToken.value);

                        if (commentToken.type !== "//") {
                            let lines = commentToken.source.split("\n");
                            token.line += lines.length - 1;
                            token.column = lines.length > 1 ? last(lines).length : strToken.length;
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
                            if (last(matches[0]) === ":") {
                                if (!isPropValue) {
                                    setTokenData(matches[1]);
                                    isPropValue = true;
                                } else {
                                    throwSyntaxError(token);
                                }
                            } else {
                                let lines = matches[0].split("\n");

                                token.line += lines.length - 1;
                                token.column = lines.length > 1 ? last(lines).length : strToken.length;
                                token.cursor += matches[0].length;

                                if (ObjectTypes[matches[1]]) {
                                    token.type = ObjectTypes[matches[1]];
                                } else {
                                    token.type = ObjectTypes.Object;
                                }
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

console.log(parseToken('{ a: 0x12, b: { c: "hello, world" }, d: 12 }'))