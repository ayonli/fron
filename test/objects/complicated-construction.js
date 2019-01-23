{
    "12": 12,
    "hello world!": "Hello,\tWorld!",
    hi: [
        "Hello, World!",
        "Hi, FRON"
    ],
    date: Date("2019-01-11T06:23:54.059Z"),
    re: /\\[a-z]/i,
    num: 12345,
    num2: Number(12345),
    err: TypeError({
        name: "TypeError",
        message: "something went wrong",
        stack: "TypeError: something went wrong\\n    at Object.<anonymous> (I:\\git\\fron\\test\\common.js:30:24)\\n    at Module._compile (module.js:652:30)\\n    at Object.Module._extensions..js (module.js:663:10)\\n    at Module.load (module.js:565:32)\\n    at tryModuleLoad (module.js:505:12)\\n    at Function.Module._load (module.js:497:3)\\n    at Module.require (module.js:596:17)\\n    at require (internal/module.js:11:18)\\n    at Object.<anonymous> (I:\\git\\fron\\test\\stringify.js:1:24)\\n    at Module._compile (module.js:652:30)",
        code: 500
    }),
    bool: true,
    bool2: Boolean(false),
    map: Map([
        [
            "a",
            1
        ],
        [
            "b",
            2
        ]
    ]),
    set: Set([
        "a",
        "b"
    ]),
    nul: null,
    symbol: Symbol("hello"),
    buf: Uint8Array([
        104,
        101,
        108,
        108,
        111,
        44,
        32,
        119,
        111,
        114,
        108,
        100,
        33
    ]),
    obj: {
        hello: "world!",
        ha: {
            ha: Reference("")
        },
        "ha ha": Reference("obj"),
        "ha ha ha": {
            depth: {
                cir: Reference("obj['ha ha ha']")
            }
        }
    },
    arr: [],
    obj2: Reference(""),
    obj3: {
        name: "Ayonium"
    }
}