require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

describe("Stringify Booleans", () => {
    it("should stringify true as expected", () => {
        assert.strictEqual(stringify(true), get("true"));
    });

    it("should stringify false as expected", () => {
        assert.strictEqual(stringify(false), get("false"));
    });
});

describe("Parse Booleans", () => {
    it("should parse true as expected", () => {
        assert.strictEqual(parse(get("true")), true);
    });

    it("should parse false as expected", () => {
        assert.strictEqual(parse(get("false")), false);
    });
});