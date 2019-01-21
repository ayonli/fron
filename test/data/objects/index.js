require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter, createRunner, createAssertions } = require("..");
const get = createGetter(__dirname);
const run = createRunner(__dirname);
const assertions = createAssertions(__dirname)

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
});