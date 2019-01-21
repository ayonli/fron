require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter, createRunner, createAssertions } = require("..");
const get = createGetter(__dirname);
const run = createRunner(__dirname);
const assertions = createAssertions(__dirname);

describe("Stringify RegExp", () => {
    it("should stringify a regexp literal as expected", () => {
        assert.strictEqual(...assertions(stringify, "literal"));
    });
});

describe("Parse RegExp", () => {
    it("should parse a regexp literal as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "literal"));
    });

    it("should parse a RegExp compound type as expected", () => {
        assert.deepStrictEqual(parse(get("compound")), run("literal"));
    });
});