require("source-map-support/register");
const assert = require("assert");
const { parse } = require("..");
const { getData } = require("./data");

describe("Parser", () => {
    it("should parse a string literal as expected", () => {
        assert.strictEqual(parse(getData("literal-string")), "Hello, World!");
    });

    it("should parse a number literal as expected", () => {
        assert.strictEqual(parse(getData("literal-number")), 12345);
    });

    it("should parse boolean literals as expected", () => {
        assert.strictEqual(parse(getData("literal-boolean-true")), true);
        assert.strictEqual(parse(getData("literal-boolean-false")), false);
    });

    it("should parse special numbers as expected", () => {
        assert.ok(isNaN(parse(getData("literal-number-nan"))));
        assert.strictEqual(parse(getData("literal-number-infinity")), Infinity);
    });

    it("should parse a String instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-string")), new String("Hello, World!"));
    });

    it("should parse a Number instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-number")), new Number(12345));
    });

    it("should parse Boolean instances as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-boolean-true")), new Boolean(true));
        assert.deepStrictEqual(parse(getData("compound-boolean-false")), new Boolean(false));
    });

    it("should parse a Symbol instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-symbol")), Symbol.for("example"));
    });

    it("should parse a RegExp instance as expected", () => {
        assert.deepStrictEqual(parse(getData("compound-regexp")), /[a-z]/i);
    });

    it("should parse a Date instance as expected", () => {
        let date = new Date("2019-1-1 00:00:00");
        assert.deepStrictEqual(parse(getData("compound-date")), date);
    });

    it("should parse an object as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.deepStrictEqual(parse(getData("literal-object-1")), data);
    });

    it("should parse an object with quoted properties as expected", () => {
        let data = {
            "a b c": "Hello, World!",
            "e f g": "Hi, Ayon!",
            "你好": "世界"
        };
        assert.deepStrictEqual(parse(getData("literal-object-2")), data);
    });

    it("should parse an object with numeric properties as expected", () => {
        let data = {
            1: "Hello, World!",
            2: "Hi, Ayon!"
        };
        assert.deepStrictEqual(parse(getData("literal-object-3")), data);
    });

    it("should parse an object and prettify the output as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.deepStrictEqual(parse(getData("literal-object-4")), data, true);
    });

    it("should parse an object and prettify the output with customized spaces as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.deepStrictEqual(parse(getData("literal-object-5")), data, "    ");
    });

    it("should parse an array as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.deepStrictEqual(parse(getData("literal-array-1")), data);
    });

    it("should parse an array and prettify the output as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.deepStrictEqual(parse(getData("literal-array-2")), data, true);
    });

    it("should parse an array and prettify the output with customized spaces as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.deepStrictEqual(parse(getData("literal-array-3")), data, "    ");
    });

    it("should parse a Map instance as expected", () => {
        let data = new Map([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.deepStrictEqual(parse(getData("compound-map-1")), data);
    });

    it("should parse a Map instance and prettify the output as expected", () => {
        let data = new Map([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.deepStrictEqual(parse(getData("compound-map-2")), data, true);
    });

    it("should parse a Set instance as expected", () => {
        let data = new Set([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.deepStrictEqual(parse(getData("compound-set-1")), data);
    });

    it("should parse a Set instance and prettify the output as expected", () => {
        let data = new Set([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.deepStrictEqual(parse(getData("compound-set-2")), data, true);
    });
});