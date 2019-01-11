# Feature-Rich Object Notation (progressing)

JSON, even BSON, only supports a few types of objects. FRON (`/frʌn/`), on the 
other hand, is meant to support as many types as it can, and be feature-rich, 
especially for data transmission scenarios like IPC, RPC, and data storage, to 
bring the closest experience on both I/O ends.

*FRON adopts basic JSON style, and is compatible with JSON/BSON/JSONC* 
*<small>(JSON with comments)</small> data.*

Currently these types in JavaScript are considered:

- `Array` Only literal in case of conflict.
- `Boolean` Both literal and compound type.
- `comment` JavaScript style comments `//` and `/* */`.
- `Date`
- `Error` As well as well other built-in errors.
- `Map`
- `null`
- `Number` Both literal and compound type.
- `Object` Only literal in case of conflict.
- `RegExp` Both literal and compound type (the compound notation is different 
    than the constructor, e.g. `RegExp({ source:"[a-z]", flags: "i" })`).
- `Set`
- `String` Both literal and compound type, and supports multi-line strings via 
    using backquotes as ES2015 suggested.
- `Symbol` Only supports symbols registered via `Symbol.for()`.
- `TypedArray` includes all typed arrays such as `Int8Array`, `Uint8Array`, etc.

There are also some special notations that used internally to support more 
complicated scenarios.

- `Reference` References to one of the nodes of the object, regardless of 
    circulation.

While in NodeJS, these types are also pre-registered for support.

- `Buffer`
- `AssertionError`

*If there are versions for other platforms, they may not include all these types*
*or presented in different forms. That said, those implementations should be*
*look-like the JavaScript version as much as they can and translate these types*
*to platform alternatives instead.*

Each of these types are translated to string notations (with the same JavaScript
syntax) like the following examples:

```javascript
/************************ Literal Types *************************/

// String
'single-quoted string'
"double-quoted string"
`string
in
multiple
lines`

// number
12345
1e+32
NaN
Infinity

// boolean
true
false

// RegExp
/[a-zA-Z0-9]/i

// null
null

// Comment
// single-line comment
/* inline comment */
/*
comment
in
multiple
lines
*/

/************************ Compound Types *************************/

// Techniquely, Object and Array are compound types.
// Object
{ hello: "world", "key with quotes": 12345 }

// Array
["Hello", "World!"]

// Date
Date("2018-12-10T03:21:29.015Z")

// Error
Error({ name: "Error", message: "something went wrong", stack: ... })

// Map
Map([["key1", "value1"], ["key2", "value2"]])

// Set
Set([1, 2, 3, 4])

// Symbol
Symbol("description")

// RegExp
RegExp({ source: "[a-zA-Z0-9]", flags: "i" })

// Reference
Reference("") // circular reference to the root object.
Reference("abc")
Reference("abc.def")
Reference("abc['d e f']")

// TypedArray
Int8Array([1, 2, 3, 4])
Int16Array([1, 2, 3, 4])
Int32Array([1, 2, 3, 4])
Uint8Array([1, 2, 3, 4])
Uint16Array([1, 2, 3, 4])
Uint32Array([1, 2, 3, 4])
```

## API

### Stringifier

```typescript
function stringify(data: any, pretty?: boolean | string): string
```

Serializes the given `data` to a FRON string. The optional `pretty` argument is 
for generating well-formatted outlook, if set `true`, then use default indent 
with two spaces, otherwise set a customized string of spaces for preferred 
indentation. By default, stringified data will not contain any meaningless 
spaces, however when `pretty` is set, the result string will be well-constructed
with additional spaces.

### Parser

```typescript
function parse(data: string, filename?: string): any
```

Parses the given FRON string to JavaScript object. By default, if meets 
unknown types, the parser will ignore the type notation and parse the data 
according to the closest type. When parsing data from a file, given the 
`filename` to the  parser, so that if the parser throws syntax error, it could 
address the position properly. The default value is `<anonymous>`.

#### Example of Unknown Type

```javascript
var fronStr = `
{
    someData: Exception({ code: 1001, message: "something went wrong" })
}
`;
var data = FRON.parse(fronStr, true);

console.log(data);
// {
//   someData: {
//     code: 1001,
//     message: "something went wrong"
//   }
// }
```

### Register

```typescript
function register<T>(
    type: string | FRONConstructor<T> | (new (...args: any[]) => any),
    proto?: string | FRONConstructor<T> | FRONEntry<T>
): void
```

Registers a customized data type so that the stringifier and parser can identify
it.

#### Examples

```typescript
// Register a constructor with `toFRON` and `fromFRON` methods.
register(User);

// Register a constructor and merger a customized prototype.
register(Date, { toFRON() { ... }, fromFRON() { ... } });

// Register a non-constructor type with a customized prototype.
register("Article", { toFRON() { ... }, fromFRON() { ... } });

// Four ways to register an alias type.
// NOTE: the former two will use the constructor `Student`
// to create instance when parsing, but the last two will
// use `User` since "Student" is not a constructor. However,
// they all use the name "Student" as notation.
register(Student, User);
register(Student, "User");
register("Student", User);
register("Student", "User");
```

#### Example of Type Exception

```typescript
class Exception {
    code: number;
    message: string;

    toFRON(): { [key in this]: any } {
        return Object.assign({}, this};
    }

    fromFRON(data: { [key in this]: any }): Exception {
        return Object.assign(new Exception(), data));
    }
}

FRON.register(Exception);

// now the previous FRON string can be parsed correctly
var fronStr = `
{
    someData: Exception({ code: 1001, message: "something went wrong" })
}
`;

var data = FRON.parse(fronStr);

console.log(data);
// {
//   someData: Exception {
//     code: 1001,
//     message: "something went wrong"
//   }
// }
```

**NOTE:** Syntax `Exception({ code: 1001, message: "something went wrong" })` 
only indicates type `Exception` contains data 
`{ code: 1001, message: "something went wrong" }`, it doesn't mean that the
constructor takes the data as its argument.

The function allows the user assigning a new type as alias to an existing type, 
this is very useful when a different implementation uses a different name of 
type that based on that platform but can be handled with an existing approach. 
Typically, `Buffer` is compatible with `Uint8Array` in NodeJS.

```typescript
FRON.register("Buffer", "Uint8Array");
```

Now NodeJS applications can transfer buffers into FRON notations and the browser
can parse `Buffer` notations into `Uint8Array`s.

However when parse the data in NodeJS, the data will be parsed as Uint8Array as 
well, instead of Buffer as expected. So it's better to using the following 
register method for NodeJS.

```typescript
// You don't actually have to do this, the toolkit have already done it.
FRON.register(Buffer, "Uint8Array");
```

Since Buffer is a constructor, the parser can use it to create expected instance.

For more programmatic APIs, please check [API Reference](./api.md).

## TIP

Although FRON is way more feature-rich than JSON, however, this implementation 
is written in TypeScript/JavaScript, which is much more slower than the native 
JSON support in parsing phase, when using it, you have to be very careful for 
the scenarios you meet.