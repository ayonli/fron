import get = require("lodash/get");
import set = require("lodash/set");
import pick = require("lodash/pick");
import last = require("lodash/last");
import { normalize, LatinVar, matchRefNotation } from "./util";
import { CompoundTypes, getInstance } from "./types";
import {
    LiteralToken,
    string,
    number,
    regexp,
    comment,
    keyword
} from 'literal-toolkit';

/** A pattern to match Latin properties or type notations. */
export const PropOrType = /^([a-z_\$][a-z0-9_\$]*)\s*:|^([a-z_\$][a-z0-9_\$\.]*)\s*\(/i;

/**
 * The interface that carries token details in the FRON string (source), e.g.
 * `filename`, `position`, `type` etc.
 */
export interface SourceToken<T extends string = string> {
    /**
     * The filename that parsed to the parser, if no filename is parsed, the 
     * default value will be `<anonymous>`.
     */
    filename: string;
    /**
     * The appearing position of the current token, includes both start and end 
     * positions.
     */
    position: {
        start: {
            line: number,
            column: number
        };
        end: {
            line: number,
            column: number
        };
    };
    /**
     * The type of the current token, literal types are lower-cased and compound
     * types are upper-cased. For convenience, every SourceToken parsed is 
     * carried inside the `root` token.
     */
    type: T;
    /**
     * The parsed data of the current token, it may not be the final data since
     * there may be a handler to deal with the current type. If the current
     * token is an object property, the `data` will be an inner SourceToken.
     */
    data: any;
    /** The token of the parent node. */
    parent?: SourceToken;
    /**
     * The path of the current token, only for object properties and array 
     * elements.
     */
    path?: string;
    /**
     * All the comments in the current token. When parsing a comment token, it 
     * will be appended to the closest parent node. Comments are not important 
     * to the parser and will be skipped when composing data.
     */
    comments?: SourceToken<"comment">[];
}

/**
 * SourceToken is a class constructor as well, it is used to distinguish 
 * the token object from all objects.
 */
export class SourceToken<T extends string = string> implements SourceToken<T> {
    constructor(token: SourceToken<T>) {
        Object.assign(this, token);
    }
}

/** Carries details of the current position of the parsing cursor. */
export interface CursorToken {
    index: number;
    line: number;
    column: number;
    filename: string;
}

/**
 * Throws syntax error when the current token is invalid and terminate the 
 * parser immediately.
 */
export function throwSyntaxError(token: SourceToken, char?: string): never {
    let { filename, type, position: { start: { line, column } } } = token;
    type = type ? `${type} token` : (char ? `token ${char}` : "token");
    throw new SyntaxError(`Unexpected ${type} in ${filename}:${line}:${column}`);
}

/**
 * Gets the customized handler of the given type for parsing, may return 
 * undefined if no handler is registered.
 */
export function getHandler(type: string): (data: any) => any {
    return get(CompoundTypes[type], "prototype.fromFRON");
}

/** Parses every token in the FRON string. */
function doParseToken(
    str: string,
    parent: SourceToken,
    cursor: CursorToken,
    listener?: (token: SourceToken) => void
): SourceToken {
    if (!str || cursor.index >= str.length) return;

    let char: string;
    let token: SourceToken;

    loop:
    while ((char = str[cursor.index])) {
        if (<any>char == false && char !== "0") {
            // For falsy characters (except string '0'), only move the cursor 
            // forward, and do not parse any tokens.

            cursor.index++;

            if (char === "\n") {
                // Meet new line, increase the line number and move the column 
                // to the line head.
                cursor.line++;
                cursor.column = 1;
            } else {
                // Otherwise increase the column number only.
                cursor.column++;
            }

            continue;
        }

        let remains: string,
            dataToken: LiteralToken & { value: any, type?: string };

        // Use a SourceToken instance, so that it could be distinguished from
        // common objects.
        token = new SourceToken({
            filename: cursor.filename,
            position: {
                start: pick(cursor, ["line", "column"]),
                end: undefined
            },
            type: undefined,
            data: undefined,
            parent // only root token doesn't have parent token.
        });

        switch (char) {
            case ",":
                // A comma (`,`) appears right after a property value in an 
                // object, or an element in an array.
                if (parent.type === "Object" || parent.type === "Array") {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token, char);
                }
                break;

            case ":":
                // A colon (`:`) appears right after a property name in an 
                // object.
                if (parent.type === "property") {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token, char);
                }
                break;

            case "(":
                // The open bracket (`(`) appears right after a compound type 
                // name, which will be parsed as an individual token, and the 
                // bracket only indicates that it's the beginning of the type 
                // container. A compound type notation uses a type name and a 
                // pair of brackets to form a container, inside the container, 
                // is an pure object literal or array literal.
                // The parent here is the very type name node of the compound 
                // type notation.
                if (["root", "Object", "Array"].indexOf(parent.type) === -1) {
                    cursor.index++;
                    cursor.column++
                } else {
                    throwSyntaxError(token, char);
                }
                break;

            case ")":
                // The closing bracket (`)`) indicates the end position of a 
                // compound type container, see above.
                if (["root", "Object", "Array"].indexOf(parent.type) === -1) {
                    cursor.index++;
                    cursor.column++
                } else {
                    throwSyntaxError(token, char);
                }

                // Break the loop means the current node has been fully parsed,
                // if the node is not yet fully parsed, should just break the 
                // switch block and continue parsing. Once a token has been 
                // fully parsed, break the loop and go to the end of the 
                // function for summary, gather and fill the token details. 
                break loop;

            case "{": // object
            case "[": // array
                // Like the very JavaScript style, an object literal uses a pair
                // of curly braces to contain key-value pairs, and an array
                // literal uses a pair of square brackets to contain elements.
                let isArray = char === "[";

                cursor.index++;
                cursor.column++;
                token.type = isArray ? "Array" : "Object";
                token.data = isArray ? [] : {};

                // Objects and arrays contains sub-nodes (inner tokens), so 
                // recursively calling `doParseToken` to parse them before 
                // parsing continuing tokens. Since the cursor is a reference,
                // not a copy, when parsing inner tokens and move the cursor, 
                // the outside node will follow the cursor, and keep parsing
                // from where the inner nodes ends.
                doParseToken(str, token, cursor, listener);
                break loop;

            case "}": // closing sign of an object
            case "]": // closing sign of an array
                if (parent.type === "Object" || parent.type === "Array") {
                    cursor.index++;
                    cursor.column++;
                } else {
                    throwSyntaxError(token, char);
                }

                // The closing bracket of an object or array indicates the 
                // "block" is finished, and should no longer try to parse 
                // remaining tokens since they don't belong to the object or the
                // array. `doParseToken()` will try to parse remaining tokens
                // once a former token is parsed, since we don't need to parse 
                // them, return immediately to prevent that happens. 
                return;

            case "'": // single-quoted string
            case '"': // double-quoted string
            case "`": // back-quoted string
                // Once a token type has been identified, assign it to the token
                // object immediately, so that when even the token is invalid 
                // and throw a syntax error, the error can still tell what kind 
                // of token that is.
                token.type = "string";

                if ((dataToken = string.parseToken(str.slice(cursor.index)))) {
                    let lines = dataToken.source.split("\n");

                    token.data = dataToken.value;
                    cursor.index += dataToken.length;
                    cursor.line += lines.length - 1;

                    if (lines.length > 1) {
                        // If the string takes multiple lines, move the column 
                        // number to the end of the last line.
                        cursor.column = last(lines).length + 1;
                    } else {
                        cursor.column += dataToken.length;
                    }
                } else {
                    throwSyntaxError(token, char);
                }
                break loop;

            case "/": // regular expression or comment
                token.type = "regexp";
                remains = str.slice(cursor.index);

                if ((dataToken = regexp.parseToken(remains))) { // regexp
                    token.data = dataToken.value;
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                } else if ((dataToken = comment.parseToken(remains))) { // comment
                    token.type = "comment";
                    token.data = dataToken.value;
                    cursor.index += dataToken.length;

                    if (dataToken.type !== "//") {
                        // Multi-line comment starts with `/*` or `/**`.
                        let lines = dataToken.source.split("\n");
                        cursor.line += lines.length - 1;

                        if (lines.length > 1) {
                            cursor.column = last(lines).length + 1;
                        } else {
                            cursor.column += dataToken.length;
                        }
                    }
                } else {
                    throwSyntaxError(token, char);
                }
                break loop;

            default:
                remains = str.slice(cursor.index);
                let matches: RegExpMatchArray;

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
                } else if (["Array", "property"].indexOf(parent.type) >= 0
                    && (dataToken = matchRefNotation(remains))) { // reference
                    token.type = "Reference";
                    token.data = dataToken.value.slice(2) || "";
                    cursor.index += dataToken.length;
                    cursor.column += dataToken.length;
                } else if (matches = remains.match(PropOrType)) {
                    let lines = matches[0].split("\n"),
                        key = matches[1] || matches[2];

                    cursor.index += key.length;
                    cursor.line += lines.length - 1;

                    if (lines.length > 1) {
                        // If there are new lines between the property (or type 
                        // name) and the colon(or open bracket), move the column
                        // number to the head of the line.
                        cursor.column = 1;
                    } else {
                        cursor.column += key.length;
                    }

                    if (matches[1] !== undefined) { // property
                        token.type = "string";

                        // A property can only appears inside an object.
                        if (parent.type === "Object") {
                            token.data = key;
                        } else {
                            throwSyntaxError(token, char);
                        }
                    } else { // compound type
                        token.type = key;

                        if (parent.type === "root" && key === "Reference") {
                            // A reference type con only appears inside a 
                            // compound type (object, array or something else).
                            throwSyntaxError(token, char);
                        } else {
                            token.data = doParseToken(
                                str,
                                token,
                                cursor,
                                listener
                            );

                            // Since the token of a user-defined compound type 
                            // contains an extra closing bracket ")", and 
                            // potential spaces, using doParseToken() can let 
                            // the cursor travel through them.
                            doParseToken(str, token, cursor);
                        }
                    }
                } else {
                    isFinite(Number(char)) && (token.type = "number");
                    throwSyntaxError(token, char);
                }
                break loop;
        }
    }

    if (!token) return; // EOF with new-line(s)

    token.position.end = pick(cursor, ["line", "column"]);

    if (parent.type === "root" && parent.data !== undefined
        && token.type !== "comment") {
        // Only trailing comments are allowed after non-comment token.
        throwSyntaxError(token, char);
    } else if (token.type === "comment") {
        parent.comments = parent.comments || [];
        parent.comments.push(<SourceToken<"comment">>token);

        // Recursively calling doParserToken to get nearest non-comment token 
        // and travel through any potential comments.
        return doParseToken(str, parent, cursor, listener);
    } else if (parent.type === "Object") { // object
        if (token.type !== "string" && token.type !== "Symbol" && (
            token.type !== "number" || typeof token.data === "bigint"
        )) {
            throwSyntaxError(token, char);
        }

        let prop = token.data,
            isVar = LatinVar.test(prop),
            prefix = get(parent, "parent.path", ""),
            path = isVar ? (prefix ? "." : "") + `${prop}` : `['${prop}']`;

        // If the parent node is an object, that means the current node is a 
        // property node, should set the path and parse the property value as a
        // child node.
        token.path = (prefix || "") + path;
        token.type = "property";
        token.data = doParseToken(str, token, cursor, listener);

        // Append the current node to the parent node as a new property. 
        parent.data[prop] = token;
    } else if (parent.type === "Array") { // array
        let prefix = get(parent, "parent.path", "");

        // If the parent node is an array, append the current node to the parent
        // node as its element.
        token.path = `${prefix}[${parent.data.length}]`;
        parent.data.push(token);
    }

    // If there is a listener bound, call it to watch all parsing moments.
    listener && listener.call(void 0, token);

    if (parent.type === "Object" || parent.type === "Array") {
        // If the parent node is either object or array, try to parse remaining 
        // tokens as its properties (or elements).
        return doParseToken(str, parent, cursor, listener);
    } else {
        return token;
    }
}

