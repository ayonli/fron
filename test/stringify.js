require("source-map-support/register");
const assert = require("assert");
const { stringify } = require("..");

describe("Stringifier", () => {
    it("should stringify a string literal as expected", () => {
        assert.equal(stringify("Hello, World!"), '"Hello, World!"');
    });

    it("should stringify a number literal as expected", () => {
        assert.equal(stringify(12345), "12345");
    });

    it("should stringify boolean literals as expected", () => {
        assert.equal(stringify(true), "true");
        assert.equal(stringify(false), "false")
    });

    it("should stringify special numbers as expected", () => {
        assert.equal(stringify(NaN), "NaN");
        assert.equal(stringify(Infinity), "Infinity");
    });

    it("should stringify a String instance as expected", () => {
        assert.equal(stringify(new String("Hello, World!")), 'String("Hello, World!")');
    });

    it("should stringify a Number instance as expected", () => {
        assert.equal(stringify(new Number(12345)), 'Number(12345)');
    });

    it("should stringify Boolean instances as expected", () => {
        assert.equal(stringify(new Boolean(true)), 'Boolean(true)');
        assert.equal(stringify(new Boolean(false)), 'Boolean(false)');
    });

    it("should stringify a Symbol instance as expected", () => {
        assert.equal(stringify(Symbol.for("example")), 'Symbol("example")');
    });

    it("should stringify a RegExp instance as expected", () => {
        assert.equal(stringify(/[a-z]/i), '/[a-z]/i');
    });

    it("should stringify a Date instance as expected", () => {
        let date = new Date();
        assert.equal(stringify(date), `Date("${date.toISOString()}")`);
    });

    it("should stringify an object as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.equal(stringify(data), `{abc:"Hello, World!",efg:"Hi, Ayon!"}`);
    });

    it("should stringify an object with quoted properties as expected", () => {
        let data = {
            "a b c": "Hello, World!",
            "e f g": "Hi, Ayon!",
            "你好": "世界"
        };
        assert.equal(stringify(data), `{"a b c":"Hello, World!","e f g":"Hi, Ayon!","你好":"世界"}`);
    });

    it("should stringify an object with numeric properties as expected", () => {
        let data = {
            1: "Hello, World!",
            2: "Hi, Ayon!"
        };
        assert.equal(stringify(data), `{"1":"Hello, World!","2":"Hi, Ayon!"}`);
    });

    it("should stringify an object and prettify the output as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.equal(stringify(data, true), [
            '{',
            '  abc: "Hello, World!",',
            '  efg: "Hi, Ayon!"',
            "}"
        ].join("\n"));
    });

    it("should stringify an object and prettify the output with customized spaces as expected", () => {
        let data = {
            abc: "Hello, World!",
            efg: "Hi, Ayon!"
        };
        assert.equal(stringify(data, "    "), [
            '{',
            '    abc: "Hello, World!",',
            '    efg: "Hi, Ayon!"',
            "}"
        ].join("\n"));
    });

    it("should stringify an array as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.equal(stringify(data), `["Hello, World!","Hi, Ayon!"]`);
    });

    it("should stringify an array and prettify the output as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.equal(stringify(data, true), [
            '[',
            '  "Hello, World!",',
            '  "Hi, Ayon!"',
            ']'
        ].join("\n"));
    });

    it("should stringify an array and prettify the output with customized spaces as expected", () => {
        let data = ["Hello, World!", "Hi, Ayon!"];
        assert.equal(stringify(data, "    "), [
            '[',
            '    "Hello, World!",',
            '    "Hi, Ayon!"',
            ']'
        ].join("\n"));
    });

    it("should stringify a Map instance as expected", () => {
        let data = new Map([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.equal(stringify(data), `Map([["abc","Hello, World!"],[{efg:"Hi, Ayon"},1]])`);
    });

    it("should stringify a Map instance and prettify the output as expected", () => {
        let data = new Map([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.equal(stringify(data, true), [
            'Map([',
            '  [',
            '    "abc",',
            '    "Hello, World!"',
            '  ],',
            '  [',
            '    {',
            '      efg: "Hi, Ayon"',
            '    },',
            '    1',
            '  ]',
            '])'
        ].join("\n"));
    });

    it("should stringify a Set instance as expected", () => {
        let data = new Set([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.equal(stringify(data), `Set([["abc","Hello, World!"],[{efg:"Hi, Ayon"},1]])`);
    });

    it("should stringify a Set instance and prettify the output as expected", () => {
        let data = new Set([["abc", "Hello, World!"], [{ efg: "Hi, Ayon" }, 1]]);
        assert.equal(stringify(data, true), [
            'Set([',
            '  [',
            '    "abc",',
            '    "Hello, World!"',
            '  ],',
            '  [',
            '    {',
            '      efg: "Hi, Ayon"',
            '    },',
            '    1',
            '  ]',
            '])'
        ].join("\n"));
    });
});