require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createAssertions } = require("../utils");
const assertions = createAssertions(__dirname);

describe("Stringify Basic Compound Types", () => {
    it("should stringify a String instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "string"));
    });

    it("should stringify a Number instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "number"));
    });

    it("should stringify Boolean instances (true and false) as expected", () => {
        assert.strictEqual(...assertions(stringify, "boolean-true"));
        assert.strictEqual(...assertions(stringify, "boolean-false"));
    });

    it("should stringify a Symbol instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "symbol", Symbol));
    });

    it("should stringify a Date instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "date"));
    });
});

describe("Parse Basic Compound Types", () => {
    it("should parse a String instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "string"));
    });

    it("should parse a Number instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "number"));
    });

    it("should parse Boolean instances as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "boolean-true"));
        assert.deepStrictEqual(...assertions(parse, "boolean-false"));
    });

    it("should parse a Symbol instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "symbol", Symbol));
    });

    it("should parse a Date instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "date"));
    });
});