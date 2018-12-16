"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const types_1 = require("./types");
const literal_toolkit_1 = require("literal-toolkit");
const last = require("lodash/last");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const get = require("lodash/get");
const set = require("lodash/set");
const path = require("path");
const IsVar = /^[a-z_][a-z0-9_]*$/i;
const TypeOrPorp = /^([a-z_][a-z0-9_]*)\s*[:\(]/i;
const TypeMap = {};
const CustomHandlers = {};
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
        let err = Object.create((types_1.ExtendedErrors[data.name] || Error).prototype);
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
    let filename = token.filename ? path.resolve(token.filename) : "<anonymous>", type = token.type ? token.type + " token" : "token";
    throw new SyntaxError(`Unexpected ${type} in ${filename}:${token.line}:${token.column}`);
}
function getHandler(type) {
    return MixedTypeHandlers[type] || CustomHandlers[type];
}
function getInstance(type) {
    return TypeMap[type] ? Object.create(TypeMap[type].prototype) : undefined;
}
function setTokenData(token, value) {
    if (token.parent) {
        if (token.parent.type === types_1.MixedTypes.Object) {
            if (!token.property) {
                let path = token.parent.path || "", isVar = IsVar.test(value), prop = isVar ? `${value}` : `['${value}']`;
                token.data[value] = undefined;
                token.property = value;
                token.path = path + (isVar && path ? "." : "") + prop;
            }
            else {
                token.data[token.property] = value;
                token.property = "";
            }
        }
        else if (token.parent.type === types_1.MixedTypes.Array) {
            token.data.push(value);
            token.path = (token.parent.path || "") + `[${token.data.length}]`;
        }
        else if (token.parent.type === "Reference") {
            token.refMap[token.path] = value;
        }
        else {
            let handle = getHandler(token.parent.type), inst = getInstance(token.parent.type);
            if (inst)
                console.log(inst, handle);
            if (handle) {
                token.data = handle.call(inst || value, value);
            }
            else {
                token.data = value;
            }
        }
    }
    else {
        token.data = value;
    }
    token.type = "";
}
function parseToken(str, token) {
    let char;
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
                if (token.parent && !token.property) {
                    token.column++;
                    token.cursor++;
                }
                else {
                    throwSyntaxError(token);
                }
                break;
            case ":":
                if (token.parent && token.property) {
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
                innerToken = parseToken(str, Object.assign({
                    parent: token
                }, pick(token, [
                    "filename",
                    "line",
                    "column",
                    "cursor",
                    "refMap",
                    "path",
                    "type",
                ])));
                token.line = innerToken.line;
                token.column = innerToken.column;
                token.cursor = innerToken.cursor;
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
                token.type = isArray ? types_1.MixedTypes.Array : types_1.MixedTypes.Object;
                innerToken = parseToken(str, Object.assign({
                    data: isArray ? [] : {},
                    path: isArray ? (token.path || "") + "[0]" : "",
                    parent: token
                }, pick(token, [
                    "filename",
                    "line",
                    "column",
                    "cursor",
                    "refMap"
                ])));
                token.line = innerToken.line;
                token.column = innerToken.column;
                token.cursor = innerToken.cursor;
                setTokenData(token, innerToken.data);
                break;
            case "'":
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
                            if (!token.property) {
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
                            if (types_1.MixedTypes[matches[1]]) {
                                token.type = types_1.MixedTypes[matches[1]];
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
    let token = parseToken(str, {
        filename,
        line: 1,
        column: 1,
        cursor: 0,
        path: "",
        refMap: {}
    });
    let data = token.data;
    for (let path in token.refMap) {
        let target = token.refMap[path];
        let ref = target ? get(data, target) : data;
        set(data, path, ref);
    }
    return data;
}
exports.parse = parse;
function registerFromFron(type, fromFRON) {
    CustomHandlers[type] = fromFRON;
}
exports.registerFromFron = registerFromFron;
function registerConstructr(type) {
    if (typeof type.prototype.fromFRON !== "function") {
        throw new TypeError("The prototype must inlcude a fromFRON method");
    }
    TypeMap[type.name] = type;
}
exports.registerConstructr = registerConstructr;
//# sourceMappingURL=parse.js.map