require("source-map-support/register");
const assert = require("assert");
const { parse } = require("..");
const { getData } = require("./data");

describe("Parse Strings", () => { 
    it("should parse a double quoted string as expected", () => {
        assert.strictEqual(parse(getData("literal-string")), "Hello, World!");
    });
    
    it("should parse a single quoted string as expected", () => {
        assert.strictEqual(parse(getData("literal-string-single-quoted")), "Hello, World!");
    });

    it("should parse a back quoted string as expected", () => {
        assert.strictEqual(parse(getData("literal-string-back-quoted")), "Hello, World!");
    });

    it("should parse a back quoted string in multiple lines as expected", () => {
        assert.strictEqual(parse(getData("literal-string-back-quoted-multi-line")), "Hello,\nWorld!");
    });
});