require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createGetter } = require("..");
const get = createGetter(__dirname);

describe("Stringify Strings", () => {
    it("should stringify a single-line string as expected", () => {
        assert.strictEqual(stringify("Hello, World!"), get("double-quoted"));
    });

    it("should stringify a multi-line string as expected", () => {
        assert.strictEqual(stringify("Hello,\nWorld!"), get("double-quoted-multi-line"));
    });
});

describe("Parse Strings", () => { 
    it("should parse a double-quoted string as expected", () => {
        assert.strictEqual(parse(get("double-quoted")), "Hello, World!");
    });

    it("should parse a double-quoted string in multiple lines as expected", () => {
        assert.strictEqual(parse(get("double-quoted-multi-line")), "Hello,\nWorld!");
    });
    
    it("should parse a single-quoted string as expected", () => {
        assert.strictEqual(parse(get("single-quoted")), "Hello, World!");
    });

    it("should parse a single-quoted string in multiple lines as expected", () => {
        assert.strictEqual(parse(get("single-quoted-multi-line")), "Hello,\nWorld!");
    });

    it("should parse a back-quoted string as expected", () => {
        assert.strictEqual(parse(get("back-quoted")), "Hello, World!");
    });

    it("should parse a back-quoted string in multiple lines as expected", () => {
        assert.strictEqual(parse(get("back-quoted-multi-line")), "Hello,\nWorld!");
    });
});