require("source-map-support/register");
const assert = require("assert");
const { parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

describe("Parse Comments", () => {
    it("should parse a single-line comment as expected", () => {
        assert.strictEqual(parse(get("single-line-comment")), undefined);
    });

    it("should parse a single-line comment before a number as expected", () => {
        assert.strictEqual(parse(get("single-line-comment-before-number")), 12345);
    });

    it("should parse a single-line comment after a number as expected", () => {
        assert.strictEqual(parse(get("single-line-comment-after-number")), 12345);
    });

    it("should parse a single-line comment wraps a number as expected", () => {
        assert.strictEqual(parse(get("single-line-comment-wraps-number")), 12345);
    });

    it("should parse an inline comment as expected", () => {
        assert.strictEqual(parse(get("inline-comment")), undefined);
    });

    it("should parse an inline comment before a number as expected", () => {
        assert.strictEqual(parse(get("inline-comment-before-number")), 12345);
    });

    it("should parse an inline comment after a number as expected", () => {
        assert.strictEqual(parse(get("inline-comment-after-number")), 12345);
    });

    it("should parse an inline comment wraps a number as expected", () => {
        assert.strictEqual(parse(get("inline-comment-wraps-number")), 12345);
    });

    it("should parse a multi-line comment as expected", () => {
        assert.strictEqual(parse(get("multi-line-comment")), undefined);
    });

    it("should parse a multi-line comment before a number as expected", () => {
        assert.strictEqual(parse(get("multi-line-comment-before-number")), 12345);
    });

    it("should parse a multi-line comment after a number as expected", () => {
        assert.strictEqual(parse(get("multi-line-comment-after-number")), 12345);
    });

    it("should parse a multi-line comment wraps a number as expected", () => {
        assert.strictEqual(parse(get("multi-line-comment-wraps-number")), 12345);
    });
});