import { type DEFAULT_TAG_ERROR, type DEFAULT_TAG_OK } from '@/lib/constants';
import { type ResultConfig } from '@/types.private';
import { type Err, type Ok, type Tagged } from '@/types.public';
import { err } from './err';
import { ok } from './ok';

const defaultIsError = <const T, E extends Error>(value: T | E): value is E =>
  value instanceof Error;

// Both tags provided
export function result<const T, E extends Error, TagError extends string, TagOk extends string>(
  value: T,
  config: ResultConfig<T, E, TagError, TagOk> & { tagError: TagError; tagOk: TagOk },
): Tagged<Ok<Exclude<T, E>>, TagOk> | Tagged<Err<E>, TagError>;

// No tags provided
export function result<const T, E extends Error>(
  value: T,
  config?: Omit<ResultConfig<T, E, string, string>, 'tagError' | 'tagOk'> & {
    tagOk?: never;
    tagError?: never;
  },
): Ok<Exclude<T, E>> | Err<E>;

// Only tagError provided
export function result<const T, E extends Error, TagError extends string>(
  value: T,
  config: Omit<ResultConfig<T, E, TagError, string>, 'tagOk'> & {
    tagError: TagError;
    tagOk?: never;
  },
): Ok<Exclude<T, E>> | Tagged<Err<E>, TagError>;

// Only tagOk provided
export function result<const T, E extends Error, TagOk extends string>(
  value: T,
  config: Omit<ResultConfig<T, E, string, TagOk>, 'tagError'> & { tagOk: TagOk; tagError?: never },
): Tagged<Ok<Exclude<T, E>>, TagOk> | Err<E>;

// Configuration objects with optional tags may use defaults at runtime.
export function result<const T, E extends Error, TagError extends string, TagOk extends string>(
  value: T,
  config: ResultConfig<T, E, TagError, TagOk>,
): Ok<Exclude<T, E>, TagOk | 'ok'> | Err<E, TagError | 'error'>;

// Implementation
export function result<
  const T,
  E extends Error,
  TagError extends string = typeof DEFAULT_TAG_ERROR,
  TagOk extends string = typeof DEFAULT_TAG_OK,
>(
  value: T,
  config?: ResultConfig<T, E, TagError, TagOk>,
): Ok<Exclude<T, E>> | Err<E> | Tagged<Ok<Exclude<T, E>>, TagOk> | Tagged<Err<E>, TagError> {
  const isError = config?.isError ?? defaultIsError<T, E>;

  const processValue = (val: T | E) => {
    if (isError(val)) {
      return config?.tagError !== undefined ? err(val, config.tagError) : err(val);
    }
    return config?.tagOk !== undefined
      ? (ok(val, config.tagOk) as Tagged<Ok<Exclude<T, E>>, TagOk>)
      : (ok(val) as Ok<Exclude<T, E>>);
  };

  return processValue(value);
}
