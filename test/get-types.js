require("source-map-support/register");
const assert = require("assert");
const { getType } = require("..");

describe("Get types", () => {
    it("should get literal type 'string' as expected", () => {
        assert.strictEqual(getType("this is a string literal"), "string");
    });

    it("should get literal type 'number' as expected", () => {
        assert.strictEqual(getType(12345), "number");
    });

    it("should get literal type 'boolean' as expected", () => {
        assert.strictEqual(getType(true), "boolean");
    });

    it("should get compound type 'String' as expected", () => {
        assert.strictEqual(getType(new String("this is a string literal")), "String");
    });

    it("should get compound type 'Number' as expected", () => {
        assert.strictEqual(getType(new Number(12345)), "Number");
    });

    it("should get compound type 'Boolean' as expected", () => {
        assert.strictEqual(getType(new Boolean(true)), "Boolean");
    });

    it("should get compound type 'Symbol' as expected", () => {
        assert.strictEqual(getType(Symbol.for("example")), "Symbol");
    });

    it("should get compound type 'RegExp' as expected", () => {
        assert.strictEqual(getType(/[a-z]/), "RegExp");
    });

    it("should get compound type 'Date' as expected", () => {
        assert.strictEqual(getType(new Date()), "Date");
    });

    it("should get compound type 'Map' as expected", () => {
        assert.strictEqual(getType(new Map([["a", "hello, world"]])), "Map");
    });

    it("should get compound type 'Set' as expected", () => {
        assert.strictEqual(getType(new Set(["Hello, World!", "Hi, Ayon!"])), "Set");
    });
});