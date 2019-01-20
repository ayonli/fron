const fs = require("fs");
const path = require("path");
const assert = require("assert");

exports.buffer = Buffer.from("Hello, World!");
exports.int8Array = Int8Array.from(exports.buffer);
exports.int16Array = Int16Array.from(exports.buffer);
exports.int32Array = Int32Array.from(exports.buffer);
exports.uint8Array = Uint8Array.from(exports.buffer);
exports.uint16Array = Uint16Array.from(exports.buffer);
exports.uint32Array = Uint32Array.from(exports.buffer);

exports.error = new Error("something went wrong");
exports.evalError = new EvalError(exports.error.message);
exports.rangeError = new RangeError(exports.error.message);
exports.referenceError = new ReferenceError(exports.error.message);
exports.syntaxError = new SyntaxError(exports.error.message);
exports.typeError = new TypeError(exports.error.message);
/** @type {assert.AssertionError} */
exports.assertionError = Object.create(assert.AssertionError.prototype);

try {
    assert.ok(false);
} catch (err) {
    exports.assertionError = err;
}

exports.regularReference = {
    abc: {
        prop1: "Hello, World",
        prop2: [
            "Hi, Ayon",
            [
                "Hello, World!"
            ]
        ]
    }
};
exports.regularReference.def = exports.regularReference.abc;
exports.regularReference.ghi = exports.regularReference.abc.prop2;
exports.regularReference.abc.prop2.push(exports.regularReference.abc.prop2[1]);

exports.circularReference = {
    abc: {
        prop1: "Hello, World",
        prop2: [
            "Hi, Ayon"
        ]
    }
};
exports.circularReference.def = exports.circularReference;
exports.circularReference.abc.prop3 = exports.circularReference.abc;
exports.circularReference.abc.prop2.push(exports.circularReference.abc.prop2);

/**
 * @param {string} name 
 */
function filename(name) {
    let ext = path.extname(name);

    if (ext && [".js", ".json", ".fron", ".bson"].indexOf(ext) >= 0) {
        return name;
    } else {
        return name + ".js";
    }
}

/**
 * @param {string} name 
 * @param {string} [dirname]
 */
function getData(name, dirname) {
    /** @type {string} */
    let data;
    try {
        data = fs.readFileSync((dirname || __dirname) + "/" + filename(name), {
            encoding: "utf8"
        });
    } finally {
        return data;
    };
}

/**
 * @param {string} name 
 * @param {string} data 
 * @param {string} [dirname]
 */
function setData(name, data, dirname) {
    let result = false;
    try {
        fs.writeFileSync((dirname || __dirname) + "/" + filename(name), data, {
            encoding: "utf8"
        });
        result = true;
    } finally {
        return result;
    }
}

exports.getData = getData;
exports.setData = setData;

/**
 * @returns {(name: string) => string}
 */
exports.createGetter = function createGetter(dirname) {
    return name => getData(name, dirname);
};

exports.createSetter = function createSetter(dirname) {
    return (name, data) => setData(name, data, dirname);
};