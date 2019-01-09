import * as path from "path";
import last = require("lodash/last");
import pick = require("lodash/pick");
import get = require("lodash/get");
import { Variable } from "./types";
import {
    LiteralToken,
    string,
    number,
    regexp,
    comment,
    keyword
} from 'literal-toolkit';
import {
    SourceToken,
    CursorToken,
    TypeOrPorp,
    throwSyntaxError,
    composeToken
} from "./parse";

async function doParseToken(
    str: string,
    parent: SourceToken,
    cursor: CursorToken,
    listener?: (token: SourceToken) => void
): Promise<SourceToken> {
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
            filename: cursor.filename,
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

                await doParseToken(str, token, cursor, listener);
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
                                token.data = await doParseToken(str, token, cursor, listener);

                                // since the token of personalized type will 
                                // contain an extra closing bracket ")", and 
                                // potential spaces, using doParseToken() can 
                                // let the cursor travel through them.
                                await doParseToken(str, token, cursor);
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
                isVar = Variable.test(prop),
                prefix = get(token, "parent.parent.path", ""),
                path = isVar ? (prefix ? "." : "") + `${prop}` : `['${prop}']`;

            token.path = (prefix || "") + path;
            token.type = "property";
            token.data = await doParseToken(str, token, cursor, listener);
            token.parent.data[prop] = token;
        } else if (token.parent.type === "Array") { // array
            let prefix = get(token, "parent.path", "");

            token.path = `${prefix}[${token.parent.data.length}]`;
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

export async function parseToken(
    str: string,
    filename?: string,
    listener?: (token: SourceToken) => void
) {
    return doParseToken(str, null, {
        index: 0,
        line: 1,
        column: 1,
        filename: filename ? path.resolve(filename) : "<anonymous>"
    }, listener);
}

export async function parse(str: string, filename?: string) {
    return composeToken(await parseToken(str, filename));
}