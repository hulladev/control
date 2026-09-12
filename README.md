# @hulla/control

A small TypeScript library for functional error handling with success and error results.

```sh
pnpm add @hulla/control
```

Also available through npm, Yarn, Bun, and Deno's `npm:@hulla/control` imports.

## Basic usage

```typescript
import { err, ok, type Result } from '@hulla/control';

interface User {
  id: string;
  name: string;
  age: number;
}

function checkAge(user: User): Result<User, Error> {
  if (user.age < 18) {
    return err(new Error('You must be at least 18 to enter'));
  }
  return ok(user);
}

const checked = checkAge({ id: '1', name: 'Sam', age: 20 });
if (checked.isOk()) {
  console.log(checked.value.name);
} else {
  console.error(checked.error.message);
}

const message = checked.match(
  (user) => `Welcome, ${user.name}`,
  (error) => error.message,
);
```

`isOk()` and `isErr()` narrow the result. The default tags are `'ok'` and `'error'`.
Success and error payloads may have overlapping types: `Result<string, string>` is valid.

## Try, catch, finally

`tcf()` accepts synchronous and asynchronous callbacks. Fully synchronous work returns a result immediately. A promise from `try`, `catch`, or `finally` is awaited before the returned promise settles. Cleanup runs once, after the operation and any error mapping complete.

```typescript
import { tcf } from '@hulla/control';

const parsed = tcf({
  try: (): unknown => JSON.parse('{"name":"Sam"}'),
  catch: (error) => new Error(`Invalid JSON: ${String(error)}`),
});
console.log(parsed.isOk()); // synchronous

const downloaded = await tcf({
  try: async () => {
    const response = await fetch('https://example.com/data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  },
  catch: (error) => (error instanceof Error ? error : new Error(String(error))),
  finally: () => console.log('Request completed'),
});

downloaded.match(
  (text) => console.log(text),
  (error) => console.error(error.message),
);
```

Catch input defaults to `unknown`, because JavaScript can throw any value. Narrow it before accessing error properties. Explicit catch parameter annotations remain supported when you know the throwing code's contract. The catch callback must return an `Error` (or a promise of one).

Errors thrown or rejected by `catch` and `finally` propagate to the caller, just as in native try/catch/finally. Cleanup errors override an earlier outcome. Use `await tcf(...)` whenever a callback can be asynchronous: a non-async function declared to return a promise can still throw synchronously, so the inferred type may include both a result and a promise.

### Migrating from 0.0.3

Previously, `tcf({ try: async ... })` returned `Ok<Promise<T>>`, missed rejections, and ran cleanup before the operation completed. Await `tcf(...)` before calling result methods now. Asynchronous catch and finally callbacks also require awaiting the call. Synchronous calls retain their immediate result shape.

The default tag types now match the existing runtime strings (`'ok'` / `'error'`), replacing the incorrect `'Ok'` / `'Err'` declarations.

## Convert a value or error

Use `result()` when a value is already available. By default it checks `instanceof Error` and excludes error types from the success branch.

```typescript
import { result } from '@hulla/control';

function convert(value: string | Error) {
  const converted = result(value);
  if (converted.isOk()) {
    console.log(converted.value.toUpperCase());
  }
  return converted;
}
```

A custom `isError` type guard can override detection. By default, errors from a different JavaScript realm are not detected by `instanceof Error`; supply an appropriate guard when needed. `result()` does not execute functions or catch rejected promises; use `tcf()` for that.

## Custom tags

```typescript
import { err, ok, type Result } from '@hulla/control';

function validateName(name: string): Result<string, Error, 'VALID', 'INVALID'> {
  return name ? ok(name, 'VALID') : err(new Error('Name required'), 'INVALID');
}

const checked = validateName('Sam');
if (checked.isErr()) {
  console.log(checked.tag); // 'INVALID'
  console.error(checked.error.message);
}
```

Both `tcf()` and `result()` accept `tagOk` and `tagError`. Empty string tags are preserved. `Tagged<Ok<T>, Tag>` and `Tagged<Err<E>, Tag>` are also available; their type guards retain custom tags.

## Transform results with map and mapErr

