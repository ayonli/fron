"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function keys(obj) {
    let proto = Object.getPrototypeOf(obj);
    return Reflect.ownKeys(obj).concat(Reflect.ownKeys(proto).filter(key => {
        if (typeof key === "string" && key.slice(0, 1) === "__") {
            return false;
        }
        else {
            let pass = false;
            try {
                pass = typeof proto[key] !== "function";
            }
            finally {
                return pass;
            }
        }
    }));
}
exports.keys = keys;
function values(data) {
    let arr = [];
    if (typeof data[Symbol.iterator] === "function") {
        for (let item of data) {
            arr.push(item);
        }
    }
    else {
        for (let key of keys(data)) {
            arr.push(data[key]);
        }
    }
    return arr;
}
exports.values = values;
function pick(obj, props) {
    let result = {};
    for (let key of keys(obj)) {
        if (props.indexOf(key) >= 0) {
            result[key] = obj[key];
        }
    }
    return result;
}
exports.pick = pick;
function omit(obj, props) {
    let result = {};
    for (let key of keys(obj)) {
        if (props.indexOf(key) === -1) {
            result[key] = obj[key];
        }
    }
    return result;
}
exports.omit = omit;
//# sourceMappingURL=util.js.map