const { User, data } = require("./common");
const { stringify } = require("..");
const fs = require("fs");

let fron = JSON.stringify(data, null, "    ");
fs.writeFileSync(__dirname + "/test.fron", fron, "utf8");