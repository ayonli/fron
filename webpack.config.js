module.exports = {
    mode: "production",
    entry: "./src/index.ts",
    devtool: "source-map",
    target: "node",
    node: {
        process: false
    },
    output: {
        path: __dirname + "/bundle",
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
            {
                test: /\.ts?$/,
                loader: "ts-loader",
                options: {
                    configFile: __dirname + "/webpack-tsconfig.json"
                }
            }
        ]
    }
};