const fs = require("fs");
const path = require("path");
const { stringify, parse } = require("..");

const INLINE_COMMENTS = /\s*\/\/.*\n*?/g;
const BLOCK_COMMENTS = /\s*\/\*[\s\S]*?\*\//g;

/**
 * @param {string} name 
 */
function filename(name) {
    let ext = path.extname(name);

    if (ext && [".js", ".json", ".fron", ".bson"].indexOf(ext) >= 0) {
        return name;
    } else {
        return name + ".js";
    }
}

/**
 * @param {string} name 
 * @param {string} [dirname]
 */
function getData(name, dirname) {
    /** @type {string} */
    let data;
    try {
        data = fs.readFileSync((dirname || __dirname) + "/" + filename(name), {
            encoding: "utf8"
        });
    } finally {
        return data;
    };
}

/**
 * @param {string} name 
 * @param {string} data 
 * @param {string} [dirname]
 */
function setData(name, data, dirname) {
    let result = false;
    try {
        fs.writeFileSync((dirname || __dirname) + "/" + filename(name), data, {
            encoding: "utf8"
        });
        result = true;
    } finally {
        return result;
    }
}

/**
 * @returns {(name: string) => string}
 */
exports.createGetter = function createGetter(dirname) {
    return name => getData(name, dirname);
};

/**
 * @returns {(name: string, data: string) => boolean}
 */
exports.createSetter = function createSetter(dirname) {
    return (name, data) => setData(name, data, dirname);
};

/**
 * @returns {(name: string, type?: Function) => any}
 */
exports.createRunner = function createRunner(dirname) {
    return (name, type) => {
        let code = getData(name, dirname)
            .replace(INLINE_COMMENTS, "")
            .replace(BLOCK_COMMENTS, "")
            .replace(/^\n/g, "");
        let notation = /([A-Z][a-zA-Z0-9]*)\([\s\S]+\)/;
        let matches;

        if ((matches = notation.exec(code))) {
            let name = matches[1];

            type = type || global[name];

            if (type instanceof Function && typeof type.from === "function") {
                code = `return ${name}.from` + code.slice(name.length);
            } else if (type instanceof Function && typeof type.for === "function") {
                code = `return ${name}.for` + code.slice(name.length);
            } else {
                code = "return new " + code;
            }

            if (type instanceof Function) {
                return (new Function(type.name, code))(type);
            } else {
                return (new Function(code))();
            }
        } else {
            code = "return " + code;
            return (new Function(code))();
        }
    };
};

/**
 * @returns {(fn: Function, name: string, type?: Function) => [any, any]}
 */
exports.createAssertions = function createAssertions(dirname) {
    let run = exports.createRunner(dirname);
    let get = exports.createGetter(dirname);

    return (fn, name, type) => {
        if (fn === stringify) {
            return [fn(run(name, type)), get(name)];
        } else if (fn === parse) {
            return [parse(get(name)), run(name, type)];
        } else {
            throw new TypeError("fn must be either stringify or parse");
        }
    };
};