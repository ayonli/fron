"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
exports.IsNode = typeof global === "object"
    && get(global, "process.release.name") === "node";
exports.LatinVar = /^[a-z_\$][a-z0-9_\$]*$/i;
function values(data) {
    let arr = [];
    if (typeof data[Symbol.iterator] === "function") {
        for (let item of data) {
            arr.push(item);
        }
    }
    else {
        for (let key in data) {
            arr.push(data[key]);
        }
    }
    return arr;
}
exports.values = values;
function normalize(path) {
    let parts = path.split(/\/|\\/), sep = exports.IsNode ? "/" : (process.platform == "win32" ? "\\" : "/");
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] == "..") {
            parts.splice(i - 1, 2);
            i -= 2;
        }
        else if (parts[i] == ".") {
            parts.splice(i, 1);
            i -= 1;
        }
    }
    return parts.join(sep);
}
exports.normalize = normalize;
//# sourceMappingURL=util.js.map