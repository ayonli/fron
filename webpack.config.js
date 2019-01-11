module.exports = {
    mode: "production",
    entry: "./src/index.ts",
    devtool: "source-map",
    target: "node",
    node: {
        process: false
    },
    output: {
        filename: "fron.min.js",
        library: "FRON",
        libraryTarget: "umd",
        globalObject: "this",
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts?$/, loader: "ts-loader" }
        ]
    }
};