const fs = require("fs");
const path = require("path");

var folders = fs.readdirSync(path.resolve(__dirname, "data"));

for (let folder of folders) {
    let filename = path.resolve(__dirname, "data", folder);
    let stat = fs.statSync(filename);

    if (stat.isDirectory()) {
        require(filename);
    }
}