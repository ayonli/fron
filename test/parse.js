require("source-map-support/register");
const assert = require("assert");
const pick = require("lodash/pick");
const { parse } = require("..");
const {
    getData,
    int8Array,
    int16Array,
    int32Array,
    uint8Array,
    uint16Array,
    uint32Array,
    buffer,
    error,
    evalError,
    rangeError,
    referenceError,
    syntaxError,
    typeError,
    assertionError,
    regularReference,
    circularReference
} = require("./data");

/**
 * @param {Error} err 
 */
function accessError(err) {
    return Object.assign({}, err, pick(err, ["name", "message", "stack"]));
};

describe("Parser", () => {
    it("should parse an array as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.deepStrictEqual(parse(getData("literal-array-1")), data);
    });

    it("should parse an array and prettify the output as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.deepStrictEqual(parse(getData("literal-array-2")), data, true);
    });

    it("should parse an array and prettify the output with customized spaces as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.deepStrictEqual(parse(getData("literal-array-3")), data, "    ");
    });

    it("should parse an Int8Array instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-int8array")), int8Array);
    });

    it("should parse an Int16Array instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-int16array")), int16Array);
    });

    it("should parse an Int32Array instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-int32array")), int32Array);
    });

    it("should parse a Uint8Array instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-uint8array")), uint8Array);
    });

    it("should parse a Uint16Array instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-uint16array")), uint16Array);
    });

    it("should parse a Uint32Array instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-uint32array")), uint32Array);
    });

    it("should parse a Buffer instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-buffer")), buffer);
    });

    it("should parse an Error instance as expected", () => {
        let data = parse(getData("compound-error"));
        assert.strictEqual(data.constructor, error.constructor);
        assert.deepStrictEqual(accessError(data), accessError(error));
    });

    it("should parse an EvalError instance as expected", () => {
        let data = parse(getData("compound-eval-error"));
        assert.strictEqual(data.constructor, evalError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(evalError));
    });

    it("should parse a RangeError instance as expected", () => {
        let data = parse(getData("compound-range-error"));
        assert.strictEqual(data.constructor, rangeError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(rangeError));
    });

    it("should parse a ReferenceError instance as expected", () => {
        let data = parse(getData("compound-reference-error"));
        assert.strictEqual(data.constructor, referenceError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(referenceError));
    });

    it("should parse a SyntaxError instance as expected", () => {
        let data = parse(getData("compound-syntax-error"));
        assert.strictEqual(data.constructor, syntaxError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(syntaxError));
    });

    it("should parse a TypeError instance as expected", () => {
        let data = parse(getData("compound-type-error"));
        assert.strictEqual(data.constructor, typeError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(typeError));
    });

    it("should parse an AssertionError instance as expected", () => {
        let data = parse(getData("compound-assertion-error"));
        assert.strictEqual(data.constructor, assertionError.constructor);
        assert.deepStrictEqual(accessError(data), accessError(assertionError));
    });

    it("should parse an object with regular references as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-regular-reference")), regularReference);
    });

    it("should parse an object with circular references as expected", () => {
        let nodeVersion = parseInt(process.version.slice(1));
        if (nodeVersion > 8) {
            assert.deepStrictEqual(parse(getData("compound-circular-reference")), circularReference);
        }
    });
});