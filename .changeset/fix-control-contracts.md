---
'@hulla/control': minor
---

Make tcf handle both synchronous and asynchronous callbacks, catching promise rejections and awaiting cleanup. Async callers must now await tcf before accessing result methods instead of receiving a wrapped promise payload.

Correct default and custom tag types, allow overlapping Result payload types, exclude errors from result success types, preserve empty tags, and resolve thenables and cross-realm promises in match/pair.

Add chainable map and mapErr methods that preserve tags, skip the inactive branch, and support promise payloads and asynchronous mappers.
