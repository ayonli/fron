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

// Technically, Object and Array are compound types.
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