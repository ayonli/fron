require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

var data = new Map([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);

describe("Stringify Map", () => {
    it("should stringify a Map instance as expected", () => {
        assert.strictEqual(stringify(data), get("map"));
    });

    it("should stringify a Map instance and prettify the output as expected", () => {
        assert.strictEqual(stringify(data, true), get("map-pretty"));
    });
});

describe("Parse Map", () => {
    it("should parse a Map instance as expected", () => {
        assert.deepStrictEqual(parse(get("map")), data);
    });

    it("should parse a Map instance from pretty FRON string as expected", () => {
        assert.deepStrictEqual(parse(get("map-pretty")), data);
    });
});