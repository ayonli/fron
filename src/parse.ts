import { ObjectTypes } from "./types";

export interface DataToken {
    type: string;
    offset: number;
    data?: any;
}

const CharRE = /\S/;
const VarRE = /[a-z_][a-z0-9_]*/i;

function getToken(input: string): DataToken {
    let match = input.match(CharRE);

    if (!match) return null;

    let offset = match.index,
        char = input[offset],
        type: string,
        data: any;

    switch (char) {
        case "{":
            type = ObjectTypes.Object;
            offset += 1;
            break;
        case "[":
            type = ObjectTypes.Array;
            offset += 1;
            break;
        case '"':
        case "'":
        case "`":
            type = "string";
            offset += 1;
            break;
        case "/":
            let nextChar = data[offset + 1];
            if (nextChar == "/") {
                type = "inlineComment"
                offset += 2;
            } else if (nextChar == "*") {
                type = "multilineComment";
                offset += 2;
            } else {
                type = ObjectTypes.RegExp;
            }
            break;
        default:
            if (isNaN(<any>char)) {
                if (match = input.slice(offset).match(/^(true|false|null|NaN|Infinity)\b/)) {
                    if (match[1] == "true" || match[1] == "false") {
                        type = "boolean";
                        data = Boolean(match[1]);
                    } else if (match[0] == "null") {
                        type = "null";
                        data = null;
                    } else {
                        type = "number";
                        data = Number(match[1]);
                    }
                    offset += match[1].length;
                } else if (match = input.slice(offset).match(/^[+-]*[0-9x]+\b/)) {
                    if (isNaN(<any>match[0])) {
                        throw new TypeError("invalid FRON token");
                    } else {
                        data = match[0][1] == "x" ? parseFloat(match[0]) : parseFloat(match[0]);
                        type = "number";
                        offset += match[0].length;
                    }
                } else {
                    let match = input.slice(offset).match(VarRE);
                    if (match) {
                        let _offset = match.index + match[0].length;
                        let _match = input.slice(_offset).match(CharRE);
                        if (_match && _match[0] == "(") {
                            type = match[0];
                            offset = _offset + _match.index + 1;

                            if (!ObjectTypes[type])
                                type = "Unknown";

                            break;
                        }
                    }

                    throw new TypeError("invalid FRON token");
                }
            } else {
                let match = input.slice(offset).match(/.+\b/);
                data = parseFloat(match[0]);

                if (isNaN(data)) {
                    throw new TypeError("invalid FRON token");
                } else {
                    type = "number";
                    offset += match[0].length;

                    if (data === 0) data = parseInt(match[0]);
                }
            }
            break;
    }

    return {
        type,
        offset,
        data
    };
}

console.log(getToken('0x12'))