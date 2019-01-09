"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const last = require("lodash/last");
const pick = require("lodash/pick");
const get = require("lodash/get");
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
const parse_1 = require("./parse");
function doParseToken(str, parent, cursor, listener) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let char;
        let token;
        loop: while ((char = str[cursor.index])) {
            if (char == false && char !== "0") {
                cursor.index++;
                if (char === "\n") {
                    cursor.line++;
                    cursor.column = 1;
                }
                else {
                    cursor.column++;
                }
                continue;
            }
            let remains, dataToken;
            token = new parse_1.SourceToken({
                filename: cursor.filename,
                position: {
                    start: pick(cursor, ["line", "column"]),
                    end: undefined
                },
                type: undefined,
                data: undefined,
            });
            if (parent)
                token.parent = parent;
            switch (char) {
                case ",":
                    if (parent && ["Object", "Array"].indexOf(parent.type) >= 0) {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    break;
                case ":":
                    if (parent && parent.type === "property") {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    break;
                case "(":
                    if (parent) {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    break;
                case ")":
                    if (parent) {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    break loop;
                case "]":
                case "}":
                    if (parent) {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    return;
                case "[":
                case "{":
                    let isArray = char === "[";
                    cursor.index++;
                    cursor.column++;
                    token.type = isArray ? "Array" : "Object";
                    token.data = isArray ? [] : {};
                    yield doParseToken(str, token, cursor, listener);
                    break loop;
                case "'":
                case '"':
                case "`":
                    token.type = "string";
                    if ((dataToken = literal_toolkit_1.string.parseToken(str.slice(cursor.index)))) {
                        let lines = dataToken.source.split("\n");
                        token.data = dataToken.value;
                        cursor.index += dataToken.length;
                        cursor.line += lines.length - 1;
                        if (lines.length > 1) {
                            cursor.column = last(lines).length;
                        }
                        else {
                            cursor.column += dataToken.length;
                        }
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    break loop;
                case "/":
                    token.type = "regexp";
                    remains = str.slice(cursor.index);
                    if ((dataToken = literal_toolkit_1.regexp.parseToken(remains))) {
                        token.data = dataToken.value;
                        cursor.index += dataToken.length;
                        cursor.column += dataToken.length;
                    }
                    else if ((dataToken = literal_toolkit_1.comment.parseToken(remains))) {
                        token.type = "comment";
                        token.data = dataToken.value;
                        cursor.index += dataToken.length;
                        if (dataToken.type !== "//") {
                            let lines = dataToken.source.split("\n");
                            cursor.line += lines.length - 1;
                            if (lines.length > 1) {
                                cursor.column = last(lines).length;
                            }
                            else {
                                cursor.column += dataToken.length;
                            }
                        }
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    break loop;
                case "0":
                case ".":
                    token.type = "number";
                    if ((dataToken = literal_toolkit_1.number.parseToken(str.slice(cursor.index)))) {
                        token.data = dataToken.value;
                        cursor.index += dataToken.length;
                        cursor.column += dataToken.length;
                    }
                    else {
                        parse_1.throwSyntaxError(token);
                    }
                    break loop;
                default:
                    remains = str.slice(cursor.index);
                    if ((dataToken = literal_toolkit_1.number.parseToken(remains))) {
                        token.type = "number";
                        token.data = dataToken.value;
                        cursor.index += dataToken.length;
                        cursor.column += dataToken.length;
                    }
                    else if ((dataToken = literal_toolkit_1.keyword.parseToken(remains))) {
                        token.type = "keyword";
                        token.data = dataToken.value;
                        cursor.index += dataToken.length;
                        cursor.column += dataToken.length;
                    }
                    else {
                        let matches = remains.match(parse_1.TypeOrPorp);
                        if (matches) {
                            let lines = matches[0].split("\n"), key = matches[1];
                            cursor.index += key.length;
                            cursor.line += lines.length - 1;
                            if (lines.length > 1) {
                                cursor.column = last(lines).length;
                            }
                            else {
                                cursor.column += key.length;
                            }
                            if (last(matches[0]) === ":") {
                                token.type = "property";
                                if (parent && parent.type === "Object") {
                                    token.data = key;
                                }
                                else {
                                    parse_1.throwSyntaxError(token);
                                }
                            }
                            else {
                                token.type = key;
                                if (!parent && token.type === "Reference") {
                                    parse_1.throwSyntaxError(token);
                                }
                                else {
                                    token.data = yield doParseToken(str, token, cursor, listener);
                                    yield doParseToken(str, token, cursor);
                                }
                            }
                        }
                        else {
                            isFinite(Number(char)) && (token.type = "number");
                            parse_1.throwSyntaxError(token);
                        }
                    }
                    break loop;
            }
        }
        token.position.end = pick(cursor, ["line", "column"]);
        if (token.parent) {
            if (token.parent.type === "Object") {
                let prop = token.data, isVar = types_1.Variable.test(prop), prefix = get(token, "parent.parent.path", ""), path = isVar ? (prefix ? "." : "") + `${prop}` : `['${prop}']`;
                token.path = (prefix || "") + path;
                token.type = "property";
                token.data = yield doParseToken(str, token, cursor, listener);
                token.parent.data[prop] = token;
            }
            else if (token.parent.type === "Array") {
                let prefix = get(token, "parent.path", "");
                token.path = `${prefix}[${token.parent.data.length}]`;
                token.parent.data.push(token);
            }
        }
        listener && listener.call(void 0, token);
        if (token.parent && ["Object", "Array"].indexOf(token.parent.type) >= 0) {
            return doParseToken(str, token.parent, cursor, listener);
        }
        else {
            return token;
        }
    });
}
function parseToken(str, filename, listener) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return doParseToken(str, null, {
            index: 0,
            line: 1,
            column: 1,
            filename: filename ? path.resolve(filename) : "<anonymous>"
        }, listener);
    });
}
exports.parseToken = parseToken;
function parse(str, filename) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return parse_1.composeToken(yield parseToken(str, filename));
    });
}
exports.parse = parse;
//# sourceMappingURL=parse-async.js.map