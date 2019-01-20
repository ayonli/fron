require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

describe("Stringify Numbers", () => {
    it("should stringify a decimal number as expected", () => {
        assert.strictEqual(stringify(12345), get("decimal"));
    });

    it("should stringify a minus decimal number as expected", () => {
        assert.strictEqual(stringify(-12345), get("minus-decimal"));
    });

    it("should stringify a bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(stringify(BigInt(12345)), get("bigint"));
    });

    it("should stringify a minus bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(stringify(BigInt(-12345)), get("minus-bigint"));
    });

    it("should stringify Infinity as expected", () => {
        assert.strictEqual(stringify(Infinity), get("infinity"));
    });

    it("should stringify minus Infinity as expected", () => {
        assert.strictEqual(stringify(-Infinity), get("minus-infinity"));
    });

    it("should stringify NaN as expected", () => {
        assert.strictEqual(stringify(NaN), get("nan"));
    });
});

describe("Parse Numbers", () => {
    it("should parse a decimal number as expected", () => {
        assert.strictEqual(parse(get("decimal")), 12345);
    });

    it("should parse a plus decimal number as expected", () => {
        assert.strictEqual(parse(get("plus-decimal")), +12345);
    });

    it("should parse a minus decimal number as expected", () => {
        assert.strictEqual(parse(get("minus-decimal")), -12345);
    });

    it("should parse a binary number as expected", () => {
        assert.strictEqual(parse(get("binary")), 0b101010);
    });

    it("should parse a plus binary number as expected", () => {
        assert.strictEqual(parse(get("plus-binary")), +0b101010);
    });

    it("should parse a minus binary number as expected", () => {
        assert.strictEqual(parse(get("minus-binary")), -0b101010);
    });

    it("should parse an octal number as expected", () => {
        assert.strictEqual(parse(get("octal")), 0o12345670);
    });

    it("should parse a plus octal number as expected", () => {
        assert.strictEqual(parse(get("plus-octal")), +0o12345670);
    });

    it("should parse a minus octal number as expected", () => {
        assert.strictEqual(parse(get("minus-octal")), -0o12345670);
    });

    it("should parse a hexdecimal number as expected", () => {
        assert.strictEqual(parse(get("hexdecimal")), 0x12345abcdef);
    });

    it("should parse a plus hexdecimal number as expected", () => {
        assert.strictEqual(parse(get("plus-hexdecimal")), +0x12345abcdef);
    });

    it("should parse a minus hexdecimal number as expected", () => {
        assert.strictEqual(parse(get("minus-hexdecimal")), -0x12345abcdef);
    });

    it("should parse a float number as expected", () => {
        assert.strictEqual(parse(get("float")), 12345.123);
    });

    it("should parse a plus float number as expected", () => {
        assert.strictEqual(parse(get("plus-float")), +12345.123);
    });

    it("should parse a minus float number as expected", () => {
        assert.strictEqual(parse(get("minus-float")), -12345.123);
    });

    it("should parse a float number without integer as expected", () => {
        assert.strictEqual(parse(get("float-no-integer")), .123);
    });

    it("should parse a plus float number without integer as expected", () => {
        assert.strictEqual(parse(get("plus-float-no-integer")), +.123);
    });

    it("should parse a minus float number without integer as expected", () => {
        assert.strictEqual(parse(get("minus-float-no-integer")), -.123);
    });

    it("should parse a bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(parse(get("bigint")), BigInt(12345));
    });

    it("should parse a minus bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(parse(get("minus-bigint")), BigInt(-12345));
    });

    it("should parse Infinity as expected", () => {
        assert.strictEqual(parse(get("infinity")), Infinity);
    });

    it("should parse plus Infinity as expected", () => {
        assert.strictEqual(parse(get("plus-infinity")), +Infinity);
    });

    it("should parse minus Infinity as expected", () => {
        assert.strictEqual(parse(get("minus-infinity")), -Infinity);
    });

    it("should parse a NaN as expected", () => {
        let nan = parse(get("nan"));
        assert.ok(typeof nan === "number");
        assert.ok(Number.isNaN(nan));
    });
});