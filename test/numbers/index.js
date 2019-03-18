require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createGetter, createAssertions } = require("../utils");
const get = createGetter(__dirname);
const assertions = createAssertions(__dirname);

describe("Stringify Numbers", () => {
    it("should stringify a decimal number as expected", () => {
        assert.strictEqual(...assertions(stringify, "decimal"));
    });

    it("should stringify a minus decimal number as expected", () => {
        assert.strictEqual(...assertions(stringify, "minus-decimal"));
    });

    it("should stringify a bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(...assertions(stringify, "bigint"));
    });

    it("should stringify a minus bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(...assertions(stringify, "minus-bigint"));
    });

    it("should stringify Infinity as expected", () => {
        assert.strictEqual(...assertions(stringify, "infinity"));
    });

    it("should stringify minus Infinity as expected", () => {
        assert.strictEqual(...assertions(stringify, "minus-infinity"));
    });

    it("should stringify NaN as expected", () => {
        assert.strictEqual(...assertions(stringify, "nan"));
    });
});

describe("Parse Numbers", () => {
    it("should parse a decimal number as expected", () => {
        assert.strictEqual(...assertions(parse, "decimal"));
    });

    it("should parse a plus decimal number as expected", () => {
        assert.strictEqual(...assertions(parse, "plus-decimal"));
    });

    it("should parse a minus decimal number as expected", () => {
        assert.strictEqual(...assertions(parse, "minus-decimal"));
    });

    it("should parse a binary number as expected", () => {
        assert.strictEqual(...assertions(parse, "binary"));
    });

    it("should parse a plus binary number as expected", () => {
        assert.strictEqual(...assertions(parse, "plus-binary"));
    });

    it("should parse a minus binary number as expected", () => {
        assert.strictEqual(...assertions(parse, "minus-binary"));
    });

    it("should parse an octal number as expected", () => {
        assert.strictEqual(...assertions(parse, "octal"));
    });

    it("should parse a plus octal number as expected", () => {
        assert.strictEqual(...assertions(parse, "plus-octal"));
    });

    it("should parse a minus octal number as expected", () => {
        assert.strictEqual(...assertions(parse, "minus-octal"));
    });

    it("should parse a hexdecimal number as expected", () => {
        assert.strictEqual(...assertions(parse, "hexdecimal"));
    });

    it("should parse a plus hexdecimal number as expected", () => {
        assert.strictEqual(...assertions(parse, "plus-hexdecimal"));
    });

    it("should parse a minus hexdecimal number as expected", () => {
        assert.strictEqual(...assertions(parse, "minus-hexdecimal"));
    });

    it("should parse a float number as expected", () => {
        assert.strictEqual(...assertions(parse, "float"));
    });

    it("should parse a plus float number as expected", () => {
        assert.strictEqual(...assertions(parse, "plus-float"));
    });

    it("should parse a minus float number as expected", () => {
        assert.strictEqual(...assertions(parse, "minus-float"));
    });

    it("should parse a float number without integer as expected", () => {
        assert.strictEqual(...assertions(parse, "float-no-integer"));
    });

    it("should parse a plus float number without integer as expected", () => {
        assert.strictEqual(...assertions(parse, "plus-float-no-integer"));
    });

    it("should parse a minus float number without integer as expected", () => {
        assert.strictEqual(...assertions(parse, "minus-float-no-integer"));
    });

    it("should parse a bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(...assertions(parse, "bigint"));
    });

    it("should parse a minus bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(...assertions(parse, "minus-bigint"));
    });

    it("should parse Infinity as expected", () => {
        assert.strictEqual(...assertions(parse, "infinity"));
    });

    it("should parse plus Infinity as expected", () => {
        assert.strictEqual(...assertions(parse, "plus-infinity"));
    });

    it("should parse minus Infinity as expected", () => {
        assert.strictEqual(...assertions(parse, "minus-infinity"));
    });

    it("should parse a NaN as expected", () => {
        let nan = parse(get("nan"));
        assert.ok(typeof nan === "number");
        assert.ok(Number.isNaN(nan));
    });
});