import get = require("lodash/get");
import pick = require("lodash/pick");
import last = require("lodash/last");
import { LatinVar } from "../util";
import {
    SourceToken,
    CursorToken,
    throwSyntaxError,
    PropOrType,
    prepareParser,
    composeToken
} from "../parse";
import {
    LiteralToken,
    string,
    number,
    regexp,
    comment,
    keyword
} from 'literal-toolkit';

async function doParseToken(
    str: string,
    parent: SourceToken,
    cursor: CursorToken,
    listener?: (token: SourceToken) => void
): Promise<SourceToken> {
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
                await doParseToken(str, token, cursor, listener);
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
                            token.data = await doParseToken(
                                str,
                                token,
                                cursor,
                                listener
                            );

                            // Since the token of a user-defined compound type 
                            // contains an extra closing bracket ")", and 
                            // potential spaces, using doParseToken() can let 
                            // the cursor travel through them.
                            await doParseToken(str, token, cursor);
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
        token.data = await doParseToken(str, token, cursor, listener);

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
 * Parses the given FRON string into a well-constructed token tree.
 * @param filename When parsing data from a file, given that filename to the 
 *  parser, so that if the parser throws syntax error, it could address the 
 *  position properly. The default value is `<anonymous>`.
 * @param listener If set, it will be called when parsing every token in the 
 *  FRON string, and be helpful for programmatic usage.
 */
export async function parseTokenAsync(
    str: string,
    filename?: string,
    listener?: (token: SourceToken) => void
): Promise<SourceToken<"root">> {
    let [rootToken, cursor] = prepareParser(str, filename);

    rootToken.data = await doParseToken(str, rootToken, cursor, listener);

    if (cursor.index < str.length) {
        // If there are remaining characters, try to parse them.
        await doParseToken(str, rootToken, cursor, listener);
    }

    return rootToken;
}

/**
 * Parses the given FRON string to JavaScript object.
 * @param filename When parsing data from a file, given that filename to the 
 *  parser, so that if the parser throws syntax error, it could address the 
 *  position properly. The default value is `<anonymous>`.
 */
export async function parseAsync(str: string, filename?: string): Promise<any> {
    return composeToken(await parseTokenAsync(str, filename));
}