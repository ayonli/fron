require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createGetter, createAssertions, createRunner } = require("../utils");
const get = createGetter(__dirname);
const assertions = createAssertions(__dirname);
const run = createRunner(__dirname);

describe("Stringify Map", () => {
    it("should stringify a Map instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "map"));
    });

    it("should stringify a Map instance and prettify the output as expected", () => {
        assert.strictEqual(stringify(run("map-pretty"), true), get("map-pretty"));
    });
});

describe("Parse Map", () => {
    it("should parse a Map instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "map"));
    });

    it("should parse a Map instance from pretty FRON string as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "map-pretty"));
    });
});