"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const stringify_1 = require("./stringify");
exports.stringify = stringify_1.stringify;
const parse_1 = require("./parse");
exports.parse = parse_1.parse;
function register(type, proto) {
    if (typeof type === "function") {
        types_1.registerType(type.name, type.name);
        stringify_1.registerToFron(type.name, type.prototype.toFRON);
        parse_1.registerFromFron(type.name, type.prototype.fromFRON);
        parse_1.registerConstructr(type);
    }
    else {
        if (typeof proto === "string") {
            types_1.registerType(type, proto);
        }
        else {
            types_1.registerType(type, type);
            stringify_1.registerToFron(type, proto.toFRON);
            parse_1.registerFromFron(type, proto.fromFRON);
        }
    }
}
exports.register = register;
//# sourceMappingURL=index.js.map