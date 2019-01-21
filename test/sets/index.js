require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../..");
const { createGetter, createAssertions, createRunner } = require("../utils");
const get = createGetter(__dirname);
const assertions = createAssertions(__dirname);
const run = createRunner(__dirname);

describe("Stringify Set", () => {
    it("should stringify a Set instance as expected", () => {
        assert.strictEqual(...assertions(stringify, "set"));
    });

    it("should stringify a Set instance and prettify the output as expected", () => {
        assert.strictEqual(stringify(run("set-pretty"), true), get("set-pretty"));
    });
});

describe("Parse Set", () => {
    it("should parse a Set instance as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "set"));
    });

    it("should parse a Set instance from pretty FRON string as expected", () => {
        assert.deepStrictEqual(...assertions(parse, "set-pretty"));
    });
});