/**
 * Composes all tokens (include children nodes) to a JavaScript object and 
 * gather all references into a map.
 */
function compose(token: SourceToken, refMap: { [path: string]: string }): any {
    let data: any;

    if (!token) return;

    switch (token.type) {
        case "Object":
            data = {};
            for (let prop in token.data) {
                // Every property in an object token is also SourceToken, which
                // should be composed recursively.
                data[prop] = compose(token.data[prop].data, refMap);
            }
            break;

        case "Array":
            data = [];
            for (let item of token.data) {
                // Every element in an array token is also SourceToken, which
                // should be composed recursively.
                data.push(compose(item, refMap));
            }
            break;

        case "Reference":
            // The data contained by Reference is a SourceToken with string,
            // which should be composed first before using it.
            if (token.parent.type === "Array") {
                if (typeof token.data === "string") {
                    // When using reference notation in form of `$.a.b.c`, the 
                    // token data here will be a 'string' representing the
                    // property path.
                    refMap[token.path] = token.data;
                } else {
                    refMap[token.path] = compose(token.data, refMap);
                }
            } else { // property
                if (typeof token.data === "string") {
                    refMap[token.parent.path] = token.data;
                } else {
                    refMap[token.parent.path] = compose(token.data, refMap);
                }
            }
            break;

        default:
            if (token.data instanceof SourceToken) {
                let handle = getHandler(token.type),
                    inst = getInstance(token.type);

                data = compose(token.data, refMap); // try to compose first

                // Try to call registered parsing handler to get expected data.
                data = handle
                    ? handle.call(inst || data, data)
                    : data;
            } else if (token.type !== "comment") {
                data = token.data;
            }
            break;
    }

    return data;
}

