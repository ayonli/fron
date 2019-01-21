require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createAssertions } = require("../utils");
const assertions = createAssertions(__dirname);

describe("Stringify Typed Arrays", () => {
    it("should stringify an Int8Array instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "int8array"));
    });

    it("should stringify an Int16Array instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "int16array"));
    });

    it("should stringify an Int32Array instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "int32array"));
    });

    it("should stringify a Uint8Array instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "uint8array"));
    });

    it("should stringify a Uint16Array instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "uint16array"));
    });

    it("should stringify a Uint32Array instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "uint32array"));
    });

    it("should stringify a Buffer instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "buffer"));
    });
});

describe("Parse Typed Arrays", () => {
    it("should parse an Int8Array instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "int8array"));
    });

    it("should parse an Int16Array instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "int16array"));
    });

    it("should parse an Int32Array instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "int32array"));
    });

    it("should parse a Uint8Array instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "uint8array"));
    });

    it("should parse a Uint16Array instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "uint16array"));
    });

    it("should parse a Uint32Array instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "uint32array"));
    });

    it("should parse a Buffer instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "buffer"));
    });
});