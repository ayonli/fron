require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

var data = new Set([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);

describe("Stringify Set", () => {
    it("should stringify a Set instance as expected", () => {
        assert.strictEqual(stringify(data), get("set"));
    });

    it("should stringify a Set instance and prettify the output as expected", () => {
        assert.strictEqual(stringify(data, true), get("set-pretty"));
    });
});

describe("Parse Set", () => {
    it("should parse a Set instance as expected", () => {
        assert.deepStrictEqual(parse(get("set")), data);
    });

    it("should parse a Set instance from pretty FRON string as expected", () => {
        assert.deepStrictEqual(parse(get("set-pretty")), data);
    });
});