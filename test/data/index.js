const fs = require("fs");
const path = require("path");

/**
 * @param {string} name 
 */
function filename(name) {
    let ext = path.extname(name);
    let basename = path.basename(name, ext);

    if (["js", ".json", ".fron", ".bson"].includes(ext) === false) {
        ext = ".js";
    }

    return basename + ext;
}

/**
 * @param {string} name 
 */
function getData(name) {
    /** @type {string} */
    let data;
    try {
        data = fs.readFileSync(__dirname + "/" + filename(name), { encoding: "utf8" });
    } finally {
        return data;
    };
}

/**
 * @param {string} name 
 * @param {string} data 
 */
function setData(name, data) {
    let result = false;
    try {
        fs.writeFileSync(__dirname + "/" + filename(name), data, { encoding: "utf8" });
        result = true;
    } finally {
        return result;
    }
}

exports.getData = getData;
exports.setData = setData;