require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createGetter, createRunner, createAssertions } = require("../utils");
const get = createGetter(__dirname);
const run = createRunner(__dirname);
const assertions = createAssertions(__dirname);

describe("Stringify Arrays", () => {
    it("should stringify an array with no spaces as expected", () => {
        assert.strictEqual(...assertions(stringify, "no-space"));
    });

    it("should stringify an array with pretty format as expected", () => {
        assert.strictEqual(stringify(run("pretty"), true), get("pretty"));
    });

    it("should stringify an array with custom pretty format as expected", () => {
        assert.strictEqual(stringify(run("custom-pretty"), "    "), get("custom-pretty"));
    });
});

describe("Parse Arrays", () => {
    it("should parse an array with with no spaces as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "no-space"));
    });

    it("should parse an array with pretty format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "pretty"));
    });

    it("should parse an array with custom pretty format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "custom-pretty"));
    });

    it("should parse an array with inline comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-inline-comment"));
    });

    it("should parse an array with leading comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-leading-comment"));
    });

    it("should parse an array with trailing comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-trailing-comment"));
    });

    it("should parse an array with block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-block-comment"));
    });

    it("should parse an array with leading block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-leading-block-comment"));
    });

    it("should parse an array with trailing block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-trailing-block-comment"));
    });

    it("should parse an array with inline block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-inline-block-comment"));
    });

    it("should parse an array with bad format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "bad-format"));
    });
});