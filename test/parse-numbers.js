require("source-map-support/register");
const assert = require("assert");
const { parse } = require("..");
const { getData } = require("./data");

describe("Parse Numbers", () => {
    it("should parse a decimal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/decimal")), 12345);
    });

    it("should parse a plus decimal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/plus-decimal")), +12345);
    });

    it("should parse a minus decimal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/minus-decimal")), -12345);
    });

    it("should parse a binary number as expected", () => {
        assert.strictEqual(parse(getData("numbers/binary")), 0b101010);
    });

    it("should parse a plus binary number as expected", () => {
        assert.strictEqual(parse(getData("numbers/plus-binary")), +0b101010);
    });

    it("should parse a minus binary number as expected", () => {
        assert.strictEqual(parse(getData("numbers/minus-binary")), -0b101010);
    });

    it("should parse an octal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/octal")), 0o12345670);
    });

    it("should parse a plus octal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/plus-octal")), +0o12345670);
    });

    it("should parse a minus octal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/minus-octal")), -0o12345670);
    });

    it("should parse a hexdecimal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/hexdecimal")), 0x12345abcdef);
    });

    it("should parse a plus hexdecimal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/plus-hexdecimal")), +0x12345abcdef);
    });

    it("should parse a minus hexdecimal number as expected", () => {
        assert.strictEqual(parse(getData("numbers/minus-hexdecimal")), -0x12345abcdef);
    });

    it("should parse a float number as expected", () => {
        assert.strictEqual(parse(getData("numbers/float")), 12345.123);
    });

    it("should parse a plus float number as expected", () => {
        assert.strictEqual(parse(getData("numbers/plus-float")), +12345.123);
    });

    it("should parse a minus float number as expected", () => {
        assert.strictEqual(parse(getData("numbers/minus-float")), -12345.123);
    });

    it("should parse a float number without integer as expected", () => {
        assert.strictEqual(parse(getData("numbers/float-no-integer")), .123);
    });

    it("should parse a plus float number without integer as expected", () => {
        assert.strictEqual(parse(getData("numbers/plus-float-no-integer")), +.123);
    });

    it("should parse a minus float number without integer as expected", () => {
        assert.strictEqual(parse(getData("numbers/minus-float-no-integer")), -.123);
    });

    it("should parse a bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(parse(getData("numbers/bigint")), BigInt(12345));
    });

    it("should parse a minus bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(parse(getData("numbers/minus-bigint")), BigInt(-12345));
    });

    it("should parse Infinity as expected", () => {
        assert.strictEqual(parse(getData("numbers/infinity")), Infinity);
    });

    it("should parse plus Infinity as expected", () => {
        assert.strictEqual(parse(getData("numbers/plus-infinity")), +Infinity);
    });

    it("should parse minus Infinity as expected", () => {
        assert.strictEqual(parse(getData("numbers/minus-infinity")), -Infinity);
    });

    it("should parse a NaN as expected", () => {
        let nan = parse(getData("numbers/nan"));
        assert.ok(typeof nan === "number");
        assert.ok(Number.isNaN(nan));
    });
});