const { User, data } = require("./common");
const { stringify } = require("..");
const fs = require("fs");

let fron = stringify(data, "    ");
fs.writeFileSync(__dirname + "/test.fron", fron, "utf8");