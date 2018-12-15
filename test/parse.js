const fs = require("fs");
const { parse } = require("../dist/parse");

var filename = __dirname + "/test.fron";
var fron = fs.readFileSync(filename, "utf8");

console.log(parse(fron, filename));