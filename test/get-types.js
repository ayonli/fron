require("source-map-support/register");
const assert = require("assert");
const { getType } = require("..");
const {
    int8Array,
    int16Array,
    int32Array,
    uint8Array,
    uint16Array,
    uint32Array,
    buffer
} = require("./data");

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

    it("should get compound type 'Int8Array' as expected", () => {
        assert.strictEqual(getType(int8Array), Int8Array.name);
    });

    it("should get compound type 'Int16Array' as expected", () => {
        assert.strictEqual(getType(int16Array), Int16Array.name);
    });

    it("should get compound type 'Int32Array' as expected", () => {
        assert.strictEqual(getType(int32Array), Int32Array.name);
    });

    it("should get compound type 'Uint8Array' as expected", () => {
        assert.strictEqual(getType(uint8Array), Uint8Array.name);
    });

    it("should get compound type 'Uint16Array' as expected", () => {
        assert.strictEqual(getType(uint16Array), Uint16Array.name);
    });

    it("should get compound type 'Uint32Array' as expected", () => {
        assert.strictEqual(getType(uint32Array), Uint32Array.name);
    });

    it("should get compound type 'Buffer' as expected", () => {
        assert.strictEqual(getType(buffer), Buffer.name);
    });
});