# @hulla/control

A TypeScript library for functional error handling using the Result pattern. This library provides a robust and type-safe way to handle errors without throwing exceptions, making error handling more predictable and easier to reason about.

## Features

- 🎯 Type-safe error handling with `Result<T, E>` type
- 🔄 Functional approach with pattern matching
- ⚡ Support for both synchronous and asynchronous operations
- 🏷️ Custom tagging for better error categorization
- 🔍 Comprehensive TypeScript type definitions
- 🧪 Well-tested and production-ready

## Installation

### Node.js

```bash
# Using npm
npm install @hulla/control

# Using yarn
yarn add @hulla/control

# Using pnpm
pnpm add @hulla/control

# Using bun
bun add @hulla/control
```

### Deno

```typescript
import { ok, err, type Result } from "npm:@hulla/control"
```

Or add it to your `deno.json`:

```json
{
  "imports": {
    "@hulla/control": "npm:@hulla/control"
  }
}
```

## Usage

### Basic Usage

```typescript
import { ok, err, type Result } from '@hulla/control'

interface User {
  id: string
  name: string
  email: string
}

async function fetchUser(id: string): Promise<Result<User, Error>> {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) {
      return err(new Error(`Failed to fetch user: ${response.statusText}`))
    } 
    
    const user = await response.json()
    return ok(user)
  } catch (error) {
    return err(new Error(`Network error: ${error.message}`))
  }
}

const userResult = await fetchUser("123") // Ok<User> | Err<Error>

// Type safe handling
if (userResult.isOk()) {
  const user = userResult.value
  console.log(`User ${user.name}, ${user.email}`)
} else {
  // Can also use isErr instead of isOk
  console.error(userResult.error.message)
}

// Use result pattern matching (rust-like) 🦀
userResult.match(
  user => console.log(`User ${user.name}, ${user.email}`)
  error => console.error(error.message)
)

// Or pair handling (go-like) 🦫🌀
const [user, error] = userResult.pair()
if (error) // ...
if (user) // ...
```

### Handling error-prone functions/values

> Not sure about an external library potentially throwing an error you have no control over?

### Using `tcf` - typed version of Try-Catch-Finally

```typescript
import { tcf } from '@hulla/control'
import { doSomething } form 'some-external-library'

async function safeDoSomething(path: string) {
  return tcf({
    try: () => {
      return doSomething(path) // -> string
    },
    // can also be a other (custom) error type instead of just Error
    catch: (error: Error) => new Error( // must return an error
      `Failed to read ${path}: ${error.message}`
    ),
    finally: () => console.log('File operation completed') // optional
  })
}

const result = safeDoSomething('package.json') // Ok<string> | Err<Error>

// Rest of error/value handling like in the example above ^
```

### Using `result`

Alternatively, if you know the code and know it will only return error/value type, i.e. `string | Error` you can use `result` to conver it to `Ok<string> | Err<Error>` type.

```typescript
import { result } from '@hulla/control'

const valueOrError = doSomething() // string | Error
const converted = result(valueOrError) // Ok<string> | Err<Error>
```


### Async Operations

```typescript
const asyncResult = ok(Promise.resolve(42))

// Pattern matching preserves Promise
const doubled = await asyncResult.match(
  async value => value * 2,
  error => 0
)

// Pair method also handles Promises
const [value, error] = await asyncResult.pair()
```

### Result Tagging

Tagging allows you to add semantic meaning to your results, making it easier to categorize and handle different types of successes and errors. This is particularly useful when you need to:

1. Distinguish between different types of errors (e.g., validation, network, auth)
2. Categorize successful operations (e.g., created, updated, cached)
3. Build type-safe error handling flows

```typescript
import { ok, err, tcf, type Result } from '@hulla/control'

// Basic tagging
const success = ok("Data loaded", "FETCH_SUCCESS")
const failure = err(new Error("Network error"), "NETWORK_ERROR")

// Tagged results in functions
function validateUser(data: unknown): Result<User, Error> {
  return tcf({
    try: () => {
      if (!data.name) throw new Error("Name required")
      return data as User
    },
    catch: (error: Error) => error,
    tagOk: "VALIDATION_SUCCESS",
    tagError: "VALIDATION_ERROR"
  })
}

// Type-safe handling based on tags
const result = validateUser(data)
if (result.isErr() && result.tag === "VALIDATION_ERROR") {
  // Handle validation errors specifically
  showValidationError(result.error)
}

// Tagging with tcf wrapper
function fetchUserData(id: string) {
  return tcf({
    try: () => api.getUser(id),
    catch: (error: Error) => error,
    tagOk: "USER_FOUND",
    tagError: "USER_NOT_FOUND",
    finally: () => console.log("Fetch completed")
  })
}

// Pattern matching with tagged results
const userResult = await fetchUserData("123")
userResult.match(
  user => {
    if (userResult.tag === "USER_FOUND") {
      updateUI(user)
    }
    // ...
  },
  error => {
    if (userResult.tag === "USER_NOT_FOUND") {
      showNotFoundError()
    }
    // ....
  }
)
```

## API Reference

### Types

- `Result<T, E>` - Main result type that can be either `Ok<T>` or `Err<E>`
- `Ok<T>` - Success type containing a value of type `T`
- `Err<E>` - Error type containing an error of type `E`
- `Tagged<T, Tag>` - Result type with custom string tag

### Functions

- `ok<T>(value: T): Ok<T>` - Create a success result
- `err<E>(error: E): Err<E>` - Create an error result
- `tcf(options)` - Functional try-catch-finally wrapper
- `result(value, config?)` - Create a Result from a value that might be an error

### Methods

Each Result instance provides:

- `isOk()` - Type guard for success case
- `isErr()` - Type guard for error case
- `match(okFn, errFn)` - Pattern matching
- `pair()` - Convert to [value, error] tuple
- `unwrap()` - Get raw value/error

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Samuel Hulla ([@samuelhulla](https://github.com/hulladev))

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.