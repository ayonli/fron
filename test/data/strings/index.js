require("source-map-support/register");
const assert = require("assert");
const { stringify, parse } = require("../../..");
const { createAssertions } = require("..");
const assertions = createAssertions(__dirname);

describe("Stringify Strings", () => {
    it("should stringify a single-line string as expected", () => {
        assert.strictEqual(...assertions(stringify, "double-quoted"));
    });

    it("should stringify a multi-line string as expected", () => {
        assert.strictEqual(...assertions(stringify, "double-quoted-multi-line"));
    });
});

describe("Parse Strings", () => { 
    it("should parse a double-quoted string as expected", () => {
        assert.strictEqual(...assertions(parse, "double-quoted"));
    });

    it("should parse a double-quoted string in multiple lines as expected", () => {
        assert.strictEqual(...assertions(parse, "double-quoted-multi-line"));
    });
    
    it("should parse a single-quoted string as expected", () => {
        assert.strictEqual(...assertions(parse, "single-quoted"));
    });

    it("should parse a single-quoted string in multiple lines as expected", () => {
        assert.strictEqual(...assertions(parse, "single-quoted-multi-line"));
    });

    it("should parse a back-quoted string as expected", () => {
        assert.strictEqual(...assertions(parse, "back-quoted"));
    });

    it("should parse a back-quoted string in multiple lines as expected", () => {
        assert.strictEqual(...assertions(parse, "back-quoted-multi-line"));
    });
});