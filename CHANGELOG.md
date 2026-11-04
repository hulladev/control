# @hulla/control

## 0.1.0

### Minor Changes

- 3378eb9: Make tcf handle both synchronous and asynchronous callbacks, catching promise rejections and awaiting cleanup. Async callers must now await tcf before accessing result methods instead of receiving a wrapped promise payload.

  Correct default and custom tag types, allow overlapping Result payload types, exclude errors from result success types, preserve empty tags, and resolve thenables and cross-realm promises in match/pair.

  Add chainable map and mapErr methods that preserve tags, skip the inactive branch, and support promise payloads and asynchronous mappers.

## 0.0.3

### Patch Changes

- resolve node module path

## 0.0.2

### Patch Changes

- const type inference for values and errors

## 0.0.1

### Patch Changes

- result function + export

## 0.0.1

### Patch Changes

- v0 release
