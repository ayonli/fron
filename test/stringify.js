require("source-map-support/register");
const assert = require("assert");
const { stringify } = require("..");
const { getData } = require("./data");

describe("Stringifier", () => {
    it("should stringify a string literal as expected", () => {
        assert.strictEqual(stringify("Hello, World!"), getData("literal-string"));
    });

    it("should stringify a number literal as expected", () => {
        assert.strictEqual(stringify(12345), getData("literal-number"));
    });

    it("should stringify boolean literals as expected", () => {
        assert.strictEqual(stringify(true), getData("literal-boolean-true"));
        assert.strictEqual(stringify(false), getData("literal-boolean-false"));
    });

    it("should stringify special numbers as expected", () => {
        assert.strictEqual(stringify(NaN), getData("literal-number-nan"));
        assert.strictEqual(stringify(Infinity), getData("literal-number-infinity"));
    });

    it("should stringify a String instance as expected", () => {
        assert.strictEqual(stringify(new String("Hello, World!")), getData("compound-string"));
    });

    it("should stringify a Number instance as expected", () => {
        assert.strictEqual(stringify(new Number(12345)), getData("compound-number"));
    });

    it("should stringify Boolean instances as expected", () => {
        assert.strictEqual(stringify(new Boolean(true)), getData("compound-boolean-true"));
        assert.strictEqual(stringify(new Boolean(false)), getData("compound-boolean-false"));
    });

    it("should stringify a Symbol instance as expected", () => {
        assert.strictEqual(stringify(Symbol.for("example")), getData("compound-symbol"));
    });

    it("should stringify a RegExp instance as expected", () => {
        assert.strictEqual(stringify(/[a-z]/i), getData("compound-regexp"));
    });

    it("should stringify a Date instance as expected", () => {
        let date = new Date("2019-1-1 00:00:00");
        assert.strictEqual(stringify(date), getData("compound-date"));
    });

    it("should stringify an object as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.strictEqual(stringify(data), getData("literal-object-1"));
    });

    it("should stringify an object with quoted properties as expected", () => {
        let data = {
            "a b c": "Hello, World!",
            "e f g": "Hi, Ayon!",
            "你好": "世界"
        };
        assert.strictEqual(stringify(data), getData("literal-object-2"));
    });

    it("should stringify an object with numeric properties as expected", () => {
        let data = {
            1: "Hello, World!",
            2: "Hi, Ayon!"
        };
        assert.strictEqual(stringify(data), getData("literal-object-3"));
    });

    it("should stringify an object and prettify the output as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.strictEqual(stringify(data, true), getData("literal-object-4"));
    });

    it("should stringify an object and prettify the output with customized spaces as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.strictEqual(stringify(data, "    "), getData("literal-object-5"));
    });

    it("should stringify an array as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.strictEqual(stringify(data), getData("literal-array-1"));
    });

    it("should stringify an array and prettify the output as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.strictEqual(stringify(data, true), getData("literal-array-2"));
    });

    it("should stringify an array and prettify the output with customized spaces as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.strictEqual(stringify(data, "    "), getData("literal-array-3"));
    });

    it("should stringify a Map instance as expected", () => {
        let data = new Map([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.strictEqual(stringify(data), getData("compound-map-1"));
    });

    it("should stringify a Map instance and prettify the output as expected", () => {
        let data = new Map([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.strictEqual(stringify(data, true), getData("compound-map-2"));
    });

    it("should stringify a Set instance as expected", () => {
        let data = new Set([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.strictEqual(stringify(data), getData("compound-set-1"));
    });

    it("should stringify a Set instance and prettify the output as expected", () => {
        let data = new Set([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.strictEqual(stringify(data, true), getData("compound-set-2"));
    });
});