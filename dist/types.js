"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upperFirst = require("lodash/upperFirst");
exports.Types = {
    Array,
    Boolean,
    Buffer,
    Date,
    Error,
    Map,
    Null: "null",
    Number,
    Object,
    RegExp,
    Set,
    String,
    Symbol,
    Unknown: class Unknown {
    }
};
function getType(data) {
    if (data === null || data === undefined) {
        return exports.Types.Null;
    }
    else {
        let type = typeof data, Type = upperFirst(type), isObj = type == "object";
        for (let x in exports.Types) {
            if (typeof exports.Types[x] !== "function") {
                continue;
            }
            else if (isObj && data.constructor.name === exports.Types[x].name) {
                return exports.Types[x];
            }
            else if (!isObj && x === Type) {
                return type;
            }
        }
    }
    return exports.Types.Object;
}
exports.getType = getType;
exports.default = exports.Types;
//# sourceMappingURL=types.js.map