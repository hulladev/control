import type { ErrBaseResult, OkBaseResult } from './types.private';

/** A successful result. Default tags match the runtime lowercase values. */
export type Ok<T, Tag extends string = 'ok'> = OkBaseResult<T, Tag> & {
  value: T;
  tag: Tag;
};

/** A failed result. Errors may be any value, including domain error objects. */
export type Err<E, Tag extends string = 'error'> = ErrBaseResult<E, Tag> & {
  error: E;
  tag: Tag;
};

/** Success and failure are distinguished by their branch, even if payload types overlap. */
export type Result<T, E, TagOk extends string = 'ok', TagError extends string = 'error'> =
  Ok<T, TagOk> | Err<E, TagError>;

/** Replace a result's tag while preserving its type guards. */
export type Tagged<T, Tag extends string> =
  T extends Ok<infer U, string> ? Ok<U, Tag> : T extends Err<infer E, string> ? Err<E, Tag> : never;
