require("source-map-support/register");
const assert = require("assert");
const { parse } = require("..");
const { getData } = require("./data");

describe("Parse Numbers", () => {
    it("should parse a decimal number literal as expected", () => {
        assert.strictEqual(parse(getData("literal-number")), 12345);
    });

    it("should parse a decimal number literal with floating point as expected", () => {
        assert.strictEqual(parse(getData("literal-number-float-1")), 12345.123);
    });

    it("should parse a decimal number literal starts with floating point as expected", () => {
        assert.strictEqual(parse(getData("literal-number-float-2")), .123);
    });

    it("should parse a decimal number literal with plus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-plus")), +12345);
    });

    it("should parse a decimal number literal with minus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-minus")), -12345);
    });

    it("should parse a decimal number literal with floating point and plus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-float-plus-1")), +12345.123);
    });

    it("should parse a decimal number literal with floating point and minus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-float-minus-1")), -12345.123);
    });

    it("should parse a decimal number literal starts with floating point and plus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-float-plus-2")), +.123);
    });

    it("should parse a decimal number literal starts with floating point and minus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-float-minus-2")), -.123);
    });

    it("should parse a binary number literal as expected", () => {
        assert.strictEqual(parse(getData("literal-number-binary")), 0b101010);
    });

    it("should parse a binary number literal with plus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-binary-plus")), +0b101010);
    });

    it("should parse a binary number literal with minus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-binary-minus")), -0b101010);
    });

    it("should parse an octal number literal as expected", () => {
        assert.strictEqual(parse(getData("literal-number-octal")), 0o12345670);
    });

    it("should parse an octal number literal with plus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-octal-plus")), +0o12345670);
    });

    it("should parse an octal number literal with minus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-octal-minus")), -0o12345670);
    });

    it("should parse a hexdecimal number literal as expected", () => {
        assert.strictEqual(parse(getData("literal-number-hexdecimal")), 0x12345abcdef);
    });

    it("should parse a hexdecimal number literal with plus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-hexdecimal-plus")), +0x12345abcdef);
    });
    
    it("should parse a hexdecimal number literal with minus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-hexdecimal-minus")), -0x12345abcdef);
    });

    it("should parse a bigint number literal as expected", () => {
        assert.strictEqual(parse(getData("literal-number-bigint")), 12345n);
    });

    it("should parse a bigint number literal with plus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-bigint-plus")), 12345n);
    });

    it("should parse a bigint number literal with minus-sign mark as expected", () => {
        assert.strictEqual(parse(getData("literal-number-bigint-minus")), -12345n);
    });
});