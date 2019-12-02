require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createGetter, createRunner, createAssertions } = require("../utils");
const get = createGetter(__dirname);
const run = createRunner(__dirname);
const assertions = createAssertions(__dirname);

describe("Stringify Objects", () => {
    it("should stringify an object with Latin properties as expected", () => {
        assert.strictEqual(...assertions(stringify, "latin-properties"));
    });

    it("should stringify an object with quoted properties as expected", () => {
        assert.strictEqual(...assertions(stringify, "quoted-properties"));
    });

    it("should stringify an object with numeric properties as expected", () => {
        assert.strictEqual(...assertions(stringify, "numeric-properties"));
    });

    it("should stringify an object with pretty format as expected", () => {
        assert.strictEqual(stringify(run("pretty"), true), get("pretty"));
    });

    it("should stringify an object with custom pretty format as expected", () => {
        assert.strictEqual(stringify(run("custom-pretty"), "    "), get("custom-pretty"));
    });
});

describe("Parse Objects", () => {
    it("should parse an object with Latin properties as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "latin-properties"));
    });

    it("should parse an object with quoted properties as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "quoted-properties"));
    });

    it("should parse an object with numeric properties as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "numeric-properties"));
    });

    it("should parse an object with pretty format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "pretty"));
    });

    it("should parse an object with custom pretty format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "custom-pretty"));
    });

    it("should parse an object with inline comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-inline-comment"));
    });

    it("should parse an object with leading comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-leading-comment"));
    });

    it("should parse an object with trailing comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-trailing-comment"));
    });

    it("should parse an object with block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-block-comment"));
    });

    it("should parse an object with leading block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-leading-block-comment"));
    });

    it("should parse an object with trailing block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-trailing-block-comment"));
    });

    it("should parse an object with inline block comment as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "with-inline-block-comment"));
    });

    it("should parse an object with bad format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "bad-format"));
    });

    it("should parse an object with extra comma as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "bad-format"));
    });

    it("should parse an object with complicated-construction as expected", () => {
        let str = get("complicated-construction");
        assert.strictEqual(stringify(parse(str), "    "), str.slice(7, -1));
    });
});