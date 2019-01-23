"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stringify_1 = require("./stringify");
exports.stringify = stringify_1.stringify;
const parse_1 = require("./parse");
exports.parse = parse_1.parse;
exports.parseToken = parse_1.parseToken;
exports.composeToken = parse_1.composeToken;
exports.SourceToken = parse_1.SourceToken;
exports.throwSyntaxError = parse_1.throwSyntaxError;
const types_1 = require("./types");
exports.register = types_1.register;
exports.FRONEntryBase = types_1.FRONEntryBase;
exports.FRONString = types_1.FRONString;
exports.getType = types_1.getType;
exports.getInstance = types_1.getInstance;
function registerNS(nsp) {
    return (ctor) => types_1.register(`${nsp}.${ctor.name}`, ctor);
}
exports.registerNS = registerNS;
//# sourceMappingURL=index.js.map