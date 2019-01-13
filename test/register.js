const assert = require("assert");
const pick = require("lodash/pick");
const { register, getInstance, stringify, parse, FRONEntryBase } = require("..");

describe("Register", () => {
    it("should register a class constructor as expected", () => {
        class User {
            constructor(data) {
                Object.assign(this, data);
            }

            toFRON() {
                return pick(this, ["name", "age"]);
            }

            fromFRON(data) {
                return new User(data);
            }
        }

        register(User);

        let fronStr = stringify(new User({ name: "Ayon Lee", age: 23 }));
        let user = parse(fronStr);

        assert.ok(getInstance(User) instanceof User);
        assert.equal(fronStr, 'User({name:"Ayon Lee",age:23})');
        assert.ok(user instanceof User);
        assert.deepStrictEqual(Object.assign({}, user), { name: "Ayon Lee", age: 23 });
    });

    it("should throw an error if the class constructor does't fulfill the requirement", () => {
        class User {
            constructor(data) {
                Object.assign(this, data);
            }
        }

        let err = null;

        try {
            register(User);
        } catch (e) {
            err = e;
        } finally {
            assert.ok(err instanceof Error);
        }

        class Member {
            fromFRON() { }
        }

        try {
            register(Member);
        } catch (e) {
            err = e;
        } finally {
            assert.ok(err instanceof Error);
        }
    });

    it("should register a class constructor with customized prototype", () => {
        class User {
            constructor(data) {
                Object.assign(this, data);
            }
        }
        
        register(User, {
            toFRON() {
                return pick(this, ["name", "age"]);
            },
            fromFRON(data) {
                return new User(data);
            }
        });

        let fronStr = stringify(new User({ name: "Ayon Lee", age: 23 }));
        let user = parse(fronStr);

        assert.ok(getInstance(User) instanceof User);
        assert.equal(fronStr, 'User({name:"Ayon Lee",age:23})');
        assert.ok(user instanceof User);
        assert.deepStrictEqual(Object.assign({}, user), { name: "Ayon Lee", age: 23 });
    });

    it("should throw an error if the customized prototype does't fulfill the requirement", () => {
        class User {
            constructor(data) {
                Object.assign(this, data);
            }
        }

        let err = null;

        try {
            register(User, {});
        } catch (e) {
            err = e;
        } finally {
            assert.ok(err instanceof Error);
        }

        try {
            register(User, {
                fromFRON() {}
            });
        } catch (e) {
            err = e;
        } finally {
            assert.ok(err instanceof Error);
        }
    });

    it("should register a class constructor as an alias to an existing type", () => {        
        class ISODate {
            constructor(ISOStr) {
                this.date = new Date(ISOStr);
            }

            toISOString() {
                return this.date.toISOString();
            }
        }
        
        register(ISODate, Date.name);

        let str = new Date().toISOString();
        let fronStr = stringify(new ISODate(str));
        let date = parse(fronStr);

        assert.ok(getInstance(ISODate) instanceof ISODate);
        assert.equal(fronStr, 'ISODate("' + str + '")');
        assert.ok(date instanceof ISODate);
        assert.deepStrictEqual(date.toISOString(), str);
    });

    it("should register a class constructor as an alias to another class", () => {
        class User {
            constructor(data) {
                Object.assign(this, data);
            }

            toFRON() {
                return pick(this, ["name", "age"]);
            }

            fromFRON(data) {
                return new this.constructor(data);
            }
        }

        class Member {
            constructor(data) {
                Object.assign(this, data);
            }
        }

        register(User);
        register(Member, User);

        let data = { name: "Ayon Lee", age: 23 };
        let fronStr = stringify(new Member(data));
        let member = parse(fronStr);
        
        assert.ok(getInstance(Member) instanceof Member);
        assert.equal(fronStr, "Member({name:\"Ayon Lee\",age:23})");
        assert.ok(member instanceof Member);
        assert.deepStrictEqual(Object.assign({}, member), data);
    });

    it("should register a type with string name instead of class constructor", () => {
        class Animal {
            constructor(data) {
                Object.assign(this, data);
            }
        }

        register("Animal", {
            toFRON() {
                return Object.assign({}, this);
            },
            fromFRON(data) {
                return new Animal(data);
            }
        });

        let data = { name: "Cat", age: 1 };
        let fronStr = "Animal({name:\"Cat\",age:1})";
        let cat = parse(fronStr);

        assert.ok(getInstance("Animal") instanceof FRONEntryBase);
        assert.equal(stringify(new Animal(data)), fronStr);
        assert.ok(cat instanceof Animal);
        assert.deepStrictEqual(Object.assign({}, cat), data);
    });
});
