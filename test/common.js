const { register } = require("../dist/index");

class User {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    toFRON() {
        return Object.assign({}, this);
    }

    fromFRON(data) {
        return new User(data.name, data.age);
    }
}
exports.User = User;

register(User);