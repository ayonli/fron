require("./common");
const fs = require("fs");
const { parseToken } = require("../dist/parse");

var filename = __dirname + "/test.fron";
var fron = fs.readFileSync(filename, "utf8");

console.log(parseToken(fron, filename));