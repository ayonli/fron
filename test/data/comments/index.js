require("source-map-support/register");
const assert = require("assert");
const { parse } = require("../../..");
const { createGetter, createAssertions } = require("..");
const get = createGetter(__dirname);
const assertions = createAssertions(__dirname);

describe("Parse Comments", () => {
    it("should parse an inline comment as expected", () => {
        assert.strictEqual(...assertions(parse, "inline-comment"));
    });

    it("should parse an inline comment before a number as expected", () => {
        assert.strictEqual(...assertions(parse, "inline-comment-before-number"));
    });

    it("should parse an inline comment after a number as expected", () => {
        assert.strictEqual(...assertions(parse, "inline-comment-after-number"));
    });

    it("should parse an inline comment wraps a number as expected", () => {
        assert.strictEqual(...assertions(parse, "inline-comment-wraps-number"));
    });

    it("should parse a block comment as expected", () => {
        assert.strictEqual(...assertions(parse, "block-comment"));
    });

    it("should parse a block comment before a number as expected", () => {
        assert.strictEqual(...assertions(parse, "block-comment-before-number"));
    });

    it("should parse a block comment after a number as expected", () => {
        assert.strictEqual(...assertions(parse, "block-comment-after-number"));
    });

    it("should parse a block comment wraps a number as expected", () => {
        assert.strictEqual(...assertions(parse, "block-comment-wraps-number"));
    });

    it("should parse a multi-line comment as expected", () => {
        assert.strictEqual(...assertions(parse, "multi-line-comment"));
    });

    it("should parse a multi-line comment before a number as expected", () => {
        assert.strictEqual(...assertions(parse, "multi-line-comment-before-number"));
    });

    it("should parse a multi-line comment after a number as expected", () => {
        assert.strictEqual(...assertions(parse, "multi-line-comment-after-number"));
    });

    it("should parse a multi-line comment wraps a number as expected", () => {
        assert.strictEqual(...assertions(parse, "multi-line-comment-wraps-number"));
    });
});