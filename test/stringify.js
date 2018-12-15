const { stringify } = require("../dist/stringify");
const { register } = require("../dist/index");
const fs = require("fs");

class User {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    toFRON() {
        return Object.assign({}, this);
    }
}

register(User);

var data = {
    "hello world!": "Hello,\tWorld!",
    hi: ["Hello, World!", "Hi, FRON"],
    date: new Date(),
    re: new RegExp("\\\\[a-z]", 'i'),
    num: 12345,
    num2: new Number(12345),
    err: Object.assign(new TypeError("something went wrong"), { code: 500 }),
    bool: true,
    bool2: new Boolean(false),
    map: new Map([["a", 1], ["b", 2]]),
    set: new Set(["a", "b"]),
    nul: null,
    symbol: Symbol.for("hello"),
    fn: () => { },
    buf: Buffer.from("hello, world!"),
    obj: { hello: "world!" },
    arr: [],
    obj2: {},
    user: new User("Ayon Lee", 23)
};
data["obj2"] = data;
data.obj["ha"] = {};
data.obj["ha"]["ha"] = data;
data.obj["ha ha"] = data.obj;
data.obj["ha ha ha"] = {};
data.obj["ha ha ha"]["depth"] = {
    cir: data.obj["ha ha ha"]
};

let fron = stringify(data, "    ");
fs.writeFileSync(__dirname + "/test.fron", fron, "utf8");