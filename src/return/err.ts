import { DEFAULT_TAG_ERROR } from '@/lib/constants';
import { isPromiseLike } from '@/lib/isPromiseLike';
import type { ErrBaseResult } from '@/types.private';
import type { Err, Ok } from '@/types.public';

/**
 * Creates an error Result type that wraps an error value.
 *
 * The Err type represents a failed computation and provides methods to safely
 * handle the error value. It implements the Result pattern along with Ok type.
 *
 * @template E - The type of the error value
 * @template Tag - Optional string literal type for custom tagging
 *
 * @param error - The error value to wrap
 * @param tag - Optional custom tag for the result (defaults to "error")
 *
 * @returns An Err result containing the error and associated methods:
 * - isOk(): Returns false (type guard for Ok<never>)
 * - isErr(): Returns true (type guard for Err<E>)
 * - match(): Transforms the error using provided functions
 * - pair(): Returns a tuple of [undefined, error]
 * - unwrap(): Returns the raw error
 *
 * @example
 * // Basic usage
 * const result = err(new Error("failed"))
 * if (result.isErr()) {
 *   console.log(result.error.message) // "failed"
 * }
 *
 * // With custom tag
 * const tagged = err(new Error("failed"), "ValidationError")
 * console.log(tagged.tag) // "ValidationError"
 *
 * // Pattern matching
 * result.match(
 *   () => {}, // never called for Err
 *   error => console.error(error)
 * )
 */
export function err<const E>(error: E): Err<E>;
export function err<const E, const Tag extends string>(error: E, tag: Tag): Err<E, Tag>;
export function err<const E, const Tag extends string>(
  error: E,
  tag: Tag | undefined,
): Err<E, Tag | 'error'>;
export function err<const E, const Tag extends string>(error: E, tag?: Tag): Err<E, Tag | 'error'> {
  const methods: ErrBaseResult<E, Tag | 'error'> = {
    isOk: (): this is Ok<never, Tag | 'error'> => false,
    isErr: (): this is Err<E, Tag | 'error'> => true,
    match: <ROk, R>(_onOk: (value: never) => ROk, onErr: (error: Awaited<E>) => R) => {
      return (
        isPromiseLike(error)
          ? Promise.resolve(error).then((e) => onErr(e as Awaited<E>))
          : onErr(error as Awaited<E>)
      ) as E extends PromiseLike<unknown> ? Promise<Awaited<R>> : R;
    },
    pair: () => {
      return (
        isPromiseLike(error)
          ? Promise.resolve(error).then((v) => [undefined, v])
          : [undefined, error]
      ) as E extends PromiseLike<unknown> ? Promise<[undefined, Awaited<E>]> : [undefined, E];
    },
    map: () => result,
    mapErr: (transform) =>
      err(
        methods.match(() => undefined, transform),
        result.tag,
      ),
    unwrap: () => error,
  };
  const result: Err<E, Tag | 'error'> = { ...methods, error, tag: tag ?? DEFAULT_TAG_ERROR };
  return result;
}
