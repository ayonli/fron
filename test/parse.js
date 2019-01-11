const { data } = require("./common");
const assert = require("assert");
const fs = require("fs");
const { parseToken, composeToken } = require("../dist/parse");
const { stringify } = require("../dist/stringify");

var filename = __dirname + "/test.fron";
var fron = fs.readFileSync(filename, "utf8");
var token = parseToken(fron, filename, token => {
    console.log(token.type);
});

console.log(composeToken(token));

// console.log(result.obj["ha ha ha"]["depth"].cir === result.obj["ha ha ha"]);

// assert.deepStrictEqual(result, data);