`map()` transforms the success value and leaves errors unchanged. `mapErr()` transforms the error and leaves successes unchanged. Both preserve the current tag. The inactive branch returns the same Result instance without invoking the callback.

```typescript
import { tcf } from '@hulla/control';

const displayName = tcf({
  try: () => ({ name: ' Sam ' }),
  catch: (error) => new Error(String(error)),
})
  .map((user) => user.name.trim())
  .mapErr((error) => `Cannot load user: ${error.message}`);
// Result<string, string>

displayName.match(
  (name) => console.log(name),
  (message) => console.error(message),
);
```

Mapping always returns a Result, so transformations remain chainable. Promise payloads are resolved before invoking the mapper, and asynchronous output stays inside the result:

```typescript
import { ok } from '@hulla/control';

const doubled = ok(Promise.resolve(20))
  .map((value) => Promise.resolve(value + 1))
  .map((value) => value * 2);
// Ok<Promise<number>>

const [value] = await doubled.pair(); // 42
```

`mapErr()` handles promise payloads the same way. Await `.pair()`, `.match(...)`, or the promise returned by `.unwrap()` to consume asynchronous output; awaiting the Result object itself does not resolve its payload.

As with `match()`, mapper exceptions and promise rejections propagate; they are not converted into an error result. Use `tcf()` when a transformation needs exception handling. Returning another Result from a mapper nests it as a payload (`Ok<Err<E>>`, for example); mapping does not switch or flatten branches.

## Promise payloads, pairs, and unwrap

`ok()` and `err()` wrap values without executing or catching anything. Their `match()` and `pair()` methods resolve promise-like payloads, including thenables and promises from other realms. Rejections propagate. `match()` returns the selected callback's output, flattening promises when the payload is asynchronous.

```typescript
import { ok } from '@hulla/control';

const wrapped = ok(Promise.resolve(42));
const doubled = await wrapped.match((value) => value * 2);
const [value, error] = await wrapped.pair(); // [42, undefined]
const originalPromise = wrapped.unwrap(); // unchanged Promise<number>
```

`pair()` returns `[value, undefined]` for success or `[undefined, error]` for failure. Use the result's type guards when payloads can themselves be `undefined` or falsy; tuple truthiness cannot reliably identify those branches.

`unwrap()` returns the contained value **or error** unchanged. It does not throw for an error result.

## API

| API                                                | Purpose                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| `ok(value, tag?)`                                  | Create a success result                                          |
| `err(error, tag?)`                                 | Create an error result with any payload                          |
| `result(value, config?)`                           | Classify an existing value with an error type guard              |
| `tcf({ try, catch, finally?, tagOk?, tagError? })` | Handle synchronous throws and asynchronous rejections            |
| `isOk()` / `isErr()`                               | Narrow to a branch                                               |
| `match(onOk, onErr)`                               | Transform the active branch; `onErr` is optional on a known `Ok` |
| `map(transform)`                                   | Transform success while preserving the Result and tag            |
| `mapErr(transform)`                                | Transform failure while preserving the Result and tag            |
| `pair()`                                           | Get a success/error tuple                                        |
| `unwrap()`                                         | Read the original payload                                        |

## Development

Use Node.js 22.13+ or 24 and pnpm 10.14.0 (pinned in `packageManager`).

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs TypeScript (including type assertions in tests), typed ESLint, Prettier, runtime tests, the build, and ESM/CommonJS package smoke tests. CI runs the same command on Node.js 22 and 24. Publishing runs the checks first.

- `pnpm test`: watch tests; `pnpm test:ui`: open the test UI.
- `pnpm format`: apply formatting; `pnpm lint:fix`: apply lint fixes.
- `pnpm commit`: use the existing emoji commit convention. The commit hook uses the installed, locked commitlint dependency.
- `pnpm changeset`: describe a release change; `pnpm version:packages`: apply changesets.

Formatting runs separately from linting. Generated bundles, coverage, and the lockfile are excluded from formatting; generated code is excluded from linting. ESLint uses the TypeScript project service for [typed linting](https://typescript-eslint.io/getting-started/typed-linting/).

## License

MIT — see [LICENSE](LICENSE).

Samuel Hulla ([@hulladev](https://github.com/hulladev)).
