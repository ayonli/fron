require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

describe("Stringify Basic Compound Types", () => {
    it("should stringify a String instance as expected", () => {
        assert.strictEqual(stringify(new String("Hello, World!")), get("string"));
    });

    it("should stringify a Number instance as expected", () => {
        assert.strictEqual(stringify(new Number(12345)), get("number"));
    });

    it("should stringify Boolean instances (true and false) as expected", () => {
        assert.strictEqual(stringify(new Boolean(true)), get("boolean-true"));
        assert.strictEqual(stringify(new Boolean(false)), get("boolean-false"));
    });

    it("should stringify a Symbol instance as expected", () => {
        assert.strictEqual(stringify(Symbol.for("example")), get("symbol"));
    });

    it("should stringify a Date instance as expected", () => {
        assert.strictEqual(stringify(new Date("2019-01-01T00:00:00.000Z")), get("date"));
    });
});

describe("Parse Basic Compound Types", () => {
    it("should parse a String instance as expected", () => {
        assert.deepStrictEqual(parse(get("string")), new String("Hello, World!"));
    });

    it("should parse a Number instance as expected", () => {
        assert.deepStrictEqual(parse(get("number")), new Number(12345));
    });

    it("should parse Boolean instances as expected", () => {
        assert.deepStrictEqual(parse(get("boolean-true")), new Boolean(true));
        assert.deepStrictEqual(parse(get("boolean-false")), new Boolean(false));
    });

    it("should parse a Symbol instance as expected", () => {
        assert.deepStrictEqual(parse(get("symbol")), Symbol.for("example"));
    });

    it("should parse a Date instance as expected", () => {
        assert.deepStrictEqual(parse(get("date")), new Date("2019-01-01T00:00:00.000Z"));
    });
});