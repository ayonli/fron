const assert = require("assert");
const { getType } = require("../dist/types");

describe("testing types", () => {
    it("should get correct types as expected", () => {
        assert.equal(getType([1, 2, 3]), Array);
        assert.equal(getType(true), "boolean");
        assert.equal(getType(new Boolean(true)), Boolean);
        assert.equal(getType(Buffer.from("Hello, World!")), Buffer);
        assert.equal(getType(new Date()), Date);
        assert.equal(getType(new Error("something went wrong")), Error);
        assert.equal(getType(new Map([["hello", "world"]])), Map);
        assert.equal(getType(null), "null");
        assert.equal(getType(1), "number");
        assert.equal(getType(new Number(1)), Number);
        assert.equal(getType({ hello: "world" }), Object);
        assert.equal(getType(new Object({ hello: "world" })), Object);
        assert.equal(getType(/[a-z-A-Z0-9]/g), RegExp);
        assert.equal(getType(new RegExp("[a-z-A-Z0-9]", "g")), RegExp);
        assert.equal(getType(new Set(["hello", "world"])), Set);
        assert.equal(getType("Hello, World!"), "string");
        assert.equal(getType(new String("Hello, World!")), String);
        assert.equal(getType(Symbol.for("desc")), "symbol");
    });
});