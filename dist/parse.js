"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
const last = require("lodash/last");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const get = require("lodash/get");
const set = require("lodash/set");
const path = require("path");
class SourceToken {
    constructor(token) {
        Object.assign(this, token);
    }
}
exports.SourceToken = SourceToken;
const IsVar = /^[a-z_][a-z0-9_]*$/i;
const TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;
const MixedTypeHandlers = {
    "String": (data) => new String(data),
    "Number": (data) => new Number(data),
    "Boolean": (data) => new Boolean(data),
    "Date": (data) => new Date(data),
    "Buffer": (data) => Buffer.from(data),
    "Map": (data) => new Map(data),
    "Set": (data) => new Set(data),
    "Symbol": (data) => Symbol.for(data),
    "Error": (data) => {
        let ctor = types_1.ExtendedErrors[data.name] || Error, err = Object.create(ctor.prototype);
        Object.defineProperties(err, {
            name: { value: data.name },
            message: { value: data.message },
            stack: { value: data.stack }
        });
        Object.assign(err, omit(data, ["name", "message", "stack"]));
        return err;
    }
};
types_1.ExtendedErrors.forEach(error => {
    MixedTypeHandlers[error.name] = MixedTypeHandlers["Error"];
});
function throwSyntaxError(token) {
    let filename = token.filename ? path.resolve(token.filename) : "<anonymous>", type = token.type ? token.type + " token" : "token", { line, column } = token.position.start;
    throw new SyntaxError(`Unexpected ${type} in ${filename}:${line}:${column}`);
}
function getHandler(type) {
    return MixedTypeHandlers[type] || (types_1.MixedTypes[type]
        ? types_1.MixedTypes[type].prototype.fromFRON
        : undefined);
}
function getInstance(type) {
    return types_1.MixedTypes[type] ? Object.create(types_1.MixedTypes[type].prototype) : undefined;
}
function setTokenData(token, value, cursor) {
    token.position.end = pick(cursor, ["line", "column"]);
    if (token.parent) {
        if (token.parent.type === "Object") {
            let prop = IsVar.test(value) ? (token.path ? "." : "") + `${value}` : `['${value}']`;
            token.path = (token.parent.path || "") + prop;
            token.type = "property";
            token.parent.data[value] = token;
            token.data = doParseToken(cursor.source, token, cursor);
            token.data.position.end = pick(cursor, ["line", "column"]);
        }
        else if (token.parent.type === "Array") {
            token.path = (token.parent.path || "") + `[${token.parent.data.length}]`;
            token.data = value;
            token.parent.data.push(token);
        }
        else if (token.parent.type === "property") {
            token.data = value;
            token.parent.data = token;
            return 1;
        }
        else {
            let handle = getHandler(token.parent.type), inst = getInstance(token.parent.type);
            token.data = handle ? handle.call(inst || value, value) : value;
        }
    }
    else {
        token.data = value;
        return 1;
    }
    return 0;
}
function doParseToken(str, parent, cursor) {
    let char;
    let token;
    let lastToken = null;
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
        token = lastToken || {
            filename: cursor.filename || "<anonymous>",
            position: {
                start: pick(cursor, ["line", "column"]),
                end: undefined
            },
            type: undefined,
            data: undefined,
        };
        if (parent)
            token.parent = parent;
        switch (char) {
            case ",":
                if (parent && ["Object", "Array", "property"].includes(parent.type)) {
                    cursor.index++;
                    cursor.column++;
                    if (parent.type === "property") {
                        break loop;
                    }
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case ":":
                if (parent && parent.type === "property") {
                    cursor.index++;
                    cursor.column++;
                    lastToken = null;
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case "(":
                cursor.index++;
                cursor.column++;
                token.data = doParseToken(str, token, cursor);
                token.position.end = {
                    line: cursor.line,
                    column: cursor.column + 1
                };
                lastToken = null;
                break;
            case ")":
            case "]":
            case "}":
                cursor.index++;
                cursor.column++;
                break loop;
            case "[":
            case "{":
                let isArray = char === "[";
                cursor.index++;
                cursor.column++;
                token.type = isArray ? "Array" : "Object";
                token.data = isArray ? [] : {};
                doParseToken(str, token, cursor);
                token.position.end = pick(cursor, ["line", "column"]);
                break;
            case "'":
            case '"':
            case "`":
                token.type = "string";
                if ((dataToken = literal_toolkit_1.string.parseToken(str.slice(cursor.index)))) {
                    let lines = dataToken.source.split("\n");
                    cursor.index += dataToken.length;
                    cursor.line += lines.length - 1;
                    if (lines.length > 1) {
                        cursor.column = last(lines).length;
                    }
                    else {
                        cursor.column += dataToken.length;
                    }
                    token.position.end = {
                        line: cursor.line,
                        column: cursor.column + 1
                    };
                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    }
                    else {
                        break;
                    }
                }
                else {
                    throwSyntaxError(token);
                }
            case "/":
                token.type = "regexp";
                remains = str.slice(cursor.index);
                if ((dataToken = literal_toolkit_1.regexp.parseToken(remains))) {
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    }
                    else {
                        break;
                    }
                }
                else if ((dataToken = literal_toolkit_1.comment.parseToken(remains))) {
                    token.type = "comment";
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
                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    }
                    else {
                        break;
                    }
                }
                else {
                    throwSyntaxError(token);
                }
            case "0":
            case ".":
                token.type = "number";
                if ((dataToken = literal_toolkit_1.number.parseToken(str.slice(cursor.index)))) {
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    }
                    else {
                        break;
                    }
                }
                else {
                    throwSyntaxError(token);
                }
            default:
                remains = str.slice(cursor.index);
                if ((dataToken = literal_toolkit_1.number.parseToken(remains))) {
                    token.type = "number";
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    }
                    else {
                        break;
                    }
                }
                else if ((dataToken = literal_toolkit_1.keyword.parseToken(remains))) {
                    token.type = "keyword";
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                    if (setTokenData(token, dataToken.value, cursor)) {
                        break loop;
                    }
                    else {
                        break;
                    }
                }
                else {
                    let matches = remains.match(TypeOrPorp);
                    if (matches) {
                        let lines = matches[0].split("\n"), key = matches[1];
                        cursor.index += matches[0].length - 1;
                        cursor.line += lines.length - 1;
                        if (last(matches[0]) === ":") {
                            token.type = "property";
                            lastToken = token;
                            if (parent && parent.type === "Object") {
                                if (lines.length > 1) {
                                    cursor.column = last(lines).length - 1;
                                }
                                else {
                                    cursor.column += matches[0].length - 1;
                                }
                                if (setTokenData(token, key, cursor)) {
                                    break loop;
                                }
                                else {
                                    break;
                                }
                            }
                            else {
                                throwSyntaxError(token);
                            }
                        }
                        else {
                            token.type = key;
                            lastToken = token;
                            if (token.type === "Reference" && !parent) {
                                throwSyntaxError(token);
                            }
                            if (lines.length > 1) {
                                cursor.column = last(lines).length - 1;
                            }
                            else {
                                cursor.column += matches[0].length - 1;
                            }
                        }
                    }
                    else {
                        isFinite(Number(char)) && (token.type = "number");
                        throwSyntaxError(token);
                    }
                }
                break;
        }
    }
    return token;
}
function parseToken(str, filename) {
    let cursor = {
        source: str,
        index: 0,
        line: 1,
        column: 1,
        filename
    };
    return doParseToken(str, null, cursor);
}
exports.parseToken = parseToken;
function parse(str, filename) {
    let token = parseToken(str, filename), refMap = {}, data = compose(token, refMap);
    for (let path in refMap) {
        let target = refMap[path];
        let ref = target ? get(data, target) : data;
        set(data, path, ref);
    }
    return data;
}
exports.parse = parse;
function compose(token, refMap) {
    let data;
    switch (token.type) {
        case "Object":
            data = {};
            for (let prop in token.data) {
                data[prop] = compose(token.data[prop], refMap);
            }
            break;
        case "Array":
            data = [];
            for (let item of token.data) {
                data.push(compose(item, refMap));
            }
            break;
        case "Reference":
            refMap[token.path] = token.data;
            break;
        default:
            data = token.data;
            break;
    }
    return data;
}
//# sourceMappingURL=parse.js.map