require("source-map-support/register");
const assert = require("assert");
const pick = require("lodash/pick");
const { stringify, parse } = require("../..");
const { createGetter, createSetter, } = require("../utils");
const get = createGetter(__dirname);
const set = createSetter(__dirname);

var error = new Error("something went wrong");
var evalError = new EvalError(error.message);
var rangeError = new RangeError(error.message);
var referenceError = new ReferenceError(error.message);
var syntaxError = new SyntaxError(error.message);
var typeError = new TypeError(error.message);
/** @type {assert.AssertionError} */
var assertionError;

try {
    assert.ok(false);
} catch (err) {
    assertionError = err;
}

module.exports = {
    error,
    evalError,
    rangeError,
    referenceError,
    syntaxError,
    typeError,
    assertionError
};

before(() => {
    set("error", stringify(error, true));
    set("eval-error", stringify(evalError, true));
    set("range-error", stringify(rangeError, true));
    set("reference-error", stringify(referenceError, true));
    set("syntax-error", stringify(syntaxError, true));
    set("type-error", stringify(typeError, true));
    set("assertion-error", stringify(assertionError, true));
});

describe("Stringify Errors", () => {
    it("should stringify an Error instance as expected", () => {
        assert.strictEqual(stringify(error, true), get("error"));
    });

    it("should stringify an EvalError instance as expected", () => {
        assert.strictEqual(stringify(evalError, true), get("eval-error"));
    });

    it("should stringify a RangeError instance as expected", () => {
        assert.strictEqual(stringify(rangeError, true), get("range-error"));
    });

    it("should stringify a ReferenceError instance as expected", () => {
        assert.strictEqual(stringify(referenceError, true), get("reference-error"));
    });

    it("should stringify a SyntaxError instance as expected", () => {
        assert.strictEqual(stringify(syntaxError, true), get("syntax-error"));
    });

    it("should stringify a TypeError instance as expected", () => {
        assert.strictEqual(stringify(typeError, true), get("type-error"));
    });

    it("should stringify an AssertionError instance as expected", () => {
        assert.strictEqual(stringify(assertionError, true), get("assertion-error"));
    });
});

describe("Parse Errors", () => {
    /**
     * @param {Error} err 
     */
    function accessError(err) {
        return Object.assign({}, err, pick(err, ["name", "message", "stack"]));
    }

    it("should parse an Error instance as expected", () => {
        let data = parse(get("error"));
        assert.strictEqual(data.constructor, error.constructor);
        assert.deepStrictEqual(accessError(data), accessError(error));
    });

    it("should parse an EvalError instance as expected", () => {
        let data = parse(get("eval-error"));
        assert.strictEqual(data.constructor, evalError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(evalError));
    });

    it("should parse a RangeError instance as expected", () => {
        let data = parse(get("range-error"));
        assert.strictEqual(data.constructor, rangeError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(rangeError));
    });

    it("should parse a ReferenceError instance as expected", () => {
        let data = parse(get("reference-error"));
        assert.strictEqual(data.constructor, referenceError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(referenceError));
    });

    it("should parse a SyntaxError instance as expected", () => {
        let data = parse(get("syntax-error"));
        assert.strictEqual(data.constructor, syntaxError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(syntaxError));
    });

    it("should parse a TypeError instance as expected", () => {
        let data = parse(get("type-error"));
        assert.strictEqual(data.constructor, typeError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(typeError));
    });

    it("should parse an AssertionError instance as expected", () => {
        let data = parse(get("assertion-error"));
        assert.strictEqual(data.constructor, assertionError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(assertionError));
    });
});