const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { __awaiter } = require("tslib");
const FRON = require("..");

var folders = fs.readdirSync(__dirname);

for (let folder of folders) {
    let filename = path.resolve(__dirname, folder);
    let stat = fs.statSync(filename);

    if (stat.isDirectory()) {
        require(filename);
    }
}

describe("Stringify and parse void values", () => {
    it("should not strigify any value of undefined if not a array element", () => {
        assert.strictEqual(FRON.stringify(void 0), void 0);
        assert.strictEqual(FRON.stringify({ foo: undefined }), "{}");
    })

    it("should strigify any value of undefined in an array as expected", () => {
        assert.strictEqual(FRON.stringify([undefined]), "[null]");
        assert.strictEqual(FRON.stringify([undefined, void 0]), "[null,null]");
    });

    it("should parse value of null in any context as expected", () => {
        assert.strictEqual(FRON.parse('null'), null);
        assert.deepStrictEqual(FRON.parse('[null]'), [null]);
        assert.deepStrictEqual(FRON.parse('{foo:null}'), { foo: null });
    });
});

after("Speed Comparison", (done) => {
    __awaiter(void 0, null, void 0, function* () {
        var jsonStr = fs.readFileSync(__dirname + "/../package.json", "utf8");

        console.time("JSON.parse");
        var data = JSON.parse(jsonStr);
        console.timeEnd("JSON.parse");

        console.time("FRON.parse");
        FRON.parse(jsonStr);
        console.timeEnd("FRON.parse");

        console.time("FRON.parseAsync");
        yield FRON.parse(jsonStr);
        console.timeEnd("FRON.parseAsync");

        console.time("JSON.stringify");
        JSON.stringify(data, null, "  ");
        console.timeEnd("JSON.stringify");

        console.time("FRON.stringify");
        FRON.stringify(data, true);
        console.timeEnd("FRON.stringify");

        console.time("FRON.stringifyAsync");
        yield FRON.stringifyAsync(data, true);
        console.timeEnd("FRON.stringifyAsync");

        done();
    });
});