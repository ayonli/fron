# Feature-Rich Object Notation (proposal)

JSON, even BSON, only supports a few types of objects. FRON (`/frʌn/`), is meant
to support as many types as it can, and be feature-rich, especially for data 
transmission scenarios like IPC, RPC, and data storage, to bring the closest 
experience on both I/O sides.

*FRON adopts basic JSON style, and is compatible with JSON data.*

Currently these types in NodeJS are considered:

- `Array`
- `Boolean`
- `Buffer`
- `Comment` JavaScript style comments `//` and `/* */`.
- `Date`
- `Error`
- `Map`
- `Null`
- `Number`
- `Object`
- `RegExp`
- `Set`
- `String` Supports multi-line strings via using backquotes as ES2015 suggested.
- `Symbol` Only supports symbols registered via `Symbol.for()`.
- `Unknown` Represents the **received** type is not valid on the platform, only 
    for parsing phase, when stringifying, data of unknown types are treated as
    `Object`s.

*If there are versions for other platforms, they may not include all these types*
*or presented in different forms. That said, those implementations should be*
*look-like the NodeJS version as much as they can and transfer these types to*
*platform alternatives instead.*

Each of these types produces strings like the following examples:

```javascript
// Array
["Hello", "World!"]

// Boolean
true
false

// Buffer
Buffer([1, 2, 3, 4])
Buffer([0x01, 0x02, 0x03, 0x04])

// Comment
// inline comment
/* inline comment */
/*
comment
in
multiple
lines
*/

// Date
Date("2018-12-10T03:21:29.015Z")

// Error
Error({ name: "Error", message: "something went wrong", stack: ... })

// Map
Map([["key1", "value1"], ["key2", "value2"]])

// Null
null

// Number
12345
1e+32
NaN
Infinity

// Object
{ hello: "world", "key with quotes": 12345 }

// RegExp
/[a-zA-Z0-9]/i

// Set
Set([1, 2, 3, 4])

// String
'single-quoted string'
"double-quoted string"
`string
in
multiple
lines`

// Symbol
Symbol("description")
```

## API

### Stringify

```typescript
FRON.stringify(data: any, pretty?: boolean | string): string
FRON.stringifyAsync(data: any, pretty?: boolean | string): Promise<string>
```

Serializes the given `data` to a FRON string. The optional `pretty` argument is 
for generating well-formatted outlook, if set `true`, then use default indent 
with two spaces, otherwise set a customized string of spaces for preferred 
indentation. By default, stringified data will not contain any meaningless 
spaces, however when `pretty` is set, the result string will be well-structed 
with additional spaces.

### Parse

```typescript
FRON.parse(data: string, parseUnknown?: boolean): any
FRON.parseAsync(data: string, parseUnknown?: boolean): Promise<any>
```

Parses the serialized FRON string to JavaScript object. By default, unknown data
will not be parsed, unless setting `parseUnknown` option, the parser will ignore
the type notation and parse the data according to the closest type, if no type 
suitable, the result will be `null`.

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
FRON.register<T>(constructor: new (...args) => T)
FRON.register<T>(type: string, prototype: { toFRON(): any, fromFRON(data: any): T })
FRON.register(type: string, aliasOf: string)
```

Registers a customized data type so that the stringifier and parser can identify
it.

#### Example of Register Type

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
// is equivalent to
FROM.register(Exception.name, Exception.prototype);

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

**NOTE:** `Exception({ code: 1001, message: "something went wrong" })` only 
indicates type `Exception` contains data 
`{ code: 1001, message: "something went wrong" }`, it doesn't mean that the
constructor takes the data as its argument.

The third signature `FRON.register<T>(type: string, aliasOf: string)` allows 
user assigning a new type as alias to an existing type, this is very useful when
a different implementation uses a different name of type that based on that 
platform but can be handled with an existing approach. Typically, `Uint8Array` 
is considered as an alias of `Buffer` in NodeJS.

```javascript
FRON.register("Unit8Array", "Buffer");
```

The when the browser sends binary data with type `Uint8Array`, the NodeJS end 
can parse it to `Buffer` instance.