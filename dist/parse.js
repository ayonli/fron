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
    return types_1.MixedTypes[type] ? Object.create(types_1.MixedTypes[type].prototype) : void 0;
}
function doParseToken(str, parent, cursor, listener) {
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
            filename: cursor.filename || "<anonymous>",
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
                    throwSyntaxError(token);
                }
                break;
            case ":":
                if (parent && parent.type === "property") {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case "(":
                if (parent) {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case ")":
                if (parent) {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token);
                }
                break loop;
            case "]":
            case "}":
                if (parent) {
                    cursor.index++;
                    cursor.column++;
                }
                else {
                    throwSyntaxError(token);
                }
                return;
            case "[":
            case "{":
                let isArray = char === "[";
                cursor.index++;
                cursor.column++;
                token.type = isArray ? "Array" : "Object";
                token.data = isArray ? [] : {};
                doParseToken(str, token, cursor, listener);
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
                    throwSyntaxError(token);
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
                    throwSyntaxError(token);
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
                    throwSyntaxError(token);
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
                    let matches = remains.match(TypeOrPorp);
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
                                throwSyntaxError(token);
                            }
                        }
                        else {
                            token.type = key;
                            if (!parent && token.type === "Reference") {
                                throwSyntaxError(token);
                            }
                            else {
                                token.data = doParseToken(str, token, cursor, listener);
                                doParseToken(str, token, cursor);
                            }
                        }
                    }
                    else {
                        isFinite(Number(char)) && (token.type = "number");
                        throwSyntaxError(token);
                    }
                }
                break loop;
        }
    }
    token.position.end = pick(cursor, ["line", "column"]);
    if (token.parent) {
        if (token.parent.type === "Object") {
            let prop = token.data, prefix = get(token, "parent.parent.path", ""), path = IsVar.test(prop) ? (prefix ? "." : "") + `${prop}` : `['${prop}']`;
            token.path = (prefix || "") + path;
            token.type = "property";
            token.data = doParseToken(str, token, cursor, listener);
            token.parent.data[prop] = token;
        }
        else if (token.parent.type === "Array") {
            token.path = (token.parent.path || "") + `[${token.parent.data.length}]`;
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
}
function parseToken(str, filename, listener) {
    return doParseToken(str, null, {
        index: 0,
        line: 1,
        column: 1,
        filename
    }, listener);
}
exports.parseToken = parseToken;
function parse(str, filename) {
    return composeToken(parseToken(str, filename));
}
exports.parse = parse;
function composeToken(token) {
    let refMap = {}, data = compose(token, refMap);
    for (let path in refMap) {
        let target = refMap[path];
        let ref = target ? get(data, target) : data;
        set(data, path, ref);
    }
    return data;
}
exports.composeToken = composeToken;
function compose(token, refMap) {
    let data;
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
            refMap[token.parent.path] = compose(token.data, refMap);
            break;
        default:
            if (token.data instanceof SourceToken) {
                let handle = getHandler(token.type), inst = getInstance(token.type);
                data = compose(token.data, refMap);
                data = handle ? handle.call(inst || data, data) : data;
            }
            else {
                data = token.data;
            }
            break;
    }
    return data;
}
//# sourceMappingURL=parse.js.map