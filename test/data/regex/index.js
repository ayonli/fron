require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

describe("Stringify RegExp", () => {
    it("should stringify a regexp literal as expected", () => {
        assert.strictEqual(stringify(/[a-z]/i), get("literal"));
    });
});

describe("Parse RegExp", () => {
    it("should parse a regexp literal as expected", () => {
        assert.deepStrictEqual(parse(get("literal")), /[a-z]/i);
    });

    it("should parse a RegExp compound type as expected", () => {
        assert.deepStrictEqual(parse(get("compound")), /[a-z]/i);
    });
});