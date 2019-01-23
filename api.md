# API Reference

## register

```typescript
function register(
    type: string | FRONConstructor | (new (...args: any[]) => any),
    proto?: string | FRONConstructor | FRONEntry
): void
```

Registers a customized data type so that the stringifier and parser can identify
it.

## Examples

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

## registerNS

```typescript
function registerNS(nsp: string): (ctor: FRONConstructor) => void
```

A decorator used to register a type (class constructor) with a specified 
namespace.

**NOTE:** `register` can be used as a decorator as well.

## stringify

```typescript
function stringify(data: any, pretty?: boolean | string): string
```

Stringifies the given data into a FRON string.

- `pretty` The default indentation is two spaces, other than that, set any 
    strings for indentation is allowed.

## parse

```typescript
function parse(str: string, filename?: string): any
```

Parses the given FRON string to JavaScript object.

- `filename` When parsing data from a file, given that filename to the parser, 
    so that if the parser throws syntax error, it could address the position 
    properly. The default value is `<anonymous>`.

## parseToken

```typescript
function parseToken(
    str: string,
    filename?: string,
    listener?: (token: SourceToken) => void
): SourceToken<"root">
```

Parses the given FRON string into a well-constructed token tree.

- `filename` When parsing data from a file, given that filename to the parser, 
    so that if the parser throws syntax error, it could address the position 
    properly. The default value is `<anonymous>`.
- `listener` If set, it will be called when parsing every token in the FRON 
    string, and be helpful for programmatic usage.

## composeToken

```typescript
function composeToken(token: SourceToken): any
```

Composes a token or token tree to a JavaScript object.

## SourceToken

```typescript
interface SourceToken<T extends string = string> {
    filename: string;
    position: {
        start: {
            line: number,
            column: number
        };
        end: {
            line: number,
            column: number
        };
    };
    type: T;
    data: any;
    parent?: SourceToken;
    path?: string;
    comments?: SourceToken<"comment">[];
}
```

The interface that carries token details in the FRON string (source).

- `filename` The filename that parsed to the parser, if no filename is parsed, 
    the default value will be `<anonymous>`.
- `position` The appearing position of the current token, includes both start 
    and end positions.
- `type` The type of the current token, by default, literal types are 
    lower-cased and compound types are upper-cased. For convenience, every 
    SourceToken parsed is carried inside the `root` token.
- `data` The parsed data of the current token, it may not be the final data 
    since there may be a handler to deal with the current type. If the current
    token is an object property, the `data` will be an inner SourceToken.
- `parent` The token of the parent node.
- `path` The path of the current token, only for object properties and array 
    elements.
- `comments` All the comments in the current token. When parsing a comment token,
    it will be appended to the closest parent node. Comments are not important 
    to the parser and will be skipped when composing data.

## FRONEntry

```typescript
interface FRONEntry {
    toFRON(): any;
    fromFRON(data: any): any;
}
```

The interface restricts if a user defined type can be registered as FRON type.

## FRONConstructor

```typescript
type FRONConstructor = new (...args: any[]) => FRONEntry
```

Indicates a class constructor that implements the FRONEntry interface.

## FRONEntryBase

```typescript
class FRONEntryBase: FRONConstructor
```

When register a type with an object as its prototype, a new sub-class will be 
created to extend FRONEntryBase and merge the object to its prototype. In the 
parsing phase, a FRONEntryBase instance will be created via `Object.create()` 
and apply the `fromFRON()` method to it.

## FRONString

```typescript
class FRONString extends String { }
```

A special type used to mark up user defined FRON notations, if a `toFRON()`
method return a `FRONString`, them it will not be stringified again with common 
approach, just use the represented value as the output notation. 
NOTE: the personalized notation must use valid syntax that can be identified by 
the parser, it is either a literal, or a compound type.

## getType

```typescript
function getType(data: any): string
```

Gets the type name in string of the input data, may return a literal type 
or a compound type.

## getInstance

```typescript
function getInstance<T = any>(type: string | (new (...args: any[]) => T)): T
```

Gets an instance of the given type, may return undefined if the type isn't 
registered, this function calls `Object.create()` to create instance, so the
constructor will not be called automatically.

NOTE: This function may return `undefined` if the given type isn't registered.

## throwSyntaxError

```typescript
function throwSyntaxError(token: SourceToken, char?: string): never
```

Throws syntax error when the current token is invalid and terminate the parser 
immediately.

NOTE: This is function is used when implementing a new parser.