/** Composes a token or token tree to a JavaScript object. */
export function composeToken(token: SourceToken): any {
    let refMap = {},
        data = compose(token.type === "root" ? token.data : token, refMap);

    // Sets all references according to the map.
    for (let path in refMap) {
        let target = refMap[path];
        let ref = target ? get(data, target) : data;
        set(data, path, ref);
    }

    return data;
}

/** Gets the root token (and the cursor) of the given FRON string. */
export function prepareParser(str: string, filename: string): [
    SourceToken<"root">,
    CursorToken
] {
    let type = typeof str;

    if (type !== "string") {
        throw new TypeError(`A string value was expected, ${type} given`);
    } else if (!str) return null;

    let cursor = {
        index: 0,
        line: 1,
        column: 1,
        filename: filename ? normalize(filename) : "<anonymous>"
    };

    return [new SourceToken<"root">({
        filename: cursor.filename,
        position: {
            start: pick(cursor, ["line", "column"]),
            end: undefined
        },
        type: "root",
        data: undefined,
    }), cursor];
}

/**
 * Parses the given FRON string into a well-constructed token tree.
 * @param filename When parsing data from a file, given that filename to the 
 *  parser, so that if the parser throws syntax error, it could address the 
 *  position properly. The default value is `<anonymous>`.
 * @param listener If set, it will be called when parsing every token in the 
 *  FRON string, and be helpful for programmatic usage.
 */
export function parseToken(
    str: string,
    filename?: string,
    listener?: (token: SourceToken) => void
): SourceToken<"root"> {
    let [rootToken, cursor] = prepareParser(str, filename);

    rootToken.data = doParseToken(str, rootToken, cursor, listener);

    if (cursor.index < str.length) {
        // If there are remaining characters, try to parse them.
        doParseToken(str, rootToken, cursor, listener);
    }

    return rootToken;
}

/**
 * Parses the given FRON string to JavaScript object.
 * @param filename When parsing data from a file, given that filename to the 
 *  parser, so that if the parser throws syntax error, it could address the 
 *  position properly. The default value is `<anonymous>`.
 */
export function parse(str: string, filename?: string): any {
    return composeToken(parseToken(str, filename));
}