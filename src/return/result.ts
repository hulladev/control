import { DEFAULT_TAG_ERROR, DEFAULT_TAG_OK } from "@/lib/constants";
import { ResultConfig } from "@/types.private";
import { err } from "./err";
import { Err, Ok, Tagged } from "@/types.public";
import { ok } from "./ok";

const defaultIsError = <const T, E extends Error>(value: T | E): value is E => value instanceof Error 

// No tags provided
export function result<const T, E extends Error>(
  value: T,
  config?: Omit<ResultConfig<T, E, string, string>, 'tagError' | 'tagOk'>
): Ok<T> | Err<E>;

// Only tagError provided
export function result<const T, E extends Error, TagError extends string>(
  value: T,
  config: Omit<ResultConfig<T, E, TagError, string>, 'tagOk'> & { tagError: TagError }
): Ok<T> | Tagged<Err<E>, TagError>;

// Only tagOk provided
export function result<const T, E extends Error, TagOk extends string>(
  value: T,
  config: Omit<ResultConfig<T, E, string, TagOk>, 'tagError'> & { tagOk: TagOk }
): Tagged<Ok<T>, TagOk> | Err<E>;

// Both tags provided
export function result<const T, E extends Error, TagError extends string, TagOk extends string>(
  value: T,
  config: ResultConfig<T, E, TagError, TagOk> & { tagError: TagError; tagOk: TagOk }
): Tagged<Ok<T>, TagOk> | Tagged<Err<E>, TagError>;

// Implementation
export function result<const T, E extends Error, TagError extends string = typeof DEFAULT_TAG_ERROR, TagOk extends string = typeof DEFAULT_TAG_OK>(
  value: T,
  config?: ResultConfig<T, E, TagError, TagOk>
): Ok<T> | Err<E> | Tagged<Ok<T>, TagOk> | Tagged<Err<E>, TagError> {
  const isError = config?.isError ?? defaultIsError<T, E>

  const processValue = (val: T | E) => {
    if (isError(val)) {
      return config?.tagError 
        ? err(val, config.tagError) as Tagged<Err<E>, TagError>
        : err(val) as Err<E>
    }
    return config?.tagOk
      ? ok(val, config.tagOk) as Tagged<Ok<T>, TagOk>
      : ok(val) as Ok<T>
  }

  return processValue(value)
}
