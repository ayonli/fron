"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
const set = require("lodash/set");
const pick = require("lodash/pick");
const last = require("lodash/last");
const util_1 = require("./util");
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
exports.TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;
class SourceToken {
    constructor(token) {
        Object.assign(this, token);
    }
}
exports.SourceToken = SourceToken;
function throwSyntaxError(token, char) {
    let filename = token.filename, type = token.type ? token.type + " token" : "token " + char, { line, column } = token.position.start;
    throw new SyntaxError(`Unexpected ${type} in ${filename}:${line}:${column}`);
}
exports.throwSyntaxError = throwSyntaxError;
function getHandler(type) {
    return get(types_1.CompoundTypes[type], "prototype.fromFRON");
}
exports.getHandler = getHandler;
function doParseToken(str, parent, cursor, listener) {
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
        token = new SourceToken({
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
                    throwSyntaxError(token, char);
                }
                break;
            case ":":
                if (parent.type === "property") {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token, char);
                }
                break;
            case "(":
                if (["root", "Object", "Array"].indexOf(parent.type) === -1) {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token, char);
                }
                break;
            case ")":
                if (["root", "Object", "Array"].indexOf(parent.type) === -1) {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token, char);
                }
                break loop;
            case "{":
            case "[":
                let isArray = char === "[";
                cursor.index++;
                cursor.column++;
                token.type = isArray ? "Array" : "Object";
                token.data = isArray ? [] : {};
                doParseToken(str, token, cursor, listener);
                break loop;
            case "}":
            case "]":
                if (parent.type === "Object" || parent.type === "Array") {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token, char);
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
                    throwSyntaxError(token, char);
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
                    throwSyntaxError(token, char);
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
                else if (matches = remains.match(exports.TypeOrPorp)) {
                    let lines = matches[0].split("\n"), key = matches[1];
                    cursor.index += key.length;
                    cursor.line += lines.length - 1;
                    if (lines.length > 1) {
                        cursor.column = 1;
                    }
                    else {
                        cursor.column += key.length;
                    }
                    if (last(matches[0]) === ":") {
                        token.type = "string";
                        if (parent.type === "Object") {
                            token.data = key;
                        }
                        else {
                            throwSyntaxError(token, char);
                        }
                    }
                    else {
                        token.type = key;
                        if (parent.type === "root" && key === "Reference") {
                            throwSyntaxError(token, char);
                        }
                        else {
                            token.data = doParseToken(str, token, cursor, listener);
                            doParseToken(str, token, cursor);
                        }
                    }
                }
                else {
                    isFinite(Number(char)) && (token.type = "number");
                    throwSyntaxError(token, char);
                }
                break loop;
        }
    }
    token.position.end = pick(cursor, ["line", "column"]);
    if (parent.type === "root" && parent.data !== undefined
        && token.type !== "comment") {
        throwSyntaxError(token, char);
    }
    else if (token.type === "comment") {
        parent.comments = parent.comments || [];
        parent.comments.push(token);
        return doParseToken(str, parent, cursor, listener);
    }
    else if (parent.type === "Object") {
        if (token.type !== "string" && token.type !== "Symbol" && (token.type !== "number" || typeof token.data === "bigint")) {
            throwSyntaxError(token, char);
        }
        let prop = token.data, isVar = util_1.LatinVar.test(prop), prefix = get(parent, "parent.path", ""), path = isVar ? (prefix ? "." : "") + `${prop}` : `['${prop}']`;
        token.path = (prefix || "") + path;
        token.type = "property";
        token.data = doParseToken(str, token, cursor, listener);
        parent.data[prop] = token;
    }
    else if (parent.type === "Array") {
        let prefix = get(parent, "parent.path", "");
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
}
function compose(token, refMap) {
    let data;
    if (!token)
        return;
    switch (token.type) {
        case "Object":
            data = {};
            for (let prop in token.data) {
                data[prop] = compose(token.data[prop].data, refMap);
            }
            break;
        case "Array":
            data = [];
            for (let item of token.data) {
                data.push(compose(item, refMap));
            }
            break;
        case "Reference":
            if (token.parent.type === "Array") {
                refMap[token.path] = compose(token.data, refMap);
            }
            else {
                refMap[token.parent.path] = compose(token.data, refMap);
            }
            break;
        default:
            if (token.data instanceof SourceToken) {
                let handle = getHandler(token.type), inst = types_1.getInstance(token.type);
                data = compose(token.data, refMap);
                data = handle
                    ? handle.call(inst || data, data)
                    : data;
            }
            else if (token.type !== "comment") {
                data = token.data;
            }
            break;
    }
    return data;
}
function composeToken(token) {
    let refMap = {}, data = compose(token.type === "root" ? token.data : token, refMap);
    for (let path in refMap) {
        let target = refMap[path];
        let ref = target ? get(data, target) : data;
        set(data, path, ref);
    }
    return data;
}
exports.composeToken = composeToken;
function parseToken(str, filename, listener) {
    let type = typeof str;
    if (type !== "string") {
        throw new TypeError(`A string value was expected, ${type} given`);
    }
    else if (!str)
        return null;
    let cursor = {
        index: 0,
        line: 1,
        column: 1,
        filename: filename ? util_1.normalize(filename) : "<anonymous>"
    };
    let rootToken = new SourceToken({
        filename: cursor.filename,
        position: {
            start: pick(cursor, ["line", "column"]),
            end: undefined
        },
        type: "root",
        data: undefined,
    });
    rootToken.data = doParseToken(str, rootToken, cursor, listener);
    if (cursor.index < str.length) {
        doParseToken(str, rootToken, cursor, listener);
    }
    return rootToken;
}
exports.parseToken = parseToken;
function parse(str, filename) {
    return composeToken(parseToken(str, filename));
}
exports.parse = parse;
//# sourceMappingURL=parse.js.map