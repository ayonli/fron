const fs = require("fs");
const path = require("path");
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