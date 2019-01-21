require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createGetter, createRunner, createAssertions } = require("../utils");
const get = createGetter(__dirname);
const run = createRunner(__dirname);
const assertions = createAssertions(__dirname);

describe("Stringify Objects", () => {
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

describe("Parse Objects", () => {
    it("should parse an array with with no spaces as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "no-space"));
    });

    it("should parse an array with pretty format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "pretty"));
    });

    it("should parse an array with custom pretty format as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "custom-pretty"));
    });
});