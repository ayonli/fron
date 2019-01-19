require("source-map-support/register");
const assert = require("assert");
const { parse } = require("..");
const { getData } = require("./data");

describe("Parse Comments", () => { 
    it("should parse a single-line comment as expected", () => {
        assert.strictEqual(parse(getData("literal-comment-single-line")), undefined);
    });

    it("should parse a single-line comment after a literal as expected", () => {
        assert.strictEqual(parse(getData("literal-comment-literal-single-line")), 12345);
    });

    it("should parse an in-line comment as expected", () => {
        assert.strictEqual(parse(getData("literal-comment-in-line")), undefined);
    });

    it("should parse an in-line comment after a literal as expected", () => {
        assert.strictEqual(parse(getData("literal-comment-literal-in-line")), 12345);
    });

    it("should parse a multi-line comment as expected", () => {
        assert.strictEqual(parse(getData("literal-comment-multi-line")), undefined);
    });

    it("should parse a multi-line comment after a literal as expected", () => {
        assert.strictEqual(parse(getData("literal-comment-literal-multi-line")), 12345);
    });
});