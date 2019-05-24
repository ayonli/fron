"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
exports.IsNode = typeof global === "object"
    && get(global, "process.release.name") === "node";
exports.LatinVar = /^[a-z_\$][a-z0-9_\$]*$/i;
exports.LatinVar2 = /^[a-z_\$][a-z0-9_\$]*/i;
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
function matchRefNotation(str) {
    if (str[0] !== "$") {
        return null;
    }
    let value = "$" + resolvePropPath(str.slice(1));
    return {
        value,
        offset: 0,
        length: value.length,
        source: str,
    };
}
exports.matchRefNotation = matchRefNotation;
function resolvePropPath(str) {
    let prop = str[0];
    if (prop === "[") {
        let end = str.indexOf("]");
        if (end === -1) {
            return "";
        }
        else {
            prop += str.slice(1, end + 1);
            str = str.slice(end + 1);
        }
    }
    else if (prop === ".") {
        str = str.slice(1);
        let matches = str.match(exports.LatinVar2);
        if (!matches) {
            return "";
        }
        else {
            prop += matches[0];
            str = str.slice(matches[0].length);
        }
    }
    else {
        return "";
    }
    return prop + resolvePropPath(str);
}
//# sourceMappingURL=util.js.map