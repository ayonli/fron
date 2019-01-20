require("source-map-support/register");
const assert = require("assert");
const { stringify } = require("..");
const { getData } = require("./data");

describe("Parse Numbers", () => {
    it("should stringify a decimal number as expected", () => {
        assert.strictEqual(stringify(12345), getData("numbers/decimal"));
    });

    it("should stringify a minus decimal number as expected", () => {
        assert.strictEqual(stringify(-12345), getData("numbers/minus-decimal"));
    });

    it("should stringify a bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(stringify(BigInt(12345)), getData("numbers/bigint"));
    });

    it("should stringify a minus bigint number as expected", () => {
        if (typeof BigInt === "function")
            assert.strictEqual(stringify(BigInt(-12345)), getData("numbers/minus-bigint"));
    });

    it("should stringify Infinity as expected", () => {
        assert.strictEqual(stringify(Infinity), getData("numbers/infinity"));
    });

    it("should stringify minus Infinity as expected", () => {
        assert.strictEqual(stringify(-Infinity), getData("numbers/minus-infinity"));
    });

    it("should stringify NaN as expected", () => {
        assert.strictEqual(stringify(NaN), getData("numbers/nan"));
    });
});