require("source-map-support/register");
const assert = require("assert");
const { getType } = require("..");
const { createRunner } = require("./utils");
const {
    error,
    evalError,
    rangeError,
    referenceError,
    syntaxError,
    typeError,
    assertionError
} = require("./errors");
const run = createRunner(__dirname);

describe("Get types", () => {
    it("should get literal type 'string' as expected", () => {
        assert.strictEqual(getType(run("strings/double-quoted")), "string");
    });

    it("should get literal type 'number' as expected", () => {
        assert.strictEqual(getType(run("numbers/decimal")), "number");
    });

    it("should get literal type 'bigint' as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(getType(run("numbers/bigint")), "bigint");
    });

    it("should get literal type 'boolean' as expected", () => {
        assert.strictEqual(getType(true), "boolean");
        assert.strictEqual(getType(false), "boolean");
    });

    it("should get compound type 'String' as expected", () => {
        assert.strictEqual(getType(run("compound-basics/string")), "String");
    });

    it("should get compound type 'Number' as expected", () => {
        assert.strictEqual(getType(run("compound-basics/number")), "Number");
    });

    it("should get compound type 'Boolean' as expected", () => {
        assert.strictEqual(getType(run("compound-basics/boolean-true")), "Boolean");
        assert.strictEqual(getType(run("compound-basics/boolean-false")), "Boolean");
    });

    it("should get compound type 'Symbol' as expected", () => {
        assert.strictEqual(getType(run("compound-basics/symbol")), "Symbol");
    });

    it("should get compound type 'RegExp' as expected", () => {
        assert.strictEqual(getType(run("regexps/literal")), "RegExp");
    });

    it("should get compound type 'Date' as expected", () => {
        assert.strictEqual(getType(run("compound-basics/date")), "Date");
    });

    it("should get compound type 'Map' as expected", () => {
        assert.strictEqual(getType(run("maps/map")), "Map");
    });

    it("should get compound type 'Set' as expected", () => {
        assert.strictEqual(getType(run("sets/set")), "Set");
    });

    it("should get compound type 'Int8Array' as expected", () => {
        assert.strictEqual(getType(run("typed-arrays/int8array")), Int8Array.name);
    });

    it("should get compound type 'Int16Array' as expected", () => {
        assert.strictEqual(getType(run("typed-arrays/int16array")), Int16Array.name);
    });

    it("should get compound type 'Int32Array' as expected", () => {
        assert.strictEqual(getType(run("typed-arrays/int32array")), Int32Array.name);
    });

    it("should get compound type 'Uint8Array' as expected", () => {
        assert.strictEqual(getType(run("typed-arrays/uint8array")), Uint8Array.name);
    });

    it("should get compound type 'Uint16Array' as expected", () => {
        assert.strictEqual(getType(run("typed-arrays/uint16array")), Uint16Array.name);
    });

    it("should get compound type 'Uint32Array' as expected", () => {
        assert.strictEqual(getType(run("typed-arrays/uint32array")), Uint32Array.name);
    });

    it("should get compound type 'Buffer' as expected", () => {
        assert.strictEqual(getType(run("typed-arrays/buffer")), Buffer.name);
    });

    it("should get compound type 'Error' as expected", () => {
        assert.strictEqual(getType(error), Error.name);
    });

    it("should get compound type 'EvalError' as expected", () => {
        assert.strictEqual(getType(evalError), EvalError.name);
    });

    it("should get compound type 'RangeError' as expected", () => {
        assert.strictEqual(getType(rangeError), RangeError.name);
    });

    it("should get compound type 'ReferenceError' as expected", () => {
        assert.strictEqual(getType(referenceError), ReferenceError.name);
    });

    it("should get compound type 'SyntaxError' as expected", () => {
        assert.strictEqual(getType(syntaxError), SyntaxError.name);
    });

    it("should get compound type 'TypeError' as expected", () => {
        assert.strictEqual(getType(typeError), TypeError.name);
    });

    it("should get compound type 'AssertionError' as expected", () => {
        assert.strictEqual(getType(assertionError), "AssertionError");
    });
});