"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const stringify_1 = require("./stringify");
function register(type, proto) {
    if (typeof type === "function") {
        types_1.registerType(type.name, type.name);
        stringify_1.registerToFron(type.name, type.prototype.toFRON);
    }
    else {
        if (typeof proto === "string") {
            types_1.registerType(type, proto);
        }
        else {
            types_1.registerType(type, type);
            stringify_1.registerToFron(type, proto.toFRON);
        }
    }
}
exports.register = register;
//# sourceMappingURL=index.js.map