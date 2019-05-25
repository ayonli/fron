"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const get = require("lodash/get");
const pick = require("lodash/pick");
const last = require("lodash/last");
const util_1 = require("../util");
const parse_1 = require("../parse");
const literal_toolkit_1 = require("literal-toolkit");
function doParseToken(str, parent, cursor, listener) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!str || cursor.index >= str.length)
            return;
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
                parent
            });
            switch (char) {
                case ",":
                    if (parent.type === "Object" || parent.type === "Array") {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token, char);
                    }
                    break;
                case ":":
                    if (parent.type === "property") {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token, char);
                    }
                    break;
                case "(":
                    if (["root", "Object", "Array"].indexOf(parent.type) === -1) {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token, char);
                    }
                    break;
                case ")":
                    if (["root", "Object", "Array"].indexOf(parent.type) === -1) {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token, char);
                    }
                    break loop;
                case "{":
                case "[":
                    let isArray = char === "[";
                    cursor.index++;
                    cursor.column++;
                    token.type = isArray ? "Array" : "Object";
                    token.data = isArray ? [] : {};
                    yield doParseToken(str, token, cursor, listener);
                    break loop;
                case "}":
                case "]":
                    if (parent.type === "Object" || parent.type === "Array") {
                        cursor.index++;
                        cursor.column++;
                    }
                    else {
                        parse_1.throwSyntaxError(token, char);
                    }
                    return;
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
                            cursor.column = last(lines).length + 1;
                        }
                        else {
                            cursor.column += dataToken.length;
                        }
                    }
                    else {
                        parse_1.throwSyntaxError(token, char);
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
                                cursor.column = last(lines).length + 1;
                            }
                            else {
                                cursor.column += dataToken.length;
                            }
                        }
                    }
                    else {
                        parse_1.throwSyntaxError(token, char);
                    }
                    break loop;
                default:
                    remains = str.slice(cursor.index);
                    let matches;
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
                    else if (["Array", "property"].indexOf(parent.type) >= 0
                        && (dataToken = util_1.matchRefNotation(remains))) {
                        token.type = "Reference";
                        token.data = dataToken.value.slice(2) || "";
                        cursor.index += dataToken.length;
                        cursor.column += dataToken.length;
                    }
                    else if (matches = remains.match(parse_1.PropOrType)) {
                        let lines = matches[0].split("\n"), key = matches[1] || matches[2];
                        cursor.index += key.length;
                        cursor.line += lines.length - 1;
                        if (lines.length > 1) {
                            cursor.column = 1;
                        }
                        else {
                            cursor.column += key.length;
                        }
                        if (matches[1] !== undefined) {
                            token.type = "string";
                            if (parent.type === "Object") {
                                token.data = key;
                            }
                            else {
                                parse_1.throwSyntaxError(token, char);
                            }
                        }
                        else {
                            token.type = key;
                            if (parent.type === "root" && key === "Reference") {
                                parse_1.throwSyntaxError(token, char);
                            }
                            else {
                                token.data = yield doParseToken(str, token, cursor, listener);
                                yield doParseToken(str, token, cursor);
                            }
                        }
                    }
                    else {
                        isFinite(Number(char)) && (token.type = "number");
                        parse_1.throwSyntaxError(token, char);
                    }
                    break loop;
            }
        }
        if (!token)
            return;
        token.position.end = pick(cursor, ["line", "column"]);
        if (parent.type === "root" && parent.data !== undefined
            && token.type !== "comment") {
            parse_1.throwSyntaxError(token, char);
        }
        else if (token.type === "comment") {
            parent.comments = parent.comments || [];
            parent.comments.push(token);
            return doParseToken(str, parent, cursor, listener);
        }
        else if (parent.type === "Object") {
            if (token.type !== "string" && token.type !== "Symbol" && (token.type !== "number" || typeof token.data === "bigint")) {
                parse_1.throwSyntaxError(token, char);
            }
            let prop = token.data, isVar = util_1.LatinVar.test(prop), prefix = get(parent, "parent.path");
            if (prefix === undefined) {
                prefix = get(parent, "parent.parent.path", "");
            }
            let path = isVar ? (prefix ? "." : "") + `${prop}` : `['${prop}']`;
            token.type = "property";
            token.path = (prefix || "") + path;
            token.data = yield doParseToken(str, token, cursor, listener);
            parent.data[prop] = token;
        }
        else if (parent.type === "Array") {
            let prefix = get(parent, "parent.path");
            if (prefix === undefined) {
                prefix = get(parent, "parent.parent.path", "");
            }
            token.path = `${prefix}[${parent.data.length}]`;
            parent.data.push(token);
        }
        listener && listener.call(void 0, token);
        if (parent.type === "Object" || parent.type === "Array") {
            return doParseToken(str, parent, cursor, listener);
        }
        else {
            return token;
        }
    });
}
function parseTokenAsync(str, filename, listener) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let [rootToken, cursor] = parse_1.prepareParser(str, filename);
        rootToken.data = yield doParseToken(str, rootToken, cursor, listener);
        if (cursor.index < str.length) {
            yield doParseToken(str, rootToken, cursor, listener);
        }
        return rootToken;
    });
}
exports.parseTokenAsync = parseTokenAsync;
function parseAsync(str, filename) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return parse_1.composeToken(yield parseTokenAsync(str, filename));
    });
}
exports.parseAsync = parseAsync;
//# sourceMappingURL=parse.js.map