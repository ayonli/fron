const fs = require("fs");
const path = require("path");

var folders = fs.readdirSync(__dirname);

for (let folder of folders) {
    let filename = path.resolve(__dirname, folder);
    let stat = fs.statSync(filename);

    if (stat.isDirectory()) {
        require(filename);
    }
}